// src/components/AccountSettings.jsx
import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, User, Moon, Settings as SettingsIcon, Bell,
  Lock, HelpCircle, FileText, LogOut, UserCircle, Check,
  Phone, MapPin, Info, Trash2, Shield, Scale, Crown, Sparkles, X, DollarSign,
  Edit2, Loader2,
  Calendar, Syringe, RefreshCcw, Zap 
} from 'lucide-react';

import { doc, updateDoc } from 'firebase/firestore'; 
import { db, auth } from '../utils/firebase';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext'; 
import { useNotification } from '../context/NotificationContext'; 
import { LANGUAGES } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 

/* --------------------------------------------------------
   SETTINGS ITEM - Glassmorphism Stili
-------------------------------------------------------- */
const SettingsItem = ({ icon: Icon, label, onClick, danger, right, subLabel, isEditable }) => (
  <div
    onClick={onClick}
    role="button"
    className={`w-full flex items-center justify-between p-4 rounded-[1.5rem] mb-2
      border transition-all cursor-pointer active:scale-[0.99]
      ${danger 
        ? 'bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/20' 
        : 'bg-white dark:bg-white/5 dark:backdrop-blur-xl border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-white/10'
      }
    `}
  >
    <div className="flex items-center gap-4 pointer-events-none">
      <div
        className={`p-2.5 rounded-xl ${
          danger 
            ? 'bg-red-100 dark:bg-red-900/30 text-red-500' 
            : 'bg-gray-50 dark:bg-white/5 text-indigo-600 dark:text-indigo-400'
        }`}
      >
        <Icon size={20} />
      </div>
      <div className="flex flex-col items-start">
          <span className="font-semibold text-sm">{label}</span>
          {subLabel && <span className="text-[10px] text-gray-400 font-medium">{subLabel}</span>}
      </div>
    </div>

    <div onClick={(e) => isEditable ? null : e.stopPropagation()}>
      {right ? right : (
        isEditable ? 
        <Edit2 size={16} className="text-indigo-500 dark:text-indigo-400 opacity-60" /> : 
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-600" />
      )}
    </div>
  </div>
);

/* --------------------------------------------------------
   SUB SETTINGS LAYOUT - Glassmorphism Header
-------------------------------------------------------- */
const SubSettingsLayout = ({ title, onBack, children }) => (
  <div className="h-full flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right">
    {/* Header */}
    <div className="p-4 flex items-center gap-3 bg-white/80 dark:bg-white/5 dark:backdrop-blur-xl border-b border-gray-100 dark:border-white/5 sticky top-0 z-10">
      <button
        onClick={onBack}
        className="p-2 rounded-full bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors"
      >
        <ChevronLeft size={24} className="text-gray-600 dark:text-gray-200" />
      </button>
      <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{title}</h2>
    </div>

    {/* Content */}
    <div className="p-4 overflow-y-auto pb-32 text-gray-600 dark:text-gray-300">
      {children}
    </div>
  </div>
);

