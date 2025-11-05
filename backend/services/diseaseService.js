import Disease from "../models/Disease.js";
import { AppError } from "../utils/AppError.js";
import slugify from "slugify";

export const createDisease = async (payload) => {
  // Ensure slug
  const slug = payload.slug || slugify(payload.name || "", { lower: true, strict: true });
  payload.slug = slug;

  try {
    const d = new Disease(payload);
    return await d.save();
  } catch (err) {
    if (err.code === 11000) {
      throw new AppError(409, "DUPLICATE_SLUG", "Slug đã tồn tại");
    }
    throw err;
  }
};

export const listDiseases = async ({ q, page = 1, limit = 20, filters = {}, includeDeleted = false } = {}) => {
  const filter = { ...filters };
  if (!includeDeleted) filter.isDeleted = false;
  if (q) filter.$text = { $search: q };

  const skip = (Number(page) - 1) * Number(limit);
  const [items, total] = await Promise.all([
    Disease.find(filter).sort({ updatedAt: -1 }).skip(skip).limit(Number(limit)),
    Disease.countDocuments(filter),
  ]);

  return { items, total, page: Number(page), limit: Number(limit) };
};

export const getDiseaseBySlug = async (slug) => {
  return await Disease.findOne({ slug, isDeleted: false });
};

export const getDiseaseById = async (id) => {
  return await Disease.findById(id);
};

export const updateDisease = async (id, data) => {
  if (data.name && !data.slug) {
    data.slug = slugify(data.name, { lower: true, strict: true });
  }
  return await Disease.findByIdAndUpdate(id, data, { new: true });
};

export const softDeleteDisease = async (id) => {
  return await Disease.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const restoreDisease = async (id) => {
  return await Disease.findByIdAndUpdate(id, { isDeleted: false }, { new: true });
};
