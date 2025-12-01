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
      userId: userId || null,
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
    const { description, plantType, environment, userId } = req.body || {};

    if (!description || description.trim().length < 5) {
      return res.status(400).json({
        error: "Mô tả quá ngắn, vui lòng mô tả triệu chứng chi tiết hơn.",
      });
    }

    const aiAdvice = await diagnoseFromText({
      description,
      plantType,
      environment,
    });

    return res.json({
      success: true,
      provider: "gemini",
      aiAdvice,
    });
  } catch (err) {
    console.error("[diagnosePlantByTextController] Gemini error:", err);
    return res.status(503).json({
      error:
        "AI Gemini tạm thời không khả dụng. Vui lòng thử lại sau hoặc liên hệ quản trị viên.",
    });
  }
};
