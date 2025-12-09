// backend/controllers/plantController.js
import { diagnosePlant } from "../services/plantid.js";
import PlantDiagnosis from "../models/PlantDiagnosis.js";
// import {
//   buildAiAdviceFromPlantId,
//   diagnoseFromText,
// } from "../services/aiPlantAdvisor.js";
import {
  buildAiAdviceFromPlantId,
  diagnoseFromText,
} from "../services/aiGemini.js";
import { translateWikiDescriptionToVi } from "../services/aiGemini.js";

import User from "../models/User.js";
import { getVietnamToday } from "../utils/timezone.js";

/**
 * POST /api/plant/diagnose
 * Hỗ trợ 2 kiểu:
 * 1) multipart/form-data với field "image" (req.file)
 * 2) JSON body: { base64?: string, imageUrl?: string, plantId?: string, userId?: string }
 */
export const diagnosePlantController = async (req, res, next) => {
  try {
    // Lấy các field text (kể cả khi multipart, multer vẫn fill req.body)
    const { imageUrl, plantId, userId } = req.body || {};

    let base64 = null;

    // ✅ Ưu tiên ảnh gửi dạng file (multer.memoryStorage → buffer)
    if (req.file && req.file.buffer) {
      base64 = req.file.buffer.toString("base64");
    }

    // ✅ Fallback: nếu client cũ vẫn gửi base64 trong JSON
    if (!base64 && req.body && req.body.base64) {
      base64 = req.body.base64;
    }

    // Nếu có imageUrl (trường hợp bạn dùng URL từ chỗ khác) vẫn cho phép,
    // nhưng ít dùng khi upload trực tiếp
    if (!imageUrl && !base64) {
      return res
        .status(400)
        .json({ error: "Vui lòng gửi ảnh (file) hoặc base64." });
    }

    // 🔐 Xác định user đang gọi API (để giới hạn theo tháng)
    const authUserId = req.user?.id || req.user?._id;
    const targetUserId = userId || authUserId || null;

    const MONTHLY_LIMIT = 3;
    let usageImageInfo = null;
    let monthKey = null;

    if (targetUserId) {
      const userDoc = await User.findById(targetUserId);

      if (userDoc) {
        // 🧮 Tính tháng hiện tại theo giờ VN (YYYY-MM)
        const today = getVietnamToday();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        monthKey = `${year}-${month}`; // vd: "2025-12"

        const plan = userDoc.subscriptionPlan || userDoc.plan || "basic";
        const isFreePlan = plan === "basic" || plan === "free";

        if (isFreePlan) {
          usageImageInfo = userDoc.aiImageDiagnoseUsage || {
            monthKey,
            count: 0,
          };

          // Nếu sang tháng mới → reset count
          if (usageImageInfo.monthKey !== monthKey) {
            usageImageInfo.monthKey = monthKey;
            usageImageInfo.count = 0;
          }

          // Hết quota 3 lần / tháng
          if (usageImageInfo.count >= MONTHLY_LIMIT) {
            return res.status(429).json({
              success: false,
              error:
                "Bạn đã sử dụng hết 3 lần chẩn đoán bằng ảnh trong tháng này. " +
                "Vui lòng đợi sang tháng sau hoặc nâng cấp gói để tiếp tục sử dụng.",
              usageImage: {
                monthKey,
                used: usageImageInfo.count,
                limit: MONTHLY_LIMIT,
              },
            });
          }

          // ✅ Chưa vượt → tăng count trước khi gọi Plant.id
          usageImageInfo.count += 1;
          userDoc.aiImageDiagnoseUsage = usageImageInfo;
          await userDoc.save();
        }
      }
    }

    // Gửi đến Plant.id – hàm diagnosePlant hiện đang hỗ trợ { imageUrl, base64 }
    const result = await diagnosePlant({ imageUrl, base64 });

    const best = result.suggestions?.[0];
    const health = result.health_assessment;
    const storedImageUrl = result.images?.[0]?.url || null;

    const issues =
      health?.diseases?.slice(0, 5).map((d) => ({
        name: d.disease_details?.local_name || d.name || "Unknown",
        probability: d.probability || 0,
        treatment: d.disease_details?.treatment || null,
      })) || [];

    // Gọi Gemini để tạo advice từ Plant.id (nếu muốn dùng sau này)
    let aiAdvice = null;
    try {
      aiAdvice = await buildAiAdviceFromPlantId(result);
    } catch (e) {
      console.error("[Gemini] buildAiAdviceFromPlantId error:", e?.message || e);
    }

    const doc = await PlantDiagnosis.create({
      userId: targetUserId || null,
      plantId: plantId || null,
      provider: "plant.id",
      inputImageUrl: imageUrl || null,
      storedImageUrl,
      plantName:
        best?.plant_details?.scientific_name || best?.plant_name || null,
      plantCommonName: best?.plant_details?.common_names?.[0] || null,
      plantProbability: best?.probability ?? null,
      isHealthy: health?.is_healthy ?? null,
      isHealthyProbability: health?.is_healthy_probability ?? null,
      issues,
      raw: result,
      aiAdvice, // lưu lại, FE hiện tại chưa dùng cũng không sao
    });

    return res.json({
      success: true,
      provider: "plant.id",
      diagnosisId: doc._id,
      data: result, // FE đang dùng trường này
      aiAdvice,
      // Trả thêm usageImage (nếu có) để FE có thể hiển thị sau này
      usageImage: usageImageInfo
        ? {
            monthKey,
            used: usageImageInfo.count,
            limit: MONTHLY_LIMIT,
          }
        : null,
    });
  } catch (err) {
    console.error("[diagnosePlantController] error:", err);
    return next(err);
  }
};

