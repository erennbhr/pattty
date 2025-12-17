// src/context/AppContext.jsx
import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; 
import { db, auth } from "../utils/firebase"; 
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  setDoc,
  orderBy
} from "firebase/firestore";
import { applyTheme, loadStoredTheme } from "../utils/theme";
import { useNotification } from './NotificationContext';
// 🟢 YENİ: Storage yardımcıları
import { saveImageToLocal, getImageFromLocal, removeImageFromLocal, isLocalImage, getLocalId } from "../utils/storage";

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); 
  const showNotification = useNotification();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [weightUnit, setWeightUnit] = useState("kg"); 
  const [currency, setCurrency] = useState("TRY");

  // --- STATUS BAR ---
  const setStatusBar = async (isDark) => {
    if (Capacitor.isNativePlatform()) {
        try {
            await StatusBar.setStyle({ 
                style: isDark ? Style.Dark : Style.Light 
            });
            await StatusBar.setBackgroundColor({ 
                color: isDark ? '#000000' : '#ffffff' 
            });
            await StatusBar.setOverlaysWebView({ overlay: false });
        } catch (e) {
            console.warn("StatusBar hatası:", e);
        }
    }
  };

  const [darkMode, setDarkModeState] = useState(() => {
    const theme = loadStoredTheme();
    applyTheme(theme); 
    setStatusBar(theme === 'dark');
    return theme === 'dark';
  });

  const setDarkMode = (val) => {
    setDarkModeState(val);
    const theme = val ? 'dark' : 'light';
    applyTheme(theme);
    setStatusBar(val);
  };

  // --- 1. KULLANICI AYARLARI ---
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const userDocRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setReminders(data.reminders || []);
        setStreak(data.streak || 0);
        setMoodHistory(data.moodHistory || {});
        setActiveAlerts(data.activeAlerts || []);
        setWeightUnit(data.weightUnit || "kg");
        setCurrency(data.currency || "TRY");
      } else {
        setDoc(userDocRef, { 
          email: user.email,
          createdAt: new Date(),
          currency: "TRY",
          weightUnit: "kg"
        }, { merge: true });
      }
    });

    return () => unsubscribe();
  }, [user]);

  // --- 2. HAYVANLARI DİNLEME VE GÖRSEL BİRLEŞTİRME ---
  useEffect(() => {
    if (!user?.uid) {
      setPets([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "pets"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const petsData = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        let finalImage = data.image;

        // 🟢 EĞER GÖRSEL LOCAL STORAGE REFERANSIYSA ORADAN ÇEK
        if (isLocalImage(data.image)) {
            const localId = getLocalId(data.image);
            const localData = getImageFromLocal(localId);
            // LocalStorage'da varsa onu kullan, yoksa (silinmişse) null yap
            finalImage = localData || null; 
        }

        petsData.push({ 
            id: doc.id, 
            ...data,
            image: finalImage // UI için birleştirilmiş görsel
        });
      });

      // Sıralama (Oluşturulma tarihine göre)
      petsData.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      
      setPets(petsData);
      setLoading(false);
    }, (error) => {
      console.error("Hayvan verisi çekme hatası:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- 3. FONKSİYONLAR ---

  // 🟢 YENİ HAYVAN EKLEME (LOCAL STORAGE ENTEGRASYONLU)
  const addPet = async (petData) => {
    if (!user) {
      showNotification("Kayıt için giriş yapmalısınız.", "error");
      return;
    }

    try {
      const { id, ...dataToSave } = petData;
      
      // Geçici bir ID oluştur (veya random kullan)
      // Firestore'a yazarken ID'yi manuel belirleyelim ki görselle eşleşsin
      // Eğer 'id' yoksa (AddPetModal genelde oluşturuyor) yeni oluştur.
      const petDocRef = id ? doc(collection(db, "pets"), id) : doc(collection(db, "pets"));
      const docId = petDocRef.id;

      // 🟢 GÖRSEL AYRIŞTIRMA
      let imageValue = dataToSave.image;
      
      // Eğer görsel Base64 ise (uzunsa) LocalStorage'a al
      if (imageValue && imageValue.startsWith("data:image")) {
          const saveSuccess = saveImageToLocal(docId, imageValue);
          if (saveSuccess) {
              // Veritabanına sadece referans yaz: "LOCAL::[DOC_ID]"
              imageValue = `LOCAL::${docId}`;
          } else {
              // LocalStorage doluysa mecbur veritabanına yazacak (uyarı verebilirsin)
              console.warn("LocalStorage dolu, görsel veritabanına yazılıyor.");
          }
      }

      const newPet = {
        ...dataToSave,
        image: imageValue, // Referans veya orijinal
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        visual_details: petData.visual_details || "",
        isNeutered: petData.isNeutered !== undefined ? petData.isNeutered : null,
        weights: petData.weights || [],
      };

      // Belirlediğimiz ID ile dökümanı oluştur
      await setDoc(petDocRef, newPet);
      
      showNotification(`${petData.name} başarıyla eklendi!`, "success");
    } catch (error) {
      console.error("Hayvan eklenirken hata:", error);
      showNotification("Hayvan kaydedilemedi: " + error.message, "error");
      throw error;
    }
  };

  // 🟢 GÜNCELLEME
  const updatePet = async (petId, updatedData) => {
    try {
      const petRef = doc(db, "pets", petId);
      
      let finalData = { ...updatedData, updatedAt: new Date() };

      // Eğer yeni bir görsel geldiyse ve Base64 ise güncelle
      if (updatedData.image && updatedData.image.startsWith("data:image")) {
          const saveSuccess = saveImageToLocal(petId, updatedData.image);
          if (saveSuccess) {
              finalData.image = `LOCAL::${petId}`;
          }
      }

      await updateDoc(petRef, finalData);
      showNotification("Bilgiler güncellendi.", "success");
    } catch (error) {
      console.error("Güncelleme hatası:", error);
      showNotification("Güncelleme başarısız.", "error");
      throw error;
    }
  };

  // 🟢 SİLME
  const deletePet = async (petId) => {
    try {
      await deleteDoc(doc(db, "pets", petId));
      // LocalStorage'dan da temizle
      removeImageFromLocal(petId);
      
      showNotification("Kayıt silindi.", "success");
    } catch (error) {
      console.error("Silme hatası:", error);
      showNotification("Silme işlemi başarısız.", "error");
    }
  };

  // KULLANICI VERİSİ GÜNCELLEME
  const updateUserData = async (field, value) => {
    if (!user?.uid) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      await setDoc(userDocRef, { [field]: value }, { merge: true });
    } catch (err) {
      console.error("User data update error:", err);
    }
  };

  const setRemindersWrapper = (val) => {
     const newValue = typeof val === 'function' ? val(reminders) : val;
     setReminders(newValue);
     updateUserData("reminders", newValue);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        pets,
        loading,
        addPet,
        updatePet,
        deletePet,
        reminders,
        setReminders: setRemindersWrapper,
        streak,
        setStreak: (val) => { setStreak(val); updateUserData("streak", val); },
        moodHistory,
        setMoodHistory: (val) => { setMoodHistory(val); updateUserData("moodHistory", val); },
        activeAlerts,
        setActiveAlerts: (val) => { setActiveAlerts(val); updateUserData("activeAlerts", val); },
        weightUnit,
        setWeightUnit: (val) => { setWeightUnit(val); updateUserData("weightUnit", val); },
        currency,
        setCurrency: (val) => { setCurrency(val); updateUserData("currency", val); },
        darkMode,
        setDarkMode
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;