import * as service from "../services/diseaseCategoryService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const diseaseCategoryController = {
  create: asyncHandler(async (req, res) => {
    const payload = req.body;
    const cat = await service.createCategory(payload);
    return created(res, cat);
  }),

  list: asyncHandler(async (req, res) => {
    const { q, page, limit, includeDeleted } = req.query;
    const result = await service.listCategories({ q, page, limit, includeDeleted: includeDeleted === "true" });
    return ok(res, result);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const cat = await service.getCategoryBySlug(slug);
    return ok(res, cat);
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await service.updateCategory(id, data);
    return ok(res, updated);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await service.softDeleteCategory(id);
    return ok(res, d);
  }),

  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await service.restoreCategory(id);
    return ok(res, d);
  }),
};
