// src/components/Dashboard.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Flame, 
  MapPin, 
  ArrowUpRight, 
  ScanLine, 
  DollarSign, 
  ChevronRight, 
  Plus, 
  Check,
  Smile,
  Zap,
  Thermometer,
  Stethoscope,
  Moon,
  Lock,
  Loader
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';

import {
  calculateAge,
  generateID,
  getLocalYMD,
  updateDailyStreakAndBadges
} from '../utils/helpers';

import PaywallModal from './PaywallModal';
import LostPetAlert from './LostPetAlert';
import BadgeCelebrationModal from './BadgeCelebrationModal';

/* --- MİKRO BİLEŞENLER --- */

// 1. Dairesel İlerleme Çubuğu (Tailwind Dark Classes Updated)
const CircularProgress = ({ percentage, color }) => {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="transform -rotate-90 w-14 h-14">
        <circle
          cx="28" cy="28" r={radius}
          stroke="currentColor"
          strokeWidth="4"
          fill="transparent"
          className="text-gray-200 dark:text-white/10"
        />
        <circle
          cx="28" cy="28" r={radius}
          stroke={color}
          strokeWidth="4"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <span className="absolute text-xs font-bold text-gray-800 dark:text-white">
        {percentage}%
      </span>
    </div>
  );
};

// 2. Skeleton Loader
const Skeleton = ({ className }) => (
  <div className={`animate-pulse bg-gray-400/20 rounded-xl ${className}`}></div>
);

// 3. Minimal Adım Görselleştirici (Tailwind Dark Classes Updated)
const PetMoodStepper = ({ pets, completedIds, activePetId }) => {
  return (
    <div className="flex items-center justify-center gap-1.5 mb-5">
      {pets.map((pet) => {
        const isActive = pet.id === activePetId;
        const isCompleted = completedIds.includes(pet.id);
        
        let widthClass = isActive ? 'w-6' : 'w-1.5';
        
        // Dark/Light mode mantığı CSS classlarına taşındı
        let bgClass = (isActive || isCompleted) 
            ? 'bg-black/80 dark:bg-white/90' 
            : 'bg-black/10 dark:bg-white/20';

        return (
            <div 
              key={pet.id} 
              className={`h-1.5 rounded-full transition-all duration-300 ease-out ${widthClass} ${bgClass}`}
            ></div>
        );
      })}
    </div>
  );
};

const PetImageDisplay = ({ pet, className }) => {
  if (pet?.image) {
    return (
      <img
        src={pet.image}
        alt={pet.name}
        className={`object-cover ${className}`}
      />
    );
  }
  const icons = { dog: '🐕', cat: '🐈', bird: '🦜', other: '🐾' };
  return (
    <div className={`flex items-center justify-center bg-[#2C2C2E] text-2xl ${className}`}>
      {icons[pet?.type] || '🐾'}
    </div>
  );
};

