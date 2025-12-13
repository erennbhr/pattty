// src/context/AuthContext.jsx
import React, { createContext, useState, useContext, useEffect } from "react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";
import { auth } from "../utils/firebase"; 
import { 
  onAuthStateChanged, 
  GoogleAuthProvider, 
  signInWithCredential, 
  signOut 
} from "firebase/auth";

const AuthContext = createContext();

const isNative = () => !!window.Capacitor?.isNativePlatform?.();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Native platformda GoogleAuth başlat
    if (isNative()) {
      GoogleAuth.initialize(); 
    }

    // Firebase oturum durumunu dinle (Kullanıcı giriş yaptı mı?)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser({
          id: currentUser.uid, // Firebase'in verdiği eşsiz ID
          name: currentUser.displayName,
          email: currentUser.email,
          imageUrl: currentUser.photoURL,
          joinedAt: currentUser.metadata.creationTime
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // --- GOOGLE GİRİŞİ (Capacitor + Firebase) ---
  const loginWithGoogle = async () => {
    // Web'de (localhost) çalışırken hata vermemesi için uyarı
    if (!isNative()) {
      alert("Mobil emülatör veya gerçek cihazda test ediniz.");
      return null;
    }

    try {
      // 1. Telefondan Google hesabını seçtir
      const googleUser = await GoogleAuth.signIn();

      // 2. Google'dan gelen "Kimlik Kartını" (idToken) al
      const idToken = googleUser.authentication.idToken;

      // 3. Bu kartı Firebase'e ver ve oturum aç
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);

      return true;
    } catch (err) {
      console.error("Google Login Hatası:", err);
      return null;
    }
  };

  // --- ÇIKIŞ YAP ---
  const logout = async () => {
    try {
      await signOut(auth); // Firebase'den çık
      if (isNative()) {
        await GoogleAuth.signOut(); // Telefondan çık
      }
      setUser(null);
    } catch (error) {
      console.error("Çıkış Hatası:", error);
    }
  };

  // Manuel giriş (login) fonksiyonunu şimdilik boş bırakıyoruz
  // çünkü sadece Google ile ilerliyoruz.
  const login = () => {}; 

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        loginWithGoogle,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);