import React, { useState } from 'react';
import { 
  ArrowRight, Check, Bot, Activity, Heart, 
  Calendar, User, Home, Sparkles, PawPrint 
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const WelcomeScreen = ({ onFinish }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);

    const slides = [
        {
            id: 'welcome',
            icon: <PawPrint size={80} className="text-white drop-shadow-[0_0_20px_rgba(255,255,255,0.6)]" />,
            title: t('intro_welcome_title'),
            desc: t('intro_welcome_desc'),
            bg: 'from-gray-900 via-[#1a1a2e] to-black', // Deep dark blueish tint
            accent: 'bg-white'
        },
        {
            id: 'home',
            icon: <Home size={60} className="text-blue-400 drop-shadow-[0_0_15px_rgba(96,165,250,0.5)]" />,
            title: t('intro_home_title'),
            desc: t('intro_home_desc'),
            bg: 'from-blue-950 via-slate-900 to-black',
            accent: 'bg-blue-500'
        },
        {
            id: 'pets',
            icon: <Heart size={60} className="text-red-400 drop-shadow-[0_0_15px_rgba(248,113,113,0.5)]" />,
            title: t('intro_pets_title'),
            desc: t('intro_pets_desc'),
            bg: 'from-red-950 via-slate-900 to-black',
            accent: 'bg-red-500'
        },
        {
            id: 'ai',
            icon: (
                <div className="relative">
                    <Bot size={80} className="text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.6)]" />
                    <Sparkles size={30} className="absolute -top-2 -right-4 text-yellow-300 animate-pulse drop-shadow-[0_0_10px_rgba(253,224,71,0.8)]"/>
                </div>
            ),
            title: t('intro_ai_title'),
            desc: t('intro_ai_desc'),
            bg: 'from-purple-950 via-indigo-950 to-black',
            accent: 'bg-purple-500'
        },
        {
            id: 'calendar',
            icon: <Calendar size={60} className="text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.5)]" />,
            title: t('intro_calendar_title'),
            desc: t('intro_calendar_desc'),
            bg: 'from-orange-950 via-slate-900 to-black',
            accent: 'bg-orange-500'
        },
        {
            id: 'account',
            icon: <User size={60} className="text-teal-400 drop-shadow-[0_0_15px_rgba(45,212,191,0.5)]" />,
            title: t('intro_account_title'),
            desc: t('intro_account_desc'),
            bg: 'from-teal-950 via-slate-900 to-black',
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
            <div className={`absolute top-[-20%] left-[-20%] w-[80%] h-[50%] rounded-full blur-[120px] opacity-20 transition-all duration-1000 ${currentSlide.accent}`}></div>
            <div className={`absolute bottom-[-10%] right-[-10%] w-[60%] h-[40%] rounded-full blur-[100px] opacity-10 transition-all duration-1000 ${currentSlide.accent}`}></div>

            {/* Atla Butonu */}
            <button onClick={onFinish} className="absolute top-safe top-8 right-6 text-white/40 hover:text-white font-bold text-xs uppercase tracking-widest transition-colors z-20 px-3 py-1 rounded-full hover:bg-white/10">
                {t('intro_btn_skip')}
            </button>

            {/* İçerik Kartı */}
            <div className="w-full max-w-sm px-8 relative z-10 flex flex-col items-center text-center">
                
                {/* İkon Alanı (Floating Animation) */}
                <div key={`icon-${step}`} className="mb-12 p-10 rounded-[2.5rem] bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl animate-in zoom-in duration-500 ring-1 ring-white/10">
                    <div className="animate-float">
                        {currentSlide.icon}
                    </div>
                </div>

                {/* Metin Alanı */}
                <div className="space-y-5 mb-14 min-h-[140px]">
                    <h2 key={`title-${step}`} className="text-3xl font-black text-white tracking-tight animate-in slide-in-from-bottom-4 duration-500 leading-tight">
                        {currentSlide.title}
                    </h2>
                    <p key={`desc-${step}`} className="text-lg text-gray-400 font-medium leading-relaxed animate-in slide-in-from-bottom-4 duration-700 delay-100 px-2">
                        {currentSlide.desc}
                    </p>
                </div>

                {/* İlerleme Çubuğu (Dots) */}
                <div className="flex gap-2 mb-10">
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
                    className="group relative w-full py-4 bg-white text-black rounded-2xl font-black text-lg shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all overflow-hidden"
                >
                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity ${currentSlide.accent}`}></div>
                    <span className="flex items-center justify-center gap-2 relative z-10">
                        {step === slides.length - 1 ? t('intro_btn_start') : t('intro_btn_next')}
                        {step === slides.length - 1 ? <Check size={22} strokeWidth={3}/> : <ArrowRight size={22} strokeWidth={3}/>}
                    </span>
                </button>
            </div>

            {/* CSS Animation Style (JSX içinde) */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-12px); }
                }
                .animate-float {
                    animation: float 5s ease-in-out infinite;
                }
                .top-safe {
                    top: env(safe-area-inset-top, 24px);
                }
            `}</style>
        </div>
    );
};

export default WelcomeScreen;