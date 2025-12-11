// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/utils/theme.js

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
  // 1. pattty_settings_v8 anahtarından gelen kesin boolean değerini önceliklendir.
  const settings = localStorage.getItem('pattty_settings_v8');
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      // darkMode'un kesinlikle boolean olup olmadığını kontrol et
      if (typeof parsed.darkMode === "boolean") {
        return parsed.darkMode ? 'dark' : 'light';
      }
    } catch (e) {
      // JSON parse hatası olursa, alttaki yedek değere düş.
    }
  }

  // 2. Yedek olarak, applyTheme'in yazdığı basit 'theme' anahtarını kullan.
  return localStorage.getItem('theme') || 'light';
}