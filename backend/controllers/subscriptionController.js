import User from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import { getDailyLimitFor, getEffectivePlan, getTodayUsage } from '../utils/subscription.js';

export const subscriptionController = {
  // GET /subscription/status
  status: asyncHandler(async (req, res) => {
    const user = await User.findById(req.user?.id);
    const plan = getEffectivePlan(user);
    const limit = getDailyLimitFor(user);
    const used = getTodayUsage(user);
    return ok(res, {
      plan,
      subscriptionPlan: user.subscriptionPlan,
      subscriptionExpires: user.subscriptionExpires,
      usage: { used, limit },
    });
  }),
};

export default subscriptionController;