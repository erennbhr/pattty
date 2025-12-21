// src/context/AuthContext.jsx
import React, {
  createContext,
  useState,
  useContext,
  useEffect,
} from "react";

import { Capacitor } from "@capacitor/core";
import { auth, db } from "../utils/firebase";

import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  sendEmailVerification // 🟢 EKLENDİ
} from "firebase/auth";

import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

const AuthContext = createContext(null);

/* -------------------------------------------------------------------------- */
/* PROVIDER                               */
/* -------------------------------------------------------------------------- */

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ------------------------------------------------------------------------ */
  /* ORTAK USER DOC OLUŞTURMA                          */
  /* ------------------------------------------------------------------------ */
  const ensureUserDocument = async (firebaseUser, providerName) => {
    const userRef = doc(db, "users", firebaseUser.uid);
    const snap = await getDoc(userRef);

    if (!snap.exists()) {
      await setDoc(userRef, {
        uid: firebaseUser.uid,
        name: firebaseUser.displayName || "",
        email: firebaseUser.email || "",
        photoURL: firebaseUser.photoURL || "",
        isPremium: false,
        provider: providerName,
        createdAt: serverTimestamp(),
      });
    }
  };

  /* ------------------------------------------------------------------------ */
  /* AUTH STATE + FIRESTORE LISTENER                       */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (currentUser) => {
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (!currentUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      // 🟢 ÖNEMLİ: Auth objesindeki emailVerified bilgisini state'e aktaralım
      // currentUser objesi zaten emailVerified bilgisini taşır.
      
      const userDocRef = doc(db, "users", currentUser.uid);

      unsubscribeSnapshot = onSnapshot(
        userDocRef,
        (docSnap) => {
          setUser({
            uid: currentUser.uid,
            email: currentUser.email,
            name: currentUser.displayName,
            imageUrl: currentUser.photoURL,
            joinedAt: currentUser.metadata.creationTime,
            emailVerified: currentUser.emailVerified, // 🟢 EKLENDİ
            ...(docSnap.exists() ? docSnap.data() : {}),
          });
          setLoading(false);
        },
        (error) => {
          console.error("Firestore dinleme hatası:", error);
          setLoading(false);
        }
      );
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  /* ------------------------------------------------------------------------ */
  /* GOOGLE (AYNI KALIYOR)                             */
  /* ------------------------------------------------------------------------ */
  useEffect(() => {
    getRedirectResult(auth)
      .then(async (result) => {
        if (result?.user) await ensureUserDocument(result.user, "google");
      }).catch((err) => console.error(err));
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      if (Capacitor.isNativePlatform()) {
        await signInWithRedirect(auth, provider);
        return null;
      } else {
        const result = await signInWithPopup(auth, provider);
        await ensureUserDocument(result.user, "google");
        return true;
      }
    } catch (error) {
      if (error.code === "auth/popup-closed-by-user") return null;
      console.error("Google Login Error:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* LOGIN (AYNI KALIYOR)                              */
  /* ------------------------------------------------------------------------ */
  const login = async (email, password) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      return true;
    } catch (error) {
      console.error("Login hatası:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* REGISTER (GÜNCELLENDİ: Mail Gönderimi)                   */
  /* ------------------------------------------------------------------------ */
  // İsim değişikliği yapmadım 'register' olarak bıraktım, mevcut kodun bozulmasın diye.
  const register = async (email, password, name) => {
    try {
      // 1. Kullanıcıyı oluştur
      const cred = await createUserWithEmailAndPassword(auth, email, password);

      if (name) {
        await updateProfile(cred.user, { displayName: name });
      }

      // 2. Firestore'a kaydet
      await setDoc(doc(db, "users", cred.user.uid), {
        uid: cred.user.uid,
        name: name || "",
        email,
        photoURL: "",
        isPremium: false,
        provider: "email",
        createdAt: serverTimestamp(),
      });

      // 3. 🟢 DOĞRULAMA MAİLİ GÖNDER
      await sendEmailVerification(cred.user);
      
      // Çıkış yapmıyoruz, kullanıcı oturum açmış durumda.
      // App.jsx tarafında emailVerified: false olduğu için VerifyScreen'e düşecek.

      return true;
    } catch (error) {
      console.error("Register hatası:", error);
      throw error;
    }
  };

  /* ------------------------------------------------------------------------ */
  /* YENİ FONKSİYONLAR: REFRESH USER & RESEND EMAIL              */
  /* ------------------------------------------------------------------------ */
  
  // 🟢 Kullanıcının "emailVerified" durumunu Firebase'den günceller
  const refreshUser = async () => {
    if (auth.currentUser) {
      await auth.currentUser.reload(); // Firebase'den en güncel veriyi çek
      
      // User state'ini manuel güncelle (State'in tetiklenmesi için copy yapıyoruz)
      const updatedUser = { ...user, emailVerified: auth.currentUser.emailVerified };
      setUser(updatedUser);
      
      return auth.currentUser.emailVerified;
    }
    return false;
  };

  // 🟢 Mail gelmediyse tekrar gönder
  const resendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  /* ------------------------------------------------------------------------ */
  /* LOGOUT                                    */
  /* ------------------------------------------------------------------------ */
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout hatası:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        loginWithGoogle,
        refreshUser,        // 🟢 Yeni
        resendVerification, // 🟢 Yeni
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
};