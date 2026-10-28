import { state, setState } from './state.js';

let translations = {};

/**
 * Load translations for the selected language
 */
export async function loadLanguage(lang) {
  try {
    const res = await fetch(`/locales/${lang}.json?v=${Date.now()}`);
    if (!res.ok) throw new Error(`Could not load /locales/${lang}.json`);
    translations = await res.json();
    setState({ language: lang });
    applyTranslations();
  } catch (err) {
    console.error('[i18n Error]', err);
  }
}

/**
 * Get translation for nested key like "app.title"
 */
export function t(key, fallback = '') {
  const parts = key.split('.');
  let current = translations;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return fallback || key;
    }
  }
  return typeof current === 'string' ? current : fallback || key;
}

/**
 * Update DOM elements marked with data-i18n attributes
 */
export function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    el.textContent = t(key, el.textContent);
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    el.setAttribute('placeholder', t(key, el.getAttribute('placeholder') || ''));
  });

  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    const key = el.getAttribute('data-i18n-title');
    el.setAttribute('title', t(key, el.getAttribute('title') || ''));
  });

  // Update HTML lang attribute
  document.documentElement.lang = state.language;
}

/**
 * Switch language instantly
 */
export function switchLanguage(lang) {
  return loadLanguage(lang);
}
