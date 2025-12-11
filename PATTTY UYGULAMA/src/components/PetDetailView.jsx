import React, { useState } from 'react';
import { ChevronLeft, Syringe, Activity, StickyNote, Gamepad2, QrCode } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import InteractiveSleepingPet from './InteractiveSleepingPet';
import { calculateAge } from '../utils/helpers';

// Alt Bileşenler
import VaccineManager from './VaccineManager';
import WeightChart from './WeightChart';
import NotesManager from './NotesManager';
import GamesHub from './GamesHub';
import DigitalIDCard from './DigitalIDCard'; // <--- YENİ EKLENDİ

const PetDetailView = ({ pet, setPets, onBack }) => {
    const { t } = useLanguage();
    
    // Sekme Yönetimi
    const [subTab, setSubTab] = useState('summary'); 
    
    // Dijital Kimlik Modalı State'i
    const [showID, setShowID] = useState(false);

    const TabButton = ({ id, icon: Icon, label, color }) => (
        <button onClick={()=>setSubTab(id)} className={`p-4 rounded-3xl font-bold text-left flex flex-col justify-between h-32 transition-all shadow-sm border ${color} active:scale-95 hover:shadow-md`}>
            <div className="p-2.5 rounded-full bg-white/80 w-fit"><Icon size={24}/></div>
            <span className="text-sm">{label}</span>
        </button>
    );

    const renderSubContent = () => {
        switch(subTab) {
            case 'vaccine': return <VaccineManager pet={pet} setPets={setPets} />;
            case 'weight': return <WeightChart pet={pet} setPets={setPets} />;
            case 'notes': return <NotesManager pet={pet} setPets={setPets} />;
            case 'game': return <GamesHub />;
            default: return (
                <div className="grid grid-cols-2 gap-4">
                    <TabButton id="vaccine" icon={Syringe} label={t('tab_vaccine')} color="bg-pink-50 text-pink-600 border-pink-100 dark:bg-pink-900/10 dark:border-pink-900/30" />
                    <TabButton id="weight" icon={Activity} label={t('tab_weight')} color="bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-900/10 dark:border-blue-900/30" />
                    <TabButton id="notes" icon={StickyNote} label={t('tab_notes')} color="bg-yellow-50 text-yellow-600 border-yellow-100 dark:bg-yellow-900/10 dark:border-yellow-900/30" />
                    <TabButton id="game" icon={Gamepad2} label={t('game_title')} color="bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30" />
                </div>
            );
        }
    };

    return (
        // Tam Ekran (Fixed) Yapısı
        <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right duration-300">
            
            {/* Üst Bar (Geri Dön Butonu) */}
            <div className="p-4 pt-safe flex items-center justify-between bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 shrink-0">
                <button onClick={subTab === 'summary' ? onBack : () => setSubTab('summary')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                    <ChevronLeft size={24} className="dark:text-white"/>
                </button>
                <h2 className="font-bold text-lg dark:text-white">{subTab !== 'summary' ? t(`tab_${subTab}`) : pet.name}</h2>
                <div className="w-10"/> 
            </div>
            
            {/* İçerik Alanı */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-10">
                
                {/* Özet (Profil) Ekranı */}
                {subTab === 'summary' && (
                    <div className="flex flex-col items-center py-6 relative">
                         {/* Resim ve QR Butonu Alanı */}
                         <div className="w-48 h-48 drop-shadow-2xl mb-6 relative z-10">
                            <InteractiveSleepingPet type={pet.type} color={pet.color} className="w-full h-full"/>
                            
                            {/* --- QR KOD BUTONU --- */}
                            <button 
                                onClick={() => setShowID(true)}
                                className="absolute bottom-2 right-2 p-3 bg-white dark:bg-neutral-800 rounded-full shadow-lg text-indigo-600 hover:scale-110 hover:bg-indigo-50 transition-all border border-gray-100 dark:border-neutral-700 z-20 group"
                            >
                                <QrCode size={22} className="group-hover:rotate-90 transition-transform duration-300"/>
                            </button>
                         </div>
                         
                         <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{pet.name}</h1>
                         <p className="text-gray-500 font-medium mb-4">{pet.breed}</p>
                         
                         <div className="flex gap-3">
                            <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm text-sm font-bold border border-gray-100 dark:border-neutral-700 dark:text-white">
                                {calculateAge(pet.birthDate, t) || pet.age}
                            </span>
                            <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm text-sm font-bold border border-gray-100 dark:border-neutral-700 dark:text-white">
                                {pet.weights?.[pet.weights.length-1]?.weight || pet.weight} kg
                            </span>
                         </div>
                    </div>
                )}
                
                {/* Alt Modüller (Aşı, Kilo vb.) */}
                {renderSubContent()}
            </div>

            {/* --- DİJİTAL KİMLİK KARTI MODALI --- */}
            {showID && (
                <DigitalIDCard 
                    pet={pet} 
                    onClose={() => setShowID(false)} 
                    // Gerçek uygulamada bu numara kullanıcının profilinden gelir
                    ownerPhone="+90 555 000 00 00" 
                />
            )}
        </div>
    );
}

export default PetDetailView;