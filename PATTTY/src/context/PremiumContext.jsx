import React, { createContext, useContext, useState, useEffect } from 'react';
import { Purchases } from '@revenuecat/purchases-capacitor'; 
import { Capacitor } from '@capacitor/core';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';

const PremiumContext = createContext();

// 🟢 HERKES PREMIUM MODU (Beta)
const EVERYONE_IS_PREMIUM = true; 

// Sahte paketler
const MOCK_PACKAGES = [
    {
        identifier: 'monthly_mock',
        product: {
            priceString: '0.00₺',
            title: 'Beta Sürüm',
            description: 'Tüm özellikler açık (Beta)',
            identifier: 'monthly_mock_id'
        }
    }
];

export const PremiumProvider = ({ children }) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  
  const notificationCtx = useNotification();
  const showNotification = (notificationCtx && typeof notificationCtx.showNotification === 'function')
    ? notificationCtx.showNotification
    : () => {};

  const [isPremium, setIsPremium] = useState(EVERYONE_IS_PREMIUM);
  const [packages, setPackages] = useState(MOCK_PACKAGES); 
  const [loading, setLoading] = useState(true);

  const LIMITS = {
    food_scan: 9999,      
    analyze_food: 9999,   
    analyze_poop: 9999,   
    ai_chat: 9999,        
    vaccine_scan: 9999,   
    vet_locator: 9999,    
    ai_vaccine: 9999,     
    add_pet: 9999,        
    image_gen: 9999,      
  };

  // 1. BAŞLANGIÇ AYARLARI
  useEffect(() => {
    const init = async () => {
        if (EVERYONE_IS_PREMIUM) {
            // Log konsol spam'i yapmasın diye kaldırıldı veya sadece dev modda
            setIsPremium(true);
            setLoading(false);
            return;
        }

        if (!Capacitor.isNativePlatform()) {
            setLoading(false);
            return;
        }

        try {
            const apiKey = Capacitor.getPlatform() === 'ios' 
                ? 'appl_IOS_KEY' 
                : 'goog_ANDROID_KEY';
            
            await Purchases.configure({ apiKey });
            
            const info = await Purchases.getCustomerInfo();
            if (info?.entitlements?.active?.['premium']) {
                setIsPremium(true);
            }

            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                    setPackages(offerings.current.availablePackages);
                }
            } catch (e) {
                console.error("RevenueCat Offerings Error:", e);
            }

        } catch (error) {
            console.error("RevenueCat Init Error:", error);
        } finally {
            setLoading(false);
        }
    };

    init();
  }, [user]);

  // 2. FIREBASE SENKRONİZASYON (Beta dışı modda)
  useEffect(() => {
    if (EVERYONE_IS_PREMIUM) return; 

    if (!user?.uid) return;

    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.isPremium === true) {
            setIsPremium(true);
        }
      }
    });

    return () => unsubscribe();
  }, [user]);

  // 3. KULLANIM KONTROLÜ
  const canUseFeature = (featureName) => {
    return { allowed: true, remaining: 9999 };
  };

  // 4. AKSİYON KAYDETME
  const recordAction = (featureName) => {
    // Boş işlem veya analitik kaydı
  };

  // 🟢 EKLENEN FONKSİYON: recordMessage (Hata sebebi buydu)
  const recordMessage = () => {
    // Mesaj sayacı (Beta modunda limitsiz)
  };

  // 5. SATIN ALMA
  const upgradeToPremium = async () => {
    if (EVERYONE_IS_PREMIUM) {
        showNotification(t('beta_already_premium'), 'success');
        return;
    }
    // ... Gerçek satın alma kodları buraya ...
  };

  const restorePurchases = async () => {
      if (EVERYONE_IS_PREMIUM) {
          showNotification(t('beta_already_premium'), 'success');
          return;
      }
      // ... Gerçek restore kodları ...
  };

  const downgradeToFree = async () => {
      showNotification(t('beta_no_downgrade'), 'warning');
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        loading,
        packages,
        canUseFeature,
        recordAction,
        recordMessage, // 🟢 Eklendi
        upgradeToPremium,
        purchasePackage: upgradeToPremium,
        restorePurchases,
        downgradeToFree,
        LIMITS,
        isTestMode: EVERYONE_IS_PREMIUM
      }}
    >
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);
export default PremiumContext;