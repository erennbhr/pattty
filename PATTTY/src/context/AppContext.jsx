import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext"; 
import { db } from "../utils/firebase"; 
import { 
  collection, 
  updateDoc, 
  deleteDoc, 
  doc, 
  onSnapshot, 
  query, 
  where,
  setDoc,
  getDoc
} from "firebase/firestore";
import { applyTheme, loadStoredTheme } from "../utils/theme";
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';
import { generateStyledPetImage } from "../utils/helpers"; 

import { saveImageToLocal, getImageFromLocal, removeImageFromLocal, isLocalImage, getLocalId } from "../utils/storage";

import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';

const AppContext = createContext();

export const AppProvider = ({ children }) => {
  const { user } = useAuth(); 
  
  const notificationCtx = useNotification();
  const showNotification = (notificationCtx && typeof notificationCtx.showNotification === 'function')
    ? notificationCtx.showNotification
    : (typeof notificationCtx === 'function' ? notificationCtx : () => console.warn("Bildirim sistemi yüklenemedi"));

  const { t } = useLanguage();

  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [reminders, setReminders] = useState([]);
  const [streak, setStreak] = useState(0);
  const [moodHistory, setMoodHistory] = useState({});
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [weightUnit, setWeightUnit] = useState("kg"); 
  const [currency, setCurrency] = useState("TRY");
  
  const [notifications, setNotifications] = useState({ 
      vaccine: true,  
      calendar: true, 
      updates: true,  
      ai: true        
  });

  const MOOD_PROMPTS = {
      happy: "Very happy expression, smiling, bright lighting, joyful atmosphere, cute style.",
      energetic: "Running or jumping, dynamic action pose, wide eyes, energetic background, action shot.",
      sleepy: "Sleeping comfortably, yawning, cozy blanket, soft lighting, peaceful, cute style.",
      sick: "Wearing a small scarf, thermometer in mouth, sad puppy eyes, needing care, cute style."
  };

  const notifyIfEnabled = (category, message, type = 'info') => {
      if (notifications[category] && typeof showNotification === 'function') {
          showNotification(message, type);
      }
  };

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
        if (data.notifications) {
            setNotifications(data.notifications);
        }
      } else {
        setDoc(userDocRef, { 
          email: user.email,
          createdAt: new Date(),
          currency: "TRY",
          weightUnit: "kg",
          notifications: { vaccine: true, calendar: true, updates: true, ai: true }
        }, { merge: true });
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user?.uid) {
      setPets([]);
      return;
    }

    setLoading(true);
    const q = query(collection(db, "pets"), where("userId", "==", user.uid));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const petsData = [];
      const today = new Date().toISOString().split('T')[0];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        let originalProfileImage = data.image;
        if (isLocalImage(data.image)) {
            const localId = getLocalId(data.image);
            originalProfileImage = getImageFromLocal(localId); 
        }

        let resolvedMoodImages = {};
        if (data.moodImages) {
            Object.keys(data.moodImages).forEach(key => {
                const imgVal = data.moodImages[key];
                if (isLocalImage(imgVal)) {
                    const lId = getLocalId(imgVal);
                    resolvedMoodImages[key] = getImageFromLocal(lId);
                } else {
                    resolvedMoodImages[key] = imgVal;
                }
            });
        }

        let displayImage = originalProfileImage;
        if (data.lastMoodDate === today && data.currentMood && resolvedMoodImages[data.currentMood]) {
            displayImage = resolvedMoodImages[data.currentMood];
        }

        petsData.push({ 
            id: doc.id, 
            ...data,
            image: displayImage || null,
            originalImage: originalProfileImage || null,
            moodImages: resolvedMoodImages
        });
      });

      petsData.sort((a, b) => (a.createdAt?.seconds || 0) - (b.createdAt?.seconds || 0));
      
      setPets(petsData);
      setLoading(false);
    }, (error) => {
      console.error("Hayvan verisi çekme hatası:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addPet = async (petData) => {
    if (!user) {
      showNotification(t('err_login_required'), "error");
      return;
    }

    try {
      const { id, ...dataToSave } = petData;
      
      const petDocRef = id ? doc(collection(db, "pets"), id) : doc(collection(db, "pets"));
      const docId = petDocRef.id;

      let imageValue = dataToSave.image;
      
      if (imageValue && imageValue.startsWith("data:image")) {
          const saveSuccess = saveImageToLocal(docId, imageValue);
          if (saveSuccess) {
              imageValue = `LOCAL::${docId}`;
          } else {
              console.warn("LocalStorage dolu, görsel veritabanına yazılıyor.");
          }
      }

      const newPet = {
        ...dataToSave,
        image: imageValue,
        userId: user.uid,
        createdAt: new Date(),
        updatedAt: new Date(),
        visual_details: petData.visual_details || "",
        isNeutered: petData.isNeutered !== undefined ? petData.isNeutered : null,
        weights: petData.weights || [],
        moodImages: {},
        currentMood: null,
        lastMoodDate: null
      };

      await setDoc(petDocRef, newPet);
      notifyIfEnabled('updates', `${petData.name} ${t('pet_added_suffix')}`, "success");

    } catch (error) {
      console.error("Hayvan eklenirken hata:", error);
      showNotification(t('err_save_pet_prefix') + error.message, "error");
      throw error;
    }
  };

  const updatePet = async (petId, updatedData) => {
    try {
      const petRef = doc(db, "pets", petId);
      
      let finalData = { ...updatedData, updatedAt: new Date() };

      if (updatedData.image && updatedData.image.startsWith("data:image")) {
          const saveSuccess = saveImageToLocal(petId, updatedData.image);
          if (saveSuccess) {
              finalData.image = `LOCAL::${petId}`;
          }
      }

      await updateDoc(petRef, finalData);
      notifyIfEnabled('updates', t('info_updated'), "success");

    } catch (error) {
      console.error("Güncelleme hatası:", error);
      showNotification(t('err_update_generic'), "error");
      throw error;
    }
  };

  const changePetMood = async (petId, mood) => {
      const today = new Date().toISOString().split('T')[0];
      const pet = pets.find(p => p.id === petId);
      if (!pet) return;

      try {
          const petRef = doc(db, "pets", petId);
          await updateDoc(petRef, {
              currentMood: mood,
              lastMoodDate: today
          });

          // Mood görseli kontrolü
          if (!pet.moodImages || !pet.moodImages[mood]) {
              notifyIfEnabled('ai', `${t('ai_generating')} (${t('mood_' + mood)})`, 'info');

              const prompt = MOOD_PROMPTS[mood] || "Cute style";
              
              const newImageUrl = await generateStyledPetImage(pet, prompt);

              if (!newImageUrl) {
                  throw new Error("Görsel URL oluşturulamadı (boş döndü).");
              }

              const localImageId = `mood_${petId}_${mood}`;
              const saveSuccess = saveImageToLocal(localImageId, newImageUrl);
              
              let valueToSave = newImageUrl;
              if (saveSuccess) {
                  valueToSave = `LOCAL::${localImageId}`;
              }

              // 🟢 FIX: setDoc ile merge kullanıyoruz (Daha güvenli)
              await setDoc(petRef, {
                  moodImages: {
                      [mood]: valueToSave
                  }
              }, { merge: true });

              notifyIfEnabled('ai', t('ai_generated_alt_text'), 'success');
          }

      } catch (error) {
          console.error("Mood Change Error:", error);
          if (typeof showNotification === 'function') {
             showNotification(t('err_image_gen_failed'), "error");
          }
      }
  };

  const deletePet = async (petId) => {
    try {
      await deleteDoc(doc(db, "pets", petId));
      removeImageFromLocal(petId);
      notifyIfEnabled('updates', t('delete_success'), "success");

    } catch (error) {
      console.error("Silme hatası:", error);
      showNotification(t('delete_failed'), "error");
    }
  };

  const updateUserData = async (field, value) => {
    if (!user?.uid) return;
    const userDocRef = doc(db, "users", user.uid);
    try {
      if (typeof value === 'function') {
          console.error("HATA: Firestore'a fonksiyon kaydedilemez.", field);
          return;
      }
      await setDoc(userDocRef, { [field]: value }, { merge: true });
    } catch (err) {
      console.error("User data update error:", err);
    }
  };

  const setRemindersWrapper = (val) => {
     setReminders(prev => {
         const newValue = typeof val === 'function' ? val(prev) : val;
         updateUserData("reminders", newValue);
         return newValue;
     });
  };

  const setNotificationsWrapper = (val) => {
      setNotifications(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("notifications", newValue);
          return newValue;
      });
  };

  const setStreakWrapper = (val) => {
      setStreak(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("streak", newValue);
          return newValue;
      });
  };

  const setMoodHistoryWrapper = (val) => {
      setMoodHistory(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("moodHistory", newValue);
          return newValue;
      });
  };

  const setActiveAlertsWrapper = (val) => {
      setActiveAlerts(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("activeAlerts", newValue);
          return newValue;
      });
  };

  const setWeightUnitWrapper = (val) => {
      setWeightUnit(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("weightUnit", newValue);
          return newValue;
      });
  };

  const setCurrencyWrapper = (val) => {
      setCurrency(prev => {
          const newValue = typeof val === 'function' ? val(prev) : val;
          updateUserData("currency", newValue);
          return newValue;
      });
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
        changePetMood, 
        reminders,
        setReminders: setRemindersWrapper,
        streak,
        setStreak: setStreakWrapper,
        moodHistory,
        setMoodHistory: setMoodHistoryWrapper,
        activeAlerts,
        setActiveAlerts: setActiveAlertsWrapper,
        weightUnit,
        setWeightUnit: setWeightUnitWrapper,
        currency,
        setCurrency: setCurrencyWrapper,
        darkMode,
        setDarkMode,
        notifications,
        setNotifications: setNotificationsWrapper,
        notifyIfEnabled
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => useContext(AppContext);
export default AppContext;