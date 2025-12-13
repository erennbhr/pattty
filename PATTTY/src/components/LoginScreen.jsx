// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/LoginScreen.jsx

import React, { useState } from 'react';
import { PawPrint, Mail, Lock, ArrowRight, User, Phone, MapPin, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import InteractiveSleepingPet from './InteractiveSleepingPet';

// Google İkonu (SVG)
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.24.81-.6z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const LoginScreen = () => {
  const { t } = useLanguage();
  const { login, loginWithGoogle } = useAuth();
  
  // Ekran Yönetimi: 'login' | 'register' | 'complete_google'
  const [viewState, setViewState] = useState('login'); 
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: ''
  });

  const [errors, setErrors] = useState({});

  // --- GOOGLE GİRİŞ İŞLEMİ ---
  const handleGoogleLogin = async () => {
    const googleUser = await loginWithGoogle();
    
    if (googleUser) {
        setFormData(prev => ({
            ...prev,
            name: googleUser.name,
            email: googleUser.email,
            password: "google_verified_token" 
        }));
        setViewState('complete_google');
    } else {
        console.log("Google girişi iptal edildi.");
    }
  };

  // --- FORM GÖNDERME ---
  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (viewState === 'login') {
        if (!formData.email) newErrors.email = true;
        if (!formData.password) newErrors.password = true;
    }

    if (viewState === 'register' || viewState === 'complete_google') {
        if (!formData.name) newErrors.name = true;
        if (viewState === 'register') {
            if (!formData.email) newErrors.email = true;
            if (!formData.password) newErrors.password = true;
        }
        if (!formData.phone) newErrors.phone = true; 
    }

    if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
    }

    login({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address
    });
  };

  // --- RENDER ---
  return (
    <div className="fixed inset-0 bg-gray-50 dark:bg-black flex flex-col items-center justify-center p-6 z-[100] overflow-hidden transition-colors duration-500">
      
      {/* Arka Plan Dekorasyonları */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-200/40 dark:bg-purple-900/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-indigo-200/40 dark:bg-indigo-900/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* --- ÜST BÖLÜM: MASKOT VE BAŞLIK --- */}
      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative z-10">
        
        {/* Sevimli Maskot */}
        <div className="w-48 h-48 mb-6 relative">
            {/* Arka plandaki parlama */}
            <div className="absolute inset-4 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-2xl opacity-20 dark:opacity-40 animate-pulse"></div>
            <InteractiveSleepingPet type="cat" color="#818cf8" className="w-full h-full drop-shadow-2xl" />
        </div>

        <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight text-center">
            {viewState === 'complete_google' ? t('login_step_title') : 'Pattty'}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm mt-2 text-center max-w-xs font-medium">
            {viewState === 'complete_google' ? t('login_step_desc') : t('login_desc')}
        </p>
      </div>

      {/* --- ALT BÖLÜM: FORM KARTI --- */}
      <div className="w-full max-w-sm bg-white dark:bg-[#111417] p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/5 relative z-10 animate-in slide-in-from-bottom duration-500">
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* --- GÖRÜNÜM 1: GİRİŞ YAP --- */}
          {viewState === 'login' && (
              <div className="space-y-4 animate-in fade-in">
                <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.email ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                    <div className="p-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"><Mail size={20}/></div>
                    <input 
                        type="email" 
                        placeholder={t('email_placeholder')} 
                        className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium h-full py-4 pr-4"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                </div>
                <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.password ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                    <div className="p-4 text-gray-400 group-focus-within:text-indigo-500 transition-colors"><Lock size={20}/></div>
                    <input 
                        type="password" 
                        placeholder={t('password_placeholder')} 
                        className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium h-full py-4 pr-4"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                </div>
                
                <button type="submit" className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    {t('login_btn')} <ArrowRight size={20}/>
                </button>

                <div className="relative py-2">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-gray-100 dark:border-white/10"></span></div>
                    <div className="relative flex justify-center text-xs font-bold uppercase"><span className="bg-white dark:bg-[#111417] px-3 text-gray-400">{t('or')}</span></div>
                </div>

                <button type="button" onClick={handleGoogleLogin} className="w-full bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-200 py-3.5 rounded-2xl font-bold text-sm shadow-sm border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700 transition-all flex items-center justify-center gap-3">
                    <GoogleIcon /> {t('login_with_google')}
                </button>
              </div>
          )}

          {/* --- GÖRÜNÜM 2 & 3: KAYIT OL / TAMAMLA --- */}
          {(viewState === 'register' || viewState === 'complete_google') && (
              <div className="space-y-3 animate-in slide-in-from-right fade-in">
                
                {/* İsim */}
                <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.name ? 'border-red-500' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                    <div className="p-3.5 text-gray-400 group-focus-within:text-indigo-500"><User size={20}/></div>
                    <input 
                        type="text" 
                        placeholder={t('name_required_placeholder')} 
                        className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium py-3.5 pr-4"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                </div>

                {viewState === 'register' && (
                    <>
                        <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.email ? 'border-red-500' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                            <div className="p-3.5 text-gray-400 group-focus-within:text-indigo-500"><Mail size={20}/></div>
                            <input 
                                type="email" 
                                placeholder={t('email_required_placeholder')} 
                                className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium py-3.5 pr-4"
                                value={formData.email}
                                onChange={(e) => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                        <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.password ? 'border-red-500' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                            <div className="p-3.5 text-gray-400 group-focus-within:text-indigo-500"><Lock size={20}/></div>
                            <input 
                                type="password" 
                                placeholder={t('password_required_placeholder')} 
                                className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium py-3.5 pr-4"
                                value={formData.password}
                                onChange={(e) => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </>
                )}

                <div className={`group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 transition-all ${errors.phone ? 'border-red-500' : 'border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black'}`}>
                    <div className="p-3.5 text-gray-400 group-focus-within:text-indigo-500"><Phone size={20}/></div>
                    <input 
                        type="tel" 
                        placeholder={t('phone_required_placeholder')} 
                        className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium py-3.5 pr-4"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    />
                </div>

                <div className="group flex items-center bg-gray-50 dark:bg-neutral-900 rounded-2xl border-2 border-transparent focus-within:border-indigo-500 focus-within:bg-white dark:focus-within:bg-black transition-all">
                    <div className="p-3.5 text-gray-400 group-focus-within:text-indigo-500"><MapPin size={20}/></div>
                    <input 
                        type="text" 
                        placeholder={t('address_optional_placeholder')} 
                        className="bg-transparent w-full text-gray-900 dark:text-white placeholder-gray-400 outline-none text-sm font-medium py-3.5 pr-4"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                    />
                </div>

                <button type="submit" className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-base shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 mt-4">
                    {viewState === 'complete_google' ? t('complete_and_start_btn') : t('register_btn')} <Check size={20}/>
                </button>
              </div>
          )}

        </form>

        {/* --- ALT LINKLER --- */}
        <div className="mt-6 text-center">
          {viewState === 'login' ? (
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {t('no_account')}
                <button onClick={() => setViewState('register')} className="text-indigo-600 dark:text-indigo-400 font-bold ml-2 hover:underline">{t('register_link')}</button>
              </p>
          ) : (
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
                {t('already_member')}
                <button onClick={() => setViewState('login')} className="text-indigo-600 dark:text-indigo-400 font-bold ml-2 hover:underline">{t('login_link')}</button>
              </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default LoginScreen;