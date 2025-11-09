// ===============================
// FARMHUB - Market Listing Controller (User submit → Admin approve)
// ===============================
import mongoose from "mongoose";
import MarketListing, { MARKET_CATEGORIES } from "../models/MarketListing.js";

/** Build filter based on query (public: approved only) */
function buildFilter(q) {
  const f = { status: "approved" }; // public default (chỉ hiển thị bài đã duyệt)

  if (q.status) f.status = q.status;
  if (q.category) f.category = q.category;
  if (q.location) f.location = new RegExp(q.location, "i");
  if (q.q) {
    const r = new RegExp(q.q, "i");
    f.$or = [{ title: r }, { description: r }, { location: r }];
  }

  const priceFilter = {};
  if (q.minPrice) priceFilter.$gte = Number(q.minPrice);
  if (q.maxPrice) priceFilter.$lte = Number(q.maxPrice);
  if (Object.keys(priceFilter).length) f.price = priceFilter;

  return f;
}

/** Check permission */
function canEdit(listing, user) {
  if (!user) return false;
  if (user.role === "admin") return true;
  return String(listing.createdBy) === String(user._id || user.id);
}

// ===============================
// ROUTE HANDLERS
// ===============================

export const categories = async (req, res) => {
  res.json({ ok: true, data: MARKET_CATEGORIES });
};

// Public list (approved only). If mine=true & có token → show bài của chính user (mọi trạng thái trừ deleted)
export const list = async (req, res, next) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 12);
    const skip = (page - 1) * limit;

    let filter = buildFilter(req.query);

    if (req.query.mine === "true" && req.user) {
      // giữ các tiêu chí q/category/location/price, nhưng bỏ ràng buộc approved và thêm createdBy
      filter = {
        ...filter,
        createdBy: new mongoose.Types.ObjectId(req.user._id || req.user.id),
        status: { $ne: "deleted" },
      };
      // nếu buildFilter đã set status=approved thì bỏ để thấy cả pending/rejected/hidden...
      if ("status" in filter) delete filter.status;
    }

    const [items, total] = await Promise.all([
      MarketListing.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      MarketListing.countDocuments(filter),
    ]);

    res.json({
      ok: true,
      data: { items, total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
};

// Chi tiết bài đăng (kể cả pending nếu là chủ bài)
export const detail = async (req, res, next) => {
  try {
    const item = await MarketListing.findById(req.params.id).lean();
    if (!item) return res.status(404).json({ ok: false, message: "Listing not found" });

    // Nếu chưa duyệt mà không phải chủ bài/admin → chặn xem
    if (item.status !== "approved" && !canEdit(item, req.user)) {
      return res.status(403).json({ ok: false, message: "Not authorized to view this listing" });
    }

    await MarketListing.findByIdAndUpdate(item._id, { $inc: { views: 1 } }).exec();
    res.json({ ok: true, data: item });
  } catch (err) {
    next(err);
  }
};

// User đăng bài mới (status = pending)
export const create = async (req, res, next) => {
  try {
    const {
      title,
      category,
      priceText = "",
      description = "",
      location = "",
      contactName,
      contactPhone = "",
      contactEmail = "",
    } = req.body;

    if (!title || !category || !contactName) {
      return res.status(400).json({ ok: false, message: "Missing required fields" });
    }

    const images = (req.files || []).map((f) => ({
      url: `/uploads/market/${f.filename}`,
      alt: title,
    }));

    const price = MarketListing.normalizeVnd(priceText);

    const doc = await MarketListing.create({
      title,
      category,
      priceText,
      price,
      description,
      location,
      images,
      contactName,
      contactPhone,
      contactEmail,
      createdBy: req.user._id || req.user.id,
      status: "pending", // chờ admin duyệt
    });

    res.status(201).json({ ok: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// User cập nhật bài đăng của mình
export const update = async (req, res, next) => {
  try {
    const doc = await MarketListing.findById(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, message: "Listing not found" });
    if (!canEdit(doc, req.user)) return res.status(403).json({ ok: false, message: "Forbidden" });

    const up = {};
    ["title", "category", "description", "location", "contactName", "contactPhone", "contactEmail"].forEach((k) => {
      if (k in req.body) up[k] = req.body[k];
    });
    if ("priceText" in req.body) {
      up.priceText = req.body.priceText || "";
      up.price = MarketListing.normalizeVnd(req.body.priceText);
    }

    if (req.files?.length) {
      up.images = req.files.map((f) => ({
        url: `/uploads/market/${f.filename}`,
        alt: up.title || doc.title,
      }));
    }

    const updated = await MarketListing.findByIdAndUpdate(doc._id, up, { new: true }).lean();
    res.json({ ok: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Admin duyệt bài
export const changeStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "approved", "rejected"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ ok: false, message: "Invalid status" });
    }

    const doc = await MarketListing.findById(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, message: "Listing not found" });

    doc.status = status;
    await doc.save();

    res.json({ ok: true, data: doc });
  } catch (err) {
    next(err);
  }
};

// User xoá bài (soft delete)
export const remove = async (req, res, next) => {
  try {
    const doc = await MarketListing.findById(req.params.id);
    if (!doc) return res.status(404).json({ ok: false, message: "Listing not found" });
    if (!canEdit(doc, req.user)) return res.status(403).json({ ok: false, message: "Forbidden" });

    doc.status = "deleted";
    await doc.save();
    res.json({ ok: true, message: "Listing deleted (soft)" });
  } catch (err) {
    next(err);
  }
};

// ===== Default Export (để router import kiểu nào cũng được) =====
export default {
  categories,
  list,
  detail,
  create,
  update,
  changeStatus,
  remove,
};
