// src/App.jsx
import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter, Routes, Route } from "react-router-dom"; 

/* CONTEXTS */
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import { NotificationProvider } from "./context/NotificationContext";
import { AppProvider } from "./context/AppContext";
import { PhotoGalleryProvider } from "./context/PhotoGalleryContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { PremiumProvider } from "./context/PremiumContext";
import { ThemeProvider } from "./context/ThemeContext";

/* PAGES & COMPONENTS */
import AppContent from "./components/AppContent";
import LoginScreen from "./components/LoginScreen";
import VerifyScreen from "./pages/VerifyScreen";
import AuthActionHandler from "./pages/AuthActionHandler"; // 🟢 EKLENDİ
import LandingPage from "./pages/LandingPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

import "./index.css";

/* ================= ANA UYGULAMA AKIŞI (LOGIN & DOĞRULAMA KONTROLÜ) ================= */
function MainAppFlow() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f13] text-white">
        {t('loading') || "..."} 
      </div>
    );
  }

  // 1. Kullanıcı hiç giriş yapmamışsa -> Login Ekranı
  if (!user) {
    return <LoginScreen />;
  }

  // 2. Kullanıcı var AMA e-postası doğrulanmamışsa -> Doğrulama Ekranı
  if (!user.emailVerified) {
    return <VerifyScreen />;
  }

  // 3. Kullanıcı var VE doğrulanmışsa -> Ana İçerik
  return <AppContent />;
}

/* ================= ROOT ================= */

export default function App() {
  const isDev = import.meta.env.DEV;
  const isNative = Capacitor.isNativePlatform();
  const forceWeb = isDev && new URLSearchParams(window.location.search).has("web");
  const isWeb = !isNative && (!isDev || forceWeb);

  /* WEB İÇİN SCROLL KİLİDİNİ KALDIR */
  useEffect(() => {
    const root = document.documentElement;
    if (isWeb) {
      root.classList.add("is-web");
    } else {
      root.classList.remove("is-web");
    }
    return () => {
      root.classList.remove("is-web");
    };
  }, [isWeb]);

return (
  <BrowserRouter>
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <ThemeProvider>
            <AppProvider> 
              <PhotoGalleryProvider>
                <PremiumProvider>

                  <Routes>
                    {/* Ortak Rotalar (Hem mobil hem web'de çalışmalı) */}
                    <Route path="/auth/action" element={<AuthActionHandler />} />
                    <Route path="/terms" element={<TermsPage />} />
                    <Route path="/privacy" element={<PrivacyPage />} />

                    {/* Web için Landing Page */}
                    {isWeb ? (
                      <>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/app" element={<MainAppFlow />} />
                      </>
                    ) : (
                      /* Mobil için Ana Akış */
                      <Route path="/" element={<MainAppFlow />} />
                    )}
                  </Routes>

                </PremiumProvider>
              </PhotoGalleryProvider>
            </AppProvider>
          </ThemeProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  </BrowserRouter>
);
}