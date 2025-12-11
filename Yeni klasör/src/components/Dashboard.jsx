import React, { useState, useEffect } from 'react';
import { Plus, Flame, Check, Smile, Zap, Moon, Thermometer, Heart, ChevronRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import InteractiveSleepingPet from './InteractiveSleepingPet';
import { calculateAge, generateID } from '../utils/helpers';

const Dashboard = ({ setPet, openAddModal }) => {
    const { t } = useLanguage();
    const { pets, streak, setStreak, moodHistory, setMoodHistory, setReminders } = useApp();
    
    const activePet = pets.length > 0 ? pets[0] : null;
    const todayStr = new Date().toISOString().split('T')[0];

    const [moodQueueIndex, setMoodQueueIndex] = useState(0); 
    const [tempDailyMoods, setTempDailyMoods] = useState({}); 
    const [hasLoggedToday, setHasLoggedToday] = useState(false); 

    // --- HATA DÜZELTMESİ BURADA YAPILDI ---
    useEffect(() => { 
        // moodHistory var mı ve bugün için kayıt var mı diye güvenli kontrol yapıyoruz
        if (moodHistory && moodHistory[todayStr]) {
            setHasLoggedToday(true);
        }
    }, [moodHistory, todayStr]);

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
                title: "Ruh Hali Günlüğü",
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
        <button onClick={() => handleMoodSelect(mood)} className="flex flex-col items-center gap-2 group">
            <div className={`w-14 h-14 rounded-2xl ${bg} flex items-center justify-center shadow-lg transition-transform active:scale-90 group-hover:-translate-y-1`}>
                <Icon size={28} className={color} />
            </div>
            <span className="text-xs font-bold text-white/80">{t(`mood_${mood}`)}</span>
        </button>
    );

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
            <button onClick={openAddModal} className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-full font-bold shadow-xl shadow-indigo-500/30 active:scale-95 transition-all z-10 relative hover:brightness-110">
                <Plus size={22}/> {t('add_first_pet')}
            </button>
        </div>
    );

    return (
        <div className="p-6 space-y-8 animate-in slide-in-from-right-4 relative pb-32">
            <div className="relative rounded-[2rem] p-6 text-white overflow-hidden shadow-2xl shadow-indigo-500/20 transition-all duration-500">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 z-0"/>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"/>
                
                <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-2xl font-bold mb-1 transition-all key={currentQueuePet.id}">
                                {hasLoggedToday ? activePet.name : currentQueuePet.name}
                            </h3>
                            <p className="text-indigo-100 text-sm font-medium opacity-90">
                                {hasLoggedToday ? "Bugün harika görünüyor!" : `${t('how_feeling').replace('bugün', '')}?`}
                            </p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/10">
                            <Flame size={14} className="text-yellow-300 fill-yellow-300"/> 
                            <span className="font-bold text-sm">{streak} Gün</span>
                        </div>
                    </div>

                    {hasLoggedToday ? (
                        <div className="bg-white/20 backdrop-blur-md rounded-2xl p-4 flex items-center gap-4 border border-white/10 animate-in zoom-in">
                            <div className="bg-white p-2.5 rounded-full text-green-500"><Check size={24}/></div>
                            <div>
                                <p className="font-bold text-lg">{t('logged_xp')}</p>
                                <p className="text-xs opacity-80">Takvime işlendi.</p>
                            </div>
                        </div>
                    ) : (
                        <div>
                            {pets.length > 1 && (
                                <div className="flex justify-center gap-1 mb-4">
                                    {pets.map((_, idx) => (
                                        <div key={idx} className={`h-1.5 rounded-full transition-all duration-300 ${idx <= moodQueueIndex ? 'w-6 bg-white' : 'w-2 bg-white/30'}`} />
                                    ))}
                                </div>
                            )}
                            
                            <div className="flex justify-between px-2">
                                <MoodButton mood="happy" icon={Smile} color="text-green-500" bg="bg-white" />
                                <MoodButton mood="energetic" icon={Zap} color="text-yellow-500" bg="bg-white" />
                                <MoodButton mood="sleepy" icon={Moon} color="text-indigo-500" bg="bg-white" />
                                <MoodButton mood="sick" icon={Thermometer} color="text-red-500" bg="bg-white" />
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex justify-between items-end px-2">
                    <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                        <Heart className="text-red-500 fill-red-500" size={20}/> {t('my_pets_title')}
                    </h2>
                    <button onClick={openAddModal} className="text-indigo-600 dark:text-indigo-400 font-bold text-sm hover:underline">
                        {t('add_new')}
                    </button>
                </div>
                
                {pets.slice(0, 3).map((pet) => (
                    <div key={pet.id} onClick={() => setPet(pet.id)} className="group bg-white dark:bg-neutral-900 rounded-3xl p-4 flex items-center gap-5 cursor-pointer active:scale-[0.98] transition-all shadow-lg shadow-gray-200/50 dark:shadow-none border border-gray-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-neutral-700">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-neutral-800 dark:to-neutral-900 p-1 shadow-inner relative overflow-hidden">
                             <div className="absolute inset-0 bg-indigo-500/5 rounded-2xl"/>
                             <InteractiveSleepingPet type={pet.type} color={pet.color} className="w-full h-full transform group-hover:scale-110 transition-transform duration-500" /> 
                        </div>
                        <div className="flex-1 min-w-0 py-1">
                            <h3 className="font-extrabold text-lg text-gray-900 dark:text-white truncate">{pet.name}</h3>
                            <p className="text-sm font-medium text-gray-500 truncate mb-2">{pet.breed}</p>
                            <div className="flex gap-2">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-900/10">
                                    {calculateAge(pet.birthDate, t) || pet.age}
                                </span>
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-neutral-800 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <ChevronRight size={20} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Dashboard;