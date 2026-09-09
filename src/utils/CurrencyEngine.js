/**
 * CurrencyEngine.js
 * Centralized currency translation and formatting engine for Meso AI.
 * Supports instantaneous toggle between INR (₹) and USD ($).
 */

const CURRENCY_KEY = 'MESO_CURRENCY';
const RATE_CACHE_KEY = 'MESO_USD_INR_RATE';
const RATE_TIMESTAMP_KEY = 'MESO_USD_INR_TIMESTAMP';
const RATE_PROVIDER_KEY = 'MESO_USD_INR_PROVIDER';

// Default baseline rate (RBI proxy)
export const DEFAULT_USD_RATE = 86.50;

// Dynamic in-memory rate initialized from localStorage cache or baseline
let currentExchangeRate = (() => {
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = parseFloat(localStorage.getItem(RATE_CACHE_KEY));
    if (!isNaN(cached) && cached > 50 && cached < 200) {
      return cached;
    }
  }
  return DEFAULT_USD_RATE;
})();

export function getExchangeRate() {
  return currentExchangeRate;
}

export const USD_EXCHANGE_RATE = DEFAULT_USD_RATE; // Backwards-compatible export

export function getCurrency() {
  if (typeof window === 'undefined' || !window.localStorage) return 'INR';
  return localStorage.getItem(CURRENCY_KEY) || 'INR';
}

export function setCurrency(currency) {
  const code = (currency || 'INR').toUpperCase();
  const valid = code === 'USD' ? 'USD' : 'INR';
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.setItem(CURRENCY_KEY, valid);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('currency-changed', { detail: { currency: valid, rate: currentExchangeRate } }));
    window.dispatchEvent(new Event('ledger-updated'));
  }
  return valid;
}

export function toggleCurrency() {
  const current = getCurrency();
  const next = current === 'INR' ? 'USD' : 'INR';
  return setCurrency(next);
}

export function getCurrencySymbol() {
  return getCurrency() === 'USD' ? '$' : '₹';
}

export function getRateMetadata() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return { rate: currentExchangeRate, isLive: false, lastUpdated: 'Baseline Proxy' };
  }
  const timestamp = localStorage.getItem(RATE_TIMESTAMP_KEY);
  const provider = localStorage.getItem(RATE_PROVIDER_KEY) || 'Static Baseline';
  return {
    rate: currentExchangeRate,
    isLive: Boolean(timestamp),
    lastUpdated: timestamp ? new Date(Number(timestamp)).toLocaleTimeString() : 'Static Baseline (86.50)',
    provider
  };
}

/**
 * Fetches live exchange rate from open Forex API with 24-hour cache.
 * Falls back gracefully to cached rate or DEFAULT_USD_RATE if offline/error.
 */
export async function syncExchangeRate(force = false) {
  const CACHE_TTL_MS = 1 * 60 * 60 * 1000; // 1 hour (hourly polling)
  const now = Date.now();

  if (typeof window !== 'undefined' && window.localStorage && !force) {
    const cachedTime = Number(localStorage.getItem(RATE_TIMESTAMP_KEY) || 0);
    const cachedRate = parseFloat(localStorage.getItem(RATE_CACHE_KEY));
    if (cachedRate && now - cachedTime < CACHE_TTL_MS) {
      currentExchangeRate = cachedRate;
      return { rate: cachedRate, cached: true };
    }
  }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD');
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    
    if (data && data.rates && typeof data.rates.INR === 'number') {
      const liveRate = Number(data.rates.INR.toFixed(2));
      currentExchangeRate = liveRate;

      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem(RATE_CACHE_KEY, String(liveRate));
        localStorage.setItem(RATE_TIMESTAMP_KEY, String(now));
        localStorage.setItem(RATE_PROVIDER_KEY, 'Open Forex Feed');
      }

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('exchange-rate-updated', { detail: { rate: liveRate } }));
        window.dispatchEvent(new Event('ledger-updated'));
      }

      console.log(`[CurrencyEngine] Live USD/INR rate synced: ₹${liveRate}`);
      return { rate: liveRate, cached: false, provider: 'Open Forex Feed' };
    }
  } catch (err) {
    console.warn('[CurrencyEngine] Live rate fetch failed, using fallback:', err.message);
  }

  // Fallback: check localStorage, otherwise statutory baseline
  if (typeof window !== 'undefined' && window.localStorage) {
    const cached = parseFloat(localStorage.getItem(RATE_CACHE_KEY));
    if (!isNaN(cached) && cached > 50 && cached < 200) {
      currentExchangeRate = cached;
      return { rate: cached, cached: true, fallback: true };
    }
  }

  currentExchangeRate = DEFAULT_USD_RATE;
  return { rate: DEFAULT_USD_RATE, cached: false, fallback: true };
}

export function formatCurrency(amount, targetCurrency) {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = Number(amount);
  if (isNaN(num)) return '';

  const activeCurrency = targetCurrency ? targetCurrency.toUpperCase() : getCurrency();
  const rate = currentExchangeRate > 0 ? currentExchangeRate : DEFAULT_USD_RATE;

  if (activeCurrency === 'USD') {
    const usdVal = num / rate;
    const isNegative = usdVal < 0;
    const absVal = Math.abs(usdVal);
    
    // Format according to standard US currency conventions
    const formatted = absVal.toLocaleString('en-US', {
      maximumFractionDigits: absVal < 100 && absVal > 0 ? 2 : 0,
      minimumFractionDigits: 0
    });
    return isNegative ? `-$${formatted}` : `$${formatted}`;
  }

  // Default: INR
  const isNegative = num < 0;
  const absVal = Math.abs(num);
  const formatted = absVal.toLocaleString('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0
  });
  return isNegative ? `-₹${formatted}` : `₹${formatted}`;
}

export const CurrencyEngine = {
  getCurrency,
  setCurrency,
  toggleCurrency,
  getCurrencySymbol,
  formatCurrency,
  getExchangeRate,
  getRateMetadata,
  syncExchangeRate,
  USD_EXCHANGE_RATE: DEFAULT_USD_RATE
};

export default CurrencyEngine;
