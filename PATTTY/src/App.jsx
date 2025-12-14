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
  
  // Yükleniyor durumunda boş ekran veya spinner dönebiliriz
  if (loading) return null; 

  // Kullanıcı giriş yapmamışsa (Platform fark etmeksizin) LoginScreen'i göster
  // NOT: Artık AppProvider üstte olduğu için LoginScreen hata vermeden useApp verilerini çekebilir.
  if (!user) return <LoginScreen />; 

  // Giriş yapılmışsa ana içeriği göster
  return (
      <AppContent /> 
  );
}

// ---------------- APP ROOT ----------------
export default function App() {
  return (
    <AuthProvider>
      {/* AppProvider buraya taşındı. Artık hem LoginScreen hem de AppContent kapsama alanında. */}
      <AppProvider>
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
      </AppProvider>
    </AuthProvider>
  );
}