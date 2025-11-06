import DiseaseCategory from "../models/DiseaseCategory.js";
import { AppError } from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const diseaseCategoryController = {
  create: asyncHandler(async (req, res) => {
    const payload = { ...req.body };
    const cat = new DiseaseCategory(payload);
    try {
      const saved = await cat.save();
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
      DiseaseCategory.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(limitNum),
      DiseaseCategory.countDocuments(filter),
    ]);

    return ok(res, { items, total, page: pageNum, limit: limitNum });
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const cat = await DiseaseCategory.findOne({ slug, isDeleted: false });
    return ok(res, cat);
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await DiseaseCategory.findByIdAndUpdate(id, data, { new: true });
    return ok(res, updated);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await DiseaseCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
    return ok(res, d);
  }),

  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await DiseaseCategory.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
    return ok(res, d);
  }),
};
