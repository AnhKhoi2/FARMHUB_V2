import UserStreak from "../models/UserStreak.js";
import { recordLoginHelper } from "../utils/streakHelpers.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";

export const userStreakController = {
  
  // User tự xem streak của họ
  getMyStreak: asyncHandler(async (req, res) => {
    const userId = req.user.id; // lấy từ token
    
    const data = await UserStreak.findOne({ user: userId })
      .populate({
        path: 'user',
        select: 'username email role',
        match: { isDeleted: false } // Only include non-deleted users
      });

    return ok(res, { item: data });
  }),

  // record by token/user context
  recordForUser: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const result = await recordLoginHelper(userId);
    return ok(res, { streak: result });
  }),

  // admin listing with pagination
  list: asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, q = "" } = req.query;
    const pageNum = Number(page) || 1;
    const limitNum = Number(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    const filter = {};
    if (q) {
      filter.$or = [
        { earned_badges: { $regex: q, $options: "i" } },
      ];
    }

    let items = await UserStreak.find(filter)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .populate({
        path: 'user',
        select: 'username email role',
        match: { isDeleted: false } // Only include non-deleted users
      });

    // Filter out items where user is null (deleted users)
    items = items.filter(item => item.user !== null);

    const total = await UserStreak.countDocuments(filter);
    const pages = Math.ceil(total / limitNum || 1);
    return ok(res, { items, total, page: pageNum, limit: limitNum, pages });
  }),

  getById: asyncHandler(async (req, res) => {
    const { id } = req.params;
    const data = await UserStreak.findOne({ user: id })
      .populate({
        path: 'user',
        select: 'username email role',
        match: { isDeleted: false } // Only include non-deleted users
      });
    return ok(res, { item: data });
  }),
  // top leaderboard
  top: asyncHandler(async (req, res) => {
    const limit = req.query.limit || 10;
    const sortBy = req.query.sortBy || 'total_points';
    const sortField = sortBy === 'current_streak' ? { current_streak: -1 } : { total_points: -1 };
    let items = await UserStreak.find({})
      .sort(sortField)
      .limit(Number(limit))
      .populate({
        path: 'user',
        select: 'username email role',
        match: { isDeleted: false } // Only include non-deleted users
      });
    // Filter out items where user is null (deleted users)
    items = items.filter(item => item.user !== null);
    return ok(res, { items });
  }),
};
