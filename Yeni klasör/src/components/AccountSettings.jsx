// FINAL — AccountSettings.jsx (Ultra Dark UI + VetLocator + Delete Account + Full i18n)
import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, User, Moon, Settings as SettingsIcon, Bell,
  Lock, HelpCircle, FileText, LogOut, UserCircle, Check,
  Phone, MapPin, Info, Trash2
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { LANGUAGES } from '../utils/helpers';

/* --------------------------------------------------------
   PREMIUM SETTINGS ITEM
-------------------------------------------------------- */
const SettingsItem = ({ icon: Icon, label, onClick, danger, right }) => (
  <div
    onClick={onClick}
    role="button"
    className={`w-full flex items-center justify-between p-4 rounded-2xl mb-2
      bg-[#1A1D21] hover:bg-[#23262B] active:bg-[#2A2D31]
      border border-white/5 transition-colors cursor-pointer
      ${danger ? 'text-red-400' : 'text-gray-200'}
    `}
  >
    <div className="flex items-center gap-4 pointer-events-none">
      <div
        className={`p-2 rounded-xl ${
          danger ? 'bg-red-900/30 text-red-400' : 'bg-[#23262B] text-indigo-400'
        }`}
      >
        <Icon size={22} />
      </div>
      <span className="font-semibold text-sm">{label}</span>
    </div>

    <div onClick={(e) => e.stopPropagation()}>
      {right || <ChevronRight size={18} className="text-gray-500" />}
    </div>
  </div>
);

/* --------------------------------------------------------
   SUB SETTINGS LAYOUT
-------------------------------------------------------- */
const SubSettingsLayout = ({ title, onBack, children }) => (
  <div className="h-full flex flex-col bg-black animate-in slide-in-from-right">
    <div className="p-4 flex items-center gap-3 bg-[#111417] border-b border-white/5">
      <button
        onClick={onBack}
        className="p-2 rounded-full bg-[#1A1D21] hover:bg-[#23262B] transition-colors"
      >
        <ChevronLeft size={24} className="text-gray-200" />
      </button>
      <h2 className="text-lg font-bold text-gray-100">{title}</h2>
    </div>

    <div className="p-4 overflow-y-auto pb-24">{children}</div>
  </div>
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
            flex items-center justify-center mb-4 shadow-xl text-white text-3xl font-bold">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
          </div>

          <h3 className="font-bold text-xl text-gray-100">{user?.name || t('acc_guest')}</h3>
          <p className="text-sm text-gray-400">{user?.email || t('acc_no_login')}</p>
        </div>

        <div className="space-y-3">
          <SettingsItem icon={User} label={`${t('form_name')}: ${user?.name || '-'}`} />
          <SettingsItem icon={SettingsIcon} label={`${t('set_lang')}: ${user?.email || '-'}`} />
          <SettingsItem icon={Phone} label={`${t('phone') || 'Telefon'}: ${user?.phone || '-'}`} />
          <SettingsItem icon={MapPin} label={`${t('address') || 'Adres'}: ${user?.address || '-'}`} />

          {/* DELETE ACCOUNT */}
          <SettingsItem
            icon={Trash2}
            danger
            label={t('acc_delete_acc')}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
            <div className="w-[90%] max-w-md bg-[#1A1D21] p-6 rounded-2xl border border-white/10">
              <h2 className="text-lg font-bold text-red-400 mb-4">{t('acc_delete_confirm_title')}</h2>
              <p className="text-gray-300 text-sm mb-6">
                {t('acc_delete_confirm_desc')}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="flex-1 py-2 rounded-xl bg-[#23262B] text-gray-200"
                >
                  {t('acc_delete_confirm_no')}
                </button>
                <button
                  onClick={() => {
                    logout();
                    setShowDeleteModal(false);
                  }}
                  className="flex-1 py-2 rounded-xl bg-red-600 text-white"
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
                className={`w-12 h-7 rounded-full p-1 ${
                  notifications.vaccine ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
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
                className={`w-12 h-7 rounded-full p-1 ${
                  notifications.vet ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
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
              right={language === langKey && <Check className="text-indigo-400" />}
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
                className={`w-12 h-7 rounded-full p-1 ${
                  darkMode ? 'bg-indigo-600' : 'bg-gray-600'
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
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
          <SettingsItem icon={Lock} label={t('set_privacy')} onClick={() => {}} />
        </div>
      </SubSettingsLayout>
    );
  }

  /* --------------------------------------------------------
      MAIN ACCOUNT SCREEN
-------------------------------------------------------- */
  return (
    <div className="p-4 h-full overflow-y-auto pb-24 animate-in fade-in">

      <h2 className="text-3xl font-bold text-gray-100 mb-8 px-2">{t('acc_title')}</h2>

      {/* ACCOUNT */}
      <div className="mb-6">
        <SettingsItem icon={UserCircle} label={t('acc_my_account')} onClick={() => setCurrentView('profile')} />
        <SettingsItem icon={SettingsIcon} label={t('acc_settings')} onClick={() => setCurrentView('settings')} />
      </div>

      {/* SUPPORT */}
      <h3 className="text-xs font-bold text-gray-500 ml-2 mb-3 uppercase tracking-wider">
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
        <SettingsItem icon={HelpCircle} label={t('set_help')} onClick={() => {}} />
        <SettingsItem icon={FileText} label={t('set_terms')} onClick={() => {}} />
      </div>

      {/* ABOUT */}
      <h3 className="text-xs font-bold text-gray-500 ml-2 mb-3 uppercase tracking-wider">
        {t('app_section') || 'Uygulama'}
      </h3>

      <div className="mb-6">
        <SettingsItem
          icon={Info}
          label={t('acc_about')}
          onClick={() => alert('Pattty App — v1.0.0 © 2025')}
        />
      </div>

      {/* LOGOUT */}
      <button
        onClick={logout}
        className="w-full p-4 bg-red-900/20 text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2
        hover:bg-red-900/30 transition-colors"
      >
        <LogOut size={20} /> {t('set_logout')}
      </button>
    </div>
  );
};

export default AccountSettings;
