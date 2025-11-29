import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ok } from "../utils/ApiResponse.js";
import {
  getDailyLimitFor,
  getEffectivePlan,
  getTodayUsage,
} from "../utils/subscription.js";

export const subscriptionController = {
  // GET /subscription/status
  status: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?.id);
    const plan = getEffectivePlan(user);
    const limit = getDailyLimitFor(user);
    const used = getTodayUsage(user);
    const limitLabel = Number.isFinite(limit) ? limit : "unlimited";
    return ok(res, {
      plan,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpires: user.subscriptionExpires,
      usage: { used, limit: limitLabel },
    });
  }),

  // PATCH /subscription/downgrade
  downgrade: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");

    // Downgrade to free
    user.subscriptionPlan = "free";
    user.subscriptionExpires = null;
    await user.save();

    return ok(res, {
      message: "Đã hạ gói về Free",
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpires: user.subscriptionExpires || null,
      user: await User.findById(userId).select(
        "-password -refreshTokens -resetPasswordToken -resetPasswordExpires"
      ),
    });
  }),
};

export default subscriptionController;
