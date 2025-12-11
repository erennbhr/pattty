// erennbhr/pattty/pattty-df8ab6d3def020d5068a132ec11f675ce8fce13a/Yeni klasör/src/components/AppContent.jsx

import React, { useState, useEffect } from 'react';
import { Home, Calendar, Bot, PawPrint, User } from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';

// Bileşenler
import NavButton from './NavButton';
import Dashboard from './Dashboard';
import SmartCalendar from './SmartCalendar';
import MyPetsHub from './MyPetsHub';
import AIAssistant from './AIAssistant';
import AccountSettings from './AccountSettings';
import VetLocator from './VetLocator';
import PetDetailView from './PetDetailView';
import AddPetModal from './AddPetModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import WelcomeScreen from './WelcomeScreen';
import { generateID } from '../utils/helpers';

const AppContent = () => {
  const { t } = useLanguage();
  const { pets, setPets, darkMode } = useApp();

  const [activeTab, setActiveTab] = useState('home');
  const [selectedPetId, setSelectedPetId] = useState(null);

  const [showAddPetModal, setShowAddPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [petToDelete, setPetToDelete] = useState(null);

  const [showWelcome, setShowWelcome] = useState(true);

  // VET ekranından geri dönülecek yer (account / pets)
  const [vetBackScreen, setVetBackScreen] = useState('account');

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

  const handleAddOrUpdate = (petData) => {
    if (petData.id) {
      setPets((prev) =>
        prev.map((p) => (p.id === petData.id ? { ...p, ...petData } : p)),
      );
    } else {
      setPets((prev) => [
        ...prev,
        {
          ...petData,
          id: generateID(),
          vaccines: [],
          weights: [],
          notes: [],
        },
      ]);
    }

    setShowAddPetModal(false);
    setEditingPet(null);
  };

  const handleDeletePet = () => {
    if (petToDelete) {
      setPets((prev) => prev.filter((p) => p.id !== petToDelete));
      if (selectedPetId === petToDelete) setSelectedPetId(null);
      setPetToDelete(null);
    }
  };

  const openEditModal = (pet) => {
    setEditingPet(pet);
    setShowAddPetModal(true);
  };

  useEffect(() => {
    window.openVetLocatorFromAccount = () => {
      setVetBackScreen('account');
      setSelectedPetId(null);
      setActiveTab('vet');
    };

    window.openVetLocatorFromVaccine = () => {
      setVetBackScreen('pets');
      setSelectedPetId(null);
      setActiveTab('vet');
    };

    return () => {
      window.openVetLocatorFromAccount = undefined;
      window.openVetLocatorFromVaccine = undefined;
    };
  }, []);

  const renderContent = () => {
    if (selectedPetId && activePet && activeTab === 'pets') {
      return (
        <PetDetailView
          pet={activePet}
          setPets={setPets}
          onBack={() => setSelectedPetId(null)}
        />
      );
    }

    switch (activeTab) {
      case 'home':
        return (
          <Dashboard
            // DÜZELTME: Dashboard'dan tıklandığında hem pet ID'sini set et hem de 'pets' sekmesine geç.
            setPet={(id) => {
                setSelectedPetId(id);
                setActiveTab('pets'); 
            }}
            openAddModal={() => {
              setEditingPet(null);
              setShowAddPetModal(true);
            }}
          />
        );

      case 'pets':
        return (
          <MyPetsHub
            setPet={setSelectedPetId}
            openAddModal={() => {
              setEditingPet(null);
              setShowAddPetModal(true);
            }}
            openEditModal={openEditModal}
            onDeletePet={setPetToDelete}
          />
        );

      case 'ai':
        return <AIAssistant />;

      case 'calendar':
        return <SmartCalendar />;

      case 'vet':
        return (
          <VetLocator
            onBack={() => setActiveTab(vetBackScreen)}
          />
        );

      case 'account':
        return <AccountSettings />;

      default:
        return (
          <div className="p-10 text-center text-gray-400">Sayfa Bulunamadı</div>
        );
    }
  };

  return (
    <div className="font-sans h-[100dvh] w-full overflow-hidden bg-gray-50 dark:bg-black text-gray-800 dark:text-neutral-200 select-none flex flex-col transition-colors duration-300">
      
      {showWelcome ? (
        <WelcomeScreen onFinish={finishWelcome} />
      ) : (
        <>
          {/* ANA İÇERİK */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden pb-24 pt-safe-top scroll-smooth">
            {renderContent()}
          </div>

          {/* ALT NAV BAR */}
          {!selectedPetId && (
            <div className="absolute bottom-0 left-0 right-0 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 px-4 pb-safe-bottom pt-2 flex justify-between items-end z-50 shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
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

          {/* ADD PET MODAL */}
          {showAddPetModal && (
            <AddPetModal
              onClose={() => setShowAddPetModal(false)}
              onAdd={handleAddOrUpdate}
              initialData={editingPet}
            />
          )}

          {/* DELETE CONFIRM MODAL */}
          {petToDelete && (
            <DeleteConfirmationModal
              pet={pets.find((p) => p.id === petToDelete)}
              onConfirm={handleDeletePet}
              onCancel={() => setPetToDelete(null)}
            />
          )}
        </>
      )}
    </div>
  );
};

export default AppContent;