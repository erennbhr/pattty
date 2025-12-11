import React, { createContext, useState, useContext, useEffect } from 'react';
import { GoogleAuth } from '@codetrix-studio/capacitor-google-auth'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // DÜZELTİLDİ: initialize() parametresiz bırakıldı. 
    // Bilgiyi capacitor.config.json ve index.html'den alacak.
    GoogleAuth.initialize(); 

    const storedUser = localStorage.getItem('pattty_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  // --- GOOGLE GİRİŞİ ---
const loginWithGoogle = async () => {
  try {
    const googleUser = await GoogleAuth.signIn();

    return {
      name: `${googleUser?.givenName || ""} ${googleUser?.familyName || ""}`.trim(),
      email: googleUser?.email || "",
      imageUrl: googleUser?.imageUrl || "",
      googleId: googleUser?.id || "",
    };

  } catch {
    return null;
  }
};


  // --- MANUEL GİRİŞ/KAYIT ---
  const login = (userData) => {
    const finalUser = { 
        ...userData, 
        id: userData.id || Date.now(),
        joinedAt: new Date().toLocaleDateString()
    };
    setUser(finalUser);
    localStorage.setItem('pattty_user', JSON.stringify(finalUser));
  };

  // --- ÇIKIŞ YAP ---
  const logout = async () => {
    try {
        await GoogleAuth.signOut(); 
    } catch (e) {
        // Oturum kapalıysa sorun yok
    }
    setUser(null);
    localStorage.removeItem('pattty_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loginWithGoogle, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

// HATA DÜZELTİLDİ: useAuth hook'u kendi AuthContext'ini kullanıyor.
export const useAuth = () => useContext(AuthContext);