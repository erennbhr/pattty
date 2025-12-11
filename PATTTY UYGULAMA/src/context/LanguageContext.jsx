import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, TRANSLATIONS } from '../utils/helpers';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const defaultLang = localStorage.getItem('app_lang') || 'tr';
  const [language, setLanguage] = useState(defaultLang);

  // Dili değiştikçe localStorage’a yaz
  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  // Temel çeviri fonksiyonu
  const t = (key) => {
    const langPack = TRANSLATIONS[language];

    // Seçili dil yoksa EN'e düş
    if (!langPack) return (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;

    // Ana dilde varsa
    if (langPack[key]) return langPack[key];

    // Yoksa EN fallback
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];

    // En sonunda key'in kendisi
    return key;
  };

  // Bazı yerlerde t('key').toUpperCase yerine kısayol istemiştin
  const toUpper = (key) => t(key).toUpperCase();

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        t,
        toUpper,
        LANGUAGES,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
