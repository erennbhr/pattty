import React, { createContext, useState, useContext, useEffect } from "react";
import { GoogleAuth } from "@codetrix-studio/capacitor-google-auth";

const AuthContext = createContext();

// Tarayıcı mı, native mi?
const isNative = () => {
  return !!window.Capacitor?.isNativePlatform?.();
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Yalnızca Android/iOS'ta initialize edilecek
    if (isNative()) {
      console.log("GoogleAuth initialized (native)");
      GoogleAuth.initialize();
    } else {
      console.log("GoogleAuth skipped (web)");
    }

    const storedUser = localStorage.getItem("pattty_user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // --- GOOGLE GİRİŞİ (Sadece mobilde!) ---
  const loginWithGoogle = async () => {
    if (!isNative()) {
      alert("Google ile giriş sadece mobil uygulamada kullanılabilir.");
      return null;
    }

    try {
      const googleUser = await GoogleAuth.signIn();

      return {
        name: `${googleUser?.givenName || ""} ${googleUser?.familyName || ""}`.trim(),
        email: googleUser?.email || "",
        imageUrl: googleUser?.imageUrl || "",
        googleId: googleUser?.id || "",
      };
    } catch (err) {
      console.warn("Google Login Error:", err);
      return null;
    }
  };

  // --- MANUEL GİRİŞ ---
  const login = (userData) => {
    const finalUser = {
      ...userData,
      id: userData.id || Date.now(),
      joinedAt: new Date().toLocaleDateString(),
    };

    setUser(finalUser);
    localStorage.setItem("pattty_user", JSON.stringify(finalUser));
  };

  // --- ÇIKIŞ YAP ---
  const logout = async () => {
    try {
      if (isNative()) {
        await GoogleAuth.signOut();
      }
    } catch {}

    setUser(null);
    localStorage.removeItem("pattty_user");
  };

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
