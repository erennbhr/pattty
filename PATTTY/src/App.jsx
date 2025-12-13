import React, { useEffect } from 'react'; // useEffect eklendi
import { App as CapApp } from '@capacitor/app'; // Capacitor App eklendi
import { useNavigate, useLocation } from 'react-router-dom'; // Router hook'ları eklendi

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
  
  // --- GERİ TUŞU ENTEGRASYONU BAŞLANGIÇ ---
  // Not: Bu hook'ların çalışması için main.jsx/index.js içinde <BrowserRouter> olması gerekir.
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Android Fiziksel Geri Tuşu Dinleyicisi
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      // Eğer kullanıcı ana sayfada, home'da veya login ekranındaysa uygulamadan çık
      if (location.pathname === '/' || location.pathname === '/home' || location.pathname === '/login') {
        CapApp.exitApp();
      } else {
        // Diğer sayfalardaysa (örn: Aşılar, Profil vb.) bir önceki sayfaya dön
        navigate(-1);
      }
    });

    // Sayfa değiştiğinde veya bileşen kapandığında dinleyiciyi temizle
    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, [navigate, location]);
  // --- GERİ TUŞU ENTEGRASYONU BİTİŞ ---

  if (loading) return null;       // Yükleniyor ekranı
  if (!user) return <LoginScreen />; // Giriş yapılmamış → Login

  return (
    <AppProvider>
      <AppContent />              {/* Karanlık mod dahil tüm uygulama burada */}
    </AppProvider>
  );
}

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