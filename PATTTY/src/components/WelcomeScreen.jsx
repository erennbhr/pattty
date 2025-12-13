import React, { useState } from 'react';
import { ArrowRight, Check, Bot, Activity, Heart, Calendar, User, Home, Sparkles, PawPrint, MapPin } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const WelcomeScreen = ({ onFinish }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);

    const slides = [
        {
            id: 'welcome',
            icon: <PawPrint size={80} className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]" />,
            title: t('intro_welcome_title'),
            desc: t('intro_welcome_desc'),
            bg: 'from-gray-900 via-gray-800 to-black',
            accent: 'bg-white'
        },
        {
            id: 'home',
            icon: <Home size={60} className="text-blue-400" />,
            title: t('intro_home_title'),
            desc: t('intro_home_desc'),
            bg: 'from-blue-900/90 via-slate-900 to-black',
            accent: 'bg-blue-500'
        },
        {
            id: 'pets',
            icon: <Heart size={60} className="text-red-400" />,
            title: t('intro_pets_title'),
            desc: t('intro_pets_desc'),
            bg: 'from-red-900/90 via-slate-900 to-black',
            accent: 'bg-red-500'
        },
        {
            id: 'ai',
            icon: <div className="relative"><Bot size={80} className="text-purple-400" /><Sparkles size={30} className="absolute -top-2 -right-4 text-yellow-300 animate-pulse"/></div>,
            title: t('intro_ai_title'),
            desc: t('intro_ai_desc'),
            bg: 'from-purple-900/90 via-indigo-950 to-black',
            accent: 'bg-purple-500'
        },
        {
            id: 'calendar',
            icon: <Calendar size={60} className="text-orange-400" />,
            title: t('intro_calendar_title'),
            desc: t('intro_calendar_desc'),
            bg: 'from-orange-900/90 via-slate-900 to-black',
            accent: 'bg-orange-500'
        },
        {
            id: 'account',
            icon: <User size={60} className="text-teal-400" />,
            title: t('intro_account_title'),
            desc: t('intro_account_desc'),
            bg: 'from-teal-900/90 via-slate-900 to-black',
            accent: 'bg-teal-500'
        }
    ];

    const handleNext = () => {
        if (step < slides.length - 1) {
            setStep(step + 1);
        } else {
            onFinish();
        }
    };

    const currentSlide = slides[step];

    return (
        <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center transition-all duration-700 bg-gradient-to-br ${currentSlide.bg}`}>
            
            {/* Arka Plan Efektleri (Ambient Light) */}
            <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full blur-[120px] opacity-30 transition-all duration-1000 ${currentSlide.accent}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full blur-[100px] opacity-20 transition-all duration-1000 ${currentSlide.accent}`}></div>

            {/* Atla Butonu */}
            <button onClick={onFinish} className="absolute top-safe top-6 right-6 text-white/50 font-medium text-xs uppercase tracking-widest hover:text-white transition-colors z-20">
                {t('intro_btn_skip')}
            </button>

            {/* İçerik Kartı */}
            <div className="w-full max-w-sm px-8 relative z-10 flex flex-col items-center text-center">
                
                {/* İkon Alanı (Floating Animation) */}
                <div key={`icon-${step}`} className="mb-10 p-8 rounded-full bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-in zoom-in duration-500 ring-1 ring-white/20">
                    <div className="animate-float">
                        {currentSlide.icon}
                    </div>
                </div>

                {/* Metin Alanı */}
                <div className="space-y-4 mb-12">
                    <h2 key={`title-${step}`} className="text-3xl font-bold text-white tracking-tight animate-in slide-in-from-bottom-4 duration-500">
                        {currentSlide.title}
                    </h2>
                    <p key={`desc-${step}`} className="text-lg text-gray-300 font-medium leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-100">
                        {currentSlide.desc}
                    </p>
                </div>

                {/* İlerleme Çubuğu (Dots) */}
                <div className="flex gap-2 mb-8">
                    {slides.map((_, i) => (
                        <div 
                            key={i} 
                            className={`h-1.5 rounded-full transition-all duration-500 ${i === step ? `w-8 ${currentSlide.accent.replace('bg-', 'bg-')}` : 'w-1.5 bg-white/20'}`} 
                            style={{ backgroundColor: i === step ? 'white' : ''}}
                        />
                    ))}
                </div>

                {/* Ana Buton */}
                <button 
                    onClick={handleNext}
                    className="group relative w-full py-4 bg-white text-black rounded-2xl font-bold text-lg shadow-xl shadow-white/10 active:scale-95 transition-all overflow-hidden"
                >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${currentSlide.accent}`}></div>
                    <span className="flex items-center justify-center gap-2">
                        {step === slides.length - 1 ? t('intro_btn_start') : t('intro_btn_next')}
                        {step === slides.length - 1 ? <Check size={20}/> : <ArrowRight size={20}/>}
                    </span>
                </button>
            </div>

            {/* CSS Animation Style (JSX içinde) */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
                .animate-float {
                    animation: float 4s ease-in-out infinite;
                }
                .top-safe {
                    top: env(safe-area-inset-top, 24px);
                }
            `}</style>
        </div>
    );
};

export default WelcomeScreen;