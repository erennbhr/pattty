import React, { useState } from 'react';
import {
  ChevronRight, ChevronLeft, User, Moon, Settings as SettingsIcon, Bell,
  Lock, HelpCircle, FileText, LogOut, UserCircle, Check,
  Phone, MapPin, Info, Trash2, Shield, Scale, Crown, Sparkles, X, DollarSign,
  Edit2, Loader2 // Edit ve Loader ikonları eklendi
} from 'lucide-react';

// FIREBASE IMPORTLARI (Projenizdeki yola göre düzenleyin)
import { doc, updateDoc } from 'firebase/firestore'; 
import { db, auth } from '../utils/firebase';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext'; 
import { LANGUAGES } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 

/* --------------------------------------------------------
   PREMIUM SETTINGS ITEM (Yardımcı Bileşen)
-------------------------------------------------------- */
const SettingsItem = ({ icon: Icon, label, onClick, danger, right, subLabel, isEditable }) => (
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
      <div className="flex flex-col items-start">
          <span className="font-semibold text-sm">{label}</span>
          {subLabel && <span className="text-[10px] text-gray-400 font-medium">{subLabel}</span>}
      </div>
    </div>

    <div onClick={(e) => isEditable ? null : e.stopPropagation()}>
      {right ? right : (
        isEditable ? 
        <Edit2 size={16} className="text-indigo-500 dark:text-indigo-400 opacity-60" /> : 
        <ChevronRight size={18} className="text-gray-400 dark:text-gray-500" />
      )}
    </div>
  </div>
);

/* --------------------------------------------------------
   SUB SETTINGS LAYOUT (Yardımcı Bileşen)
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
   TEXT CONTENT PAGE (Yardımcı Bileşen)
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
  const { darkMode, setDarkMode, notifications, setNotifications, weightUnit, setWeightUnit, currency, setCurrency } = useApp();
  const { user, logout } = useAuth(); // Not: user nesnesinin içinde 'uid' olmalı.
  
  const { isPremium, upgradeToPremium, downgradeToFree } = usePremium();

  const [currentView, setCurrentView] = useState('main');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  // --- EDIT MODAL STATE ---
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState({ key: '', label: '', value: '' });
  const [isSaving, setIsSaving] = useState(false);

  /* --------------------------------------------------------
     FIREBASE GÜNCELLEME FONKSİYONU
   -------------------------------------------------------- */
  const handleSaveProfile = async () => {
    if (!user?.uid || !editingField.value.trim()) return;
    
    setIsSaving(true);
    try {
      const userRef = doc(db, "users", user.uid);
      
      // Dinamik key güncellemesi (örneğin { name: "Ahmet" } veya { phone: "555..." })
      await updateDoc(userRef, {
        [editingField.key]: editingField.value
      });

      // Başarılı olduğunda modalı kapat
      setEditModalOpen(false);
      
      // Not: AuthContext genellikle real-time dinlediği için user state'i otomatik güncellenecektir.
      // Eğer user state manuel güncelleme gerektiriyorsa burada context fonksiyonunu çağırabilirsin.

    } catch (error) {
      console.error("Profil güncellenirken hata:", error);
      alert("Güncelleme sırasında bir hata oluştu.");
    } finally {
      setIsSaving(false);
    }
  };

  const openEditModal = (key, label, currentValue) => {
    setEditingField({ key, label, value: currentValue || '' });
    setEditModalOpen(true);
  };

  /* --------------------------------------------------------
     NOTIFICATION TOGGLE
   -------------------------------------------------------- */
  const toggleNotification = (key) =>
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));

  /* --------------------------------------------------------
     PROFILE VIEW (DÜZENLENDİ)
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
          {/* İSİM (Düzenlenebilir) */}
          <SettingsItem 
            icon={User} 
            label={`${t('form_name')}: ${user?.name || '-'}`} 
            isEditable 
            onClick={() => openEditModal('name', t('form_name'), user?.name)} 
          />
          
          {/* TELEFON (Düzenlenebilir) */}
          <SettingsItem 
            icon={Phone} 
            label={`${t('phone')}: ${user?.phone || '-'}`} 
            isEditable
            onClick={() => openEditModal('phone', t('phone'), user?.phone)}
          />
          
          {/* ADRES (Düzenlenebilir) */}
          <SettingsItem 
            icon={MapPin} 
            label={`${t('address')}: ${user?.address || '-'}`} 
            isEditable
            onClick={() => openEditModal('address', t('address'), user?.address)}
          />

          {/* DİL AYARLARI BURADAN KALDIRILDI */}

          {/* HESABI SİL */}
          <SettingsItem
            icon={Trash2}
            danger
            label={t('acc_delete_account')}
            onClick={() => setShowDeleteModal(true)}
          />
        </div>

        {/* --- EDIT MODAL (POP-UP) --- */}
        {editModalOpen && (
          <div className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
             <div className="w-full max-w-sm bg-white dark:bg-[#1A1D21] p-6 rounded-3xl border border-gray-100 dark:border-white/10 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                   <h3 className="text-lg font-bold text-gray-900 dark:text-white">{editingField.label} {t('edit_suffix') || 'Düzenle'}</h3>
                   <button onClick={() => setEditModalOpen(false)} className="p-1 bg-gray-100 dark:bg-gray-800 rounded-full">
                      <X size={18} className="text-gray-500" />
                   </button>
                </div>
                
                <input
                  type="text"
                  value={editingField.value}
                  onChange={(e) => setEditingField({...editingField, value: e.target.value})}
                  className="w-full p-4 bg-gray-50 dark:bg-[#23262B] border border-gray-200 dark:border-gray-700 rounded-xl mb-6 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={`${editingField.label} giriniz...`}
                />

                <button
                  onClick={handleSaveProfile}
                  disabled={isSaving}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                  {t('save') || 'Kaydet'}
                </button>
             </div>
          </div>
        )}

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
     UNIT & CURRENCY SELECTION VIEW
   -------------------------------------------------------- */
  if (currentView === 'settings_unit') {
    return (
      <SubSettingsLayout title={t('set_unit_and_currency')} onBack={() => setCurrentView('settings')}>
        <div className="space-y-6">
            
            {/* AĞIRLIK BİRİMİ */}
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

            {/* PARA BİRİMİ */}
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

          {/* BİRİM & PARA BİRİMİ */}
          <SettingsItem
            icon={Scale}
            label={t('set_unit_and_currency')}
            onClick={() => setCurrentView('settings_unit')}
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

      <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6 px-2">{t('acc_title')}</h2>

      {/* --- PREMIUM KARTI --- */}
      <div className={`mb-8 p-6 rounded-3xl relative overflow-hidden shadow-xl ${isPremium ? 'bg-gradient-to-r from-gray-900 to-black text-white' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'}`}>
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
        {/* ✅ DÜZELTME: acc_find_vet (Veteriner Bul) butonu kaldırıldı */}
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
        <p className="text-xs text-gray-500 dark:text-gray-600 font-medium">{t('acc_app_version')}</p>
        <p className="text--[10px] text-gray-400 dark:text-gray-700 mt-1">{t('acc_made_with_love')}</p>
      </div>

      {/* PAYWALL MODAL */}
      {showPaywall && <PaywallModal feature="general" onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

export default AccountSettings;