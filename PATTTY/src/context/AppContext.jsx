// src/context/AppContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
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
  serverTimestamp,
} from "firebase/firestore";
import { applyTheme } from "../utils/theme";
import { useNotification } from "./NotificationContext";
import { useLanguage } from "./LanguageContext";
import { generateStyledPetImage } from "../utils/helpers";

// Local storage utils
import {
  saveImageToLocal,
  getImageFromLocal,
  isLocalImage,
  getLocalId,
  removeAllPetImagesFromLocal,
} from "../utils/storage";

import { StatusBar, Style } from "@capacitor/status-bar";
import { Capacitor } from "@capacitor/core";

const AppContext = createContext();

// --------------------------------------------------
// 🔑 BOOTSTRAP THEME READER
// index.html'de set edilen class'ı okur
// --------------------------------------------------
const getInitialDarkMode = () => {
  if (typeof document === "undefined") return false;
  return document.documentElement.classList.contains("dark");
};

export const AppProvider = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const notificationCtx = useNotification();

  // --------------------------------------------------
  // 🔔 SAFE NOTIFICATION
  // --------------------------------------------------
  const safeShowNotification = useCallback(
    (message, type = "info") => {
      const fn =
        notificationCtx?.showNotification ||
        (typeof notificationCtx === "function" ? notificationCtx : null);

      if (typeof fn === "function") {
        fn(message, type);
      }
    },
    [notificationCtx]
  );

  // --------------------------------------------------
  // 📦 STATE
  // --------------------------------------------------
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
    ai: true,
  });

  // --------------------------------------------------
  // 🎨 THEME + STATUS BAR (MOBILE SAFE)
  // --------------------------------------------------
  const [darkMode, setDarkModeState] = useState(getInitialDarkMode);

  const setStatusBar = useCallback(async (isDark) => {
    if (!Capacitor.isNativePlatform()) return;
    try {
      await StatusBar.setStyle({
        style: isDark ? Style.Dark : Style.Light,
      });
      await StatusBar.setBackgroundColor({
        color: isDark ? "#000000" : "#ffffff",
      });
    } catch {
      // native fail silent
    }
  }, []);

  // SADECE kullanıcı değiştirince çalışır
  useEffect(() => {
    const theme = darkMode ? "dark" : "light";

    // DOM
    applyTheme(theme);

    // Persist
    try {
      localStorage.setItem("theme", theme);
    } catch {}

    // Native
    setStatusBar(darkMode);
  }, [darkMode, setStatusBar]);

  const setDarkMode = useCallback((val) => {
    setDarkModeState(!!val);
  }, []);

  // --------------------------------------------------
  // 😊 MOOD PROMPTS
  // --------------------------------------------------
  const MOOD_PROMPTS = useMemo(
    () => ({
      happy:
        "Very happy expression, smiling, bright lighting, joyful atmosphere, cute style.",
      energetic:
        "Running or jumping, dynamic action pose, wide eyes, energetic background, action shot.",
      sleepy:
        "Sleeping comfortably, yawning, cozy blanket, soft lighting, peaceful, cute style.",
      sick: "Wearing a small scarf, thermometer in mouth, sad puppy eyes, needing care, cute style.",
    }),
    []
  );

  const notifyIfEnabled = useCallback(
    (category, message, type = "info") => {
      if (notifications?.[category]) {
        safeShowNotification(message, type);
      }
    },
    [notifications, safeShowNotification]
  );

  // --------------------------------------------------
  // 🔄 FIRESTORE LISTENERS
  // --------------------------------------------------
  useEffect(() => {
    let unsubUser = null;
    let unsubPets = null;

    let userLoaded = false;
    let petsLoaded = false;

    const syncLoading = () => {
      setLoading(!(userLoaded && petsLoaded));
    };

    if (!user?.uid) {
      setPets([]);
      userLoaded = true;
      petsLoaded = true;
      syncLoading();
      return;
    }

    setLoading(true);

    const userRef = doc(db, "users", user.uid);

    unsubUser = onSnapshot(userRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setReminders(d.reminders || []);
        setStreak(d.streak || 0);
        setMoodHistory(d.moodHistory || {});
        setActiveAlerts(d.activeAlerts || []);
        setWeightUnit(d.weightUnit || "kg");
        setCurrency(d.currency || "TRY");
        if (d.notifications) setNotifications(d.notifications);
      } else {
        setDoc(
          userRef,
          {
            email: user.email,
            createdAt: serverTimestamp(),
            currency: "TRY",
            weightUnit: "kg",
            notifications,
          },
          { merge: true }
        );
      }
      userLoaded = true;
      syncLoading();
    });

    const q = query(collection(db, "pets"), where("userId", "==", user.uid));

    unsubPets = onSnapshot(q, (snap) => {
      const today = new Date().toISOString().split("T")[0];
      const list = [];

      snap.forEach((d) => {
        const data = d.data();

        let baseImage = data.image;
        if (isLocalImage(baseImage)) {
          baseImage = getImageFromLocal(getLocalId(baseImage));
        }

        const moodImages = {};
        if (data.moodImages) {
          Object.entries(data.moodImages).forEach(([k, v]) => {
            moodImages[k] = isLocalImage(v)
              ? getImageFromLocal(getLocalId(v))
              : v;
          });
        }

        let displayImage = baseImage;
        if (
          data.lastMoodDate === today &&
          data.currentMood &&
          moodImages[data.currentMood]
        ) {
          displayImage = moodImages[data.currentMood];
        }

        list.push({
          id: d.id,
          ...data,
          image: displayImage,
          originalImage: baseImage,
          moodImages,
        });
      });

      list.sort((a, b) => {
        const t = (v) =>
          v?.seconds
            ? v.seconds * 1000
            : typeof v?.toDate === "function"
            ? v.toDate().getTime()
            : 0;
        return t(a.createdAt) - t(b.createdAt);
      });

      setPets(list);
      petsLoaded = true;
      syncLoading();
    });

    return () => {
      unsubUser?.();
      unsubPets?.();
    };
  }, [user?.uid]);

  // --------------------------------------------------
  // 🐾 PET ACTIONS
  // --------------------------------------------------
  const addPet = useCallback(
    async (petData) => {
      if (!user?.uid) {
        safeShowNotification(t("err_login_required"), "error");
        return;
      }

      const ref = doc(collection(db, "pets"));
      let image = petData.image;

      if (image?.startsWith("data:image")) {
        const key = `profile_${ref.id}_${Date.now()}`;
        const saved = saveImageToLocal(key, image);
        if (!saved) {
          notifyIfEnabled("updates", t("warn_image_cache_failed"), "warning");
        } else {
          image = `LOCAL::${key}`;
        }
      }

      await setDoc(
        ref,
        {
          ...petData,
          image: image || null,
          userId: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          moodImages: {},
          currentMood: null,
          lastMoodDate: null,
        },
        { merge: true }
      );

      notifyIfEnabled(
        "updates",
        `${petData.name} ${t("pet_added_suffix")}`,
        "success"
      );
    },
    [user?.uid, t, notifyIfEnabled, safeShowNotification]
  );

  const updatePet = useCallback(
    async (petId, data) => {
      const ref = doc(db, "pets", petId);
      let final = { ...data, updatedAt: serverTimestamp() };

      if (data.image?.startsWith("data:image")) {
        const key = `profile_${petId}_${Date.now()}`;
        const saved = saveImageToLocal(key, data.image);
        if (!saved) {
          notifyIfEnabled("updates", t("warn_image_cache_failed"), "warning");
        } else {
          final.image = `LOCAL::${key}`;
        }
      }

      await updateDoc(ref, final);
      notifyIfEnabled("updates", t("info_updated"), "success");
    },
    [notifyIfEnabled, t]
  );

  const changePetMood = useCallback(
    async (petId, mood) => {
      const pet = pets.find((p) => p.id === petId);
      if (!pet) return;

      const today = new Date().toISOString().split("T")[0];
      const petRef = doc(db, "pets", petId);

      // 🟢 SORUNUN ÇÖZÜMÜ: User Mood History'yi de güncelle
      // Bu sayede onSnapshot çalıştığında Dashboard eski veriyi çekip ekranı sıfırlamaz.
      if (user?.uid) {
        const userRef = doc(db, "users", user.uid);
        try {
            await updateDoc(userRef, {
                [`moodHistory.${today}.${petId}`]: mood
            });
        } catch (err) {
            // Eğer döküman yapısı uygun değilse merge ile oluşturmayı dene
            await setDoc(userRef, {
                moodHistory: {
                    [today]: {
                        [petId]: mood
                    }
                }
            }, { merge: true });
        }
      }

      // Pet verisini güncelle
      await updateDoc(petRef, {
        currentMood: mood,
        lastMoodDate: today,
        updatedAt: serverTimestamp(),
      });

      if (!pet.moodImages?.[mood]) {
        notifyIfEnabled("ai", t("ai_generating"), "info");

        const img = await generateStyledPetImage(pet, MOOD_PROMPTS[mood]);
        if (img) {
          const key = `mood_${petId}_${mood}_${Date.now()}`;
          const saved = saveImageToLocal(key, img);

          if (!saved) {
            notifyIfEnabled("ai", t("warn_image_cache_failed"), "warning");
          }

          await setDoc(
            petRef,
            {
              moodImages: {
                ...(pet.moodImages || {}),
                [mood]: saved ? `LOCAL::${key}` : img,
              },
              updatedAt: serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    },
    [pets, notifyIfEnabled, t, MOOD_PROMPTS, user?.uid]
  );

  const deletePet = useCallback(
    async (petId) => {
      await deleteDoc(doc(db, "pets", petId));
      removeAllPetImagesFromLocal(petId);
      notifyIfEnabled("updates", t("delete_success"), "success");
    },
    [notifyIfEnabled, t]
  );

  // --------------------------------------------------
  // 📤 CONTEXT VALUE
  // --------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      pets,
      loading,
      addPet,
      updatePet,
      deletePet,
      changePetMood,
      reminders,
      setReminders,
      streak,
      setStreak,
      moodHistory,
      setMoodHistory,
      activeAlerts,
      setActiveAlerts,
      weightUnit,
      currency,
      darkMode,
      notifications,
      setDarkMode,
      notifyIfEnabled,
    }),
    [
      user,
      pets,
      loading,
      addPet,
      updatePet,
      deletePet,
      changePetMood,
      reminders,
      setReminders,
      streak,
      setStreak,
      moodHistory,
      setMoodHistory,
      activeAlerts,
      setActiveAlerts,
      weightUnit,
      currency,
      darkMode,
      notifications,
      setDarkMode,
      notifyIfEnabled,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = () => useContext(AppContext);
export default AppContext;