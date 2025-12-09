// backend/controllers/urbanFarmingController.js
import asyncHandler from "express-async-handler";
import { suggestFarmingModel } from "../services/aiGemini.js";
import FarmingModel from "../models/FarmingModel.js";

/**
 * Helper tạo title mặc định nếu user không gửi lên
 */
function buildDefaultTitle(input) {
  const space = input.space_type || "Không gian";
  const locality = input.locality || "";
  const ts = new Date().toLocaleString("vi-VN");
  return `${space} - ${locality} (${ts})`.trim();
}

/**
 * Helper lấy userId an toàn, nếu không có thì throw 401
 */
function getUserIdOrThrow(req, res) {
  const user = req.user;
  const userId = user?.id || user?._id;

  if (!userId) {
    // trả luôn response, không cho chạy tiếp
    res.status(401);
    throw new Error("Không xác định được người dùng. Vui lòng đăng nhập lại.");
  }

  return userId;
}

/**
 * POST /api/urban-farming/plan
 * Tạo 1 gợi ý mới: gọi AI + lưu vào Mongo
 */
export const createFarmingModel = asyncHandler(async (req, res) => {
  const userId = getUserIdOrThrow(req, res);
  const formInput = req.body || {};

  if (!formInput.space_type || !formInput.locality) {
    return res.status(400).json({
      success: false,
      message:
        "Vui lòng nhập Loại không gian",
    });
  }

  // Gọi AI
  let aiResult;
  try {
    aiResult = await suggestFarmingModel(formInput);
  } catch (err) {
    console.error("[createFarmingModel] AI error:", err);
    return res.status(500).json({
      success: false,
      message:
        err.message ||
        "AI gợi ý mô hình trồng trọt đang gặp sự cố. Vui lòng thử lại sau.",
    });
  }

  // Lấy info tóm tắt từ aiResult
  const climate_zone_vn = aiResult?.climate_zone_vn || null;
  const main_model_id = aiResult?.top_models?.[0]?.model_id || null;
  const title =
    formInput.title?.trim() || buildDefaultTitle(formInput);

  const doc = await FarmingModel.create({
    userId,
    input: formInput,
    aiResult,
    title,
    climate_zone_vn,
    main_model_id,
  });

  return res.status(201).json({
    success: true,
    data: doc,
  });
});

/**
 * GET /api/urban-farming/plans
 * Lấy danh sách gợi ý (list)
 * query:
 *  - status=active|deleted|all (default: active)
 *  - page, limit (phân trang đơn giản)
 */
export const listFarmingModel = asyncHandler(async (req, res) => {
  const userId = getUserIdOrThrow(req, res);

  const status = req.query.status || "active";
  const page = parseInt(req.query.page || "1", 10);
  const limit = parseInt(req.query.limit || "10", 10);
  const skip = (page - 1) * limit;

  const filter = { userId };

  if (status === "active") {
    filter.status = "active";
  } else if (status === "deleted") {
    filter.status = "deleted";
  }

  const [items, total] = await Promise.all([
    FarmingModel.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .select(
        "title climate_zone_vn main_model_id status createdAt updatedAt"
      )
      .lean(),
    FarmingModel.countDocuments(filter),
  ]);

  return res.json({
    success: true,
    page,
    limit,
    total,
    items,
  });
});

/**
 * GET /api/urban-farming/plans/:id
 * Lấy chi tiết 1 gợi ý (detail)
 */
export const getFarmingModelById = asyncHandler(async (req, res) => {
  const userId = getUserIdOrThrow(req, res);
  const { id } = req.params;

  const doc = await FarmingModel.findOne({
    _id: id,
    userId,
  }).lean();

  if (!doc) {
    return res.status(404).json({
      success: false,
      message: "Không tìm thấy gợi ý trồng trọt.",
    });
  }

  return res.json({
    success: true,
    data: doc,
  });
});

/**
 * DELETE /api/urban-farming/plans/:id
 * Xóa mềm 1 gợi ý (status → deleted)
 */
export const softDeleteFarmingModel = asyncHandler(async (req, res) => {
  const userId = getUserIdOrThrow(req, res);
  const { id } = req.params;

  const doc = await FarmingModel.findOneAndUpdate(
    { _id: id, userId, status: "active" },
    {
      $set: {
        status: "deleted",
        deletedAt: new Date(),
      },
    },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({
      success: false,
      message:
        "Không tìm thấy gợi ý hoặc gợi ý đã bị xóa trước đó.",
    });
  }

  return res.json({
    success: true,
    message: "Đã xóa mềm gợi ý.",
    data: doc,
  });
});

/**
 * PATCH /api/urban-farming/plans/:id/restore
 * Khôi phục (restore) 1 gợi ý đã xóa mềm
 */
export const restoreFarmingModel = asyncHandler(async (req, res) => {
  const userId = getUserIdOrThrow(req, res);
  const { id } = req.params;

  const doc = await FarmingModel.findOneAndUpdate(
    { _id: id, userId, status: "deleted" },
    {
      $set: {
        status: "active",
        deletedAt: null,
      },
    },
    { new: true }
  );

  if (!doc) {
    return res.status(404).json({
      success: false,
      message:
        "Không tìm thấy gợi ý đã xóa để khôi phục.",
    });
  }

  return res.json({
    success: true,
    message: "Đã khôi phục gợi ý.",
    data: doc,
  });
});
