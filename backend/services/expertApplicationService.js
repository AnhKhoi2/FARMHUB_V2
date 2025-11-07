import mongoose from "mongoose";
import ExpertApplication from "../models/ExpertApplication.js";

function buildFilter(qs = {}) {
  const { q, status, expertise_area } = qs;
  const filter = { deleted_at: { $exists: false } };

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    filter.status = status;
  }
  if (expertise_area) {
    filter.expertise_area = { $regex: String(expertise_area).trim(), $options: "i" };
  }
  if (q && String(q).trim()) {
    const kw = String(q).trim();
    filter.$or = [
      { full_name: { $regex: kw, $options: "i" } },
      { email: { $regex: kw, $options: "i" } },
      { phone_number: { $regex: kw, $options: "i" } },
    ];
  }
  return filter;
}

export async function list(qs = {}) {
  const page = Math.max(Number(qs.page) || 1, 1);
  const limit = Math.min(Math.max(Number(qs.limit) || 10, 1), 100);
  const skip = (page - 1) * limit;

  const filter = buildFilter(qs);

  const [items, total] = await Promise.all([
    ExpertApplication.find(filter)
      .populate({ path: "user", select: "email username role" })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    ExpertApplication.countDocuments(filter),
  ]);

  return { items, total, page, limit };
}

export async function getById(id) {
  if (!id) {
    const e = new Error("Missing id");
    e.code = "NOT_FOUND";
    throw e;
  }
  const isOid = mongoose.isValidObjectId(id);
  const doc = await ExpertApplication.findOne({
    ...(isOid ? { _id: id } : { _id: id }), // ở đây id chỉ dùng _id
    deleted_at: { $exists: false },
  })
    .populate({ path: "user", select: "email username role" })
    .lean();

  if (!doc) {
    const e = new Error("Application not found");
    e.code = "NOT_FOUND";
    throw e;
  }
  return doc;
}

export async function approve(id, reviewerUserId, opts = {}) {
  const { activate_expert = false } = opts;
  const doc = await ExpertApplication.findOneAndUpdate(
    { _id: id, deleted_at: { $exists: false } },
    { $set: { status: "approved", reviewed_by: reviewerUserId, reviewed_at: new Date(), reject_reason: null } },
    { new: true }
  );

  if (!doc) {
    const e = new Error("Application not found");
    e.code = "NOT_FOUND";
    throw e;
  }

  // Nếu bạn muốn tạo Expert luôn khi duyệt:
  // if (activate_expert) { ... tạo Expert từ doc ... }

  return doc.toObject();
}

export async function reject(id, reviewerUserId, reason) {
  if (!reason) {
    const e = new Error("Missing reject reason");
    e.code = "VALIDATION";
    throw e;
  }
  const doc = await ExpertApplication.findOneAndUpdate(
    { _id: id, deleted_at: { $exists: false } },
    { $set: { status: "rejected", reject_reason: reason, reviewed_by: reviewerUserId, reviewed_at: new Date() } },
    { new: true }
  );

  if (!doc) {
    const e = new Error("Application not found");
    e.code = "NOT_FOUND";
    throw e;
  }
  return doc.toObject();
}
