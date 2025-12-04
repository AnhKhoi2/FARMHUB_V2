// backend/services/aiGemini.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) console.warn("[Gemini] Missing GEMINI_API_KEY in .env");

// ⭐ DÙNG MODEL 2.x (1.5 đã bị gỡ khỏi API nên không dùng được)
const MODEL_NAME = "gemini-2.0-flash";
// Hoặc rẻ hơn (nếu tài khoản hỗ trợ): "gemini-2.0-flash-lite";

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({ model: MODEL_NAME });

/**
 * Retry helper cho generateContent – chống 429 Too Many Requests
 */
async function safeGenerateContent(prompt, retries = 3, delay = 1200) {
  try {
    return await model.generateContent(prompt);
  } catch (err) {
    if (err.status === 429 && retries > 0) {
      console.warn(
        `[Gemini] 429 Too Many Requests → retry sau ${delay}ms... (còn ${retries} lần)`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      return safeGenerateContent(prompt, retries - 1, delay * 1.5);
    }

    console.error("[Gemini] Fatal error:", err);
    throw err;
  }
}

/**
 * Helper: Bóc JSON từ text Gemini (bỏ ```json, cố gắng lấy phần { ... })
 */
function parseJSON(text) {
  try {
    if (!text || !text.trim()) {
      throw new Error("Empty response from Gemini");
    }

    let clean = text
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Nếu không bắt đầu bằng { hoặc [, cố gắng cắt đoạn JSON bên trong
    if (!(clean.startsWith("{") || clean.startsWith("["))) {
      const start = clean.indexOf("{");
      const end = clean.lastIndexOf("}");
      if (start !== -1 && end !== -1 && end > start) {
        clean = clean.slice(start, end + 1);
      }
    }

    return JSON.parse(clean);
  } catch (err) {
    console.error("[Gemini] JSON parse error:", err);
    console.error("[Gemini] Raw text from model:\n", text);
    throw new Error("Gemini trả về dữ liệu không hợp lệ.");
  }
}

/**
 * 1) Advice từ Plant.id (dịch + hướng dẫn chăm sóc)
 */
export async function buildAiAdviceFromPlantId(result) {
  const diseases = result?.health_assessment?.diseases || [];
  if (diseases.length === 0) return null;

  const prompt = `
Bạn là chuyên gia nông nghiệp. 
Hãy dịch và chuyển đổi dữ liệu bệnh sau đây (từ Plant.id) sang JSON tiếng Việt.

TRẢ VỀ DUY NHẤT JSON, KHÔNG GIẢI THÍCH THÊM, KHÔNG DÙNG MARKDOWN, KHÔNG DÙNG \`\`\`:

{
  "diseases": [
    {
      "originalName": "",
      "viName": "",
      "probability": "",
      "severity": "",
      "summaryVi": "",
      "actions": {
        "immediate": "",
        "next_3_7_days": "",
        "prevention": ""
      },
      "caution": ""
    }
  ]
}

Dữ liệu:
${JSON.stringify(diseases, null, 2)}
  `;

  try {
    const response = await safeGenerateContent(prompt);
    const text = response.response.text();

    try {
      return parseJSON(text);
    } catch (parseErr) {
      console.error(
        "[Gemini] buildAiAdviceFromPlantId JSON parse failed, return null"
      );
      return null; // để FE hiểu là không có AI advice
    }
  } catch (err) {
    console.error("[Gemini] buildAiAdviceFromPlantId error:", err);
    return null;
  }
}

/**
 * 2) Diagnose từ mô tả text của người dùng
 */
export async function diagnoseFromText({
  description,
  plantType,
  environment,
}) {
  const prompt = `
Bạn là chuyên gia cây trồng. Hãy phân tích triệu chứng người dùng mô tả
và TRẢ LẠI DUY NHẤT JSON (KHÔNG THÊM GIẢI THÍCH, KHÔNG DÙNG MARKDOWN, KHÔNG DÙNG \`\`\`):

{
  "summaryVi": "",
  "possibleDiseases": [
    { "name": "", "likelihood": "", "reason": "" }
  ],
  "actions": {
    "today": "",
    "next_3_7_days": "",
    "monitor": ""
  },
  "warning": ""
}

--- Thông Tin Người Dùng ---
Triệu chứng: ${description}
Loại cây: ${plantType || "Không rõ"}
Điều kiện môi trường: ${environment || "Không rõ"}
  `;

  try {
    const response = await safeGenerateContent(prompt);
    const text = response.response.text();

    try {
      // Ưu tiên parse JSON chuẩn
      return parseJSON(text);
    } catch (parseErr) {
      console.error(
        "[Gemini] diagnoseFromText JSON parse failed, using fallback object"
      );

      // Fallback: trả raw text để FE vẫn hiển thị được gì đó, không crash
      return {
        summaryVi: text || "Không đọc được kết quả từ AI.",
        possibleDiseases: [],
        actions: {
          today: "",
          next_3_7_days: "",
          monitor: "",
        },
        warning:
          "Không thể phân tích JSON từ AI, đây là phản hồi gốc. Vui lòng thử lại sau hoặc mô tả rõ hơn.",
      };
    }
  } catch (err) {
    console.error("[Gemini] diagnoseFromText error:", err);

    if (err.status === 429) {
      throw new Error(
        "AI đang quá tải hoặc vượt hạn mức. Vui lòng thử lại sau vài phút."
      );
    }

    // Controller sẽ bắt và trả message này ra FE
    throw new Error("Gemini AI đang gặp sự cố.");
  }
}

/**
 * 3) Dịch wiki_description sang tiếng Việt
 */
export async function translateWikiDescriptionToVi(description) {
  if (!description) return null;

  const prompt = `
Dịch đoạn văn sau sang tiếng Việt, giữ nguyên ý và ngắn gọn hơn nếu có thể.
KHÔNG dùng Markdown, KHÔNG giải thích, chỉ trả về văn bản thuần:

"${description}"
  `;

  const response = await safeGenerateContent(prompt);
  return response.response.text().trim();
}

/**
 * 4) Gợi ý mô hình trồng trọt đô thị dựa trên form điều kiện trồng trọt
 *    (ban công, sân thượng, hộ dân đô thị, diện tích hạn chế,...)
 *
 * Input (ví dụ):
 * {
 *   "space_type": "balcony",
 *   "area_m2": 1.8,
 *   "shape": "long-narrow",
 *   "height_guardrail_cm": 110,
 *   "has_roof": true,
 *   "wind_exposure": "med",
 *   "sun_hours_summer": 4.5,
 *   "sun_hours_winter": 2.5,
 *   "sun_orientation": "SE",
 *   "water_access": "bucket",
 *   "drainage_ok": true,
 *   "power_outlet": false,
 *   "time_budget_hours_per_week": 1,
 *   "maintenance_style": "low",
 *   "budget_vnd": 1500000,
 *   "ongoing_budget_vnd_per_month": 150000,
 *   "goals": ["leafy","herbs","microgreens"],
 *   "yield_priority": 4,
 *   "aesthetic_priority": 3,
 *   "learning_priority": 2,
 *   "organic_pref": true,
 *   "water_saving_pref": true,
 *   "locality": "Ho Chi Minh City",
 *   "season_start_month": 12,
 *   "experience_level": "newbie"
 * }
 *
 * Output EXPECTED (schema):
 * {
 *   "climate_zone_vn": "south",
 *   "estimated_DLI": 10.2,
 *   "risks": [ "....", "...." ],
 *   "top_models": [
 *     { "model_id": "self-watering-container", "fit_score": 86, "reason_vi": "" }
 *   ],
 *   "crop_suggestions": [
 *     {
 *       "crop": "",
 *       "season": "cool|warm|any",
 *       "light_need_DLI": 10,
 *       "container_size_l": 8,
 *       "days_to_harvest": 35,
 *       "reason_vi": ""
 *     }
 *   ],
 *   "calendar": [
 *     { "week": 0, "milestone": "" }
 *   ],
 *   "upgrades_after_3m": [
 *     ""
 *   ]
 * }
 */
export async function suggestUrbanFarmingPlan(formInput) {
  const jsonInput = JSON.stringify(formInput, null, 2);

  const prompt = `
Bạn là chuyên gia nông nghiệp đô thị tại Việt Nam.
Người dùng là cư dân đô thị, diện tích nhỏ (ban công / sân thượng / hiên nhà), ưu tiên mô hình dễ triển khai và dễ chăm.

NHIỆM VỤ:
1) Phân tích điều kiện trồng trọt dựa trên JSON đầu vào.
2) Xác định vùng khí hậu Việt Nam tương ứng ("north", "central", "south", "highland").
3) Ước lượng DLI (Daily Light Integral) trung bình khả dụng trên không gian đó, dựa trên số giờ nắng, hướng nắng, có mái che hay không, v.v.
4) Gợi ý các mô hình trồng trọt phù hợp nhất với mục tiêu và ràng buộc của người dùng
   (đặc biệt chú ý: experience_level, maintenance_style, time_budget_hours_per_week, budget_vnd).
5) Gợi ý danh sách cây trồng (lá, rau gia vị, microgreens...) phù hợp điều kiện ánh sáng, mùa vụ Việt Nam, diện tích và kinh nghiệm.
6) Lập lịch khung 6 tuần đầu (calendar) bằng tiếng Việt, thực tế, đơn giản.
7) Đề xuất một vài nâng cấp sau 3 tháng nếu người dùng thấy phù hợp.

TRẢ VỀ DUY NHẤT JSON, KHÔNG GIẢI THÍCH THÊM, KHÔNG DÙNG MARKDOWN, KHÔNG DÙNG \`\`\`.
TẤT CẢ text (risks, reason_vi, milestone, upgrades_after_3m) VIẾT BẰNG TIẾNG VIỆT, NGẮN GỌN, THỰC TẾ.

BẮT BUỘC THEO ĐÚNG SCHEMA SAU (có thể thêm field phụ nếu cần, nhưng KHÔNG ĐƯỢC THIẾU bất kỳ field nào dưới đây):

{
  "climate_zone_vn": "north|central|south|highland",
  "estimated_DLI": 0,
  "risks": [
    "Chuỗi mô tả rủi ro ngắn bằng tiếng Việt"
  ],
  "top_models": [
    {
      "model_id": "self-watering-container | kratky-microgreens | railing-planter | vertical-rack | grow-bag-floor | hanging-baskets | other",
      "fit_score": 0,
      "reason_vi": "Giải thích ngắn gọn vì sao mô hình này phù hợp",
      "notes_layout_vi": "Gợi ý bố trí sơ bộ cho không gian cụ thể (ví dụ: kệ dài sát lan can...)"
    }
  ],
  "crop_suggestions": [
    {
      "crop": "tên cây trồng (tiếng Việt, ưu tiên giống phổ biến ở Việt Nam)",
      "season": "cool|warm|any",
      "light_need_DLI": 0,
      "container_size_l": 0,
      "days_to_harvest": 0,
      "reason_vi": "Vì sao cây này phù hợp với ánh sáng, không gian và mục tiêu người dùng"
    }
  ],
  "calendar": [
    {
      "week": 0,
      "milestone": "Mốc việc cần làm tuần này, viết ngắn gọn tiếng Việt"
    }
  ],
  "upgrades_after_3m": [
    "Đề xuất nâng cấp sau 3 tháng (VD: thêm 1 chậu tự tưới 20L, lưới che nắng 30%, giàn dưa leo lùn...)"
  ]
}

DỮ LIỆU ĐẦU VÀO (FORM NGƯỜI DÙNG):

${jsonInput}
  `;

  try {
    const response = await safeGenerateContent(prompt);
    const text = response.response.text();

    try {
      // Ưu tiên parse JSON chuẩn theo schema yêu cầu
      return parseJSON(text);
    } catch (parseErr) {
      console.error(
        "[Gemini] suggestUrbanFarmingPlan JSON parse failed, using fallback object"
      );

      // Fallback: trả rawText để FE vẫn hiển thị được gì đó, không crash
      return {
        climate_zone_vn: null,
        estimated_DLI: null,
        risks: [],
        top_models: [],
        crop_suggestions: [],
        calendar: [],
        upgrades_after_3m: [],
        rawText: text || "Không đọc được kết quả từ AI.",
        warning:
          "Không thể phân tích JSON từ AI, đây là phản hồi gốc. Vui lòng thử lại sau hoặc điều chỉnh thông tin đầu vào.",
      };
    }
  } catch (err) {
    console.error("[Gemini] suggestUrbanFarmingPlan error:", err);

    if (err.status === 429) {
      throw new Error(
        "AI đang quá tải hoặc vượt hạn mức. Vui lòng thử lại sau vài phút."
      );
    }

    throw new Error("AI gợi ý mô hình trồng trọt đang gặp sự cố.");
  }
}
