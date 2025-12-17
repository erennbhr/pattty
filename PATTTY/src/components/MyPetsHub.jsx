// src/components/MyPetsHub.jsx
import React, { useState, useEffect } from 'react';
import { 
  Plus, Edit3, Trash2, MoreVertical, Heart, Crown,
  Cat, Dog, Bird, Rabbit, Fish, Turtle, PawPrint,
  Calendar, Weight, Activity
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { calculateAge, getLocalizedData } from '../utils/helpers';

const MyPetsHub = ({ setPet, openAddModal, openEditModal, onDeletePet }) => {
  const { t, language } = useLanguage();
  // 🟢 moodHistory eklendi
  const { pets, loading, moodHistory } = useApp();
  const { isPremium } = usePremium();
  const [activeMenuId, setActiveMenuId] = useState(null);

  const todayStr = new Date().toISOString().split('T')[0];

  // 🟢 OTOMATİK YÖNLENDİRME (Tek Hayvan Varsa)
  useEffect(() => {
      // Yükleme bittiyse ve sadece 1 hayvan varsa direkt detay sayfasına git
      if (!loading && pets.length === 1) {
          setPet(pets[0].id);
      }
  }, [loading, pets, setPet]);

  // Hayvan türüne göre ikon seçimi
  const getIcon = (type) => {
      const icons = { cat: Cat, dog: Dog, bird: Bird, rabbit: Rabbit, fish: Fish, turtle: Turtle };
      return icons[type] || PawPrint;
  };

  const toggleMenu = (e, id) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
  };

  // Menü dışına tıklanınca kapat
  useEffect(() => {
      const closeMenu = () => setActiveMenuId(null);
      document.addEventListener('click', closeMenu);
      return () => document.removeEventListener('click', closeMenu);
  }, []);

  if (loading) {
      return <div className="p-8 text-center"><div className="animate-spin inline-block w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>;
  }

  // 🟢 BOŞ DURUM (HİÇ HAYVAN YOKSA)
  if (pets.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[70vh] text-center animate-in zoom-in duration-500">
        <div className="w-48 h-48 bg-indigo-50 dark:bg-indigo-900/20 rounded-full flex items-center justify-center mb-6 relative group">
            <PawPrint size={80} className="text-indigo-300 dark:text-indigo-600 group-hover:scale-110 transition-transform" />
            {!isPremium && <Crown size={24} className="absolute top-4 right-4 text-amber-500 animate-bounce" />}
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-3 tracking-tight">{t('hub_empty_title') || "Merhaba!"}</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-xs leading-relaxed">{t('hub_empty_desc') || "Henüz hiç dostun yok. Takibe başlamak için ekle."}</p>
        
        <button 
            onClick={openAddModal}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 p-[2px] focus:outline-none focus:ring-4 focus:ring-indigo-300 dark:focus:ring-indigo-900 active:scale-95 transition-all"
        >
            <span className="flex items-center gap-3 rounded-2xl bg-white dark:bg-[#111417] px-8 py-4 font-bold text-lg transition-all group-hover:bg-transparent group-hover:text-white">
                <Plus className="group-hover:rotate-90 transition-transform duration-300" size={24} strokeWidth={2.5} />
                {t('add_first_pet')}
            </span>
        </button>
      </div>
    );
  }

  // 🟢 LİSTE GÖRÜNÜMÜ (KARTLAR)
  return (
    <div className="p-4 pt-2 pb-32">
       {/* Başlık Alanı */}
      <div className="flex items-center justify-between mb-6 px-2">
        <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
                {t('my_pets_title')} <Heart className="text-red-500 fill-red-500 animate-pulse" size={24} />
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1">
                {(t('hub_subtitle') || "{count} dostun var").replace('{count}', pets.length)}
            </p>
        </div>
        <button 
            onClick={openAddModal}
            className="p-3 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 rounded-2xl hover:bg-indigo-100 dark:hover:bg-indigo-500/30 transition-colors active:scale-95"
        >
            <Plus size={24} strokeWidth={2.5} />
        </button>
      </div>

      {/* KART GRİDİ */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {pets.map((pet) => {
            const TypeIcon = getIcon(pet.type);
            const ageInfo = calculateAge(pet.birthDate, t);
            const breedName = getLocalizedData(language, t).breedName(pet.breed, pet.type, pet.customBreed);
            
            // 🟢 MOOD GÖRSELİ KONTROLÜ
            // Bugün seçilen mood varsa onun görselini kullan, yoksa ana görsel
            const todayMood = moodHistory?.[todayStr]?.[pet.id];
            const moodImage = todayMood ? pet.moodImages?.[todayMood] : null;
            
            // Öncelik: Mood Görseli > Ana Görsel > Varsayılan Stok Foto
            const bgImage = moodImage || pet.image || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

            return (
              <div 
                  key={pet.id}
                  onClick={() => setPet(pet.id)}
                  className="group relative aspect-[4/5] md:aspect-[3/4] w-full rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 active:scale-[0.98] bg-gray-900"
              >
                  {/* 1. Arkaplan Görseli (Tüm kartı kaplar) */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style={{ backgroundImage: `url(${bgImage})` }}
                  />

                  {/* 2. Karartma Gradyanı (Metnin okunması için koyu katman) */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-80 group-hover:opacity-90 transition-opacity duration-300" />
                  
                  {/* 3. Üst Kısım: Tür İkonu ve Menü */}
                  <div className="absolute top-0 left-0 right-0 p-5 flex justify-between items-start z-20">
                      {/* Tür İkonu (Glassmorphism) */}
                      <div className="w-12 h-12 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white shadow-lg">
                          <TypeIcon size={24} strokeWidth={1.5} />
                      </div>
                      
                      {/* Menü Butonu (Glassmorphism) */}
                      <div className="relative">
                          <button 
                              onClick={(e) => toggleMenu(e, pet.id)}
                              className="w-10 h-10 bg-white/20 backdrop-blur-md border border-white/30 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors shadow-sm active:scale-90"
                          >
                              <MoreVertical size={20} />
                          </button>
                          
                          {/* Açılır Menü */}
                          {activeMenuId === pet.id && (
                              <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.2)] py-2 border border-gray-200/50 dark:border-white/10 z-30 animate-in fade-in zoom-in-95 origin-top-right">
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); openEditModal(pet); setActiveMenuId(null); }}
                                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold transition-colors"
                                  >
                                      <Edit3 size={18} className="text-indigo-500" /> {t('edit')}
                                  </button>
                                  <button 
                                      onClick={(e) => { e.stopPropagation(); onDeletePet(pet.id); setActiveMenuId(null); }}
                                      className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-bold transition-colors border-t border-gray-100 dark:border-white/5"
                                  >
                                      <Trash2 size={18} /> {t('delete')}
                                  </button>
                              </div>
                          )}
                      </div>
                  </div>

                  {/* 4. Alt Kısım: Pet Bilgileri (Beyaz Metin + Gölge) */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 z-20 text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                      {/* İsim */}
                      <h3 className="text-3xl font-black tracking-tight mb-1 leading-tight">
                          {pet.name}
                      </h3>
                      {/* Irk */}
                      <p className="text-lg font-bold text-white/90 mb-4">{breedName}</p>
                      
                      {/* Detaylar (Yaş, Kilo) */}
                      <div className="flex items-center gap-4 text-sm font-bold">
                          {ageInfo && (
                              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                  <Calendar size={14} />
                                  <span>{ageInfo}</span>
                              </div>
                          )}
                          {pet.weight && (
                              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20">
                                  <Weight size={14} />
                                  <span>{pet.weight} kg</span>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default MyPetsHub;