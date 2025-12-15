import React, { createContext, useContext, useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core'; 
// 👇 DÜZELTİLEN SATIR BURASI (Süslü parantez eklendi)
import { Purchases, LOG_LEVEL } from '@revenuecat/purchases-capacitor';
import { useAuth } from './AuthContext';

// --- YAPILANDIRMA ---
const REVENUECAT_API_KEY = "test_WJhImhljZtdGhAIVCdJtktYggxt"; 
const ENTITLEMENT_ID = "Pattty App Premium"; 

// ... kodun geri kalanı aynı ...
const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { user } = useAuth();
  
  const [isPremium, setIsPremium] = useState(false);
  const [offerings, setOfferings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState(null);

  // 1. RevenueCat BAŞLATMA
  useEffect(() => {
    const initRevenueCat = async () => {
      if (!Capacitor.isNativePlatform()) {
        console.warn("RevenueCat sadece mobilde (Android/iOS) çalışır. Web'de devre dışı.");
        setLoading(false);
        return;
      }

      try {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
        await Purchases.configure({ apiKey: REVENUECAT_API_KEY });
        await loadOfferings();
        await checkEntitlement();
      } catch (e) {
        console.error("RevenueCat Başlatma Hatası:", e);
      } finally {
        setLoading(false);
      }
    };

    initRevenueCat();
  }, []);

  // 2. KULLANICI EŞLEŞTİRME
  useEffect(() => {
    const identifyUser = async () => {
      if (!Capacitor.isNativePlatform()) return;

      if (user?.uid) {
        try {
          await Purchases.logIn(user.uid);
          await checkEntitlement(); 
        } catch (e) {
          console.error("Kullanıcı Eşleştirme Hatası:", e);
        }
      }
    };
    identifyUser();
  }, [user]);

  // --- PAKETLERİ GETİR ---
  const loadOfferings = async () => {
    try {
      const offers = await Purchases.getOfferings();
      if (offers.current) {
        setOfferings(offers.current);
      }
    } catch (e) {
      console.error("Paketler yüklenemedi:", e);
    }
  };

  // --- YETKİ KONTROLÜ ---
  const checkEntitlement = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      if (info.entitlements.active[ENTITLEMENT_ID]) {
        setIsPremium(true);
      } else {
        setIsPremium(false);
      }
    } catch (e) {
      console.error("Yetki kontrol hatası:", e);
    }
  };

  const canUseFeature = (featureName) => {
    if (isPremium) return true;
    return false;
  };

  // --- SATIN ALMA İŞLEMİ ---
  const purchasePackage = async (packageType) => {
    if (!Capacitor.isNativePlatform()) {
      alert("Satın alma işlemi sadece mobil uygulamada yapılabilir.");
      return { success: false, error: 'web_platform' };
    }

    if (!offerings) return { success: false, error: 'no_offerings' };

    try {
      let packageToBuy;
      if (packageType === 'monthly') packageToBuy = offerings.monthly;
      else if (packageType === 'yearly') packageToBuy = offerings.annual;

      if (!packageToBuy) return { success: false, error: 'package_not_found' };

      const { customerInfo } = await Purchases.purchasePackage(packageToBuy);

      if (customerInfo.entitlements.active[ENTITLEMENT_ID]) {
        setIsPremium(true);
        return { success: true };
      } else {
        return { success: false, error: 'payment_failed' };
      }

    } catch (error) {
      if (!error.userCancelled) {
        console.error("Satın alma hatası:", error);
        return { success: false, error: error.message };
      }
      return { success: false, userCancelled: true };
    }
  };

  const restorePurchases = async () => {
    if (!Capacitor.isNativePlatform()) return { success: false };

    try {
      const info = await Purchases.restorePurchases();
      if (info.entitlements.active[ENTITLEMENT_ID]) {
        setIsPremium(true);
        return { success: true };
      }
      return { success: false, error: 'not_found' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const showCustomerCenter = async () => {
      try {
          const managementURL = customerInfo?.managementURL;
          if (managementURL) {
             window.open(managementURL, '_system');
          }
      } catch (e) {
          console.error(e);
      }
  };

  return (
    <PremiumContext.Provider value={{
      isPremium,
      loading,
      offerings, 
      canUseFeature,
      purchasePackage,
      restorePurchases,
      showCustomerCenter
    }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);