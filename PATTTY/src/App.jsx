import React from 'react';
// 🔴 useNavigate, useLocation, CapApp ve useEffect kaldırıldı.
// Artık global geri tuşu dinleyicisi burada değil, AppContent içinde yönetilecek.

import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppProvider } from './context/AppContext';
import { PhotoGalleryProvider } from './context/PhotoGalleryContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { PremiumProvider } from './context/PremiumContext'; 

import AppContent from './components/AppContent';
import LoginScreen from './components/LoginScreen';
import './index.css';

// ---------------- MAIN LAYOUT ----------------
function MainLayout() {
  const { user, loading } = useAuth();
  
  // Eğer Capacitor ortamında DEĞİLSEK (yani web'de 'npm run dev' ile çalışıyorsak)
  const isWebDev = !window.Capacitor?.isNative;
  
  // *********** 🟢 DEMO GİRİŞİ LOGİĞİ BURADA ***********
  // Hata veren satır buydu, fonksiyonun en başında olmalı
  if (loading) return null; 

  if (isWebDev && !user) {
    // Web geliştirme/demo modu için giriş ekranını atla
    return (
      <AppProvider>
        <AppContent />
      </AppProvider>
    );
  }

  // Giriş yapılmamışsa LoginScreen'i göster
  if (!user) return <LoginScreen />; 

  // Giriş yapılmışsa ana içeriği göster
  return (
    <AppProvider>
      <AppContent /> 
    </AppProvider>
  );
}

// ... (App bileşeni ve diğer kodlar) ...

// ---------------- APP ROOT ----------------
export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <NotificationProvider>
          <PhotoGalleryProvider>
            {/* PremiumProvider: Tüm alt bileşenler erişebilir */}
            <PremiumProvider>
              <MainLayout />
            </PremiumProvider>
          </PhotoGalleryProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}