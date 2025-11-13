// backend/services/aiService.js
// Simple adapter to call an external Generative AI (Gemini) or return a mock if not configured.
import fs from 'fs';
import path from 'path';

const DEBUG_LOG = path.join(process.cwd(), 'backend_ai_debug.log');

const GEMINI_API_URL = process.env.GEMINI_API_URL || null; // e.g. https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || null; // Google API key (optional if using bearer)
let GEMINI_BEARER = process.env.GEMINI_BEARER || null; // Bearer token if you prefer
const GEMINI_SA = process.env.GEMINI_SA || null; // optional: service account JSON (stringified) to auto-fetch bearer

// Đặt giới hạn token mặc định cao để tránh lỗi MAX_TOKENS
const GEMINI_MAX_OUTPUT_TOKENS = Number(process.env.GEMINI_MAX_OUTPUT_TOKENS || 8192);

// Prompt đơn giản hóa. Schema sẽ xử lý việc định dạng JSON.
function buildPrompt({ description, symptoms, extra }) {
  return `Bạn là chuyên gia bệnh cây trồng. Hãy chẩn đoán nguyên nhân và đề xuất biện pháp chữa trị dựa trên thông tin sau.
Mô tả: ${description}
Triệu chứng: ${symptoms}
Bổ sung: ${extra || "-"}`;
}

