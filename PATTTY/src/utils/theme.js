// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/utils/theme.js

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
  // 1. Önce kullanıcının uygulama içinden yaptığı ve kaydettiği tercihi kontrol et
  const settings = localStorage.getItem('pattty_settings_v8');
  if (settings) {
    try {
      const parsed = JSON.parse(settings);
      if (typeof parsed.darkMode === "boolean") {
        return parsed.darkMode ? 'dark' : 'light';
      }
    } catch (e) {
      // JSON hatası varsa devam et
    }
  }

  // 2. Yedek 'theme' anahtarını kontrol et
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) {
    return storedTheme;
  }

  // 3. HİÇBİR KAYIT YOKSA: Cihazın sistem temasını kontrol et (YENİ EKLENEN KISIM)
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }

  // 4. Varsayılan olarak light döndür
  return 'light';
}