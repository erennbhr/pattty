// src/components/MyPetsHub.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Edit3, Trash2, MoreVertical, Heart, Crown,
  Cat, Dog, Bird, Rabbit, Fish, Turtle, PawPrint,
  Calendar, Weight, LayoutGrid, List, ArrowUpDown, Check, Filter
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext';
import { calculateAge, getLocalizedData } from '../utils/helpers';

const MyPetsHub = ({ setPet, openAddModal, openEditModal, onDeletePet }) => {
  const { t, language } = useLanguage();
  const { pets, loading, moodHistory } = useApp();
  const { isPremium } = usePremium();
  
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // 🟢 GÖRÜNÜM AYARLARI (GRID / LIST)
  const [viewMode, setViewMode] = useState(() => {
      return localStorage.getItem('hubViewMode') || 'grid';
  });

  // 🟢 SIRALAMA AYARLARI
  const [sortBy, setSortBy] = useState(() => {
      return localStorage.getItem('hubSortBy') || 'name'; 
  });

  const todayStr = new Date().toISOString().split('T')[0];

  const handleViewChange = (mode) => {
      setViewMode(mode);
      localStorage.setItem('hubViewMode', mode);
      setActiveMenuId(null);
  };

  const handleSortChange = (sortType) => {
      setSortBy(sortType);
      localStorage.setItem('hubSortBy', sortType);
      setShowSortMenu(false);
  };

  useEffect(() => {
      const closeMenu = () => {
          setActiveMenuId(null);
          setShowSortMenu(false);
      };
      document.addEventListener('click', closeMenu);
      return () => document.removeEventListener('click', closeMenu);
  }, []);

  // 🟢 SIRALANMIŞ LİSTE
  const sortedPets = useMemo(() => {
      const sorted = [...pets].sort((a, b) => {
          if (sortBy === 'name') return a.name.localeCompare(b.name);
          if (sortBy === 'type') return a.type.localeCompare(b.type);
          if (sortBy === 'age') {
              const dateA = new Date(a.birthDate || 0).getTime();
              const dateB = new Date(b.birthDate || 0).getTime();
              return dateB - dateA;
          }
          return 0;
      });
      return sorted;
  }, [pets, sortBy]);

  const getIcon = (type) => {
      const icons = { cat: Cat, dog: Dog, bird: Bird, rabbit: Rabbit, fish: Fish, turtle: Turtle };
      return icons[type] || PawPrint;
  };

  const toggleMenu = (e, id) => {
      e.stopPropagation();
      setActiveMenuId(activeMenuId === id ? null : id);
      setShowSortMenu(false);
  };

  const toggleSortMenu = (e) => {
      e.stopPropagation();
      setShowSortMenu(!showSortMenu);
      setActiveMenuId(null);
  };

  if (loading) {
      return (
        <div className="flex items-center justify-center h-[60vh]">
            <div className="relative w-16 h-16">
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-200 rounded-full opacity-25"></div>
                <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
        </div>
      );
  }

  // BOŞ DURUM
  if (pets.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[70vh] text-center animate-in zoom-in duration-500">
        <div className="w-48 h-48 bg-gradient-to-tr from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-full flex items-center justify-center mb-8 relative group shadow-2xl shadow-indigo-500/10">
            <div className="absolute inset-0 rounded-full bg-white/40 dark:bg-black/20 backdrop-blur-xl"></div>
            <PawPrint size={80} className="text-indigo-400 dark:text-indigo-500 relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg" />
            {!isPremium && <Crown size={28} className="absolute top-2 right-4 text-amber-400 drop-shadow-md animate-bounce z-20" />}
        </div>
        
        <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 mb-4 tracking-tight">
            {t('hub_empty_title') || "Aileye Hoşgeldin!"}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-xs leading-relaxed text-lg">
            {t('hub_empty_desc') || "Henüz hiç dostun yok. İlk dostunu ekleyerek maceraya başla."}
        </p>
        
        <button 
            onClick={openAddModal}
            className="group relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 p-[1px] shadow-2xl shadow-indigo-500/40 active:scale-95 transition-all duration-300"
        >
            <div className="absolute inset-0 bg-white/20 group-hover:bg-white/0 transition-colors"></div>
            <span className="relative flex items-center gap-3 rounded-2xl bg-black/5 dark:bg-black/40 backdrop-blur-sm px-8 py-4 font-bold text-lg text-white">
                <Plus className="group-hover:rotate-90 transition-transform duration-300" size={24} strokeWidth={3} />
                {t('add_first_pet')}
            </span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pt-2 pb-32 min-h-screen">
       
      {/* Üst Bar */}
      <div className="flex flex-col gap-6 mb-8 px-1">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
                    {t('my_pets_title')} 
                    <div className="bg-red-50 dark:bg-red-500/10 p-2 rounded-full">
                        <Heart className="text-red-500 fill-red-500 animate-pulse" size={20} />
                    </div>
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mt-1 ml-1">
                    {(t('hub_subtitle') || "{count} dostun var").replace('{count}', pets.length)}
                </p>
            </div>
            
            <button 
                onClick={openAddModal}
                className="group relative w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all duration-300"
            >
                <Plus size={26} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-300"/>
            </button>
        </div>

        {/* KONTROL PANELDİ */}
        <div className="flex items-center justify-between bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-1.5 rounded-2xl border border-gray-200/50 dark:border-white/10 shadow-sm sticky top-20 z-30 ring-1 ring-black/5 dark:ring-white/5">
            <div className="flex bg-gray-100 dark:bg-black/40 rounded-xl p-1 gap-1">
                <button 
                    onClick={() => handleViewChange('grid')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'grid' ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-white scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <LayoutGrid size={18} />
                </button>
                <button 
                    onClick={() => handleViewChange('list')}
                    className={`p-2.5 rounded-lg transition-all duration-300 ${viewMode === 'list' ? 'bg-white dark:bg-white/10 shadow-md text-indigo-600 dark:text-white scale-105 ring-1 ring-black/5' : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5'}`}
                >
                    <List size={18} />
                </button>
            </div>

            <div className="relative">
                <button 
                    onClick={toggleSortMenu}
                    className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-white/5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-xl transition-all border border-gray-200 dark:border-white/5 active:scale-95 shadow-sm"
                >
                    <Filter size={14} className="text-indigo-500"/>
                    <span>{
                        sortBy === 'name' ? (t('sort_name') || "İsim") : 
                        sortBy === 'age' ? (t('sort_age') || "Yaş") : 
                        (t('sort_type') || "Tür")
                    }</span>
                    <ArrowUpDown size={12} className="ml-1 opacity-50" />
                </button>

                {showSortMenu && (
                    <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-[#1A1D21]/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 p-1.5 z-40 animate-in fade-in zoom-in-95 origin-top-right ring-1 ring-black/5">
                        <div className="px-3 py-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Sıralama Ölçütü</div>
                        {[
                            { id: 'name', label: t('sort_name') || "İsim (A-Z)" },
                            { id: 'age', label: t('sort_age') || "Yaş (Genç-Yaşlı)" },
                            { id: 'type', label: t('sort_type') || "Tür" }
                        ].map(opt => (
                            <button
                                key={opt.id}
                                onClick={() => handleSortChange(opt.id)}
                                className={`w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${sortBy === opt.id ? 'bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                            >
                                {opt.label}
                                {sortBy === opt.id && <Check size={14} className="text-indigo-500"/>}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
      </div>

      {/* KART LİSTESİ */}
      <div className={`
          ${viewMode === 'grid' 
            ? 'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3' 
            : 'flex flex-col gap-4'
          }
      `}>
        {sortedPets.map((pet, index) => {
            const TypeIcon = getIcon(pet.type);
            const ageInfo = calculateAge(pet.birthDate, t);
            const breedName = getLocalizedData(language, t).breedName(pet.breed, pet.type, pet.customBreed);
            
            const todayMood = moodHistory?.[todayStr]?.[pet.id];
            const moodImage = todayMood ? pet.moodImages?.[todayMood] : null;
            const bgImage = moodImage || pet.image || 'https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D';

            // 🟢 Z-INDEX DÜZELTMESİ:
            // Eğer bu kartın menüsü açıksa (activeMenuId === pet.id), z-index'i 50 yapıp en öne getiriyoruz.
            // Değilse z-0. Bu sayede açılan menü alttaki kartın üzerinde kalır.
            const isMenuOpen = activeMenuId === pet.id;

            return (
              <div 
                  key={pet.id}
                  onClick={() => setPet(pet.id)}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className={`group relative w-full cursor-pointer shadow-lg hover:shadow-2xl hover:shadow-indigo-500/20 transition-all duration-500 active:scale-[0.98] bg-gray-900 border border-gray-100 dark:border-white/5 animate-in slide-in-from-bottom-4 fill-mode-backwards
                      ${viewMode === 'grid' 
                          ? 'aspect-[4/5] md:aspect-[3/4] rounded-[2.5rem]' 
                          : 'h-36 flex flex-row items-center rounded-[2.5rem]' 
                      }
                      overflow-visible
                      ${isMenuOpen ? 'z-50' : 'z-0'} 
                  `}
              >
                  {/* Görsel Kapsayıcı */}
                  <div className={`absolute inset-0 overflow-hidden z-0 pointer-events-none
                      ${viewMode === 'list' ? 'w-36 rounded-l-[2.5rem]' : 'rounded-[2.5rem]'}
                  `}>
                      <div 
                        className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 will-change-transform"
                        style={{ backgroundImage: `url(${bgImage})` }}
                      />
                      {viewMode === 'grid' && (
                          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
                      )}
                  </div>

                  {/* Liste Modu Sağ Arkaplan */}
                  {viewMode === 'list' && (
                      <div className="absolute inset-0 bg-white dark:bg-[#1A1D21] ml-36 z-0 border-l border-gray-100 dark:border-white/5 rounded-r-[2.5rem]"></div>
                  )}
                  
                  {/* İÇERİK */}
                  <div className={`relative z-20 w-full h-full p-6 flex flex-col justify-between
                      ${viewMode === 'list' ? 'flex-row items-center pl-44 pr-6' : ''}
                  `}>
                      
                      {viewMode === 'grid' && (
                          <div className="flex justify-between items-start w-full">
                              <div className="w-14 h-14 bg-white/20 backdrop-blur-xl border border-white/30 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:bg-white/30 transition-colors">
                                  <TypeIcon size={28} strokeWidth={1.5} />
                              </div>
                              <div className="relative">
                                  <button onClick={(e) => toggleMenu(e, pet.id)} className="w-10 h-10 bg-black/20 backdrop-blur-md border border-white/10 rounded-full flex items-center justify-center text-white hover:bg-white hover:text-black transition-all shadow-sm active:scale-90">
                                      <MoreVertical size={20} />
                                  </button>
                                  {isMenuOpen && (
                                      <div className="absolute right-0 mt-2 w-48 bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-2xl shadow-xl py-2 border border-gray-200/50 dark:border-white/10 z-[100] animate-in fade-in zoom-in-95 origin-top-right ring-1 ring-black/5">
                                          <button onClick={(e) => { e.stopPropagation(); openEditModal(pet); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold transition-colors">
                                              <Edit3 size={18} className="text-indigo-500" /> {t('edit')}
                                          </button>
                                          <button onClick={(e) => { e.stopPropagation(); onDeletePet(pet.id); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-bold transition-colors border-t border-gray-100 dark:border-white/5">
                                              <Trash2 size={18} /> {t('delete')}
                                          </button>
                                      </div>
                                  )}
                              </div>
                          </div>
                      )}

                      <div className={`${viewMode === 'list' ? 'flex-1' : 'text-white drop-shadow-md'}`}>
                          <h3 className={`text-2xl font-black tracking-tight mb-1 leading-tight truncate ${viewMode === 'list' ? 'text-gray-900 dark:text-white' : ''}`}>
                              {pet.name}
                          </h3>
                          <p className={`text-sm font-bold mb-4 truncate ${viewMode === 'list' ? 'text-gray-500 dark:text-gray-400' : 'text-white/80'}`}>
                              {breedName}
                          </p>
                          
                          <div className="flex items-center gap-3 text-xs font-bold">
                              {ageInfo && (
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${viewMode === 'list' ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 border-indigo-100 dark:border-indigo-500/20' : 'bg-white/20 backdrop-blur-md border-white/20 text-white'}`}>
                                      <Calendar size={14} />
                                      <span>{ageInfo}</span>
                                  </div>
                              )}
                              {pet.weight && (
                                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${viewMode === 'list' ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-300 border-emerald-100 dark:border-emerald-500/20' : 'bg-white/20 backdrop-blur-md border-white/20 text-white'}`}>
                                      <Weight size={14} />
                                      <span>{pet.weight} kg</span>
                                  </div>
                              )}
                          </div>
                      </div>

                      {viewMode === 'list' && (
                          <div className="relative">
                              <button onClick={(e) => toggleMenu(e, pet.id)} className="w-10 h-10 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors">
                                  <MoreVertical size={20} />
                              </button>
                              
                              {isMenuOpen && (
                                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/95 dark:bg-black/95 backdrop-blur-xl rounded-2xl shadow-2xl py-2 border border-gray-200/50 dark:border-white/10 z-[100] animate-in fade-in zoom-in-95 origin-top-right ring-1 ring-black/5">
                                      <button onClick={(e) => { e.stopPropagation(); openEditModal(pet); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-100 dark:hover:bg-white/10 text-gray-700 dark:text-gray-200 font-bold transition-colors">
                                          <Edit3 size={18} className="text-indigo-500" /> {t('edit')}
                                      </button>
                                      <button onClick={(e) => { e.stopPropagation(); onDeletePet(pet.id); setActiveMenuId(null); }} className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 font-bold transition-colors border-t border-gray-100 dark:border-white/5">
                                          <Trash2 size={18} /> {t('delete')}
                                      </button>
                                  </div>
                              )}
                          </div>
                      )}
                  </div>
              </div>
            );
        })}
      </div>
    </div>
  );
};

export default MyPetsHub;