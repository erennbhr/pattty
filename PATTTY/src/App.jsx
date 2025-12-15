import React, { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { Routes, Route } from "react-router-dom";

/* CONTEXTS */
import { LanguageProvider } from "./context/LanguageContext";
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

/* ================= MOBILE APP FLOW ================= */

function MobileApp() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0f0f13] text-white">
        Yükleniyor...
      </div>
    );
  }

  // Mobilde giriş yapılmışsa direkt app
  if (user) {
    return <AppContent />;
  }

  // Mobilde giriş yoksa login
  return <LoginScreen />;
}

/* ================= ROOT ================= */

export default function App() {
  const isWeb = !Capacitor.isNativePlatform();

  /* 🔴 KRİTİK: WEB İÇİN SCROLL KİLİDİNİ KALDIR */
  useEffect(() => {
    const root = document.documentElement;

    if (isWeb) {
      root.classList.add("is-web");
    } else {
      root.classList.remove("is-web");
    }

    // cleanup (hot reload / route change güvenliği)
    return () => {
      root.classList.remove("is-web");
    };
  }, [isWeb]);

  return (
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
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/terms" element={<TermsPage />} />
                      <Route path="/privacy" element={<PrivacyPage />} />
                    </Routes>
                  ) : (
                    /* ================= MOBILE ================= */
                    <MobileApp />
                  )}

                </PremiumProvider>
              </PhotoGalleryProvider>
            </NotificationProvider>
          </LanguageProvider>
        </ThemeProvider>
      </AppProvider>
    </AuthProvider>
  );
}
