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
