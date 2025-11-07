// ===============================
//  FARMHUB - Expert Controller (service-merged; no add/edit)
// ===============================
import mongoose from "mongoose";
import Expert from "../models/Expert.js";

// ---------- Helpers ----------
const ALLOWED_REVIEW = ["pending", "approved", "rejected", "banned", "inactive"];

// Dùng "+user" để chắc chắn field user được include dù schema có select:false
const PROJECTION =
  "+user expert_id full_name expertise_area experience_years certificates description avg_score total_reviews review_status is_public phone_number created_at updated_at";

// ===============================
// GET /api/experts?q=&review_status=&min_exp=&max_exp=&is_public=
// ===============================
export async function list(req, res) {
  try {
    const { q, review_status, min_exp, max_exp, is_public } = req.query || {};
    const filter = { is_deleted: false };

    if (review_status && ALLOWED_REVIEW.includes(review_status)) {
      filter.review_status = review_status;
    }

    if (typeof is_public !== "undefined") {
      if (is_public === "true" || is_public === true) filter.is_public = true;
      if (is_public === "false" || is_public === false) filter.is_public = false;
    }

    if (q && String(q).trim()) {
      const rx = new RegExp(String(q).trim(), "i");
      filter.$or = [{ full_name: rx }, { expertise_area: rx }, { description: rx }];
    }

    const min = Number(min_exp);
    const max = Number(max_exp);
    if (!Number.isNaN(min) || !Number.isNaN(max)) {
      filter.experience_years = {};
      if (!Number.isNaN(min)) filter.experience_years.$gte = min;
      if (!Number.isNaN(max)) filter.experience_years.$lte = max;
    }

    const items = await Expert.find(filter)
      .select(PROJECTION)          // include các field cần
      .select("+user")             // ép include user (phòng có select:false)
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("List experts error:", err);
    return res.status(500).json({ error: "Failed to get experts" });
  }
}

// ===============================
// GET /api/experts/:id   (accepts expert_id or _id)
// ===============================
export async function getById(req, res) {
  try {
    const id = (req.params.id || "").trim();
    const orConds = [{ expert_id: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConds.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    const expert = await Expert.findOne({ is_deleted: false, $or: orConds })
      .select(PROJECTION)
      .select("+user")
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    if (!expert) return res.status(404).json({ error: "Expert not found" });
    return res.status(200).json({ data: expert });
  } catch (err) {
    console.error("Get expert error:", err);
    return res.status(500).json({ error: "Failed to get expert detail" });
  }
}

// ===============================
// DELETE /api/experts/:id   (soft delete by expert_id)
// ===============================
export async function remove(req, res) {
  try {
    const result = await Expert.findOneAndUpdate(
      { expert_id: req.params.id, is_deleted: false },
      { is_deleted: true, deleted_at: new Date() },
      { new: true }
    );
    if (!result) return res.status(404).json({ error: "Expert not found to delete" });
    return res.status(204).send();
  } catch (err) {
    console.error("Soft delete expert error:", err);
    return res.status(500).json({ error: "Failed to delete expert" });
  }
}

// -------- Disabled stubs (giữ để tránh 404 route cũ) --------
export async function create(_req, res) {
  return res.status(405).json({ error: "Create is disabled" });
}
export async function update(_req, res) {
  return res.status(405).json({ error: "Update is disabled" });
}
