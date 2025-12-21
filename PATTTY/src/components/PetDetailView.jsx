// src/components/PetDetailView.jsx
import React, { useState, useEffect } from 'react';
import { 
  ChevronLeft, Syringe, Activity, StickyNote, Gamepad2, QrCode, FileText,
  Cat, Dog, Bird, Rabbit, Fish, Turtle, PawPrint, Mars, Venus, ArrowLeft, 
  Download, Share2, Smile, Frown, Meh, Moon, Sun, Zap, Loader2, Edit3, Trash2, X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext'; 
import { usePremium } from '../context/PremiumContext'; 
import { calculateAge, getLocalizedData, generateStyledPetImage } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 

// Alt Bileşenler
import VaccineManager from './VaccineManager';
import WeightChart from './WeightChart';
import NotesManager from './NotesManager';
import GamesHub from './GamesHub';
import DigitalIDCard from './DigitalIDCard'; 

const PetDetailView = ({ pet, onBack, onGoDashboard, onEdit }) => {
    const { t, language } = useLanguage();
    const { updatePet, deletePet, weightUnit, moodHistory, pets } = useApp(); // 🟢 deletePet eklendi
    const { canUseFeature } = usePremium(); 
    
    // State
    const [subTab, setSubTab] = useState('summary'); 
    const [showID, setShowID] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    
    // 🟢 YENİ MODAL STATE'LERİ
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const todayStr = new Date().toISOString().split('T')[0];
    const [displayImage, setDisplayImage] = useState(pet.image);

    useEffect(() => {
        if (pet) {
            const todayMood = moodHistory?.[todayStr]?.[pet.id];
            if (todayMood) {
                const moodImg = pet.moodImages?.[todayMood];
                setDisplayImage(moodImg || pet.image);
            } else {
                setDisplayImage(pet.image);
            }
        }
    }, [pet, moodHistory, todayStr]);

    const handleBack = () => {
        if (pets.length === 1 && onGoDashboard) {
            onGoDashboard();
        } else {
            onBack();
        }
    };

    // 🟢 SİLME İŞLEMİ
    const handleDelete = async () => {
        await deletePet(pet.id);
        setShowDeleteConfirm(false);
        // Silme sonrası dashboard'a veya listeye dön
        if (onGoDashboard) onGoDashboard();
        else onBack();
    };

    const rawWeight = pet.weights?.[pet.weights.length-1]?.weight || pet.weight || 0;
    const displayWeight = weightUnit === 'kg' ? rawWeight : rawWeight * 2.20462;
    const unitLabel = weightUnit === 'kg' ? t('lbl_kg') : t('lbl_lbs');
    const breedName = getLocalizedData(language, t).breedName(pet.breed, pet.type, pet.customBreed);
    const bgImage = 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=2070&auto=format&fit=crop';
    
    const GenderIcon = pet.gender === 'male' ? Mars : Venus;
    const genderColor = pet.gender === 'male' ? 'text-blue-200' : 'text-pink-200';
    const genderBg = pet.gender === 'male' ? 'bg-blue-500/20' : 'bg-pink-500/20';

    const handleGenerateReport = () => {
        const check = canUseFeature('export_report');
        if (check.allowed) { alert(t('report_generated_mock')); } else { setShowPaywall(true); }
    };

    // --- 1. MODÜL GÖRÜNÜMÜ ---
    if (subTab !== 'summary') {
        const commonProps = { pet, updatePet: (newData) => updatePet(pet.id, newData) };
        let ContentComponent = null;
        let title = "";

        switch(subTab) {
            case 'vaccine': ContentComponent = <VaccineManager {...commonProps} />; title = t('tab_vaccine'); break;
            case 'weight': ContentComponent = <WeightChart {...commonProps} />; title = t('tab_weight'); break;
            case 'notes': ContentComponent = <NotesManager {...commonProps} />; title = t('tab_notes'); break;
            case 'game': ContentComponent = <GamesHub />; title = t('game_title'); break;
            default: return null;
        }

        return (
            <div className="fixed inset-0 z-[70] bg-gray-50 dark:bg-black flex flex-col animate-in slide-in-from-right duration-300">
                <div className="pt-safe-top px-4 pb-3 flex items-center justify-between bg-white dark:bg-neutral-900 border-b border-gray-100 dark:border-neutral-800 shadow-sm z-50">
                    <button onClick={() => setSubTab('summary')} className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-neutral-800 transition-colors text-gray-700 dark:text-white">
                        <ArrowLeft size={24} />
                    </button>
                    <h2 className="font-bold text-lg text-gray-900 dark:text-white">{title}</h2>
                    <div className="w-10" />
                </div>
                <div className="flex-1 overflow-y-auto">{ContentComponent}</div>
            </div>
        );
    }

    // --- 2. PROFİL GÖRÜNÜMÜ (ANA EKRAN) ---
    return (
        <div className="fixed inset-0 z-[60] flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right duration-300 overflow-hidden">
            
            {/* HEADER */}
            <div className="relative h-[45vh] w-full shrink-0 transition-all duration-500">
                <div className="absolute inset-0 bg-black">
                    <img src={displayImage || bgImage} className="w-full h-full object-cover transition-opacity duration-500" alt="Pet Mood" />
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-black via-transparent to-transparent" />

                <div className="absolute top-0 left-0 right-0 pt-safe-top px-4 pb-4 flex justify-between items-start z-20">
                    <button onClick={handleBack} className="p-2.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg active:scale-95">
                        <ChevronLeft size={24} />
                    </button>
                    
                    <div className="flex gap-3">
                        {/* 🟢 DÜZENLE BUTONU (Action Menu'yu açar) */}
                        <button 
                            onClick={() => setShowActionMenu(true)} 
                            className="p-2.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg active:scale-95"
                        >
                            <Edit3 size={24} />
                        </button>

                        <button onClick={() => setShowID(true)} className="p-2.5 bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white hover:bg-white/30 transition-colors shadow-lg active:scale-95">
                            <QrCode size={24} />
                        </button>
                    </div>
                </div>

                {/* Profil Bilgileri */}
                <div className="absolute bottom-0 left-0 right-0 p-4 z-20 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)] flex flex-col items-center">
                    <h1 className="text-4xl font-black tracking-tighter mb-1">{pet.name}</h1>
                    <p className="text-lg font-medium text-white/90 mb-3">{breedName}</p>
                    
                    <div className="flex items-center justify-center gap-3 w-full">
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[70px]">
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-0.5">{t('age_y') || "YAŞ"}</span>
                            <span className="text-lg font-bold">{calculateAge(pet.birthDate, t).split(' ')[0]}</span>
                        </div>
                        <div className="flex flex-col items-center bg-white/10 backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[70px]">
                            <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-0.5">{unitLabel}</span>
                            <span className="text-lg font-bold">{displayWeight.toFixed(1)}</span>
                        </div>
                        {pet.gender && (
                            <div className={`flex flex-col items-center backdrop-blur-md border border-white/10 rounded-xl p-2 min-w-[70px] ${genderBg}`}>
                                <span className="text-[10px] text-white/70 font-bold uppercase tracking-wider mb-0.5">{t('form_gender')}</span>
                                <GenderIcon size={24} className={genderColor} strokeWidth={2.5} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
            
            {/* MENÜ ALANI */}
            <div className="flex-1 bg-gray-50 dark:bg-black relative z-30 rounded-t-[2rem] -mt-6 pt-6 px-6 pb-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] flex flex-col overflow-hidden">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 ml-1 shrink-0">
                    {t('nav_summary')}
                </h3>
                <div className="flex-1 grid grid-cols-2 gap-3 mb-4">
                    <MenuButton onClick={() => setSubTab('vaccine')} icon={Syringe} label={t('tab_vaccine')} color="bg-pink-50 text-pink-600 dark:bg-pink-900/20 dark:text-pink-300" />
                    <MenuButton onClick={() => setSubTab('weight')} icon={Activity} label={t('tab_weight')} color="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" />
                    <MenuButton onClick={() => setSubTab('notes')} icon={StickyNote} label={t('tab_notes')} color="bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-300" />
                    <MenuButton onClick={() => setSubTab('game')} icon={Gamepad2} label={t('game_title')} color="bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-300" />
                </div>
                <button onClick={handleGenerateReport} className="w-full py-4 rounded-2xl bg-white dark:bg-neutral-900 border border-gray-200 dark:border-neutral-800 text-gray-900 dark:text-white font-bold flex items-center justify-between px-6 active:scale-98 transition-transform shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600 dark:text-indigo-400"><FileText size={20} /></div>
                        <span>{t('btn_health_report')}</span>
                    </div>
                    <Download size={20} className="text-gray-400" />
                </button>
            </div>

            {/* 🟢 SEÇİM MENÜSÜ (ACTION SHEET) */}
            {showActionMenu && (
                <div className="fixed inset-0 z-[80] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in p-4" onClick={() => setShowActionMenu(false)}>
                    <div className="w-full max-w-sm bg-white dark:bg-[#1A1D21] rounded-3xl p-2 shadow-2xl animate-in slide-in-from-bottom-10" onClick={e => e.stopPropagation()}>
                        
                        {/* Başlık */}
                        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <span className="font-bold text-gray-900 dark:text-white">{t('edit_pet_title') || "Dostunu Yönet"}</span>
                            <button onClick={() => setShowActionMenu(false)} className="bg-gray-100 dark:bg-white/10 p-1.5 rounded-full">
                                <X size={16} />
                            </button>
                        </div>

                        <div className="p-2 flex flex-col gap-2">
                            {/* DÜZENLE */}
                            <button 
                                onClick={() => { setShowActionMenu(false); onEdit(); }}
                                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 flex items-center gap-4 transition-colors group"
                            >
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Edit3 size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-gray-900 dark:text-white">{t('btn_edit') || "Bilgileri Düzenle"}</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">İsim, kilo ve detayları güncelle.</p>
                                </div>
                            </button>

                            {/* SİL */}
                            <button 
                                onClick={() => { setShowActionMenu(false); setShowDeleteConfirm(true); }}
                                className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 flex items-center gap-4 transition-colors group"
                            >
                                <div className="p-3 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-xl group-hover:scale-110 transition-transform">
                                    <Trash2 size={24} />
                                </div>
                                <div className="text-left">
                                    <h4 className="font-bold text-red-600 dark:text-red-400">{t('btn_delete') || "Kaydı Sil"}</h4>
                                    <p className="text-xs text-red-400/80 dark:text-red-400/60">Bu işlem geri alınamaz.</p>
                                </div>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 🟢 SİLME ONAYI (CONFIRM) */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[90] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                    <div className="bg-white dark:bg-[#1A1D21] border border-gray-200 dark:border-white/10 w-full max-w-xs rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 text-center">
                        <div className="w-16 h-16 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">{t('del_title') || "Emin misin?"}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                            {t('del_desc') || "Bu işlem geri alınamaz. Dostuna ait tüm veriler silinecek."}
                        </p>
                        
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={handleDelete}
                                className="w-full py-3.5 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-all"
                            >
                                {t('del_yes') || "Evet, Sil"}
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-3.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-white font-bold rounded-xl hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all"
                            >
                                {t('cancel') || "Vazgeç"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showID && <DigitalIDCard pet={pet} onClose={() => setShowID(false)} ownerPhone="+90 555 000 00 00" />}
            {showPaywall && <PaywallModal feature="export_report" onClose={() => setShowPaywall(false)} />}
        </div>
    );
}

const MenuButton = ({ onClick, icon: Icon, label, color }) => (
    <button 
        onClick={onClick}
        className={`
            relative p-4 rounded-[1.5rem] flex flex-col justify-between h-full transition-all duration-300
            ${color} hover:brightness-110 active:scale-95 shadow-sm
        `}
    >
        <div className="p-2.5 rounded-full bg-white/60 dark:bg-black/20 w-fit backdrop-blur-sm"><Icon size={24} strokeWidth={2} /></div>
        <span className="text-sm font-bold text-left leading-tight">{label}</span>
        <Icon className="absolute -bottom-2 -right-2 w-16 h-16 opacity-10 rotate-12 pointer-events-none" />
    </button>
);

export default PetDetailView;