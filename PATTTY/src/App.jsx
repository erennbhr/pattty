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
import LandingPage from "./pages/LandingPage";
import TermsPage from "./pages/TermsPage";
import PrivacyPage from "./pages/PrivacyPage";

import "./index.css";

/* ================= ANA UYGULAMA AKIŞI (LOGIN KONTROLÜ) ================= */
function MainAppFlow() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f13] text-white">
        {t('loading') || "Yükleniyor..."} 
      </div>
    );
  }

  // Giriş yapılmışsa ana içeriği göster
  if (user) {
    return <AppContent />;
  }

  // Giriş yapılmamışsa Login ekranını göster
  return <LoginScreen />;
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

  // 🟢 DÜZELTME: Provider Sıralaması Değiştirildi
  // AppProvider; Language, Notification ve Auth contextlerini kullandığı için onların İÇİNDE olmalı.
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <NotificationProvider>
            <ThemeProvider>
              <AppProvider> 
                <PhotoGalleryProvider>
                  <PremiumProvider>

                    {/* ================= WEB ================= */}
                    {isWeb ? (
                      <Routes>
                        <Route path="/" element={<LandingPage />} />
                        <Route path="/app" element={<MainAppFlow />} />
                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                      </Routes>
                    ) : (
                      /* ================= MOBILE ================= */
                      <MainAppFlow />
                    )}

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