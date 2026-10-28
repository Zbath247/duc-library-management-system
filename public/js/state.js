// Global State Management

export const state = {
  user: null,
  language: localStorage.getItem('duc_lang') || 'km',
  theme: localStorage.getItem('duc_theme') || 'light',
  currentTab: 'dashboard',
  searchQuery: ''
};

export const listeners = new Set();

export function setState(updates) {
  Object.assign(state, updates);
  if (updates.language) {
    localStorage.setItem('duc_lang', updates.language);
  }
  if (updates.theme) {
    localStorage.setItem('duc_theme', updates.theme);
    document.documentElement.setAttribute('data-theme', updates.theme);
  }
  listeners.forEach(fn => fn(state));
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