async function callGemini(body) {
  if (!GEMINI_API_URL) throw new Error("GEMINI_API_URL not configured");

  // (Phần xác thực Auth/Bearer giữ nguyên)
  const headers = { "Content-Type": "application/json" };
  if (!GEMINI_BEARER && GEMINI_SA) {
    try {
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

  // (Phần computeAlternateModelUrls giữ nguyên)
  const computeAlternateModelUrls = (originalUrl) => {
    try {
      const alts = new Set();
      const add = (u) => { if (u && u !== originalUrl) alts.add(u); };
      if (originalUrl.includes('/v1/models/')) {
        add(originalUrl.replace('/v1/models/', '/v1beta/models/'));
      }
      add(originalUrl.replace('gemini-1.5-flash:generateContent', 'gemini-1.5-flash-latest:generateContent'));
      add(originalUrl.replace('gemini-1.5-pro:generateContent', 'gemini-1.5-pro-latest:generateContent'));
      const v1betaUrl = originalUrl.replace('/v1/models/', '/v1beta/models/');
      add(v1betaUrl.replace('gemini-1.5-flash', 'gemini-2.5-flash'));
      add(v1betaUrl.replace('gemini-1.5-pro', 'gemini-2.5-pro'));
      add(v1betaUrl.replace(/gemini-[^/:]+:generateContent/, 'gemini-flash-latest:generateContent'));
      add(v1betaUrl.replace(/gemini-[^/:]+:generateContent/, 'gemini-pro-latest:generateContent'));
      return Array.from(alts);
    } catch {
      return [];
    }
  };

  // (Phần Debug logging giữ nguyên)
  try {
    const maskedUrl = String(url).replace(/(key=)[^&]+/, '$1***');
    console.log('aiService.callGemini -> POST', maskedUrl);
    const bodySummary = JSON.stringify(body).slice(0, 1000);
    console.log('aiService.callGemini -> body summary', bodySummary);
    try { fs.appendFileSync(DEBUG_LOG, `POST ${new Date().toISOString()} ${maskedUrl}\n`); fs.appendFileSync(DEBUG_LOG, `BODY ${bodySummary}\n`); } catch (e) { }
  } catch (e) {
    console.warn('aiService.callGemini -> failed to prepare debug logs', e && e.message);
  }

  // (Phần fetchWithRetries giữ nguyên)
  const fetchWithRetries = async (fetchUrl, opts, attempts = 3, baseDelay = 500) => {
    let lastErr = null;
    for (let i = 0; i < attempts; i++) {
      try {
        const r = await fetch(fetchUrl, opts);
        if ([429, 502, 503].includes(r.status)) {
          lastErr = new Error(`Transient status ${r.status}`);
          const delay = Math.round(baseDelay * Math.pow(2, i) * (0.8 + Math.random() * 0.4));
          await new Promise((res) => setTimeout(res, delay));
          continue;
        }
        return r;
      } catch (e) {
        lastErr = e;
        const delay = Math.round(baseDelay * Math.pow(2, i) * (0.8 + Math.random() * 0.4));
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw lastErr || new Error('fetchWithRetries failed');
  };

  // First attempt
  let effectiveUrl = url;
  let res = await fetchWithRetries(effectiveUrl, { method: "POST", headers, body: JSON.stringify(body) });
  let resText = await res.text();

  // (Phần log response snippet giữ nguyên)
  try {
    console.log(`aiService.callGemini -> response status: ${res.status}`);
    console.log('aiService.callGemini -> response snippet:', resText.slice(0, 1000));
    try { fs.appendFileSync(DEBUG_LOG, `RESPONSE ${new Date().toISOString()} STATUS:${res.status}\n`); fs.appendFileSync(DEBUG_LOG, `${resText.slice(0, 2000)}\n----\n`); } catch (e) { }
  } catch (e) {
    console.warn('aiService.callGemini -> failed to log response snippet', e && e.message);
  }

  if (!res.ok) {
    // (Phần retry 404 giữ nguyên)
    if (res.status === 404 && /not found|not supported/i.test(resText)) {
      const altUrls = computeAlternateModelUrls(effectiveUrl);
      for (const altUrl of altUrls) {
        try {
          const maskedAlt = String(altUrl).replace(/(key=)[^&]+/, '$1***');
          console.warn('aiService.callGemini -> retry with alternate URL', maskedAlt);
        } catch { }
        const attempt = await fetchWithRetries(altUrl, { method: "POST", headers, body: JSON.stringify(body) });
        const attemptText = await attempt.text();
        try {
          console.log(`aiService.callGemini (retry) -> response status: ${attempt.status}`);
          console.log('aiService.callGemini (retry) -> response snippet:', attemptText.slice(0, 1000));
          try { fs.appendFileSync(DEBUG_LOG, `RETRY RESPONSE ${new Date().toISOString()} STATUS:${attempt.status}\n`); fs.appendFileSync(DEBUG_LOG, `${attemptText.slice(0, 2000)}\n----\n`); } catch (e) { }
        } catch { }
        if (attempt.ok) {
          res = attempt;
          resText = attemptText;
          effectiveUrl = altUrl;
          break;
        }
      }
    }

    if (!res.ok) {
      throw new Error(`AI API error: ${res.status} ${resText.slice(0, 1000)}`);
    }
  }

  const data = JSON.parse(resText);

  // (Phần pickText helper giữ nguyên)
  const pickText = (obj) => {
    if (!obj || typeof obj !== 'object') return null;
    if (typeof obj.text === 'string' && obj.text.trim()) return obj.text;
    if (typeof obj.output === 'string' && obj.output.trim()) return obj.output;
    const inline = obj.inlineData || obj.inline_data;
    if (inline && typeof inline === 'object') {
      const dataB64 = inline.data;
      if (typeof dataB64 === 'string' && dataB64) {
        try {
          const decoded = Buffer.from(dataB64, 'base64').toString('utf8');
          if (decoded && decoded.trim()) return decoded;
        } catch { }
      }
    }
    if (Array.isArray(obj.parts)) {
      for (const p of obj.parts) {
        const t = pickText(p);
        if (t) return t;
      }
    }
    if (Array.isArray(obj.content)) {
      for (const c of obj.content) {
        const t = pickText(c);
        if (t) return t;
      }
    } else if (obj.content) {
      const t = pickText(obj.content);
      if (t) return t;
    }
    if (Array.isArray(obj.candidates)) {
      for (const c of obj.candidates) {
        const t = pickText(c);
        if (t) return t;
      }
    }
    return null;
  };

  let text = null;
  try {
    text = pickText(data);
  } catch (e) {
    console.error('aiService: Error parsing response structure', e && e.message);
  }

  // Fallback (Lượt thử thứ hai)
  if (!text) {
    try {
      const fallbackBody = JSON.parse(JSON.stringify(body));
      const fallbackSystem = 'Chỉ trả về JSON dạng {"cause":"...","treatment":"..."} ≤ 200 ký tự. Không giải thích, không mô tả suy luận.';
      if (fallbackBody.systemInstruction && Array.isArray(fallbackBody.systemInstruction.parts)) {
        fallbackBody.systemInstruction.parts.unshift({ text: fallbackSystem });
      } else {
        fallbackBody.systemInstruction = { parts: [{ text: fallbackSystem }] };
      }
      fallbackBody.generationConfig = {
        ...(fallbackBody.generationConfig || {}),
        maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS, // Sử dụng token đầy đủ
        responseModalities: ["TEXT"],
        responseMimeType: 'application/json' // Vẫn giữ JSON mode
      };

      console.warn('aiService.callGemini -> second attempt to elicit plain text response');
      const attempt = await fetch(url, { method: 'POST', headers, body: JSON.stringify(fallbackBody) });
      const attemptText = await attempt.text();
      try {
        console.log(`aiService.callGemini (second attempt) -> status: ${attempt.status}`);
        console.log('aiService.callGemini (second attempt) -> snippet:', attemptText.slice(0, 1000));
        try { fs.appendFileSync(DEBUG_LOG, `SECOND_ATTEMPT ${new Date().toISOString()} STATUS:${attempt.status}\n`); fs.appendFileSync(DEBUG_LOG, `${attemptText.slice(0, 2000)}\n----\n`); } catch (e) { }
      } catch { }
      if (attempt.ok) {
        try {
          const data2 = JSON.parse(attemptText);
          text = pickText(data2) || text;
        } catch {
          if (!text && attemptText && attemptText.trim()) text = attemptText.trim();
        }
      }
    } catch (e) {
      console.warn('aiService: second attempt failed', e && e.message);
    }

    if (!text) {
      console.warn('aiService: Could not find text in response, returning full data.');
      throw new Error(`AI response was empty or invalid. FinishReason: ${data?.candidates?.[0]?.finishReason || 'unknown'}`);
    }
  }

  return { raw: data, text };
}

export const generateDiagnosis = async ({ description, symptoms, extra }) => {
  const prompt = buildPrompt({ description, symptoms, extra });

  // (Phần logging giữ nguyên)
  console.log("aiService: generateDiagnosis invoked", {
    descriptionLength: description ? description.length : 0,
    symptomsLength: symptoms ? symptoms.length : 0,
    hasGEMINI_API_URL: !!GEMINI_API_URL,
    hasGEMINI_API_KEY: !!GEMINI_API_KEY,
    hasGEMINI_BEARER: !!GEMINI_BEARER,
    hasGEMINI_SA: !!GEMINI_SA,
  });

  // Call remote AI
  let resp;
  try {
    if (GEMINI_API_URL) {
      console.log("aiService: GEMINI_API_URL is set, calling remote AI...");

      const body = {
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
          responseModalities: ["TEXT"],
          responseMimeType: "application/json",
          responseSchema: {
            type: "object",
            properties: {
              cause: { type: "string" },
              treatment: { type: "string" }
            },
            required: ["cause", "treatment"]
          }
        }
      };

      resp = await callGemini(body); // Gửi đối tượng body
      resp.provider = resp.provider || "gemini";
    } else {
      const mockText = `{"cause": "Nấm Rhizoctonia (giả)", "treatment": "Cắt bỏ phần bệnh và xử lý bằng thuốc gốc đồng (giả)"}`;
      resp = { raw: null, text: mockText, provider: "mock" };
    }
  } catch (err) {
    // (Phần xử lý lỗi giữ nguyên)
    console.error("aiService: generateDiagnosis - error calling AI provider", {
      message: err && err.message,
      stack: err && err.stack,
      descriptionSnippet: description ? description.slice(0, 200) : null,
      symptomsSnippet: symptoms ? symptoms.slice(0, 200) : null,
    });
    throw err;
  }

  const txt = resp.text;
  let structured = null;
  try {
    structured = JSON.parse(txt);
  } catch (e) {
    console.error("aiService: Failed to parse structured JSON from response", { text: txt, error: e.message });
    structured = null;
  }

  return { text: txt, structured, raw: resp.raw, provider: resp.provider || "gemini" };
};

export const generateChatResponse = async ({ messages = [] }) => {
  if (!Array.isArray(messages) || messages.length === 0) {
    throw new Error('messages array is required');
  }

  // Prompt hệ thống đơn giản, schema sẽ xử lý định dạng
  let systemPrompt = `Bạn là trợ lý chuyên gia bệnh cây trồng. Hãy chẩn đoán nguyên nhân và biện pháp chữa trị.`;

  const contents = [];

  for (const m of messages) {
    const role = (m.role || 'user').toLowerCase();
    const content = m.content || '';

    if (role === 'system') {
      systemPrompt = content;
    } else {
      contents.push({
        role: (role === 'assistant' ? 'model' : 'user'),
        parts: [{ text: content }]
      });
    }
  }

  // Xây dựng body đầy đủ
  const body = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: contents,
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: GEMINI_MAX_OUTPUT_TOKENS,
      responseModalities: ["TEXT"],
      // Sử dụng JSON mode
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          cause: { type: "string" },
          treatment: { type: "string" }
        },
        required: ["cause", "treatment"]
      }
    }
  };

  // Call Gemini (or mock)
  let resp;
  try {
    if (GEMINI_API_URL) {
      resp = await callGemini(body); // Gửi body đã được xây dựng
      resp.provider = resp.provider || 'gemini';
    } else {
      resp = { raw: null, text: '{"cause": "Giả lập", "treatment": "Đây là phản hồi giả cho mục đích phát triển."}', provider: 'mock' };
    }
  } catch (err) {
    console.error('aiService: generateChatResponse error', { message: err.message });
    throw err;
  }

  const txt = resp.text || '';
  let structured = null;
  try {
    // *** ĐÂY LÀ SỬA LỖI (DÒNG ~448) ***
    // Đã xóa lệnh gọi hàm `extractCauseTreatment` không tồn tại.
    // Chúng ta parse `txt` trực tiếp vì nó là JSON sạch.
    structured = JSON.parse(txt);
  } catch (e) {
    console.error("aiService: Failed to parse structured JSON from chat response", { text: txt, error: e.message });
    structured = null;
  }

  return { text: txt, structured, raw: resp.raw, provider: resp.provider || 'gemini' };
};