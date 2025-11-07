// backend/controllers/expertApplicationController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertApplication from "../models/ExpertApplication.js";

// Tạo model tạm cho expertapplications nếu bạn chưa có schema riêng (strict:false để nhận mọi field)
// Model chuẩn đã có trong models/ExpertApplication.js

// GET /api/expert-applications?status=pending&q=...
export async function list(req, res) {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ full_name: rx }, { expertise_area: rx }, { description: rx }];
    }

    const items = await ExpertApplication.find(filter)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .lean();

    const total = await ExpertApplication.countDocuments(filter);
    return res.status(200).json({ data: { items, total, page: Number(page), limit: Number(limit) } });
  } catch (err) {
    console.error("List applications error:", err);
    return res.status(500).json({ error: "Failed to get applications" });
  }
}

// GET /api/expert-applications/me  (xem đơn của chính user đang đăng nhập)
export async function getMine(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
    const apps = await ExpertApplication.find({ user: userId }).sort({ createdAt: -1 }).lean();
    return res.status(200).json({ data: apps });
  } catch (err) {
    console.error("Get my applications error:", err);
    return res.status(500).json({ error: "Failed to get your applications" });
  }
}

// GET /api/expert-applications/:id
export async function getById(req, res) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }
    const app = await ExpertApplication.findById(id).lean();
    if (!app) return res.status(404).json({ error: "Application not found" });
    return res.status(200).json({ data: app });
  } catch (err) {
    console.error("Get application error:", err);
    return res.status(500).json({ error: "Failed to get application detail" });
  }
}

// POST /api/expert-applications  (user tự nộp đơn xin xét duyệt)
export async function create(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const {
      full_name,
      expertise_area,
      experience_years = 0,
      description = "",
      phone_number = "",
      certificates = [],
    } = req.body || {};

    if (!full_name || !expertise_area) {
      return res.status(400).json({ error: "Missing required fields: full_name, expertise_area" });
    }

    // Check đã là expert chưa
    const existingExpert = await Expert.findOne({ user: userId, is_deleted: false }).lean();
    if (existingExpert) {
      return res.status(409).json({ error: "Bạn đã có hồ sơ Expert" });
    }

    // Check đơn pending
    const pending = await ExpertApplication.findOne({ user: userId, status: "pending" }).lean();
    if (pending) {
      return res.status(409).json({ error: "Đơn trước đang chờ duyệt" });
    }

    // Lấy email từ user
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const app = await ExpertApplication.create({
      user: userId,
      email: user.email,
      full_name,
      expertise_area,
      experience_years: Number(experience_years) || 0,
      description,
      phone_number,
      certificates: Array.isArray(certificates)
        ? certificates.map((c) => (typeof c === "string" ? { url: c } : c))
        : [],
      status: "pending",
    });

    return res.status(201).json({ data: app });
  } catch (err) {
    console.error("Create application error:", err);
    return res.status(500).json({ error: "Failed to submit application" });
  }
}

// PATCH /api/expert-applications/:id/approve
export async function approve(req, res) {
  try {
    const { id } = req.params;
    const { activate_expert = true, review_notes = "" } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const app = await ExpertApplication.findById(id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status && app.status !== "pending") {
      return res.status(400).json({ error: "Only pending applications can be approved" });
    }

    // ✅ Tạo Expert record
    const payload = {
      user: app.user,
      full_name: app.full_name,
      phone_number: app.phone_number || null,
      expertise_area: app.expertise_area,
      experience_years: app.experience_years || 0,
      certificates: (Array.isArray(app.certificates) ? app.certificates : []).map(c =>
        typeof c === "string" ? { url: c } : c
      ),
      description: app.description || "",
      review_status: "approved",
      is_public: !!activate_expert,
    };

    const expert = await Expert.findOneAndUpdate(
      { user: app.user, is_deleted: false },
      { $set: payload },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // ✅ Cập nhật role user → expert
    await User.findByIdAndUpdate(app.user, { role: "expert" });

    // ✅ Xóa application sau khi duyệt
    await ExpertApplication.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Application approved, role updated to expert, and removed from pending list",
      expert,
    });
  } catch (err) {
    console.error("Approve application error:", err);
    return res.status(500).json({ error: "Failed to approve application" });
  }
}
// PATCH /api/expert-applications/:id/reject
export async function reject(req, res) {
  try {
    const { id } = req.params;
    const { reason = "" } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Invalid application id" });
    }

    const app = await ExpertApplication.findById(id);
    if (!app) return res.status(404).json({ error: "Application not found" });
    if (app.status && app.status !== "pending") {
      return res.status(400).json({ error: "Only pending applications can be rejected" });
    }

    // ✅ Xóa đơn sau khi reject
    await ExpertApplication.findByIdAndDelete(id);

    return res.status(200).json({
      message: "Application rejected and removed from pending list",
      reason,
    });
  } catch (err) {
    console.error("Reject application error:", err);
    return res.status(500).json({ error: "Failed to reject application" });
  }
}
