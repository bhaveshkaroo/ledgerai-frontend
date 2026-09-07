/**
 * CurrencyEngine.js
 * Centralized currency translation and formatting engine for Meso AI.
 * Supports instantaneous toggle between INR (₹) and USD ($).
 */

const CURRENCY_KEY = 'MESO_CURRENCY';
export const USD_EXCHANGE_RATE = 86.50; // 1 USD = 86.50 INR

export function getCurrency() {
  return localStorage.getItem(CURRENCY_KEY) || 'INR';
}

export function setCurrency(currency) {
  const code = (currency || 'INR').toUpperCase();
  const valid = code === 'USD' ? 'USD' : 'INR';
  localStorage.setItem(CURRENCY_KEY, valid);
  window.dispatchEvent(new Event('currency-changed'));
  window.dispatchEvent(new Event('ledger-updated'));
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

export function formatCurrency(amount, targetCurrency) {
  if (amount === null || amount === undefined || amount === '') return '';
  const num = Number(amount);
  if (isNaN(num)) return '';

  const activeCurrency = targetCurrency ? targetCurrency.toUpperCase() : getCurrency();

  if (activeCurrency === 'USD') {
    const usdVal = num / USD_EXCHANGE_RATE;
    const isNegative = usdVal < 0;
    const absVal = Math.abs(usdVal);
    
    // For smaller amounts show 2 decimals, for larger amounts round to nearest dollar
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
  USD_EXCHANGE_RATE
};

export default CurrencyEngine;
