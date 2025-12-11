// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/AccountSettings.jsx

import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, User, Moon, Settings as SettingsIcon, Bell,
  Lock, HelpCircle, FileText, LogOut, UserCircle, Check,
  Phone, MapPin, Info, Trash2, Shield
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../utils/helpers';

/* --------------------------------------------------------
   PREMIUM SETTINGS ITEM (Dinamik Tema)
-------------------------------------------------------- */
const SettingsItem = ({ icon: Icon, label, onClick, danger, right }) => (
  <div
    onClick={onClick}
    role="button"
    className={`w-full flex items-center justify-between p-4 rounded-2xl mb-2
      border transition-colors cursor-pointer
      ${danger 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20' 
        : 'bg-white dark:bg-[#1A1D21] border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-[#23262B] active:bg-gray-100 dark:active:bg-[#2A2D31]'
      }
    `}
  >
    <div className="flex items-center gap-4 pointer-events-none">
      <div
        className={`p-2 rounded-xl ${
          danger 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
            : 'bg-gray-100 dark:bg-[#23262B] text-indigo-600 dark:text-indigo-400'
        }`}
      >
        <Icon size={22} />
      </div>
      <span className="font-semibold text-sm">{label}</span>
    </div>

    <div onClick={(e) => e.stopPropagation()}>
      {right || <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />}
    </div>
  </div>
);

/* --------------------------------------------------------
   SUB SETTINGS LAYOUT (GENERIC - Dinamik Tema)
-------------------------------------------------------- */
const SubSettingsLayout = ({ title, onBack, children }) => (
  <div className="h-full flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right">
    {/* Header */}
    <div className="p-4 flex items-center gap-3 bg-white dark:bg-[#111417] border-b border-gray-100 dark:border-white/5 sticky top-0 z-10 shadow-sm dark:shadow-none">
      <button
        onClick={onBack}
        className="p-2 rounded-full bg-gray-100 dark:bg-[#1A1D21] hover:bg-gray-200 dark:hover:bg-[#23262B] transition-colors"
      >
        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-200" />
      </button>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>

    {/* Content */}
    <div className="p-4 overflow-y-auto pb-24 text-gray-600 dark:text-gray-300">
      {children}
    </div>
  </div>
);

/* --------------------------------------------------------
   TEXT CONTENT PAGE (Privacy, Terms, About)
-------------------------------------------------------- */
const TextContentPage = ({ title, content, onBack }) => (
  <SubSettingsLayout title={title} onBack={onBack}>
    <div className="prose prose-sm dark:prose-invert max-w-none">
      <p className="leading-relaxed text-sm whitespace-pre-line text-gray-700 dark:text-gray-300">
        {content}
      </p>
    </div>
  </SubSettingsLayout>
);

