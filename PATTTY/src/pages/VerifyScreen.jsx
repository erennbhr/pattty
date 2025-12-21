// src/pages/VerifyScreen.jsx
import React, { useState, useEffect } from 'react';
import { Mail, RefreshCw, LogOut, CheckCircle, Send, ExternalLink } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { AppLauncher } from '@capacitor/app-launcher';
import { Capacitor } from '@capacitor/core';

const VerifyScreen = () => {
  const { t } = useLanguage(); 
  const { user, refreshUser, resendVerification, logout } = useAuth();
  
  // 🟢 DÜZELTME: showNotification'ı güvenli şekilde alıyoruz
  const notificationCtx = useNotification();
  const showNotification = notificationCtx?.showNotification 
    ? notificationCtx.showNotification 
    : (typeof notificationCtx === 'function' ? notificationCtx : console.log);

  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let interval;
    if (cooldown > 0) {
      interval = setInterval(() => setCooldown((prev) => prev - 1), 1000);
    }
    return () => clearInterval(interval);
  }, [cooldown]);

  const handleOpenMailApp = async () => {
    if (!user?.email) return;
    const domain = user.email.split('@')[1].toLowerCase();
    const isNative = Capacitor.isNativePlatform();

    try {
      if (domain.includes('gmail')) {
        if (isNative) {
          const { value } = await AppLauncher.canOpenUrl({ url: 'googlegmail://' });
          if (value) await AppLauncher.openUrl({ url: 'googlegmail://' });
          else window.open('https://mail.google.com', '_system');
        } else {
          window.open('https://mail.google.com', '_blank');
        }
      } else if (domain.includes('hotmail') || domain.includes('outlook') || domain.includes('live')) {
        if (isNative) {
           const { value } = await AppLauncher.canOpenUrl({ url: 'ms-outlook://' });
           if (value) await AppLauncher.openUrl({ url: 'ms-outlook://' });
           else window.open('https://outlook.live.com', '_system');
        } else {
          window.open('https://outlook.live.com', '_blank');
        }
      } else {
        window.open('mailto:', '_system');
      }
    } catch (error) {
      console.error("Mail açma hatası:", error);
      window.open('mailto:', '_system');
    }
  };

  const getMailBtnText = () => {
    const domain = user?.email?.split('@')[1]?.toLowerCase() || '';
    if (domain.includes('gmail')) return t('verify_open_gmail');
    if (domain.includes('hotmail') || domain.includes('outlook')) return t('verify_open_outlook');
    return t('verify_open_mail_app');
  };

  const handleCheck = async () => {
    setChecking(true);
    try {
      const isVerified = await refreshUser();
      
      if (isVerified) {
        showNotification(t('success_verified'), "success");
      } else {
        showNotification(t('err_not_verified'), "warning");
      }
    } catch (error) {
      console.error(error);
      showNotification(t('err_connection'), "error");
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await resendVerification();
      showNotification(t('success_email_sent'), "success");
      setCooldown(60);
    } catch (error) {
      console.error(error);
      showNotification(t('err_general'), "error");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#121212] flex flex-col items-center justify-center p-6 text-center transition-colors duration-500">
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-64 h-64 bg-purple-500/10 rounded-full blur-[80px]"></div>
        <div className="absolute bottom-[10%] right-[-10%] w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
      </div>

      <div className="relative z-10 w-full max-w-sm">
        <div className="mx-auto w-24 h-24 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-full flex items-center justify-center mb-8 shadow-2xl shadow-indigo-500/20 animate-in zoom-in duration-500">
          <div className="relative">
            <Mail size={40} className="text-indigo-600 dark:text-indigo-400" />
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full border-2 border-white dark:border-[#121212] animate-bounce"></div>
          </div>
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          {t('verify_title')}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed">
          <span className="font-semibold text-indigo-600 dark:text-indigo-400 block mb-1">{user?.email}</span> 
          {t('verify_desc_suffix')}
        </p>

        <div className="space-y-3">
          
          <button
            onClick={handleOpenMailApp}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white py-4 rounded-2xl font-bold shadow-xl shadow-indigo-500/30 transition-all flex items-center justify-center gap-2"
          >
            <ExternalLink size={20} />
            <span>{getMailBtnText()}</span>
          </button>

          <button
            onClick={handleCheck}
            disabled={checking}
            className="w-full bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-white/20 active:scale-95 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2"
          >
            {checking ? (
              <RefreshCw className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle size={20} />
                <span>{t('verify_check_btn')}</span>
              </>
            )}
          </button>

          <button
            onClick={handleResend}
            disabled={cooldown > 0}
            className={`w-full py-4 rounded-2xl font-bold border transition-all flex items-center justify-center gap-2 ${
              cooldown > 0 
                ? 'bg-gray-100 text-gray-400 border-gray-200 dark:bg-transparent dark:border-white/5 dark:text-gray-600 cursor-not-allowed' 
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 border-transparent'
            }`}
          >
            {cooldown > 0 ? (
              <span>{cooldown}{t('verify_wait')}</span>
            ) : (
              <>
                <Send size={16} />
                <span className="text-sm">{t('verify_resend_btn')}</span>
              </>
            )}
          </button>
        </div>

        <button 
          onClick={logout}
          className="mt-8 flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors mx-auto"
        >
          <LogOut size={16} /> 
          <span>{t('verify_logout')}</span>
        </button>
      </div>
    </div>
  );
};

export default VerifyScreen;