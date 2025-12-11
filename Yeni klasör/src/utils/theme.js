// src/utils/theme.js

export function applyTheme(mode) {
  const root = document.documentElement;

  // Hem string ('dark'/'light') hem boolean (true/false) desteklesin
  const isDark = mode === 'dark' || mode === true;

  if (isDark) {
    root.classList.add('dark');
    localStorage.setItem('theme', 'dark');
  } else {
    root.classList.remove('dark');
    localStorage.setItem('theme', 'light');
  }
}

export function loadStoredTheme() {
  return localStorage.getItem('theme') || 'light';
}