/* --------------------------------------------------------
   TEXT CONTENT PAGE
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
  const { darkMode, setDarkMode, notifications, setNotifications, weightUnit, setWeightUnit, currency, setCurrency, notifyIfEnabled } = useApp();
  const { user, logout } = useAuth(); 
  
  const { isPremium, upgradeToPremium, downgradeToFree } = usePremium();
  const { showNotification } = useNotification(); 

  const [currentView, setCurrentView] = useState('main');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // --- EDIT MODAL STATE ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState({ key: '', label: '', value: '' });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    if (!user?.uid || !editingField.value.trim()) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      await updateDoc(userRef, { [editingField.key]: editingField.value });
      setEditModalOpen(false);
      notifyIfEnabled('updates', t('info_updated'), 'success');
    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      showNotification(t('acc_update_error'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (key, label, currentValue) => {
    setEditingField({ key, label, value: currentValue || '' });
    setEditModalOpen(true);
  };

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
            ring-4 ring-white dark:ring-white/10">
            {user?.name ? user.name.charAt(0).toUpperCase() : <User size={40} />}
          </div>

          <h3 className="font-bold text-xl text-gray-900 dark:text-gray-100">{user?.name || t('acc_guest')}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email || t('acc_no_login')}</p>
        </div>

        <div className="space-y-3">
          <SettingsItem 
            icon={User} 
            label={`${t('form_name')}: ${user?.name || '-'}`} 
            isEditable 
            onClick={() => openEditModal('name', t('form_name'), user?.name)} 
          />
          <SettingsItem 
            icon={Phone} 
            label={`${t('phone')}: ${user?.phone || '-'}`} 
            isEditable
            onClick={() => openEditModal('phone', t('phone'), user?.phone)}
          />
          <SettingsItem 
            icon={MapPin} 
            label={`${t('address')}: ${user?.address || '-'}`} 
            isEditable
            onClick={() => openEditModal('address', t('address'), user?.address)}
          />
          <SettingsItem
            icon={Trash2}
            danger
            label={t('acc_delete_account')}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>

        {/* EDIT MODAL */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingField.label} {t('edit_suffix')}</h3>
                   <button onClick={() => setEditModalOpen(false)} className="p-1 bg-gray-100 dark:bg-white/5 rounded-full">
                      <X size={18} className="text-gray-500" />
                   </button>
                </div>
                
                <input
                  type="text"
                  value={editingField.value}
                  onChange={(e) => setEditingField({...editingField, value: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/5 rounded-xl mb-6 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={t('acc_edit_placeholder').replace('{label}', editingField.label)} 
                />

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-indigo-500/20"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  {t('save')}
                </button>
             </div>
          </div>
        )}

        {/* DELETE MODAL */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
            <div className="w-full max-w-sm bg-white dark:bg-[#1C1C1E] p-6 rounded-[2rem] border border-gray-100 dark:border-white/10 shadow-2xl">
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
                  className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-white/10"
                >
                  {t('acc_delete_confirm_cancel')}
                </button>
                <button
                  onClick={() => { logout(); setShowDeleteModal(false); }}
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
    const ToggleButton = ({ active, onClick }) => (
        <button 
            onClick={(e) => { e.stopPropagation(); onClick(); }} 
            className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${active ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/10'}`}
        >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-300 ${active ? 'translate-x-5' : ''}`}></div>
        </button>
    );

    return (
      <SubSettingsLayout title={t('set_notif')} onBack={() => setCurrentView('settings')}>
        <div className="space-y-3">
          <SettingsItem
            icon={Syringe}
            label={t('notif_vaccine')}
            right={<ToggleButton active={notifications?.vaccine} onClick={() => toggleNotification('vaccine')} />}
          />
          <SettingsItem
            icon={Calendar}
            label={t('notif_calendar')}
            right={<ToggleButton active={notifications?.calendar} onClick={() => toggleNotification('calendar')} />}
          />
          <SettingsItem
            icon={Sparkles}
            label={t('notif_ai')}
            right={<ToggleButton active={notifications?.ai} onClick={() => toggleNotification('ai')} />}
          />
          <SettingsItem
            icon={RefreshCcw}
            label={t('notif_updates')}
            right={<ToggleButton active={notifications?.updates} onClick={() => toggleNotification('updates')} />}
          />
        </div>
      </SubSettingsLayout>
    );
  }

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

  if (currentView === 'settings_unit') {
    return (
      <SubSettingsLayout title={t('set_unit_and_currency')} onBack={() => setCurrentView('settings')}>
        <div className="space-y-6">
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">{t('unit_weight_title')}</h3>
                <div className="space-y-2">
                    <SettingsItem
                        icon={Scale}
                        label={t('unit_kg')}
                        onClick={() => setWeightUnit('kg')}
                        right={weightUnit === 'kg' && <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    />
                    <SettingsItem
                        icon={Scale}
                        label={t('unit_lbs')}
                        onClick={() => setWeightUnit('lbs')}
                        right={weightUnit === 'lbs' && <div className="w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                    />
                </div>
            </div>
            <div>
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-2">{t('unit_currency_title')}</h3>
                <div className="space-y-2">
                    {['TRY', 'USD', 'EUR', 'GBP'].map(curr => (
                        <SettingsItem
                            key={curr}
                            icon={DollarSign}
                            label={t(`curr_${curr.toLowerCase()}`)}
                            onClick={() => setCurrency(curr)}
                            right={currency === curr && <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><Check size={14} className="text-white" /></div>}
                        />
                    ))}
                </div>
            </div>
        </div>
      </SubSettingsLayout>
    );
  }

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
                  darkMode ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-white/10'
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
          <SettingsItem icon={SettingsIcon} label={t('set_lang')} onClick={() => setCurrentView('settings_lang')} />
          <SettingsItem icon={Scale} label={t('set_unit_and_currency')} onClick={() => setCurrentView('settings_unit')} />
          <SettingsItem icon={Bell} label={t('set_notif')} onClick={() => setCurrentView('notifications')} />
        </div>
      </SubSettingsLayout>
    );
  }

  if (currentView === 'privacy') {
    return <TextContentPage title={t('privacy_title')} content={t('privacy_content')} onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'terms') {
    return <TextContentPage title={t('terms_title')} content={t('terms_content')} onBack={() => setCurrentView('main')} />;
  }

  if (currentView === 'help') {
    return (
      <SubSettingsLayout title={t('help_faq_title')} onBack={() => setCurrentView('main')}>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-white/5 dark:backdrop-blur-xl p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm dark:shadow-none">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">{t(`faq_q${i}`)}</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">{t(`faq_a${i}`)}</p>
            </div>
          ))}
        </div>
      </SubSettingsLayout>
    );
  }

  return (
    <div className="p-4 h-full overflow-y-auto pb-32 animate-in fade-in bg-gray-50 dark:bg-black">
      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-2">{t('acc_title')}</h2>
      
      {/* Premium Kart - Renkli */}
      <div className={`mb-8 p-6 rounded-[2rem] relative overflow-hidden shadow-xl ${isPremium ? 'bg-gradient-to-r from-gray-900 to-black text-white border border-white/10' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="relative z-10 flex items-center justify-between">
              <div>
                  <h3 className="text-xl font-black flex items-center gap-2">
                      <Crown size={24} className={isPremium ? 'text-yellow-400 fill-yellow-400' : 'text-white'} />
                      {isPremium ? t('acc_stat_premium') : t('acc_stat_free')}
                  </h3>
                  <p className="text-xs text-white/80 mt-1 max-w-[200px]">
                      {isPremium ? t('acc_desc_premium') : t('acc_desc_free')}
                  </p>
              </div>
              {!isPremium ? (
                  <button 
                    onClick={() => setShowPaywall(true)}
                    className="px-4 py-2 bg-white text-indigo-600 rounded-xl font-bold text-xs shadow-lg active:scale-95 transition-transform"
                  >
                    {t('acc_btn_upgrade')}
                  </button>
              ) : (
                  <button 
                    onClick={downgradeToFree}
                    className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl font-bold text-[10px] hover:bg-white/20"
                  >
                    {t('acc_btn_demo_cancel')}
                  </button>
              )}
          </div>
      </div>

      <div className="mb-6 space-y-3">
        <SettingsItem icon={UserCircle} label={t('acc_my_account')} onClick={() => setCurrentView('profile')} />
        <SettingsItem icon={SettingsIcon} label={t('acc_settings')} onClick={() => setCurrentView('settings')} />
      </div>

      <h3 className="text-xs font-bold text-gray-500 dark:text-gray-500 ml-2 mb-3 uppercase tracking-wider">
        {t('set_support')}
      </h3>

      <div className="mb-6 space-y-3">
        <SettingsItem icon={HelpCircle} label={t('set_help')} onClick={() => setCurrentView('help')} />
        <SettingsItem icon={Shield} label={t('set_privacy')} onClick={() => setCurrentView('privacy')} />
        <SettingsItem icon={FileText} label={t('set_terms')} onClick={() => setCurrentView('terms')} />
      </div>

      <button
        onClick={logout}
        className="w-full p-4 bg-red-50 dark:bg-red-900/10 text-red-600 dark:text-red-400 rounded-2xl font-bold flex items-center justify-center gap-2
        hover:bg-red-100 dark:hover:bg-red-900/20 transition-colors border border-red-100 dark:border-red-900/20 mt-4"
      >
        <LogOut size={20} /> {t('set_logout')}
      </button>

      <div className="mt-8 text-center pb-8">
        <p className="text-xs text-gray-500 dark:text-gray-600 font-medium">{t('acc_app_version')}</p>
        <p className="text-[10px] text-gray-400 dark:text-gray-700 mt-1">{t('acc_made_with_love')}</p>
      </div>

      {showPaywall && <PaywallModal feature="general" onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

export default AccountSettings;