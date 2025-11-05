// backend/services/aiService.js
// Simple adapter to call an external Generative AI (Gemini) or return a mock if not configured.

const GEMINI_API_URL = process.env.GEMINI_API_URL || null; // e.g. https://generativelanguage.googleapis.com/v1/models/text-bison-001:generateText
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null; // Google API key (optional if using bearer)
let GEMINI_BEARER = process.env.GEMINI_BEARER || null; // Bearer token if you prefer
const GEMINI_SA = process.env.GEMINI_SA || null; // optional: service account JSON (stringified) to auto-fetch bearer

function buildPrompt({ description, symptoms, extra }) {
  return `You are an expert plant pathologist. A user provides the following information about a plant and its symptoms. Provide a concise diagnosis including: 1) most likely causes (list up to 3), 2) suggested next steps for confirmation (tests/observations), 3) immediate treatment/recommendations, and 4) estimated confidence (low/medium/high). Return both a short human-friendly summary and a structured JSON object with keys: likely_causes, confirmation_steps, recommendations, confidence.\n\nPlant description:\n${description}\n\nSymptoms:\n${symptoms}\n\nAdditional info:\n${extra || "-"}\n\nRespond in Vietnamese if the input language is Vietnamese; otherwise respond in English.`;
}

async function callGemini(prompt) {
  if (!GEMINI_API_URL) throw new Error("GEMINI_API_URL not configured");

  // For Google Generative Language API (Gemini) the body typically looks like:
  // { prompt: { text: "..." }, temperature, maxOutputTokens }
  const body = {
    prompt: { text: prompt },
    temperature: 0.2,
    maxOutputTokens: 800,
  };

  const headers = { "Content-Type": "application/json" };
  // If a bearer token is provided explicitly use it. Otherwise, if a Service Account JSON
  // is provided in GEMINI_SA, attempt to obtain an access token automatically.
  if (!GEMINI_BEARER && GEMINI_SA) {
    try {
      // dynamic import so package is optional at runtime
      const { GoogleAuth } = await import('google-auth-library');
      const creds = typeof GEMINI_SA === 'string' ? JSON.parse(GEMINI_SA) : GEMINI_SA;
      const auth = new GoogleAuth({ credentials: creds, scopes: ['https://www.googleapis.com/auth/cloud-platform'] });
      const client = await auth.getClient();
      const accessToken = await client.getAccessToken();
      const token = accessToken && (accessToken.token || accessToken);
      if (token) {
        GEMINI_BEARER = token;
      }
    } catch (err) {
      console.error('aiService: failed to obtain access token from GEMINI_SA', err && err.message ? err.message : err);
    }
  }

  if (GEMINI_BEARER) headers.Authorization = `Bearer ${GEMINI_BEARER}`;

  const url = GEMINI_API_KEY ? `${GEMINI_API_URL}?key=${GEMINI_API_KEY}` : GEMINI_API_URL;

  const res = await fetch(url, { method: "POST", headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI API error: ${res.status} ${text}`);
  }

  const data = await res.json();

  // Try multiple common response shapes used by generative APIs (Google/Vertex etc.)
  // - Google Generative API (v1beta2/v1) often returns { candidates: [{ output: "..." }] }
  // - Some providers use { candidates: [{ content: "..." }] } or { output: [{ content: ... }] }
  let text = null;
  if (Array.isArray(data?.candidates) && data.candidates.length) {
    text = data.candidates[0].output || data.candidates[0].content || data.candidates[0].text || data.candidates[0];
  }
  if (!text && Array.isArray(data?.output) && data.output.length) {
    text = data.output[0].content || data.output[0].text || data.output[0];
  }
  if (!text && data?.text) text = data.text;
  if (!text) text = JSON.stringify(data);

  return { raw: data, text };
}

export const generateDiagnosis = async ({ description, symptoms, extra }) => {
  const prompt = buildPrompt({ description, symptoms, extra });

  // Add richer logging for debugging 500 errors
  console.log("aiService: generateDiagnosis invoked", {
    descriptionLength: description ? description.length : 0,
    symptomsLength: symptoms ? symptoms.length : 0,
    hasGEMINI_API_URL: !!GEMINI_API_URL,
    hasGEMINI_API_KEY: !!GEMINI_API_KEY,
    hasGEMINI_BEARER: !!GEMINI_BEARER,
    hasGEMINI_SA: !!GEMINI_SA,
  });

  // Call remote AI if configured, otherwise keep a mock for dev convenience
  let resp;
  try {
    if (GEMINI_API_URL) {
      console.log("aiService: GEMINI_API_URL is set, calling remote AI...");
      resp = await callGemini(prompt);
      resp.provider = resp.provider || "gemini";
    } else {
      const mockText = `Mô tả nhận dạng giả (mock): Dựa trên mô tả, có thể do nấm Rhizoctonia hoặc bệnh do phấn trắng. Khuyến nghị: kiểm tra vết uốn lá, độ ẩm, cắt bỏ phần bệnh và xử lý bằng thuốc gốc đồng. Confidence: medium.`;
      resp = { raw: null, text: mockText, provider: "mock" };
    }
  } catch (err) {
    console.error("aiService: generateDiagnosis - error calling AI provider", {
      message: err && err.message,
      stack: err && err.stack,
      descriptionSnippet: description ? description.slice(0, 200) : null,
      symptomsSnippet: symptoms ? symptoms.slice(0, 200) : null,
    });
    // rethrow so controller/middleware can handle and return 500
    throw err;
  }
  // Try to detect a JSON block inside the returned text
  const txt = resp.text;
  let structured = null;
  try {
    // try to parse JSON substring
    const firstBrace = txt.indexOf("{");
    if (firstBrace >= 0) {
      const jsonSub = txt.slice(firstBrace);
      structured = JSON.parse(jsonSub);
    }
  } catch (e) {
    structured = null;
  }

  return { text: txt, structured, raw: resp.raw, provider: resp.provider || "gemini" };
};
