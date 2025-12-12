import React, { useState } from 'react';
import { ChevronLeft, Syringe, Activity, StickyNote, Gamepad2, QrCode, FileText } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext'; 
import { usePremium } from '../context/PremiumContext'; 
import InteractiveSleepingPet from './InteractiveSleepingPet';
import { calculateAge } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 

// Alt Bileşenler
import VaccineManager from './VaccineManager';
import WeightChart from './WeightChart';
import NotesManager from './NotesManager';
import GamesHub from './GamesHub';
import DigitalIDCard from './DigitalIDCard'; 

const PetDetailView = ({ pet, setPets, onBack }) => {
    const { t } = useLanguage();
    const { weightUnit } = useApp(); 
    const { canUseFeature } = usePremium(); 
    
    // Paywall State
    const [showPaywall, setShowPaywall] = useState(false);

    const [subTab, setSubTab] = useState('summary'); 
    const [showID, setShowID] = useState(false);

    const rawWeight = pet.weights?.[pet.weights.length-1]?.weight || pet.weight || 0;
    const displayWeight = weightUnit === 'kg' ? rawWeight : rawWeight * 2.20462;
    const unitLabel = weightUnit === 'kg' ? t('lbl_kg') : t('lbl_lbs');

    // --- RAPOR OLUŞTURMA (Mock) ---
    const handleGenerateReport = () => {
        const check = canUseFeature('export_report');
        if (check.allowed) {
            alert(t('report_generated_mock')); // Demo amaçlı alert
        } else {
            setShowPaywall(true);
        }
    };

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
        <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right duration-300">
            <div className="p-4 pt-safe flex items-center justify-between bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 shrink-0">
                <button onClick={subTab === 'summary' ? onBack : () => setSubTab('summary')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors">
                    <ChevronLeft size={24} className="dark:text-white"/>
                </button>
                <h2 className="font-bold text-lg dark:text-white">{subTab !== 'summary' ? t(`tab_${subTab}`) : pet.name}</h2>
                <div className="w-10"/> 
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 pb-10">
                {subTab === 'summary' && (
                    <div className="flex flex-col items-center py-6 relative">
                         <div className="w-48 h-48 drop-shadow-2xl mb-6 relative z-10">
                            <InteractiveSleepingPet type={pet.type} color={pet.color} className="w-full h-full"/>
                            <button onClick={() => setShowID(true)} className="absolute bottom-2 right-2 p-3 bg-white dark:bg-neutral-800 rounded-full shadow-lg text-indigo-600 hover:scale-110 hover:bg-indigo-50 transition-all border border-gray-100 dark:border-neutral-700 z-20 group">
                                <QrCode size={22} className="group-hover:rotate-90 transition-transform duration-300"/>
                            </button>
                         </div>
                         
                         <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-2">{pet.name}</h1>
                         <p className="text-gray-500 font-medium mb-4">{pet.breed}</p>
                         
                         <div className="flex gap-3 mb-6">
                            <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm text-sm font-bold border border-gray-100 dark:border-neutral-700 dark:text-white">{calculateAge(pet.birthDate, t) || pet.age}</span>
                            <span className="px-4 py-2 bg-white dark:bg-neutral-800 rounded-2xl shadow-sm text-sm font-bold border border-gray-100 dark:border-neutral-700 dark:text-white">{displayWeight.toFixed(1)} {unitLabel}</span>
                         </div>

                         {/* RAPOR BUTONU (PREMIUM) */}
                         <button onClick={handleGenerateReport} className="w-full max-w-xs py-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 font-bold text-sm flex items-center justify-center gap-2 mb-6 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors">
                             <FileText size={18}/> {t('btn_health_report')}
                         </button>
                    </div>
                )}
                {renderSubContent()}
            </div>

            {showID && <DigitalIDCard pet={pet} onClose={() => setShowID(false)} ownerPhone="+90 555 000 00 00" />}
            {showPaywall && <PaywallModal feature="export_report" onClose={() => setShowPaywall(false)} />}
        </div>
    );
}

export default PetDetailView;