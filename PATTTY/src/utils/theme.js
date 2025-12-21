// src/utils/theme.js

/**
 * SADECE DOM'u günceller.
 * localStorage YAZMAZ.
 */
export function applyTheme(mode) {
  const root = document.documentElement;
  const isDark = mode === "dark" || mode === true;

  if (isDark) {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * SADECE localStorage'dan okur.
 * Karar vermez, yazmaz.
 */
export function loadStoredTheme() {
  try {
    return localStorage.getItem("theme") || "light";
  } catch {
    return "light";
  }
}
