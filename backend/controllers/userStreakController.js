import * as userStreakService from "../services/userStreakService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

export const userStreakController = {
  // record by token/user context
  recordForUser: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await userStreakService.recordLogin(userId);
    return ok(res, { streak: result });
  }),

  // admin listing with pagination
  list: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q = "" } = req.query;
    const data = await userStreakService.listPaginated({ page, limit, q });
    return ok(res, { items: data.items, total: data.total, page: data.page, limit: data.limit, pages: data.pages });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await userStreakService.getByUser(id);
    return ok(res, { item: data });
  }),
};
