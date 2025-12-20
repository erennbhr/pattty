import React, { createContext, useContext, useState, useEffect } from 'react';
// RevenueCat importları kalsın, ileride lazım olacak
import { Purchases } from '@revenuecat/purchases-capacitor'; 
import { Capacitor } from '@capacitor/core';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';
import { useLanguage } from './LanguageContext';

const PremiumContext = createContext();

// 🟢 HERKES PREMIUM MODU
// true  = Herkes Premium (Market öncesi test/beta)
// false = Gerçek mod (Market sürümü)
const EVERYONE_IS_PREMIUM = true; 

// Sahte paketler (UI bozulmasın diye boş liste yerine dolu liste)
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
  
  // Bildirim fonksiyonu güvenliği
  const notificationCtx = useNotification();
  const showNotification = (notificationCtx && typeof notificationCtx.showNotification === 'function')
    ? notificationCtx.showNotification
    : () => {};

  // 🟢 Varsayılan olarak true ile başlıyoruz (Eğer EVERYONE_IS_PREMIUM aktifse)
  const [isPremium, setIsPremium] = useState(EVERYONE_IS_PREMIUM);
  const [packages, setPackages] = useState(MOCK_PACKAGES); 
  const [loading, setLoading] = useState(true);

  // Limitler (Premium olunca zaten limitsiz oluyor ama yapı bozulmasın diye duruyor)
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
        // 🟢 EĞER "HERKES PREMIUM" MODU AÇIKSA
        if (EVERYONE_IS_PREMIUM) {
            console.log("🌟 BETA MODU: Herkes Premium olarak ayarlandı.");
            setIsPremium(true);
            setLoading(false);
            
            // Firebase'i de güncelle ki kullanıcı veritabanında da premium görünsün
            if (user?.uid) {
               // Bunu sessizce yapabiliriz veya yapmayabiliriz, şimdilik UI yeterli.
            }
            return;
        }

        // 🔴 GERÇEK MOD (RevenueCat)
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

            // Paketleri çek
            try {
                const offerings = await Purchases.getOfferings();
                if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
                    setPackages(offerings.current.availablePackages);
                }
            } catch (e) {
                console.error("Paket çekme hatası:", e);
            }

        } catch (error) {
            console.error("RevenueCat Init Error:", error);
        } finally {
            setLoading(false);
        }
    };

    init();
  }, [user]);

  // 2. FIREBASE SENKRONİZASYON (Gerçek modda lazım)
  useEffect(() => {
    if (EVERYONE_IS_PREMIUM) return; // Beta modundaysak Firebase dinlemeye gerek yok

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

  // 3. KULLANIM KONTROLÜ (Hep True Dönecek)
  const canUseFeature = (featureName) => {
    // 🟢 Her zaman izin ver
    return { allowed: true, remaining: 9999 };
  };

  // 4. AKSİYON KAYDETME (Beta'da gerek yok ama hata vermesin)
  const recordAction = (featureName) => {
    // Boş işlem
  };

  // 5. SATIN ALMA (Beta modunda zaten premium olduğu için uyarı verelim)
  const upgradeToPremium = async () => {
    if (EVERYONE_IS_PREMIUM) {
        window.alert("BETA SÜRÜM: Zaten tüm özellikler sizin için açık! 🎉");
        return;
    }
    // ... Gerçek satın alma kodları ...
  };

  const restorePurchases = async () => {
      if (EVERYONE_IS_PREMIUM) {
          window.alert("BETA SÜRÜM: Zaten Premium'sunuz.");
          return;
      }
      // ... Gerçek restore kodları ...
  };

  const downgradeToFree = async () => {
      window.alert("Beta sürümünde Free plana geçilemez.");
  };

  return (
    <PremiumContext.Provider
      value={{
        isPremium,
        loading,
        packages,
        canUseFeature,
        recordAction,
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