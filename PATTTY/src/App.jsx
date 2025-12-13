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
  
  if (loading) return null;       // Yükleniyor ekranı
  if (!user) return <LoginScreen />; // Giriş yapılmamışsa Login ekranı

  // Kullanıcı giriş yapmışsa AppContent render edilir.
  // Geri tuşu mantığı AppContent.jsx içinde tanımlıdır.
  return (
    <AppProvider>
      <AppContent />
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