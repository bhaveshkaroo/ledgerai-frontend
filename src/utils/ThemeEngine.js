/**
 * ThemeEngine.js
 * Manages Dark / Light mode theme toggling across Meso AI.
 */

const THEME_KEY = 'MESO_THEME';

export function getTheme() {
  return localStorage.getItem(THEME_KEY) || 'light';
}

export function setTheme(theme) {
  const selected = theme === 'dark' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, selected);
  document.documentElement.setAttribute('data-theme', selected);
  window.dispatchEvent(new CustomEvent('theme-changed', { detail: { theme: selected } }));
  return selected;
}

export function toggleTheme() {
  const current = getTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  return setTheme(next);
}

export function initTheme() {
  const saved = getTheme();
  document.documentElement.setAttribute('data-theme', saved);
  return saved;
}

export const ThemeEngine = {
  getTheme,
  setTheme,
  toggleTheme,
  initTheme
};

export default ThemeEngine;
