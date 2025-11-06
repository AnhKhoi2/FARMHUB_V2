import 'dotenv/config';

const { GEMINI_API_KEY, GEMINI_API_URL } = process.env;

function maskKey(key) {
  if (!key) return '(none)';
  if (key.length <= 6) return '***';
  return key.slice(0, 3) + '***' + key.slice(-3);
}

async function get(url, opts = {}) {
  const res = await fetch(url, { ...opts, method: 'GET' });
  const text = await res.text();
  return { status: res.status, text };
}

async function post(url, body, headers = {}) {
  const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body: JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, text };
}

function buildBody(prompt) {
  return {
    contents: [
      { role: 'user', parts: [{ text: prompt }] }
    ],
    generationConfig: { temperature: 0.2, maxOutputTokens: 64 }
  };
}

async function main() {
  console.log('=== Gemini Diagnostics ===');
  console.log('GEMINI_API_URL =', GEMINI_API_URL || '(none)');
  console.log('GEMINI_API_KEY =', maskKey(GEMINI_API_KEY));

  if (!GEMINI_API_KEY) {
    console.log('No GEMINI_API_KEY found. Please set it in backend/.env');
    process.exit(1);
  }

  // 1) List models to see what's available to this key
  const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(GEMINI_API_KEY)}`;
  console.log('\n[1] Listing models from', listUrl.replace(/key=[^&]+/, 'key=***'));
  try {
    const list = await get(listUrl);
    console.log('Status:', list.status);
    try {
      const data = JSON.parse(list.text);
      const models = Array.isArray(data.models) ? data.models : [];
      const gen = models.filter(m => Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent'));
      console.log(`Found ${models.length} models, ${gen.length} support generateContent.`);
      for (const m of gen) {
        console.log(`- ${m.name} (${m.displayName || m.name}) methods=${m.supportedGenerationMethods.join(',')}`);
      }
    } catch {
      console.log('Body snippet:', list.text.slice(0, 1500));
    }
  } catch (e) {
    console.log('List models error:', e.message);
  }

  // 2) Probe generateContent on a set of known-good URLs
  const candidates = [
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent',
    'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent',
    'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b-latest:generateContent'
  ];

  const body = buildBody('Ping test from FARMHUB_V2 diagnostics.');
  for (const base of candidates) {
    const url = `${base}?key=${encodeURIComponent(GEMINI_API_KEY)}`;
    const masked = url.replace(/key=[^&]+/, 'key=***');
    console.log(`\n[2] Probing ${masked}`);
    try {
      const res = await post(url, body);
      console.log('Status:', res.status);
      console.log('Body snippet:', res.text.slice(0, 300));
    } catch (e) {
      console.log('Request error:', e.message);
    }
  }

  // 3) If GEMINI_API_URL is set, test it as-is
  if (GEMINI_API_URL) {
    const url = GEMINI_API_KEY ? `${GEMINI_API_URL}?key=${encodeURIComponent(GEMINI_API_KEY)}` : GEMINI_API_URL;
    console.log(`\n[3] Testing configured GEMINI_API_URL -> ${url.replace(/key=[^&]+/, 'key=***')}`);
    try {
      const res = await post(url, body);
      console.log('Status:', res.status);
      console.log('Body snippet:', res.text.slice(0, 500));
    } catch (e) {
      console.log('Configured URL request error:', e.message);
    }
  }

  console.log('\n=== Done ===');
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
