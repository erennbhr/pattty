import React from 'react';

import { LanguageProvider } from './context/LanguageContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppProvider } from './context/AppContext';
import { PhotoGalleryProvider } from './context/PhotoGalleryContext';
import { AuthProvider, useAuth } from './context/AuthContext';

import AppContent from './components/AppContent';
import LoginScreen from './components/LoginScreen';
import './index.css';

// ---------------- MAIN LAYOUT ----------------
function MainLayout() {
  const { user, loading } = useAuth();

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
            <MainLayout />
          </PhotoGalleryProvider>
        </NotificationProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}
