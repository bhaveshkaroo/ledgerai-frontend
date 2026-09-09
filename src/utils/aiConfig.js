import { captureError } from './sentryConfig.js';
const STORAGE_KEY = 'MESO_GEMINI_API_KEY';

export const GEMINI_MODELS = [
  'gemini-3.7-flash',
  'gemini-3-flash-preview',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-flash-latest'
];

export function getGeminiApiKey() {
  const raw = localStorage.getItem(STORAGE_KEY) || process.env.REACT_APP_GEMINI_API_KEY || '';
  return raw.replace(/['"]/g, '').trim();
}

export function setGeminiApiKey(key) {
  if (key && key.trim()) {
    const cleaned = key.replace(/['"]/g, '').trim();
    localStorage.setItem(STORAGE_KEY, cleaned);
    window.dispatchEvent(new Event('meso-api-key-updated'));
  }
}

export function clearGeminiApiKey() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event('meso-api-key-updated'));
}

export function hasGeminiApiKey() {
  return !!getGeminiApiKey();
}

export const API_KEY_MISSING_MSG = 'Gemini API key is not configured. Please go to Settings to add your Gemini API key.';

// Client-side rate limiter for Gemini endpoints: max 15 requests per rolling minute per session
const AI_RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AI_RATE_LIMIT_MAX_REQUESTS = 15;
const requestTimestamps = [];

export function checkAiRateLimit() {
  const now = Date.now();
  // Prune timestamps older than window
  while (requestTimestamps.length > 0 && requestTimestamps[0] <= now - AI_RATE_LIMIT_WINDOW_MS) {
    requestTimestamps.shift();
  }
  if (requestTimestamps.length >= AI_RATE_LIMIT_MAX_REQUESTS) {
    const oldest = requestTimestamps[0];
    const retryAfterSec = Math.ceil((oldest + AI_RATE_LIMIT_WINDOW_MS - now) / 1000);
    throw new Error(`AI rate limit exceeded (${AI_RATE_LIMIT_MAX_REQUESTS} requests/min). Please wait ${retryAfterSec} seconds before asking another question.`);
  }
  requestTimestamps.push(now);
}

/**
 * Direct client-side Gemini call with model fallback, timeout, and rate-limiting.
 * Used across AI Manual Entry, AI Audit Assistant, and Insights & Forecasting.
 */
export async function callGeminiDirect(prompt, systemInstruction = '', options = {}) {
  const key = getGeminiApiKey();
  if (!key) {
    throw new Error(API_KEY_MISSING_MSG);
  }

  // 1. Input Validation
  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) {
    throw new Error('Please enter a valid, non-empty financial description or question.');
  }

  // 2. Enforce Session Rate Limiting
  checkAiRateLimit();

  const payload = {
    contents: [{ parts: [{ text: cleanPrompt }] }],
    generationConfig: {
      responseMimeType: options.responseMimeType || 'text/plain',
      temperature: options.temperature ?? 0.3
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  let lastError = '';
  const timeoutMs = options.timeoutMs || 15000; // 15 second network timeout

  for (const model of GEMINI_MODELS) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        const code = errData?.error?.code || res.status;
        const rawMsg = errData?.error?.message || `HTTP ${res.status}`;
        lastError = rawMsg;

        if (rawMsg.includes('API_KEY_INVALID') || rawMsg.includes('API key not valid') || code === 400 && rawMsg.includes('key')) {
          throw new Error('Invalid or expired Gemini API key. Please check your key in the Settings tab.');
        }
        if (code === 429) {
          throw new Error('Gemini API quota exhausted or rate limited upstream. Please wait a moment.');
        }
        // Fall back to next model on other HTTP errors
        continue;
      }

      const data = await res.json();
      const candidates = data.candidates || [];
      if (candidates.length > 0 && candidates[0].content?.parts?.[0]?.text) {
        return candidates[0].content.parts[0].text;
      }
      lastError = 'Empty response from model';
    } catch (err) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        lastError = `Request timed out after ${timeoutMs / 1000}s. Please check your internet connection.`;
      } else {
        lastError = err.message || 'Unknown error';
      }
      if (err.message.includes('Invalid or expired Gemini API key') || err.message.includes('AI rate limit exceeded')) {
        throw err;
      }
    }
  }
  const finalError = new Error(lastError || 'All verified Gemini models failed to respond.');
  captureError(finalError, { component: 'aiConfig', action: 'callGeminiDirect', extra: { modelsAttempted: GEMINI_MODELS.length } });
  throw finalError;
}