/**
 * POST /api/plant/ai-text-diagnose
 * body: { description: string, plantType?: string, environment?: string, userId?: string }
 */
export const diagnosePlantByTextController = async (req, res, next) => {
  try {
    const { description, plantType, environment, userId: bodyUserId } =
      req.body || {};

    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        error: "Mô tả quá ngắn, vui lòng mô tả triệu chứng chi tiết hơn.",
      });
    }

    // 🔐 Xác định user đang gọi API
    const authUserId = req.user?.id || req.user?._id;
    const targetUserId = bodyUserId || authUserId || null;

    let userDoc = null;
    if (targetUserId) {
      userDoc = await User.findById(targetUserId);
    }

    // 🧮 Tính tháng hiện tại theo giờ VN (YYYY-MM)
    const today = getVietnamToday(); // Date đã chuẩn UTC+7
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const monthKey = `${year}-${month}`; // vd: "2025-12"

    // 🎫 Giới hạn 3 lần/tháng cho gói free/basic
    let usageInfo = null;
    const plan = userDoc?.subscriptionPlan || userDoc?.plan || "basic";
    const isFreePlan = plan === "basic" || plan === "free";
    const MONTHLY_LIMIT = 3;

    if (userDoc && isFreePlan) {
      usageInfo = userDoc.aiTextDiagnoseUsage || {
        monthKey,
        count: 0,
      };

      // Nếu sang tháng mới → reset count
      if (usageInfo.monthKey !== monthKey) {
        usageInfo.monthKey = monthKey;
        usageInfo.count = 0;
      }

      if (usageInfo.count >= MONTHLY_LIMIT) {
        return res.status(429).json({
          success: false,
          error:
            "Bạn đã sử dụng hết 3 lần phân tích mô tả bằng AI trong tháng này. " +
            "Vui lòng đợi sang tháng sau hoặc nâng cấp gói để tiếp tục sử dụng.",
          usage: {
            monthKey,
            used: usageInfo.count,
            limit: MONTHLY_LIMIT,
          },
        });
      }

      // ✅ Chưa vượt → tăng count trước khi gọi AI
      usageInfo.count += 1;
      userDoc.aiTextDiagnoseUsage = usageInfo;
      await userDoc.save();
    }

    // 🤖 Gọi Gemini
    const aiAdvice = await diagnoseFromText({
      description,
      plantType,
      environment,
    });

    return res.json({
      success: true,
      provider: "gemini",
      aiAdvice,
      usage: usageInfo
        ? {
            monthKey,
            used: usageInfo.count,
            limit: MONTHLY_LIMIT,
          }
        : null,
    });
  } catch (err) {
    console.error("[diagnosePlantByTextController] Gemini error:", err);
    return res.status(503).json({
      error:
        "AI Gemini tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
    });
  }
};
