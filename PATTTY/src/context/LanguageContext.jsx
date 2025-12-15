import React, { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES, TRANSLATIONS } from '../utils/helpers';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  // Başlangıç dilini belirle (Otomatik Sistem Dili Algılama Eklendi)
  const [language, setLanguage] = useState(() => {
    // 1. Önce kullanıcının daha önce seçip kaydettiği dile bak
    const storedLang = localStorage.getItem('app_lang');
    if (storedLang) {
      return storedLang;
    }

    // 2. Kayıt yoksa, cihazın/tarayıcının sistem dilini kontrol et
    const systemLang = navigator.language || navigator.userLanguage || ''; 
    const shortLang = systemLang.split('-')[0]; // örn: 'tr-TR' -> 'tr'

    // Eğer sistem dili, uygulamamızın desteklediği diller arasındaysa onu kullan
    if (LANGUAGES && Object.keys(LANGUAGES).includes(shortLang)) {
      return shortLang;
    }

    // 3. Desteklenmeyen bir dilse varsayılan olarak İngilizce'ye düş
    return 'en';
  });

  useEffect(() => {
    localStorage.setItem('app_lang', language);
  }, [language]);

  const t = (key) => {
    const langPack = TRANSLATIONS[language];
    if (!langPack) return (TRANSLATIONS.en && TRANSLATIONS.en[key]) || key;
    if (langPack[key]) return langPack[key];
    if (TRANSLATIONS.en && TRANSLATIONS.en[key]) return TRANSLATIONS.en[key];
    return key;
  };

  const toUpper = (key) => t(key).toUpperCase();

  // --- EKSİK ÇEVİRİLER GÜNCELLEMESİ (Senin verdiğin kısım) ---
  
  // TR Güncellemeleri
  TRANSLATIONS.tr.set_unit = "Birim Tercihi";
  TRANSLATIONS.tr.unit_kg = "Metrik (Kg, Gr)";
  TRANSLATIONS.tr.unit_lbs = "Imperial (Lbs, Oz)";
  TRANSLATIONS.tr.lbl_kg = "KG";
  TRANSLATIONS.tr.lbl_gr = "GR";
  TRANSLATIONS.tr.lbl_lbs = "LBS";
  TRANSLATIONS.tr.lbl_oz = "OZ";

  // EN Güncellemeleri
  TRANSLATIONS.en.set_unit = "Unit Preference";
  TRANSLATIONS.en.unit_kg = "Metric (Kg, G)";
  TRANSLATIONS.en.unit_lbs = "Imperial (Lbs, Oz)";
  TRANSLATIONS.en.lbl_kg = "KG";
  TRANSLATIONS.en.lbl_gr = "G";
  TRANSLATIONS.en.lbl_lbs = "LBS";
  TRANSLATIONS.en.lbl_oz = "OZ";

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