const Dashboard = ({ setPet, openAddModal, onOpenVetLocator, onOpenFoodScan, onOpenExpense }) => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const userId = user?.uid;

  const {
    pets,
    streak,
    setStreak,
    moodHistory,
    setMoodHistory,
    setReminders,
    activeAlerts,
    changePetMood,
    setBadgesEarned,
    loading: appLoading 
  } = useApp();

  const { canUseFeature, isPremium } = usePremium();

  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);
  const [visibleAlerts, setVisibleAlerts] = useState([]);
  const [isGeneratingMood, setIsGeneratingMood] = useState(false);
  
  // Badge Celebration
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [earnedBadgeId, setEarnedBadgeId] = useState(null);

  // Local Loading State for UI effect
  const [uiLoading, setUiLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setUiLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  const loading = appLoading || uiLoading;

  const todayStr = getLocalYMD();

  // Mood Logic (Sıralı Mantık)
  const todaysMoods = moodHistory[todayStr] || {};
  
  const remainingPets = useMemo(() => {
    return pets.filter(p => !todaysMoods[p.id]);
  }, [pets, moodHistory, todayStr]);

  const activePetForMood = remainingPets.length > 0 ? remainingPets[0] : null;
  const allCompleted = remainingPets.length === 0 && pets.length > 0;
  
  const completedPetIds = useMemo(() => {
      return pets.filter(p => todaysMoods[p.id]).map(p => p.id);
  }, [pets, todaysMoods]);

  useEffect(() => {
    setVisibleAlerts(activeAlerts || []);
  }, [activeAlerts]);

  const dismissAlert = (id) => {
    setVisibleAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleMoodSelect = async (mood) => {
    if (!activePetForMood) return;

    setIsGeneratingMood(true);
    try {
      await changePetMood(activePetForMood.id, mood);
    } catch (e) {
      console.error("Mood update failed UI:", e);
    } finally {
      setIsGeneratingMood(false);
    }

    const currentDailyMoods = moodHistory[todayStr] || {};
    
    setMoodHistory(prev => ({
      ...prev,
      [todayStr]: { ...currentDailyMoods, [activePetForMood.id]: mood }
    }));

    if (remainingPets.length === 1) {
      if (userId) {
        try {
          const res = await updateDailyStreakAndBadges(userId);
          if (typeof res?.streakCount === 'number') setStreak(res.streakCount);
          if (Array.isArray(res?.badgesEarned) && typeof setBadgesEarned === 'function') setBadgesEarned(res.badgesEarned);
          if (Array.isArray(res?.newlyEarned) && res.newlyEarned.length > 0) {
            setEarnedBadgeId(res.newlyEarned[0]);
            setShowBadgeModal(true);
          }
        } catch (err) {
          console.error("Streak/badge sync failed:", err);
        }
      }

      const finalDailyMoods = { ...currentDailyMoods, [activePetForMood.id]: mood };
      const summaryText = pets.map(p => {
        const m = finalDailyMoods[p.id];
        return m ? `${p.name}: ${t(`mood_${m}`)}` : '';
      }).filter(Boolean).join(', ');

      const newEvent = {
        id: generateID(),
        title: t('mood_log_title'),
        date: todayStr,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        type: 'other',
        petId: pets[0]?.id,
        note: summaryText,
        completed: true
      };
      setReminders(prev => [...prev, newEvent]);
    }
  };

  // Handlers
  const handleVetClick = () => {
    if (canUseFeature('vet_locator')) onOpenVetLocator();
    else { setPaywallFeature('vet_locator'); setShowPaywall(true); }
  };

  const handleCheckupClick = () => {
    if (!isPremium) {
       setPaywallFeature('checkup'); 
       setShowPaywall(true);
    }
  };

  const handleFoodClick = () => {
    if (canUseFeature('food_scan')) onOpenFoodScan();
    else { setPaywallFeature('food_scan'); setShowPaywall(true); }
  };

  const handleExpenseClick = () => {
    if (canUseFeature('expense_charts')) onOpenExpense();
    else { setPaywallFeature('expense_charts'); setShowPaywall(true); }
  };

  // 🟢 GÜNCELLENMİŞ TEMA OBJESİ (Statik Tailwind Sınıfları)
  // Bu yöntem HTML class="dark" olduğunda otomatik çalışır, JS state'ine bağımlı kalmaz.
  const theme = {
    appBg: 'bg-gray-50 dark:bg-black', // Koyu modda tam siyah
    text: 'text-gray-900 dark:text-white',
    textMuted: 'text-gray-500 dark:text-gray-400',
    // Card: Light mode için shadow ve border, Dark mode için Glassmorphism (white/5)
    card: 'bg-white border-gray-100 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:bg-white/5 dark:border-white/10 dark:backdrop-blur-xl dark:shadow-none',
    cardHover: 'hover:bg-gray-50 dark:hover:bg-white/10',
  };

  // Mood Button Component for Grid
  const MoodBtn = ({ mood, icon: Icon, color, label }) => (
    <button
      onClick={() => handleMoodSelect(mood)}
      disabled={isGeneratingMood}
      className={`flex flex-col items-center justify-center p-2 rounded-xl border transition-all active:scale-95 bg-gray-50 border-gray-100 hover:bg-gray-100 dark:bg-white/5 dark:border-white/5 dark:hover:bg-white/10`}
    >
      <Icon size={20} className={`mb-1 ${color}`} />
      <span className="text-[9px] font-bold uppercase text-gray-600 dark:text-gray-300">{label}</span>
    </button>
  );

  // --- NO PETS STATE ---
  if (!loading && pets.length === 0) return (
    <div className={`h-full flex flex-col items-center justify-center text-center p-8 space-y-6 animate-in fade-in ${theme.appBg} ${theme.text}`}>
      <div className="w-40 h-40 rounded-full flex items-center justify-center mb-4 relative overflow-hidden border shadow-2xl bg-white border-gray-200 dark:bg-[#1C1C1E] dark:border-white/10 dark:shadow-indigo-900/20">
         <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 opacity-50"></div>
         <Plus size={48} className="text-gray-400" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">{t('no_pets_title')}</h2>
        <p className={`text-sm max-w-[250px] mx-auto leading-relaxed ${theme.textMuted}`}>{t('no_pets_desc')}</p>
      </div>
      <button onClick={openAddModal} className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all">
        <Plus size={20} /> {t('add_first_pet')}
      </button>
      {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
    </div>
  );

  // --- MAIN DASHBOARD ---
  return (
    <div className={`min-h-screen ${theme.appBg} ${theme.text} font-sans transition-colors duration-500 p-0 pb-32`}>
      
      {/* Background Ambient Glows */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-900/20 rounded-full blur-[100px] transition-all duration-1000 opacity-40 dark:opacity-100"></div>
        <div className="absolute bottom-[20%] right-[-10%] w-80 h-80 bg-blue-900/10 rounded-full blur-[100px] transition-all duration-1000 opacity-40 dark:opacity-100"></div>
      </div>

      <div className="relative z-10 p-6">
        
        {/* HEADER */}
        <div className="flex justify-end items-center mb-6 animate-fade-in-down">
            {loading ? <Skeleton className="w-20 h-8 rounded-2xl" /> : (
              <div className="flex items-center gap-1.5 text-orange-400 bg-orange-500/10 px-3 py-1.5 rounded-2xl border border-orange-500/20 shadow-orange-glow">
                <Flame size={18} fill="currentColor" />
                <span className="font-bold">{streak} {t('streak_days')}</span>
              </div>
            )}
        </div>

        {/* STATUS CARD (Daily Goal / Mood) */}
        <div className="relative mb-8 group animate-slide-up" style={{ animationDelay: '0.1s' }}>
          {loading ? <Skeleton className="h-32 w-full rounded-[32px]" /> : (
            <>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-teal-500/20 rounded-[32px] blur-lg transition-opacity opacity-30 dark:opacity-60"></div>
              <div className={`relative rounded-[32px] p-5 border overflow-hidden transition-all duration-300 ${theme.card}`}>
                
                {allCompleted ? (
                   /* TAMAMLANMIŞ DURUM */
                   <div className="flex items-center gap-4">
                      <CircularProgress percentage={100} color="#10B981" />
                      <div className="z-10 flex-1">
                        <h3 className="font-bold text-lg leading-tight">{t('great_job')}</h3>
                        <p className={`text-sm ${theme.textMuted}`}>{t('mood_log_completed')}</p>
                      </div>
                      <div className="bg-green-500/20 p-2 rounded-full text-green-500"><Check size={20} strokeWidth={3} /></div>
                   </div>
                ) : (
                  /* MOOD SEÇİCİ DURUMU + STEP GÖRSELLEŞTİRME */
                  <div className="w-full">
                      {/* Minimal "Dar" Adım Görselleştirme (Opaklık Ayarlı) */}
                      <PetMoodStepper 
                        pets={pets} 
                        completedIds={completedPetIds} 
                        activePetId={activePetForMood?.id}
                      />

                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <h3 className="font-bold text-base leading-tight">{activePetForMood?.name}</h3>
                          <p className={`text-xs ${theme.textMuted}`}>{t('how_feeling')}?</p>
                        </div>
                        {isGeneratingMood && <Loader size={14} className="animate-spin text-purple-500" />}
                      </div>
                      
                      <div className="grid grid-cols-4 gap-2">
                        <MoodBtn mood="happy" icon={Smile} color="text-emerald-500" label={t('mood_happy')} />
                        <MoodBtn mood="energetic" icon={Zap} color="text-amber-500" label={t('mood_energetic')} />
                        <MoodBtn mood="sleepy" icon={Moon} color="text-indigo-500" label={t('mood_sleepy')} />
                        <MoodBtn mood="sick" icon={Thermometer} color="text-rose-500" label={t('mood_sick')} />
                      </div>
                  </div>
                )}
                
                {allCompleted && <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l to-transparent skew-x-12 pointer-events-none from-gray-100 dark:from-white/5"></div>}
              </div>
            </>
          )}
        </div>

        {/* QUICK ACCESS GRID */}
        <div className="grid grid-cols-2 gap-4 mb-8 animate-slide-up" style={{ animationDelay: '0.2s' }}>
            
            {/* NEW CHECKUP CARD (Controlled Breathing Effect) */}
            {loading ? <Skeleton className="h-44 w-full rounded-[32px]" /> : (
              <div onClick={handleCheckupClick} className="relative group cursor-pointer active:scale-95 transition-transform duration-300">
                
                {/* Breathing Glow Effect */}
                <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-400 to-rose-400 rounded-[34px] blur-lg animate-glow-breathe z-0"></div>
                
                {/* Content */}
                <div className="relative h-44 bg-gradient-to-br from-orange-400 to-rose-500 rounded-[32px] p-5 flex flex-col justify-between shadow-lg overflow-hidden text-white z-10">
                  <div className="flex justify-between items-start text-white/90 z-10">
                    <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm"><Stethoscope size={24} /></div>
                    <ArrowUpRight size={20} className="opacity-70" />
                  </div>
                  
                  {/* Pattern */}
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '10px 10px' }}></div>
                  
                  <span className="font-semibold text-xl leading-tight text-white z-10 whitespace-pre-line">{t('checkup_title') || 'Check-up'}</span>
                  {!isPremium && <div className="absolute top-3 right-10 bg-black/20 p-1.5 rounded-full backdrop-blur-md"><Lock size={12} className="text-white" /></div>}
                </div>
              </div>
            )}

            {/* ANALYSIS CENTER */}
            {loading ? <Skeleton className="h-44 w-full rounded-[32px]" /> : (
              <div onClick={handleFoodClick} className="relative group cursor-pointer active:scale-95 transition-transform duration-300">
                <div className="absolute inset-0 bg-emerald-500 rounded-[32px] blur opacity-20 group-hover:opacity-30 transition-opacity"></div>
                
                {/* Content */}
                <div className="relative h-44 bg-gradient-to-br from-emerald-400 to-teal-600 rounded-[32px] p-5 flex flex-col justify-between shadow-lg overflow-hidden text-white">
                  <div className="flex justify-between items-start text-white/90 z-10">
                    <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm"><ScanLine size={24} /></div>
                    <ArrowUpRight size={20} className="opacity-70" />
                  </div>
                  
                  <span className="font-semibold text-xl leading-tight text-white z-10 whitespace-pre-line">{t('analysis_hub_title')}</span>
                  {!isPremium && <div className="absolute top-3 right-10 bg-black/20 p-1.5 rounded-full backdrop-blur-md"><Lock size={12} className="text-white" /></div>}
                </div>
              </div>
            )}
        </div>

        {/* LIST SECTION (Vet Locator & Expenses) */}
        <div className="animate-slide-up space-y-4 mb-8" style={{ animationDelay: '0.3s' }}>
            
            {/* VET LOCATOR */}
            {loading ? <Skeleton className="h-20 w-full rounded-[24px]" /> : (
              <div onClick={handleVetClick} className={`rounded-[24px] p-4 flex items-center justify-between border transition-all active:scale-[0.98] cursor-pointer ${theme.card} ${theme.cardHover}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <MapPin size={20} />
                  </div>
                  <span className="font-medium text-lg">{t('dash_find_places')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isPremium && <Lock size={16} className="text-yellow-500" />}
                  <ChevronRight className={theme.textMuted} size={20} />
                </div>
              </div>
            )}

            {/* EXPENSES ROW */}
            {loading ? <Skeleton className="h-20 w-full rounded-[24px]" /> : (
              <div onClick={handleExpenseClick} className={`rounded-[24px] p-4 flex items-center justify-between border transition-all active:scale-[0.98] cursor-pointer ${theme.card} ${theme.cardHover}`}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                    <DollarSign size={20} />
                  </div>
                  <span className="font-medium text-lg">{t('exp_title')}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!isPremium && <Lock size={16} className="text-yellow-500" />}
                  <ChevronRight className={theme.textMuted} size={20} />
                </div>
              </div>
            )}
        </div>

        {/* MY PETS LIST */}
        <div className="mb-4 animate-slide-up" style={{ animationDelay: '0.4s' }}>
            <div className="flex justify-between items-center mb-4 px-1">
              <h2 className="text-xl font-bold">{t('my_pets_title')}</h2>
              <button onClick={openAddModal} className="flex items-center gap-1 text-sm text-purple-500 hover:text-purple-400 font-medium active:opacity-70">
                <Plus size={16} /> {t('add_new')}
              </button>
            </div>

            <div className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory -mx-6 px-6 hide-scrollbar">
              {loading ? (
                <>
                  <Skeleton className="min-w-[85%] h-28 rounded-[32px] snap-center" />
                  <Skeleton className="min-w-[85%] h-28 rounded-[32px] snap-center" />
                </>
              ) : (
                pets.map(pet => (
                  <div 
                    key={pet.id} 
                    onClick={() => setPet(pet.id)}
                    className={`min-w-[85%] snap-center rounded-[32px] p-4 flex items-center gap-4 border transition-all cursor-pointer group hover:border-purple-500/30 active:scale-[0.98] ${theme.card}`}
                  >
                    <div className="relative">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg border border-white/5">
                        <PetImageDisplay pet={pet} className="w-full h-full" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border bg-white border-gray-100 dark:bg-black dark:border-white/10">
                          <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg truncate">{pet.name}</h3>
                          <p className={`text-sm truncate ${theme.textMuted}`}>{pet.breed}</p>
                        </div>
                        <span className="text-xs font-bold px-2.5 py-1 rounded-lg border whitespace-nowrap bg-gray-200 border-gray-300 dark:bg-white/10 dark:border-white/5">
                           {calculateAge(pet.birthDate, t) || pet.age}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
        </div>

      </div>

      {/* MODALS */}
      {showBadgeModal && earnedBadgeId && (
        <BadgeCelebrationModal
          badgeId={earnedBadgeId}
          onClose={() => { setShowBadgeModal(false); setEarnedBadgeId(null); }}
          t={t}
        />
      )}

      {visibleAlerts.length > 0 && (
        <div className="fixed bottom-28 left-4 right-4 z-50">
          {visibleAlerts.map(alert => (
            <LostPetAlert key={alert.id} alert={alert} onDismiss={() => dismissAlert(alert.id)} />
          ))}
        </div>
      )}

      {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}

      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        
        @keyframes fade-in-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes glow-breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.02); }
        }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        .animate-slide-up { animation: slide-up 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
        .animate-glow-breathe { animation: glow-breathe 3s ease-in-out infinite; }
        .shadow-orange-glow { box-shadow: 0 0 15px -3px rgba(249,115,22,0.3); }
      `}</style>
    </div>
  );
};

export default Dashboard;