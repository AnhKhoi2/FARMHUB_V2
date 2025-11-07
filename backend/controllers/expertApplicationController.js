// backend/controllers/expertApplicationController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";

// Tạo model tạm cho expertapplications nếu bạn chưa có schema riêng (strict:false để nhận mọi field)
import mongoosePkg from "mongoose";
const { Schema, model } = mongoosePkg;
const ExpertApplication =
  mongoose.models.ExpertApplication ||
  model(
    "ExpertApplication",
    new Schema({}, { strict: false, collection: "expertapplications" })
  );

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
