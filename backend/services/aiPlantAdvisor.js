// be/services/aiPlantAdvisor.js
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Dùng chung 1 model, bạn có thể đổi sang model khác nếu muốn
const MODEL = "gpt-4o-mini";

/**
 * Nhận raw từ Plant.id, trả về advice tiếng Việt có cấu trúc
 */
export async function buildAiAdviceFromPlantId(result) {
  const health = result?.health_assessment;
  const diseases = Array.isArray(health?.diseases) ? health.diseases : [];

  if (!diseases.length) return null;

  const prompt = {
    role: "user",
    content: JSON.stringify(
      {
        note: "Đây là kết quả chẩn đoán bệnh cây từ Plant.id. Hãy phân tích và trả về JSON tiếng Việt dễ hiểu.",
        diseases: diseases.map((d) => ({
          name: d.name,
          probability: d.probability,
          description: d.disease_details?.description,
          treatment: d.disease_details?.treatment,
        })),
      },
      null,
      2
    ),
  };

  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Bạn là chuyên gia cây trồng, tư vấn cho người trồng rau tại ban công/ân thượng trong đô thị. Hãy trả lời bằng tiếng Việt, súc tích, thân thiện, không dùng thuật ngữ quá khó.",
      },
      {
        role: "system",
        content:
          "Hãy trả về JSON với cấu trúc: { \"diseases\": [ { \"originalName\", \"viName\", \"probability\", \"severity\", \"summaryVi\", \"actions\": { \"immediate\", \"next_3_7_days\", \"prevention\" }, \"caution\" } ] }.",
      },
      prompt,
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return parsed;
}

/**
 * Nhận text mô tả triệu chứng → AI phân tích & đề xuất giải pháp
 */
export async function diagnoseFromText({
  description,
  plantType,
  environment,
}) {
  const completion = await client.chat.completions.create({
    model: MODEL,
    response_format: { type: "json_object" },
    messages: [
      {
        role: "system",
        content:
          "Bạn là chuyên gia cây trồng, tư vấn cho người trồng tại ban công/ân thượng ở đô thị. Hãy trả lời bằng tiếng Việt, rõ ràng, dễ làm theo.",
      },
      {
        role: "system",
        content:
          "Hãy trả về JSON với cấu trúc: { \"summaryVi\", \"possibleDiseases\": [ { \"name\", \"likelihood\", \"reason\" } ], \"actions\": { \"today\", \"next_3_7_days\", \"monitor\" }, \"warning\": string }.",
      },
      {
        role: "user",
        content: `
Mô tả triệu chứng của người dùng:
${description}

Loại cây (nếu có):
${plantType || "Không rõ"}

Điều kiện môi trường (nếu có, ví dụ: nắng, gió, tưới, đất, chậu...):
${environment || "Không rõ"}
        `,
      },
    ],
  });

  const parsed = JSON.parse(completion.choices[0].message.content);
  return parsed;
}
