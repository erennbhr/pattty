// src/App.jsx
import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { BrowserRouter, Routes, Route } from "react-router-dom"; // ✅ BrowserRouter eklendi

/* CONTEXTS */
import { LanguageProvider, useLanguage } from "./context/LanguageContext"; // ✅ useLanguage importu birleştirildi
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
// Hem Mobilde hem de Web'de '/app' rotasında bu bileşen çalışacak.
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

  return (
    <BrowserRouter> {/* ✅ Router Kapsayıcısı Eklendi */}
      <AuthProvider>
        <AppProvider>
          <ThemeProvider>
            <LanguageProvider>
              <NotificationProvider>
                <PhotoGalleryProvider>
                  <PremiumProvider>

                    {/* ================= WEB ================= */}
                    {isWeb ? (
                      <Routes>
                        {/* Ana Sayfa: Landing Page */}
                        <Route path="/" element={<LandingPage />} />
                        
                        {/* 🟢 GİZLİ ROTA: Sadece '/app' yazınca uygulama açılır */}
                        <Route path="/app" element={<MainAppFlow />} />

                        <Route path="/terms" element={<TermsPage />} />
                        <Route path="/privacy" element={<PrivacyPage />} />
                      </Routes>
                    ) : (
                      /* ================= MOBILE ================= */
                      /* Mobilde adres çubuğu olmadığı için direkt uygulamayı açar */
                      <MainAppFlow />
                    )}

                  </PremiumProvider>
                </PhotoGalleryProvider>
              </NotificationProvider>
            </LanguageProvider>
          </ThemeProvider>
        </AppProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}