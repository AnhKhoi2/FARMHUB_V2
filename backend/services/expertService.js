// ===============================
//  FARMHUB - Expert Controller (Service-merged)
//  Model: Expert links to User; auth fields live in User
// ===============================
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js"; // to validate user existence / role

// ---------- Helpers ----------
function normalizeCerts(certs = []) {
  return certs.map((c) => (typeof c === "string" ? { url: c } : c));
}

function normalizeBase(data = {}) {
  const out = { ...data };
  if (out.phone_number) out.phone_number = String(out.phone_number).trim();
  if (out.full_name) out.full_name = String(out.full_name).trim();
  if (out.expertise_area) out.expertise_area = String(out.expertise_area).trim();
  if (out.description) out.description = String(out.description).trim();
  return out;
}

const ALLOWED_REVIEW = ["pending", "approved", "rejected", "banned", "inactive"];
const PROJECTION =
  "expert_id full_name expertise_area experience_years certificates description avg_score total_reviews review_status is_public phone_number created_at updated_at";

// ===================================================
// GET /api/experts?q=&review_status=&min_exp=&max_exp=&is_public=
// ===================================================
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
      .select(PROJECTION)
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    return res.status(200).json({ data: items });
  } catch (err) {
    console.error("List experts error:", err);
    return res.status(500).json({ error: "Failed to get experts" });
  }
}

// ===================================================
// GET /api/experts/:id  (accepts expert_id or _id)
// ===================================================
export async function getById(req, res) {
  try {
    const id = (req.params.id || "").trim();
    const orConds = [{ expert_id: id }];
    if (mongoose.Types.ObjectId.isValid(id)) {
      orConds.push({ _id: new mongoose.Types.ObjectId(id) });
    }

    const expert = await Expert.findOne({ is_deleted: false, $or: orConds })
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    if (!expert) {
      return res.status(404).json({ error: "Expert not found" });
    }
    return res.status(200).json({ data: expert });
  } catch (err) {
    console.error("Get expert error:", err);
    return res.status(500).json({ error: "Failed to get expert detail" });
  }
}

// ===================================================
// POST /api/experts
// body requires: userId (ObjectId). One Expert profile per User.
// ===================================================
export async function create(req, res) {
  try {
    const payload = normalizeBase(req.body || {});
    const { userId } = payload;

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: "Missing or invalid userId" });
    }

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const existed = await Expert.findOne({ user: userId, is_deleted: false }).lean();
    if (existed) {
      return res.status(409).json({ error: "Expert profile already exists for this user" });
    }

    const doc = {
      user: userId,
      full_name: payload.full_name,
      phone_number: payload.phone_number || null,
      expertise_area: payload.expertise_area,
      experience_years: payload.experience_years || 0,
      certificates: normalizeCerts(payload.certificates),
      description: payload.description || "",
      review_status: payload.review_status || "pending", // pending | approved | rejected | banned | inactive
      review_notes: payload.review_notes || "",
      reviewed_by: null,
      reviewed_at: null,
      is_public: payload.is_public !== undefined ? !!payload.is_public : true,
      avg_score: 0,
      total_reviews: 0,
    };

    const created = await Expert.create(doc);
    const populated = await Expert.findById(created._id)
      .populate({ path: "user", select: "email role isVerified isDeleted" })
      .lean();

    return res.status(201).json({ data: populated });
  } catch (err) {
    console.error("Create expert error:", err);
    return res.status(400).json({ error: "Invalid expert data" });
  }
}

// ===================================================
// PATCH /api/experts/:id   (id is expert_id)
// - Forbid updating email/password here (they belong to User)
// - Validate review_status; auto set reviewed_at; reviewed_by from req.user?.id if not provided
// ===================================================
export async function update(req, res) {
  try {
    const updates = req.body || {};
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({ error: "Please provide at least one field to update" });
    }

    const payload = normalizeBase(updates);

    if ("email" in payload || "password" in payload) {
      return res.status(400).json({ error: "Email/Password belongs to User model, not Expert" });
    }

    if (payload.certificates) {
      payload.certificates = normalizeCerts(payload.certificates);
    }

    if (payload.review_status) {
      if (!ALLOWED_REVIEW.includes(payload.review_status)) {
        return res
          .status(400)
          .json({ error: "Invalid review_status (allowed: pending|approved|rejected|banned|inactive)" });
      }
      if (["approved", "rejected", "banned"].includes(payload.review_status)) {
        payload.reviewed_at = new Date();
        if (!payload.reviewed_by && req.user?.id) {
          payload.reviewed_by = req.user.id; // set by admin/mod if available
        }
      }
    }

    if ("is_public" in payload && typeof payload.is_public !== "boolean") {
      return res.status(400).json({ error: "is_public must be boolean" });
    }

    const expert = await Expert.findOneAndUpdate(
      { expert_id: req.params.id, is_deleted: false },
      payload,
      { new: true, runValidators: true }
    ).populate({ path: "user", select: "email role isVerified isDeleted" });

    if (!expert) {
      return res.status(404).json({ error: "Expert not found to update" });
    }

    return res.status(200).json({ data: expert.toObject() });
  } catch (err) {
    console.error("Update expert error:", err);
    return res.status(400).json({ error: "Failed to update expert" });
  }
}

// ===================================================
// DELETE /api/experts/:id   (soft delete by expert_id)
// ===================================================
export async function remove(req, res) {
  try {
    const result = await Expert.findOneAndUpdate(
      { expert_id: req.params.id, is_deleted: false },
      { is_deleted: true, deleted_at: new Date() },
      { new: true }
    );

    if (!result) {
      return res.status(404).json({ error: "Expert not found to delete" });
    }
    return res.status(204).send();
  } catch (err) {
    console.error("Soft delete expert error:", err);
    return res.status(500).json({ error: "Failed to delete expert" });
  }
}
  