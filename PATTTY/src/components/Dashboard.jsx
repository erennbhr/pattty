import React, { useState, useEffect } from 'react';
import { Plus, Flame, Check, Smile, Zap, Moon, Thermometer, Heart, ChevronRight, MapPin, ScanLine, Lock, DollarSign } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext'; 
import InteractiveSleepingPet from './InteractiveSleepingPet';
import { calculateAge, generateID } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 
import LostPetAlert from './LostPetAlert';

const Dashboard = ({ setPet, openAddModal, onOpenVetLocator, onOpenFoodScan, onOpenExpense }) => {
    const { t } = useLanguage();
    // activeAlerts eklendi
    const { pets, streak, setStreak, moodHistory, setMoodHistory, setReminders, activeAlerts } = useApp();
    const { canUseFeature, isPremium } = usePremium(); 
    
    // Paywall State
    const [showPaywall, setShowPaywall] = useState(false);
    const [paywallFeature, setPaywallFeature] = useState(null);

    // Görünür alertler için state
    const [visibleAlerts, setVisibleAlerts] = useState([]);

    useEffect(() => {
        setVisibleAlerts(activeAlerts || []);
    }, [activeAlerts]);

    const dismissAlert = (id) => {
        setVisibleAlerts(prev => prev.filter(a => a.id !== id));
    };

    const activePet = pets.length > 0 ? pets[0] : null;
    const todayStr = new Date().toISOString().split('T')[0];

    const [moodQueueIndex, setMoodQueueIndex] = useState(0); 
    const [tempDailyMoods, setTempDailyMoods] = useState({}); 
    const [hasLoggedToday, setHasLoggedToday] = useState(false); 

    useEffect(() => { 
        if (moodHistory && moodHistory[todayStr]) {
            setHasLoggedToday(true);
        }
    }, [moodHistory, todayStr]);

    const handleVetClick = () => {
        const check = canUseFeature('vet_locator');
        if (check.allowed) {
            onOpenVetLocator();
        } else {
            setPaywallFeature('vet_locator');
            setShowPaywall(true);
        }
    };

    const handleFoodClick = () => {
        const check = canUseFeature('food_scan');
        if (check.allowed) {
            onOpenFoodScan();
        } else {
            setPaywallFeature('food_scan');
            setShowPaywall(true);
        }
    };

    const handleMoodSelect = (mood) => {
        if (pets.length === 0) return;

        const currentPet = pets[moodQueueIndex];
        const newTemp = { ...tempDailyMoods, [currentPet.id]: mood };
        setTempDailyMoods(newTemp);

        if (moodQueueIndex < pets.length - 1) {
            setMoodQueueIndex(prev => prev + 1);
        } else {
            setMoodHistory(prev => ({ ...prev, [todayStr]: newTemp }));
            
            if (!hasLoggedToday) setStreak(s => s + 1);

            const moodLabels = { happy: t('mood_happy'), energetic: t('mood_energetic'), sleepy: t('mood_sleepy'), sick: t('mood_sick') };
            
            const summaryText = pets.map(p => {
                const m = newTemp[p.id];
                return `${p.name}: ${moodLabels[m]}`;
            }).join(', ');

            const newEvent = {
                id: generateID(),
                title: t('mood_log_title') || "Ruh Hali Günlüğü",
                date: todayStr,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                type: 'other',
                petId: pets[0].id,
                note: summaryText,
                completed: true
            };

            setReminders(prev => [...prev, newEvent]);
            setHasLoggedToday(true);
            setMoodQueueIndex(0);
        }
    };
    
    const currentQueuePet = pets[moodQueueIndex] || activePet;

    const MoodButton = ({ mood, icon: Icon, color, bg }) => (
        <button onClick={() => handleMoodSelect(mood)} className="flex flex-col items-center gap-2 group flex-1">
            <div className={`w-full aspect-square max-w-[4rem] rounded-2xl ${bg} flex items-center justify-center shadow-lg shadow-black/5 transition-transform active:scale-90 group-hover:-translate-y-1`}>
                <Icon size={28} className={color} />
            </div>
            <span className="text-[10px] font-bold text-white/90 uppercase tracking-wide">{t(`mood_${mood}`)}</span>
        </button>
    );

    const VetLocatorBanner = () => (
        <div 
            onClick={handleVetClick}
            className={`group relative overflow-hidden rounded-[2rem] p-1 cursor-pointer shadow-xl transition-all flex-1 min-w-[45%] active:scale-[0.98]
                ${!isPremium 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-500/50' 
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 shadow-teal-500/20' 
                }
            `}
        >
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
            
            <div className="relative bg-white/10 backdrop-blur-md rounded-[1.8rem] p-4 h-full flex flex-col justify-between border border-white/10">
                
                <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner border border-white/10">
                        <MapPin size={24} />
                    </div>
                    {!isPremium && (
                        <div className="bg-yellow-500 text-black p-1.5 rounded-full shadow-lg shadow-yellow-500/20 animate-pulse">
                            <Lock size={14} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                <div className="text-white">
                    <h3 className={`font-bold text-base leading-tight ${!isPremium ? 'text-gray-300' : ''}`}>
                        {t('dash_find_places')}
                    </h3>
                    <p className={`text-[10px] font-medium mt-1 line-clamp-1 ${!isPremium ? 'text-gray-400' : 'text-teal-50 opacity-90'}`}>
                        {t('dash_find_places_desc')}
                    </p>
                </div>

                {isPremium && (
                    <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white group-hover:bg-white group-hover:text-teal-600 transition-colors shadow-lg">
                        <ChevronRight size={16} />
                    </div>
                )}
            </div>
        </div>
    );

    const FoodScanBanner = () => (
        <div 
            onClick={handleFoodClick}
            className={`group relative overflow-hidden rounded-[2rem] p-1 cursor-pointer shadow-xl transition-all flex-1 min-w-[45%] active:scale-[0.98]
                ${!isPremium 
                    ? 'bg-gradient-to-r from-gray-800 to-gray-900 border-2 border-yellow-500/50' 
                    : 'bg-gradient-to-r from-orange-400 to-rose-500 shadow-orange-500/20' 
                }
            `}
        >
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]" />
            
            <div className="relative bg-white/10 backdrop-blur-md rounded-[1.8rem] p-4 h-full flex flex-col justify-between border border-white/20">
                
                <div className="flex justify-between items-start mb-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md shadow-inner border border-white/10">
                        <ScanLine size={24} />
                    </div>
                    {!isPremium && (
                        <div className="bg-yellow-500 text-black p-1.5 rounded-full shadow-lg shadow-yellow-500/20 animate-pulse">
                            <Lock size={14} strokeWidth={2.5} />
                        </div>
                    )}
                </div>

                <div className="text-white">
                    <h3 className={`font-bold text-base leading-tight ${!isPremium ? 'text-gray-300' : ''}`}>
                        {t('food_scan_title')}
                    </h3>
                    <p className={`text-[10px] font-medium mt-1 line-clamp-1 ${!isPremium ? 'text-gray-400' : 'text-orange-50 opacity-90'}`}>
                        {t('scan_instruction')}
                    </p>
                </div>

                {isPremium && (
                    <div className="absolute top-4 right-4 bg-white/20 p-2 rounded-full text-white group-hover:bg-white group-hover:text-orange-500 transition-colors shadow-lg">
                        <ChevronRight size={16} />
                    </div>
                )}
            </div>
        </div>
    );

    // --- BOŞ EKRAN ---
    if (!activePet) return (
        <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-8 relative overflow-hidden animate-in fade-in">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"/>
                <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{animationDelay:'1s'}}/>
            </div>
            <div className="w-56 h-56 drop-shadow-2xl z-10">
                <InteractiveSleepingPet type="cat" color="#9ca3af" className="w-full h-full" />
            </div>
            <div className="z-10 relative space-y-2">
                <h2 className="text-3xl font-bold dark:text-white">{t('no_pets_title')}</h2>
                <p className="text-gray-500 dark:text-gray-400 max-w-xs mx-auto leading-relaxed">{t('no_pets_desc')}</p>
            </div>
            
            <div className="flex flex-col gap-4 w-full max-w-xs z-10">
                <button onClick={openAddModal} className="flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 active:scale-95 transition-all hover:brightness-110">
                    <Plus size={22}/> {t('add_first_pet')}
                </button>
                <div className="grid grid-cols-2 gap-3 w-full">
                    <button onClick={handleVetClick} className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold border active:scale-95 transition-all text-xs relative overflow-hidden ${!isPremium ? 'bg-gray-100 dark:bg-neutral-800 border-yellow-500/50 text-gray-500' : 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white'}`}>
                        {!isPremium && <div className="absolute top-1 right-1 text-yellow-500"><Lock size={12}/></div>}
                        <MapPin size={20}/> {t('nav_vet')}
                    </button>
                    <button onClick={handleFoodClick} className={`flex flex-col items-center justify-center gap-2 px-4 py-3 rounded-2xl font-bold border active:scale-95 transition-all text-xs relative overflow-hidden ${!isPremium ? 'bg-gray-100 dark:bg-neutral-800 border-yellow-500/50 text-gray-500' : 'bg-white dark:bg-white/10 border-gray-200 dark:border-white/10 text-gray-700 dark:text-white'}`}>
                        {!isPremium && <div className="absolute top-1 right-1 text-yellow-500"><Lock size={12}/></div>}
                        <ScanLine size={20}/> {t('food_scan_title')}
                    </button>
                </div>
            </div>

            {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
        </div>
    );

    return (
        <div className="p-6 space-y-6 animate-in slide-in-from-right-4 relative pb-32">
            
            {/* --- PATTTY ALERT AĞI (En Üstte) --- */}
            {visibleAlerts.length > 0 && (
                <div className="mb-2 animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <div className="w-2 h-2 rounded-full bg-red-500 animate-ping"/>
                        <h3 className="text-xs font-black text-red-500 uppercase tracking-widest">
                            {t('alert_section_title')} ({visibleAlerts.length})
                        </h3>
                    </div>
                    
                    {visibleAlerts.map(alert => (
                        <LostPetAlert 
                            key={alert.id} 
                            alert={alert} 
                            onDismiss={() => dismissAlert(alert.id)}
                        />
                    ))}
                </div>
            )}

            {/* 1. MOOD TRACKER CARD */}
            <div className="relative rounded-[2.5rem] p-1 text-white overflow-hidden shadow-2xl shadow-indigo-500/20 transition-all duration-500 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                <div className="relative bg-white/5 backdrop-blur-sm rounded-[2.3rem] p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-1 transition-all flex items-center gap-2">
                                {hasLoggedToday ? activePet.name : currentQueuePet.name}
                                {hasLoggedToday && <span className="bg-white/20 text-[10px] px-2 py-0.5 rounded-full">{t('status_updated')}</span>}
                            </h3>
                            <p className="text-indigo-100 text-sm font-medium opacity-90">
                                {hasLoggedToday ? t('logged_xp') : `${t('how_feeling').replace('bugün', '')}?`}
                            </p>
                        </div>
                        <div className="bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                            <Flame size={14} className="text-orange-400 fill-orange-400 animate-pulse"/> 
                            <span className="font-bold text-sm">{streak} {t('streak_days')}</span>
                        </div>
                    </div>

                    {hasLoggedToday ? (
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 animate-in zoom-in duration-300">
                            <div className="bg-white p-3 rounded-full text-green-600 shadow-lg"><Check size={24} strokeWidth={3}/></div>
                            <div>
                                <p className="font-bold text-lg leading-tight">{t('great_job')}</p>
                                <p className="text-xs opacity-80 mt-0.5">{t('mood_log_completed')}</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {pets.length > 1 && (
                                <div className="flex justify-center gap-1.5 mb-5">
                                    {pets.map((_, idx) => (
                                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx <= moodQueueIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/20'}`} />
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex justify-between gap-3">
                                <MoodButton mood="happy" icon={Smile} color="text-emerald-500" bg="bg-white" />
                                <MoodButton mood="energetic" icon={Zap} color="text-amber-500" bg="bg-white" />
                                <MoodButton mood="sleepy" icon={Moon} color="text-indigo-500" bg="bg-white" />
                                <MoodButton mood="sick" icon={Thermometer} color="text-rose-500" bg="bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 2. ARAÇLAR GRID (GÜNCELLENMİŞ BANNERLAR) */}
            <div className="space-y-4">
                <div className="flex gap-4 w-full">
                    <VetLocatorBanner />
                    <FoodScanBanner />
                </div>
                
                {/* MASRAF TAKİBİ BANNERI */}
                <div 
                    onClick={onOpenExpense}
                    className="w-full bg-white dark:bg-[#1A1D21] p-4 rounded-[1.8rem] flex items-center justify-between shadow-sm border border-gray-100 dark:border-white/5 active:scale-[0.99] transition-transform cursor-pointer"
                >
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900 dark:text-white">{t('exp_title')}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{t('exp_subtitle')}</p>
                        </div>
                    </div>
                    <div className="bg-gray-50 dark:bg-neutral-800 p-2 rounded-full text-gray-400"><ChevronRight size={20}/></div>
                </div>
            </div>

            {/* 3. MY PETS LIST */}
            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Heart className="text-red-500 fill-red-500" size={20}/> {t('my_pets_title')}
                    </h2>
                    <button onClick={openAddModal} className="text-indigo-600 dark:text-indigo-400 font-bold text-xs bg-indigo-50 dark:bg-indigo-900/20 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition-colors">
                        {t('add_new')}
                    </button>
                </div>
                
                <div className="grid gap-4">
                    {pets.map((pet) => (
                        <div 
                            key={pet.id} 
                            onClick={() => setPet(pet.id)} 
                            className="group bg-white dark:bg-[#1A1D21] rounded-[1.5rem] p-3 pr-5 flex items-center gap-4 cursor-pointer active:scale-[0.98] transition-all shadow-sm border border-gray-100 dark:border-white/5 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 hover:shadow-lg dark:hover:bg-[#202328]"
                        >
                            <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-black/40 p-1 relative overflow-hidden shrink-0 border border-gray-100 dark:border-white/5">
                                    <InteractiveSleepingPet type={pet.type} color={pet.color} className="w-full h-full transform group-hover:scale-110 transition-transform duration-500" /> 
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-extrabold text-lg text-gray-900 dark:text-white truncate">{pet.name}</h3>
                                <p className="text-xs font-medium text-gray-500 dark:text-gray-400 truncate mb-1.5">{pet.breed}</p>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300">
                                        {calculateAge(pet.birthDate, t) || pet.age}
                                    </span>
                                </div>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                <ChevronRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* PAYWALL MODAL */}
            {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
        </div>
    );
};

export default Dashboard;