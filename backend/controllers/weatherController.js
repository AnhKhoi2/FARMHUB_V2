import * as service from '../services/weatherService.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import User from '../models/User.js';
import { BadRequest, Forbidden } from '../utils/ApiError.js';
import { getDailyLimitFor, getTodayUsage, resetOrIncrementUsage, getEffectivePlan } from '../utils/subscription.js';

export const weatherController = {
  getCurrent: asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.location || '';
    if (!q) throw BadRequest('q (location) is required');

    const data = await service.fetchWeather(q);
    return ok(res, data);
  }),

  // User-facing endpoint enforcing subscription limits
  getCurrentForUser: asyncHandler(async (req, res) => {
    const q = req.query.q || req.query.location || '';
    if (!q) throw BadRequest('q (location) is required');

    const userId = req.user?.id;
    const user = await User.findById(userId);
    if (!user) throw Forbidden('Không xác định người dùng');

    // Determine limits
    const limit = getDailyLimitFor(user);
    const used = getTodayUsage(user);

    if (used >= limit) {
      const plan = getEffectivePlan(user);
      throw Forbidden(`Gói ${plan.toUpperCase()} chỉ cho phép ${limit === Infinity ? 'không giới hạn' : limit + ' lần/ngày'} truy cập thời tiết. Bạn đã đạt giới hạn hôm nay.`);
    }

    const data = await service.fetchWeather(q);

    // Increment usage and persist
    resetOrIncrementUsage(user);
    await user.save();

    return ok(res, { usage: { used: used + 1, limit }, data });
  }),
};

export default weatherController;
