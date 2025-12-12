import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLanguage } from './LanguageContext';
import { applyTheme, loadStoredTheme } from '../utils/theme';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { t } = useLanguage();

  // Tema Yönetimi
  const [darkMode, setDarkMode] = useState(() => {
    const stored = loadStoredTheme();
    return stored === "dark";
  });

  // Ağırlık Birimi Ayarı
  const [weightUnit, setWeightUnit] = useState(() => {
    const loadedSettings = localStorage.getItem('pattty_settings_v8');
    if (loadedSettings) {
      try {
        const parsed = JSON.parse(loadedSettings);
        if (parsed.weightUnit) return parsed.weightUnit;
      } catch(e) {
        console.error("Settings parse error", e);
      }
    }
    
    // Tarayıcı diline göre varsayılan birim
    const userLocale = navigator.language || 'en-US';
    if (userLocale === 'en-US' || userLocale.endsWith('US')) {
      return 'lbs';
    }
    return 'kg';
  });

  // YENİ: Para Birimi Ayarı (Otomatik Algılama)
  const [currency, setCurrency] = useState(() => {
    const loadedSettings = localStorage.getItem('pattty_settings_v8');
    if (loadedSettings) {
      try {
        const parsed = JSON.parse(loadedSettings);
        if (parsed.currency) return parsed.currency;
      } catch(e) {}
    }

    // Tarayıcıdan para birimi tahmini
    try {
        const detected = new Intl.NumberFormat(navigator.language).resolvedOptions().currency;
        return detected || 'TRY';
    } catch (e) {
        return 'TRY';
    }
  });

  // Veri State'leri
  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});

  // Bildirim Ayarları
  const [notifications, setNotifications] = useState({
    vaccine: true,
    vet: true,
    daily: false,
    dnd: false,
    dndStart: "22:00",
    dndEnd: "08:00",
  });

  // Verileri LocalStorage'dan Yükle
  useEffect(() => {
    const loadedPets = localStorage.getItem('pattty_pets_v8');
    const loadedReminders = localStorage.getItem('pattty_reminders_v8');
    const loadedStreak = localStorage.getItem('pattty_streak_v1');
    const loadedMoods = localStorage.getItem('pattty_moods_v1');

    if (loadedPets) setPets(JSON.parse(loadedPets));
    if (loadedReminders) setReminders(JSON.parse(loadedReminders));
    if (loadedStreak) setStreak(parseInt(loadedStreak));
    if (loadedMoods) setMoodHistory(JSON.parse(loadedMoods));

    const loadedSettings = localStorage.getItem('pattty_settings_v8');
    if (loadedSettings) {
      try {
        const settings = JSON.parse(loadedSettings);
        if (settings.notifications) {
          setNotifications(settings.notifications);
        }
      } catch(e) {
        console.error("Settings load error", e);
      }
    }
  }, []);

  // Tema Uygula
  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  // Ayarları Kaydet (currency eklendi)
  useEffect(() => {
    localStorage.setItem(
      "pattty_settings_v8",
      JSON.stringify({
        darkMode,
        notifications,
        weightUnit,
        currency, // YENİ
      })
    );
  }, [darkMode, notifications, weightUnit, currency]);

  // Verileri Kaydet
  useEffect(() => {
    localStorage.setItem('pattty_pets_v8', JSON.stringify(pets));
    localStorage.setItem('pattty_reminders_v8', JSON.stringify(reminders));
    localStorage.setItem('pattty_streak_v1', streak.toString());
    localStorage.setItem('pattty_moods_v1', JSON.stringify(moodHistory));
  }, [pets, reminders, streak, moodHistory]);

  return (
    <AppContext.Provider 
      value={{ 
        pets, setPets,
        reminders, setReminders,
        darkMode, setDarkMode,       
        notifications, setNotifications,
        streak, setStreak,
        moodHistory, setMoodHistory,
        weightUnit, setWeightUnit,
        currency, setCurrency // YENİ
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);