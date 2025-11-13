// backend/controllers/expertRatingController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertRating from "../models/ExpertRating.js";

/** Tìm Expert theo id (nhận cả expert_id và _id) */
async function findExpertByAnyId(id) {
  const orConds = [{ expert_id: id }];
  if (mongoose.Types.ObjectId.isValid(id)) {
    orConds.push({ _id: new mongoose.Types.ObjectId(id) });
  }
  return Expert.findOne({ is_deleted: false, $or: orConds }).select("_id");
}

/** Tính lại avg_score & total_reviews */
async function recalcExpertStats(expertId) {
  const rows = await ExpertRating.aggregate([
    { $match: { expert: new mongoose.Types.ObjectId(expertId) } },
    {
      $group: {
        _id: "$expert",
        avg: { $avg: "$score" },
        cnt: { $sum: 1 },
      },
    },
  ]);
  const avg = rows?.[0]?.avg || 0;
  const cnt = rows?.[0]?.cnt || 0;
  await Expert.findByIdAndUpdate(expertId, {
    avg_score: Math.round(avg * 10) / 10,
    total_reviews: cnt,
  });
  return { avg_score: Math.round(avg * 10) / 10, total_reviews: cnt };
}

/** POST /api/experts/:id/rate  (mỗi user chỉ 1 lần) */
export async function rateOnce(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const { score, comment = "" } = req.body || {};
    const num = Number(score);
    if (!Number.isFinite(num) || num < 1 || num > 5) {
      return res.status(400).json({ error: "Score must be 1..5" });
    }

    const expert = await findExpertByAnyId((id || "").trim());
    if (!expert) return res.status(404).json({ error: "Expert not found" });

    // kiểm tra duplicate
    const exists = await ExpertRating.findOne({ expert: expert._id, user: userId });
    if (exists) {
      return res.status(409).json({ error: "Bạn đã đánh giá chuyên gia này rồi" });
    }

    await ExpertRating.create({
      expert: expert._id,
      user: userId,
      score: num,
      comment,
    });

    const stats = await recalcExpertStats(expert._id);
    return res.status(201).json({
      message: "Đã ghi nhận đánh giá",
      data: { expert_id: String(expert._id), ...stats },
    });
  } catch (err) {
    console.error("rateOnce error:", err);
    // xử lý lỗi unique index
    if (err?.code === 11000) {
      return res.status(409).json({ error: "Bạn đã đánh giá chuyên gia này rồi" });
    }
    return res.status(500).json({ error: "Server error" });
  }
}

/** GET /api/experts/:id/rate/me  -> trả về điểm user đã chấm (nếu có) */
export async function myRating(req, res) {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });

    const { id } = req.params;
    const expert = await findExpertByAnyId((id || "").trim());
    if (!expert) return res.status(404).json({ error: "Expert not found" });

    const r = await ExpertRating.findOne({ expert: expert._id, user: userId })
      .select("score comment createdAt")
      .lean();
    return res.json({ data: r || null });
  } catch (err) {
    console.error("myRating error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
