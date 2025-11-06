import Disease from "../models/Disease.js";
import slugify from "slugify";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const diseaseController = {
  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    // ensure slug
    const slug = payload.slug || slugify(payload.name || "", { lower: true, strict: true });
    payload.slug = slug;

    try {
      const d = new Disease(payload);
      const saved = await d.save();
      return created(res, saved);
    } catch (err) {
      if (err.code === 11000) {
        throw new AppError("Slug đã tồn tại", 409, "DUPLICATE_SLUG");
      }
      throw err;
    }
  }),

  list: asyncHandler(async (req, res) => {
    const { q, page, limit, includeDeleted } = req.query;
    const filter = {};
    if (includeDeleted !== "true") filter.isDeleted = false;
    if (q) filter.$text = { $search: q };

    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;

    const [items, total] = await Promise.all([
      Disease.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(limitNum),
      Disease.countDocuments(filter),
    ]);

    return ok(res, { items, total, page: pageNum, limit: limitNum });
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const d = await Disease.findOne({ slug, isDeleted: false });
    return ok(res, d);
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = { ...req.body };
    if (data.name && !data.slug) {
      data.slug = slugify(data.name, { lower: true, strict: true });
    }
    const updated = await Disease.findByIdAndUpdate(id, data, { new: true });
    return ok(res, updated);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await Disease.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return ok(res, d);
  }),

  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await Disease.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
    return ok(res, d);
  }),
};
