import DiseaseCategory from "../models/DiseaseCategory.js";
import { AppError } from "../utils/AppError.js";

export const createCategory = async (payload) => {
  const category = new DiseaseCategory(payload);
  try {
    return await category.save();
  } catch (err) {
    // handle duplicate slug
    if (err.code === 11000) {
      throw new AppError(409, "DUPLICATE_SLUG", "Slug đã tồn tại");
    }
    throw err;
  }
};

export const listCategories = async ({ q, page = 1, limit = 20, includeDeleted = false } = {}) => {
  const filter = {};
  if (!includeDeleted) filter.isDeleted = false;
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    DiseaseCategory.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(Number(limit)),
    DiseaseCategory.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getCategoryBySlug = async (slug) => {
  return await DiseaseCategory.findOne({ slug, isDeleted: false });
};

export const getCategoryById = async (id) => {
  return await DiseaseCategory.findById(id);
};

export const updateCategory = async (id, data) => {
  return await DiseaseCategory.findByIdAndUpdate(id, data, { new: true });
};

export const softDeleteCategory = async (id) => {
  return await DiseaseCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const restoreCategory = async (id) => {
  return await DiseaseCategory.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
};
