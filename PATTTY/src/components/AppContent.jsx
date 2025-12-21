import React, { useState, useEffect, useRef } from 'react';
import { Home, Calendar, Bot, PawPrint, User } from 'lucide-react';
import { App as CapApp } from '@capacitor/app'; 

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext'; 

// Bileşenler
import NavButton from './NavButton';
import Dashboard from './Dashboard';
import SmartCalendar from './SmartCalendar';
import MyPetsHub from './MyPetsHub';
import AIAssistant from './AIAssistant';
import AccountSettings from './AccountSettings';
import VetLocator from './VetLocator'; 
import FoodAnalyzer from './FoodAnalyzer'; 
import PetDetailView from './PetDetailView';
import AddPetModal from './AddPetModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import WelcomeScreen from './WelcomeScreen';
import PaywallModal from './PaywallModal'; 
import ExpenseTracker from './ExpenseTracker';

const AppContent = () => {
  const { t } = useLanguage();
  const { pets, addPet, updatePet, deletePet } = useApp();
  const { canUseFeature } = usePremium(); 

  const [activeTab, setActiveTab] = useState('home');
  const [selectedPetId, setSelectedPetId] = useState(null);

  // Modallar
  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [showVetModal, setShowVetModal] = useState(false); 
  
  const [editingPet, setEditingPet] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);

  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);

  const [showWelcome, setShowWelcome] = useState(true);

  // Geri dönüş ekranları
  const [foodBackScreen, setFoodBackScreen] = useState('home'); 
  const [expenseBackScreen, setExpenseBackScreen] = useState('home');

  // REF: State'in en güncel halini tutmak için
  const navStateRef = useRef({
    activeTab,
    selectedPetId,
    showAddPetModal,
    showVetModal,
    petToDelete,
    showPaywall
  });

  useEffect(() => {
    navStateRef.current = {
      activeTab,
      selectedPetId,
      showAddPetModal,
      showVetModal,
      petToDelete,
      showPaywall
    };
  }, [activeTab, selectedPetId, showAddPetModal, showVetModal, petToDelete, showPaywall]);

  // GERİ TUŞU DİNLEYİCİSİ
  useEffect(() => {
    const backButtonListener = CapApp.addListener('backButton', ({ canGoBack }) => {
      const state = navStateRef.current;

      if (state.showPaywall) { setShowPaywall(false); return; }
      if (state.showAddPetModal) { setShowAddPetModal(false); return; }
      if (state.showVetModal) { setShowVetModal(false); return; }
      if (state.petToDelete) { setPetToDelete(null); return; }

      if (state.selectedPetId) { setSelectedPetId(null); return; }

      if (state.activeTab !== 'home') {
        setActiveTab('home');
        return;
      }

      CapApp.exitApp();
    });

    return () => {
      backButtonListener.then(listener => listener.remove());
    };
  }, []);

  useEffect(() => {
    const isSeen = localStorage.getItem('pattty_welcome_seen');
    if (isSeen) setShowWelcome(false);
  }, []);

  const finishWelcome = () => {
    localStorage.setItem('pattty_welcome_seen', 'true');
    setShowWelcome(false);
  };

  const activePet = pets.find((p) => p.id === selectedPetId) || null;

  const handleNav = (tab) => {
    if (tab === 'pets' && selectedPetId) {
      setSelectedPetId(null);
    }
    setActiveTab(tab);
  };

  // --- PREMIUM KONTROLLÜ PET EKLEME ---
  const handleOpenAddPet = () => {
    setEditingPet(null);
    if (pets.length >= 1) {
        const check = canUseFeature('multi_pet');
        if (!check.allowed) {
            setPaywallFeature('multi_pet');
            setShowPaywall(true);
            return;
        }
    }
    setShowAddPetModal(true);
  };

  const handleAddOrUpdate = async (petData) => {
    try {
      if (petData.id && pets.some(p => p.id === petData.id)) {
        await updatePet(petData.id, petData);
      } else {
        await addPet(petData);
      }
      setShowAddPetModal(false);
      setEditingPet(null);
    } catch (error) {
      console.error("İşlem hatası:", error);
    }
  };

  const handleDeletePet = async () => {
    if (petToDelete) {
      await deletePet(petToDelete);
      if (selectedPetId === petToDelete) setSelectedPetId(null);
      setPetToDelete(null);
    }
  };

  const openEditModal = (pet) => {
    setEditingPet(pet);
    setShowAddPetModal(true);
  };

  const renderContent = () => {
    if (selectedPetId && activePet && activeTab === 'pets') {
      return (
        <PetDetailView
          pet={activePet}
          onGoDashboard={() => {
              setSelectedPetId(null); 
              setActiveTab('home');   
          }}
          onBack={() => setSelectedPetId(null)}
          // 🟢 EKLENDİ: Düzenleme modalını açar
          onEdit={() => openEditModal(activePet)}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            setPet={(id) => {
              setSelectedPetId(id);
              setActiveTab('pets'); 
            }}
            openAddModal={handleOpenAddPet} 
            onOpenVetLocator={() => setShowVetModal(true)} 
            onOpenFoodScan={() => {
                setFoodBackScreen('home');
                setActiveTab('food_scan');
            }}
            onOpenExpense={() => {
                setExpenseBackScreen('home');
                setActiveTab('expense');
            }}
          />
        );

      case 'pets':
        return (
          <MyPetsHub
            setPet={setSelectedPetId}
            openAddModal={handleOpenAddPet} 
            openEditModal={openEditModal}
            onDeletePet={setPetToDelete}
          />
        );

      case 'ai':
        return <AIAssistant />;

      case 'calendar':
        return <SmartCalendar />;

      case 'food_scan':
        return (
            <FoodAnalyzer 
                onBack={() => setActiveTab(foodBackScreen)} 
            />
        );

      case 'expense':
        return (
            <ExpenseTracker 
                onBack={() => setActiveTab(expenseBackScreen)} 
            />
        );

      case 'account':
        return <AccountSettings />;

      default:
        return (
          <div className="p-10 text-center text-gray-400">{t('page_not_found')}</div>
        );
    }
  };

  return (
    <div className="font-sans h-[100dvh] w-full overflow-hidden bg-gray-50 dark:bg-black text-gray-800 dark:text-neutral-200 select-none flex flex-col transition-colors duration-300">
      
      {showWelcome ? (
        <WelcomeScreen onFinish={finishWelcome} />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 relative scroll-smooth">
            {renderContent()}
          </div>

          {/* ALT NAV BAR */}
          {!selectedPetId && (
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 px-4 pb-safe-bottom pt-2 flex justify-between items-end z-40 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div className="flex-1 h-14">
                <NavButton
                  active={activeTab === 'home'}
                  onClick={() => handleNav('home')}
                  icon={Home}
                  label={t('nav_summary')}
                />
              </div>

              <div className="flex-1 h-14">
                <NavButton
                  active={activeTab === 'pets'}
                  onClick={() => handleNav('pets')}
                  icon={PawPrint}
                  label={t('nav_pets')}
                />
              </div>

              {/* ORTA AI BUTONU */}
              <div className="relative -top-6 mx-1">
                <button
                  onClick={() => handleNav('ai')}
                  className={`w-16 h-16 rounded-full flex items-center justify-center text-white shadow-2xl shadow-indigo-500/40 transition-all duration-300 transform active:scale-95 ${
                    activeTab === 'ai'
                      ? 'bg-indigo-600 ring-4 ring-indigo-100 dark:ring-indigo-900'
                      : 'bg-gradient-to-tr from-indigo-600 to-purple-600 hover:-translate-y-1'
                  }`}
                >
                  <Bot size={30} />
                </button>
              </div>

              <div className="flex-1 h-14">
                <NavButton
                  active={activeTab === 'calendar'}
                  onClick={() => handleNav('calendar')}
                  icon={Calendar}
                  label={t('nav_calendar')}
                />
              </div>

              <div className="flex-1 h-14">
                <NavButton
                  active={activeTab === 'account'}
                  onClick={() => handleNav('account')}
                  icon={User}
                  label={t('nav_account')}
                />
              </div>
            </div>
          )}

          {/* MODALLER */}
          
          {showVetModal && (
            <div className="fixed inset-0 z-50 bg-white dark:bg-black animate-in slide-in-from-bottom duration-300">
                <VetLocator onBack={() => setShowVetModal(false)} />
            </div>
          )}

          {showAddPetModal && (
            <AddPetModal
              onClose={() => setShowAddPetModal(false)}
              onAdd={handleAddOrUpdate} 
              initialData={editingPet}
              // 🟢 SİLME FONKSİYONUNU GEÇİRİYORUZ (Modal içinde kullanılacak)
              onDelete={() => {
                  setPetToDelete(editingPet?.id);
                  setShowAddPetModal(false);
              }}
            />
          )}

          {petToDelete && (
            <DeleteConfirmationModal
              pet={pets.find((p) => p.id === petToDelete)}
              onConfirm={handleDeletePet} 
              onCancel={() => setPetToDelete(null)}
            />
          )}

          {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
        </>
      )}
    </div>
  );
};

export default AppContent;