import React, { createContext, useState, useEffect, useContext } from 'react';
import { useLanguage } from './LanguageContext';
import { applyTheme, loadStoredTheme } from '../utils/theme';

const AppContext = createContext();

// YENİ: Kayıp ilanları için başlangıç verisi (Demo amaçlı)
const DEMO_ALERTS = [
  {
    id: 'alert-001',
    petName: 'Boncuk',
    type: 'cat',
    photo: 'https://images.unsplash.com/photo-1529778873920-4da4926a7071?w=500',
    location: { lat: 41.0082, lng: 28.9784 }, // İstanbul örnek
    address: 'Moda Sahili',
    date: new Date().toISOString(),
    ownerPhone: '+90 555 123 45 67',
    message: 'Tasması mavi, sol kulağında küçük bir yırtık var. Görenler lütfen arasın!',
    distance: 1.2 
  }
];

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
      } catch(e) {}
    }
    const userLocale = navigator.language || 'en-US';
    return (userLocale === 'en-US' || userLocale.endsWith('US')) ? 'lbs' : 'kg';
  });

  // Para Birimi Ayarı
  const [currency, setCurrency] = useState(() => {
    const loadedSettings = localStorage.getItem('pattty_settings_v8');
    if (loadedSettings) {
      try {
        const parsed = JSON.parse(loadedSettings);
        if (parsed.currency) return parsed.currency;
      } catch(e) {}
    }
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
  
  // YENİ: Alert State
  const [activeAlerts, setActiveAlerts] = useState(DEMO_ALERTS);

  // Bildirim Ayarları
  const [notifications, setNotifications] = useState({
    vaccine: true,
    vet: true,
    daily: false,
    dnd: false,
    dndStart: "22:00",
    dndEnd: "08:00",
  });

  // YENİ: Alert Yayınlama Fonksiyonu
  const broadcastAlert = (pet, location, message) => {
    const newAlert = {
      id: `alert-${Date.now()}`,
      petName: pet.name,
      type: pet.type,
      photo: null, // Gerçek uygulamada pet fotosu buraya gelmeli
      location: location,
      address: t('alert_current_loc'),
      date: new Date().toISOString(),
      ownerPhone: '+90 555 000 00 00', // Kullanıcı profilinden çekilmeli
      message: message || t('alert_default_msg'),
      distance: 0.1 
    };
    
    // Gerçek senaryoda burası Firebase'e yazacak
    setActiveAlerts(prev => [newAlert, ...prev]);
  };

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
        if (settings.notifications) setNotifications(settings.notifications);
      } catch(e) {}
    }
  }, []);

  useEffect(() => {
    applyTheme(darkMode);
  }, [darkMode]);

  useEffect(() => {
    localStorage.setItem("pattty_settings_v8", JSON.stringify({ darkMode, notifications, weightUnit, currency }));
  }, [darkMode, notifications, weightUnit, currency]);

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
        currency, setCurrency,
        activeAlerts, setActiveAlerts, // YENİ
        broadcastAlert // YENİ
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);