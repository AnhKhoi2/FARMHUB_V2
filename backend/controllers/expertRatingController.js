// backend/controllers/expertRatingController.js
import mongoose from "mongoose";
import Expert from "../models/Expert.js";
import User from "../models/User.js";
import ExpertRating from "../models/ExpertRating.js";
import Conversation from "../models/Conversation.js";
import Message from "../models/Message.js";

const { Types } = mongoose;

// ------------------------
// Helpers
// ------------------------

/** Tìm Expert theo id (nhận cả expert_id và _id) */
async function findExpertByAnyId(id) {
  const orConds = [{ expert_id: id }];
  if (Types.ObjectId.isValid(id)) {
    orConds.push({ _id: new Types.ObjectId(id) });
  }
  return Expert.findOne({ is_deleted: false, $or: orConds }).select("_id");
}

/** Tính lại avg_score & total_reviews trên Expert */
async function recalcExpertRating(expertId) {
  const objId = Types.ObjectId.isValid(expertId)
    ? new Types.ObjectId(expertId)
    : expertId;

  const agg = await ExpertRating.aggregate([
    { $match: { expert: objId } },
    {
      $group: {
        _id: "$expert",
        avg_score: { $avg: "$score" },
        total_reviews: { $sum: 1 },
      },
    },
  ]);

  const stats = agg[0] || { avg_score: 0, total_reviews: 0 };

  const avg = Number(stats.avg_score || 0);
  const total = Number(stats.total_reviews || 0);

  await Expert.findByIdAndUpdate(
    objId,
    {
      avg_score: avg,
      total_reviews: total,
    },
    { new: true }
  ).lean();

  return { avg_score: avg, total_reviews: total };
}

/**
 * Kiểm tra user có đủ điều kiện đánh giá expert chưa:
 * - có conversation giữa user và expert
 * - có ít nhất 5 tin nhắn trong conversation đó
 * - có ít nhất 2 phía gửi tin (user & expert)
 */
async function checkCanRate(userId, expertId) {
  if (!Types.ObjectId.isValid(userId) || !Types.ObjectId.isValid(expertId)) {
    return false;
  }

  const uId = new Types.ObjectId(userId);
  const eId = new Types.ObjectId(expertId);

  const conv = await Conversation.findOne({
    user: uId,
    expert: eId,
  }).select("_id");

  if (!conv) return false;

  const convId = conv._id;

  const [totalMessages, distinctSenders] = await Promise.all([
    Message.countDocuments({ conversation: convId }),
    Message.distinct("sender", { conversation: convId }),
  ]);

  // cần >= 5 tin nhắn và phải có từ 2 phía gửi
  if (totalMessages < 5) return false;
  if (!distinctSenders || distinctSenders.length < 2) return false;

  return true;
}

// ------------------------
// POST /api/experts/:id/rate
// ------------------------
export async function rateOnce(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const { score, comment } = req.body || {};

    const expert = await findExpertByAnyId((id || "").trim());
    if (!expert) {
      return res.status(404).json({ error: "Expert not found" });
    }

    const s = Number(score);
    if (!Number.isFinite(s) || s < 1 || s > 5) {
      return res.status(400).json({ error: "Score must be from 1 to 5" });
    }

    // đã rating rồi thì không cho nữa
    const existing = await ExpertRating.findOne({
      expert: expert._id,
      user: userId,
    }).lean();

    if (existing) {
      return res
        .status(409)
        .json({ error: "Bạn đã đánh giá chuyên gia này rồi." });
    }

    // ✅ kiểm tra lịch sử chat
    const canRate = await checkCanRate(userId, expert._id);
    if (!canRate) {
      return res.status(403).json({
        error:
          "Bạn chỉ có thể đánh giá chuyên gia sau khi đã trò chuyện qua lại (ít nhất 5 tin nhắn).",
      });
    }

    await ExpertRating.create({
      expert: expert._id,
      user: userId,
      score: s,
      comment: comment || "",
    });

    const stats = await recalcExpertRating(expert._id);

    return res.status(201).json({
      message: "Đã ghi nhận đánh giá.",
      data: stats,
    });
  } catch (err) {
    console.error("rateOnce error:", err);
    return res.status(500).json({
      error: "Server error",
      detail: err.message,
    });
  }
}

// ------------------------
// GET /api/experts/:id/rate/me
// Trả về: { score, comment, canRate }
// ------------------------
export async function myRating(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { id } = req.params;
    const expert = await findExpertByAnyId((id || "").trim());
    if (!expert) {
      return res.status(404).json({ error: "Expert not found" });
    }

    const rating = await ExpertRating.findOne({
      expert: expert._id,
      user: userId,
    })
      .select("score comment createdAt")
      .lean();

    let canRate = false;
    // chỉ check quyền rate nếu CHƯA từng rate
    if (!rating) {
      canRate = await checkCanRate(userId, expert._id);
    }

    return res.json({
      data: {
        score: rating?.score || 0,
        comment: rating?.comment || "",
        canRate,
      },
    });
  } catch (err) {
    console.error("myRating error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
