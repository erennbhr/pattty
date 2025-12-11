import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLanguage } from './LanguageContext';
import { applyTheme, loadStoredTheme } from '../utils/theme';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { t } = useLanguage();

  // -------------------------------
  //   TEMA (DARK/LIGHT) BAŞLANGIÇ
  //   loadStoredTheme sadece İLK render’da 1 kez çalışacak
  // -------------------------------
  const [darkMode, setDarkMode] = useState(() => {
    const stored = loadStoredTheme();              // "dark" | "light"
    return stored === "dark";                      // boolean
  });

  // -------------------------------
  //   STATE TANIMLARI (TAMAMI ESKİ HALİYLE)
  // -------------------------------
  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});

  const [notifications, setNotifications] = useState({
    vaccine: true,
    vet: true,
    daily: false,
    dnd: false,
    dndStart: "22:00",
    dndEnd: "08:00",
  });

  // -------------------------------
  //   VERİ YÜKLE (LOCALSTORAGE)
  // -------------------------------
  useEffect(() => {
    const loadedPets = localStorage.getItem('pattty_pets_v8');
    const loadedReminders = localStorage.getItem('pattty_reminders_v8');
    const loadedStreak = localStorage.getItem('pattty_streak_v1');
    const loadedMoods = localStorage.getItem('pattty_moods_v1');

    if (loadedPets) setPets(JSON.parse(loadedPets));
    if (loadedReminders) setReminders(JSON.parse(loadedReminders));
    if (loadedStreak) setStreak(parseInt(loadedStreak));
    if (loadedMoods) setMoodHistory(JSON.parse(loadedMoods));

    // Settings Yükle
    const loadedSettings = localStorage.getItem('pattty_settings_v8');
    if (loadedSettings) {
      const settings = JSON.parse(loadedSettings);

      // Eğer localStorage.theme varsa ve geçerli ise override eder
      if (typeof settings.darkMode === "boolean") {
        setDarkMode(settings.darkMode);
      }

      if (settings.notifications) {
        setNotifications(settings.notifications);
      }
    }
  }, []);

  // -------------------------------
  //   DARK MODE EFEKTİ (ANA MOTOR)
  // -------------------------------
  useEffect(() => {
    applyTheme(darkMode);   // html.dark class + localStorage.theme
  }, [darkMode]);

  // -------------------------------
  //   SETTINGS KAYDET
  // -------------------------------
  useEffect(() => {
    localStorage.setItem(
      "pattty_settings_v8",
      JSON.stringify({
        darkMode,
        notifications,
      })
    );
  }, [darkMode, notifications]);

  // -------------------------------
  //   DİĞER VERİLERİ KAYDET
  // -------------------------------
  useEffect(() => {
    localStorage.setItem('pattty_pets_v8', JSON.stringify(pets));
    localStorage.setItem('pattty_reminders_v8', JSON.stringify(reminders));
    localStorage.setItem('pattty_streak_v1', streak.toString());
    localStorage.setItem('pattty_moods_v1', JSON.stringify(moodHistory));
  }, [pets, reminders, streak, moodHistory]);

  // -------------------------------
  //   CONTEXT RETURN
  // -------------------------------
  return (
    <AppContext.Provider 
      value={{ 
        pets, setPets,
        reminders, setReminders,
        darkMode, setDarkMode,       
        notifications, setNotifications,
        streak, setStreak,
        moodHistory, setMoodHistory
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