/* --------------------------------------------------------
   MAIN COMPONENT
-------------------------------------------------------- */
const AccountSettings = () => {
  const { t, language, setLanguage } = useLanguage();
  const { darkMode, setDarkMode, notifications, setNotifications } = useApp();
  const { user, logout } = useAuth();

  const [currentView, setCurrentView] = useState('main');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* --------------------------------------------------------
      NOTIFICATION TOGGLE
  -------------------------------------------------------- */
  const toggleNotification = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  /* --------------------------------------------------------
      PROFILE VIEW
  -------------------------------------------------------- */
  if (currentView === 'profile') {
    return (
      <SubSettingsLayout title={t('acc_my_account')} onBack={() => setCurrentView('main')}>
        <div className="flex flex-col items-center mb-8 mt-4">
          <div className="w-24 h-24 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full 
            flex items-center justify-center mb-4 shadow-xl text-white text-3xl font-bold 
            ring-4 ring-white dark:ring-[#1A1D21]">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
          </div>

          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{user?.name || t('acc_guest')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || t('acc_no_login')}</p>
        </div>

        <div className="space-y-3">
          <SettingsItem icon={User} label={`${t('form_name')}: ${user?.name || '-'}`} />
          <SettingsItem icon={SettingsIcon} label={`${t('set_lang')}: ${LANGUAGES[language]}`} />
          <SettingsItem icon={Phone} label={`${t('phone')}: ${user?.phone || '-'}`} />
          <SettingsItem icon={MapPin} label={`${t('address')}: ${user?.address || '-'}`} />

          {/* DELETE ACCOUNT */}
          <SettingsItem
            icon={Trash2}
            danger
            label={t('acc_delete_account')}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-[#1A1D21] p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4 mx-auto">
                <Trash2 size={24} className="text-red-500" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2 text-center">{t('acc_delete_confirm_title')}</h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 text-center leading-relaxed">
                {t('acc_delete_confirm_desc')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-[#23262B] text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-[#2A2E33]"
                >
                  {t('acc_delete_confirm_cancel')}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-500/20"
                >
                  {t('acc_delete_confirm_yes')}
                </button>
              </div>
            </div>
          </div>
        )}
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      NOTIFICATION SETTINGS
  -------------------------------------------------------- */
  if (currentView === 'notifications') {
    return (
      <SubSettingsLayout title={t('set_notif')} onBack={() => setCurrentView('settings')}>
        <div className="space-y-3">
          <SettingsItem
            icon={Bell}
            label={t('notif_vaccine')}
            right={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotification('vaccine');
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
                  notifications.vaccine ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    notifications.vaccine ? 'translate-x-5' : ''
                  }`}
                ></div>
              </button>
            }
          />

          <SettingsItem
            icon={MapPin}
            label={t('notif_vet')}
            right={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleNotification('vet');
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
                  notifications.vet ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    notifications.vet ? 'translate-x-5' : ''
                  }`}
                ></div>
              </button>
            }
          />
        </div>
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      LANGUAGE SELECTION
  -------------------------------------------------------- */
  if (currentView === 'settings_lang') {
    return (
      <SubSettingsLayout title={t('set_lang')} onBack={() => setCurrentView('settings')}>
        <div className="space-y-2">
          {Object.keys(LANGUAGES).map((langKey) => (
            <SettingsItem
              key={langKey}
              icon={Check}
              label={LANGUAGES[langKey]}
              onClick={() => setLanguage(langKey)}
              right={language === langKey && <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
            />
          ))}
        </div>
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      GENERAL SETTINGS
  -------------------------------------------------------- */
  if (currentView === 'settings') {
    return (
      <SubSettingsLayout title={t('acc_settings')} onBack={() => setCurrentView('main')}>
        <div className="space-y-3">
          <SettingsItem
            icon={Moon}
            label={t('set_dark')}
            right={
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDarkMode(!darkMode);
                }}
                className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                    darkMode ? 'translate-x-5' : ''
                  }`}
                ></div>
              </button>
            }
          />

          <SettingsItem
            icon={SettingsIcon}
            label={t('set_lang')}
            onClick={() => setCurrentView('settings_lang')}
          />
          <SettingsItem
            icon={Bell}
            label={t('set_notif')}
            onClick={() => setCurrentView('notifications')}
          />
        </div>
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      PRIVACY POLICY
  -------------------------------------------------------- */
  if (currentView === 'privacy') {
    return <TextContentPage title={t('privacy_title')} content={t('privacy_content')} onBack={() => setCurrentView('main')} />;
  }

  /* --------------------------------------------------------
      TERMS OF USE
  -------------------------------------------------------- */
  if (currentView === 'terms') {
    return <TextContentPage title={t('terms_title')} content={t('terms_content')} onBack={() => setCurrentView('main')} />;
  }

  /* --------------------------------------------------------
      HELP & FAQ
  -------------------------------------------------------- */
  if (currentView === 'help') {
    return (
      <SubSettingsLayout title={t('help_faq_title')} onBack={() => setCurrentView('main')}>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-[#1A1D21] p-4 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t(`faq_q${i}`)}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t(`faq_a${i}`)}</p>
            </div>
          ))}
        </div>
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      MAIN ACCOUNT SCREEN
  -------------------------------------------------------- */
  return (
    <div className="p-4 h-full overflow-y-auto pb-24 animate-in fade-in">

      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8 px-2">{t('acc_title')}</h2>

      {/* ACCOUNT */}
      <div className="mb-6">
        <SettingsItem icon={UserCircle} label={t('acc_my_account')} onClick={() => setCurrentView('profile')} />
        <SettingsItem icon={SettingsIcon} label={t('acc_settings')} onClick={() => setCurrentView('settings')} />
      </div>

      {/* SUPPORT */}
      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-500 ml-2 mb-3 uppercase tracking-wider">
        {t('set_support')}
      </h3>

      <div className="mb-6">
        <SettingsItem
          icon={MapPin}
          label={t('acc_find_vet')}
          onClick={() => {
            if (window.openVetLocatorFromAccount) window.openVetLocatorFromAccount();
          }}
        />
        <SettingsItem icon={HelpCircle} label={t('set_help')} onClick={() => setCurrentView('help')} />
        <SettingsItem icon={Shield} label={t('set_privacy')} onClick={() => setCurrentView('privacy')} />
        <SettingsItem icon={FileText} label={t('set_terms')} onClick={() => setCurrentView('terms')} />
      </div>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2
        hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-red-900/20 mt-4"
      >
        <LogOut size={20} /> {t('set_logout')}
      </button>

      {/* FOOTER */}
      <div className="mt-8 text-center">
        <p className="text-xs text-gray-500 dark:text-gray-600 font-medium">Pattty App v1.0.0</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-700 mt-1">Made with ❤️ for pets</p>
      </div>
    </div>
  );
};

export default AccountSettings;