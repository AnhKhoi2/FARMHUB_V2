import express from 'express';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import * as userStreakService from '../services/userStreakService.js';

const router = express.Router();

// Public test endpoint to fetch leaderboard (no auth) - for local Postman testing only
router.get('/leaderboard', asyncHandler(async (req, res) => {
  const limit = req.query.limit || 10;
  const sortBy = req.query.sortBy || 'total_points';
  const items = await userStreakService.topList({ limit, sortBy });
  return ok(res, { items });
}));

export default router;
