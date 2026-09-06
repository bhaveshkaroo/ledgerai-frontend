const STORAGE_KEY = 'MESO_GEMINI_API_KEY';

export const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

export function getGeminiApiKey() {
  return localStorage.getItem(STORAGE_KEY) || process.env.REACT_APP_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    localStorage.setItem(STORAGE_KEY, key.trim());
  }
}

export function clearGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY);
}

export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

export const API_KEY_MISSING_MSG = 'Gemini API key is not configured. Please go to Settings to add your Gemini API key.';

/**
 * Direct client-side Gemini call with model fallback.
 * Used across AI Manual Entry, AI Audit Assistant, and Insights & Forecasting.
 */
export async function callGeminiDirect(prompt, systemInstruction = '', options = {}) {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(API_KEY_MISSING_MSG);
  }

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: options.responseMimeType || 'text/plain',
      temperature: options.temperature ?? 0.3
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let lastError = '';
  for (const model of GEMINI_MODELS) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || res.status;
        lastError = errData?.error?.message || `HTTP ${res.status}`;
        if (code === 429 || code === 503) continue; // High demand spike, fallback to next model
        if (code === 404) continue;
        throw new Error(lastError);
      }

      const data = await res.json();
      const candidates = data.candidates || [];
      if (candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
      }
      lastError = 'Empty response from model';
    } catch (err) {
      lastError = err.message || 'Unknown error';
      if (err.message === API_KEY_MISSING_MSG) throw err;
    }
  }
  throw new Error(lastError || 'All verified Gemini models failed to respond.');
}
