// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; 
import { db } from "../utils/firebase"; 
import { doc, onSnapshot, setDoc, updateDoc } from "firebase/firestore";

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); 

  const [pets, setPets] = useState([]);
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [weightUnit, setWeightUnit] = useState("kg"); 

  // --- 1. VERİLERİ DİNLEME ---
  useEffect(() => {
    if (!user?.id) {
      console.log("⚠️ AppContext: Kullanıcı yok veya yükleniyor...");
      setPets([]);
      return;
    }

    console.log("✅ AppContext: Firestore dinleniyor... UserID:", user.id);
    const userDocRef = doc(db, "users", user.id);

    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log("📥 Firestore'dan veri geldi:", data);
        setPets(data.pets || []);
        // Diğer verileri de güncelle
        setReminders(data.reminders || []);
        setStreak(data.streak || 0);
        setMoodHistory(data.moodHistory || {});
        setActiveAlerts(data.activeAlerts || []);
        setWeightUnit(data.weightUnit || "kg");
      } else {
        console.log("ℹ️ Kullanıcı kaydı yok, yeni oluşturuluyor...");
        setDoc(userDocRef, { 
          email: user.email,
          pets: [],
          reminders: [],
          streak: 0
        }, { merge: true });
      }
    }, (error) => {
      console.error("❌ Veri okuma hatası (onSnapshot):", error);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 2. GÜNCELLEME ---
  const updateUserData = async (field, value) => {
    if (!user?.id) return;
    console.log(`📤 Firestore'a yazılıyor: ${field}`, value);
    
    const userDocRef = doc(db, "users", user.id);
    try {
      await updateDoc(userDocRef, { [field]: value });
      console.log(`✅ Yazma başarılı: ${field}`);
    } catch (err) {
      console.error(`❌ Yazma HATASI (${field}):`, err);
      // Eğer döküman yok hatasıysa oluşturmayı dene
      if (err.code === 'not-found') {
          console.log("🛠 Döküman bulunamadı, setDoc ile oluşturuluyor...");
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

    console.log("🐶 savePet tetiklendi. Yeni liste:", newPetsArray);
    setPets(newPetsArray); // Önce lokal güncelle
    await updateUserData("pets", newPetsArray); // Sonra DB
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
        setWeightUnit: (val) => { setWeightUnit(val); updateUserData("weightUnit", val); }
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);