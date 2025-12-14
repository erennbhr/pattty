// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; 
import { db } from "../utils/firebase"; 
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";
import { applyTheme, loadStoredTheme } from "../utils/theme";
// ✅ Capacitor StatusBar eklentisi içe aktarıldı
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); 

  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [weightUnit, setWeightUnit] = useState("kg"); 
  const [currency, setCurrency] = useState("TRY");

  // ✅ Status Bar'ı ayarlayan yardımcı fonksiyon
  const setStatusBar = async (isDark) => {
    // Sadece native platformlarda çalışsın (Web'de hata vermesin)
    if (Capacitor.isNativePlatform()) {
        try {
            await StatusBar.setStyle({ 
                style: isDark ? Style.Dark : Style.Light 
            });
            // Arka planı şeffaf yapalım ki uygulamanın kendi header rengi görünsün
            // veya spesifik bir renk verilebilir (örn: isDark ? '#000000' : '#ffffff')
            await StatusBar.setBackgroundColor({ 
                color: isDark ? '#000000' : '#ffffff' 
            });
        } catch (e) {
            console.warn("StatusBar hatası:", e);
        }
    }
  };

  // --- DARK MODE STATE ---
  const [darkMode, setDarkModeState] = useState(() => {
    const theme = loadStoredTheme();
    applyTheme(theme); 
    // ✅ İlk açılışta status barı ayarla
    setStatusBar(theme === 'dark');
    return theme === 'dark';
  });

  // ✅ Temayı ve status barı değiştiren fonksiyon
  const setDarkMode = (val) => {
    setDarkModeState(val);
    const theme = val ? 'dark' : 'light';
    applyTheme(theme);
    setStatusBar(val); // ✅ Tema değişince status bar da değişsin
  };

  // --- 1. VERİLERİ DİNLEME ---
  useEffect(() => {
    if (!user?.id) {
      setPets([]);
      return;
    }

    const userDocRef = doc(db, "users", user.id);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPets(data.pets || []);
        setReminders(data.reminders || []);
        setStreak(data.streak || 0);
        setMoodHistory(data.moodHistory || {});
        setActiveAlerts(data.activeAlerts || []);
        setWeightUnit(data.weightUnit || "kg");
        setCurrency(data.currency || "TRY");
      } else {
        setDoc(userDocRef, { 
          email: user.email,
          pets: [],
          reminders: [],
          streak: 0,
          currency: "TRY"
        }, { merge: true });
      }
    }, (error) => {
      console.error("Veri okuma hatası:", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 2. GÜNCELLEME (Update) Fonskiyonu ---
  const updateUserData = async (field, value) => {
    if (!user?.id) return;
    
    const userDocRef = doc(db, "users", user.id);
    try {
      await updateDoc(userDocRef, { [field]: value });
    } catch (err) {
      // Eğer döküman yok hatasıysa oluşturmayı dene
      if (err.code === 'not-found') {
          await setDoc(userDocRef, { [field]: value }, { merge: true });
      }
    }
  };

  // --- 3. SAVE WRAPPERS ---
  const savePet = async (newPetsArg) => {
    let newPetsArray;
    if (typeof newPetsArg === 'function') {
      newPetsArray = newPetsArg(pets);
    } else {
      newPetsArray = newPetsArg;
    }
    setPets(newPetsArray);
    await updateUserData("pets", newPetsArray);
  };

  const saveReminders = async (newRemindersArg) => {
    let newRemindersArray;
    if (typeof newRemindersArg === 'function') {
        newRemindersArray = newRemindersArg(reminders);
    } else {
        newRemindersArray = newRemindersArg;
    }
    setReminders(newRemindersArray);
    await updateUserData("reminders", newRemindersArray);
  };

  return (
    <AppContext.Provider
      value={{
        pets,
        setPets: savePet,
        reminders,
        setReminders: saveReminders,
        streak,
        setStreak: (val) => { setStreak(val); updateUserData("streak", val); },
        moodHistory,
        setMoodHistory: (val) => { setMoodHistory(val); updateUserData("moodHistory", val); },
        activeAlerts,
        setActiveAlerts: (val) => { setActiveAlerts(val); updateUserData("activeAlerts", val); },
        weightUnit,
        setWeightUnit: (val) => { setWeightUnit(val); updateUserData("weightUnit", val); },
        darkMode,
        setDarkMode,
        currency,
        setCurrency: (val) => { setCurrency(val); updateUserData("currency", val); }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);