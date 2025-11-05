import * as service from "../services/diseaseService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok, created } from "../utils/ApiResponse.js";

export const diseaseController = {
  create: asyncHandler(async (req, res) => {
    const payload = req.body;
    const d = await service.createDisease(payload);
    return created(res, d);
  }),

  list: asyncHandler(async (req, res) => {
    const { q, page, limit, includeDeleted } = req.query;
    const result = await service.listDiseases({ q, page, limit, includeDeleted: includeDeleted === "true" });
    return ok(res, result);
  }),

  getBySlug: asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const d = await service.getDiseaseBySlug(slug);
    return ok(res, d);
  }),

  update: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = req.body;
    const updated = await service.updateDisease(id, data);
    return ok(res, updated);
  }),

  softDelete: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await service.softDeleteDisease(id);
    return ok(res, d);
  }),

  restore: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const d = await service.restoreDisease(id);
    return ok(res, d);
  }),
};
