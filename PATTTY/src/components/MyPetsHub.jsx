import React, { useState, useEffect, useMemo } from "react";

import {
  Plus,
  Edit3,
  Trash2,
  MoreVertical,
  Heart,
  Crown,
  Cat,
  Dog,
  Bird,
  Rabbit,
  Fish,
  Turtle,
  PawPrint,
  Calendar,
  Weight,
  LayoutGrid,
  List,
  ArrowUpDown,
  Check,
  Filter,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useApp } from "../context/AppContext";
import { usePremium } from "../context/PremiumContext";
import { calculateAge, getLocalizedData } from "../utils/helpers";

const MyPetsHub = ({ setPet, openAddModal, openEditModal, onDeletePet }) => {
  const { t, language } = useLanguage();

  // 🟢 DÜZELTME: weightUnit buradan çekildi
  const { pets, loading, moodHistory, weightUnit } = useApp();
  const { isPremium } = usePremium();

  const [activeMenuId, setActiveMenuId] = useState(null);
  const [showSortMenu, setShowSortMenu] = useState(false);

  // --- GÖRÜNÜM VE SIRALAMA AYARLARI ---
  const [viewMode, setViewMode] = useState(() => {
    try {
      return localStorage.getItem("hubViewMode") || "list";
    } catch {
      return "list";
    }
  });

  const [sortBy, setSortBy] = useState(() => {
    try {
      return localStorage.getItem("hubSortBy") || "name";
    } catch {
      return "name";
    }
  });

  const todayStr = new Date().toISOString().split("T")[0];

  const handleViewChange = (mode) => {
    setViewMode(mode);
    try {
      localStorage.setItem("hubViewMode", mode);
    } catch {}
    setActiveMenuId(null);
  };

  const handleSortChange = (sortType) => {
    setSortBy(sortType);
    try {
      localStorage.setItem("hubSortBy", sortType);
    } catch {}
    setShowSortMenu(false);
  };

  useEffect(() => {
    const closeMenu = () => {
      setActiveMenuId(null);
      setShowSortMenu(false);
    };
    document.addEventListener("click", closeMenu);
    return () => document.removeEventListener("click", closeMenu);
  }, []);

  // --- SIRALANMIŞ LİSTE ---
  const sortedPets = useMemo(() => {
    const sorted = [...pets].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "type") return a.type.localeCompare(b.type);
      if (sortBy === "age") {
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

  // --- YÜKLENİYOR DURUMU ---
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="relative w-16 h-16">
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500/30 rounded-full"></div>
          <div className="absolute top-0 left-0 w-full h-full border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </div>
    );
  }

  // --- BOŞ DURUM (Glassmorphism) ---
  if (pets.length === 0) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[70vh] text-center animate-in zoom-in duration-500">
        <div className="w-full max-w-sm bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-black/5 dark:border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center p-8 mb-8 relative group shadow-2xl">
          <div className="w-32 h-32 bg-indigo-500/10 rounded-full flex items-center justify-center mb-6 relative border border-indigo-500/20">
            <PawPrint
              size={64}
              className="text-indigo-500 dark:text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-500 drop-shadow-lg"
            />
            {!isPremium && (
              <Crown size={28} className="absolute top-0 right-0 text-amber-400 drop-shadow-md animate-bounce z-20" />
            )}
          </div>

          <h2 className="text-3xl font-black text-neutral-900 dark:text-white mb-3 tracking-tight">
            {t("hub_empty_title")}
          </h2>
          <p className="text-neutral-600 dark:text-gray-400 text-sm leading-relaxed">
            {t("hub_empty_desc")}
          </p>
        </div>

        <button
          onClick={openAddModal}
          className="w-full max-w-xs py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 hover:shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-3 border border-white/10"
        >
          <Plus size={24} strokeWidth={3} />
          {t("add_first_pet")}
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pt-2 pb-32 min-h-screen bg-white dark:bg-black">
      {/* Üst Bar */}
      <div className="flex flex-col gap-6 mb-8 px-1">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3 text-neutral-900 dark:text-white">
              {t("my_pets_title")}
              <div className="bg-red-500/10 p-2 rounded-full border border-red-500/20">
                <Heart className="text-red-500 fill-red-500 animate-pulse" size={20} />
              </div>
            </h1>

            <p className="text-sm font-medium mt-1 ml-1 text-neutral-600 dark:text-gray-400">
              {t("hub_subtitle").replace("{count}", pets.length)}
            </p>
          </div>

          <button
            onClick={openAddModal}
            className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/10"
          >
            <Plus size={28} strokeWidth={2.5} />
          </button>
        </div>

        {/* KONTROL PANELİ */}
        <div className="flex items-center justify-between bg-white/70 dark:bg-white/5 backdrop-blur-xl p-1.5 rounded-2xl border border-black/5 dark:border-white/10 shadow-sm sticky top-20 z-30">
          <div className="flex bg-white/50 dark:bg-black/40 rounded-xl p-1 gap-1 border border-black/5 dark:border-white/10">
            <button
              onClick={() => handleViewChange("grid")}
              className={`p-2.5 rounded-lg transition-all duration-300 ${
                viewMode === "grid"
                  ? "bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10"
                  : "text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <LayoutGrid size={18} />
            </button>

            <button
              onClick={() => handleViewChange("list")}
              className={`p-2.5 rounded-lg transition-all duration-300 ${
                viewMode === "list"
                  ? "bg-black/5 dark:bg-white/10 text-neutral-900 dark:text-white shadow-sm border border-black/5 dark:border-white/10"
                  : "text-neutral-600 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
              }`}
            >
              <List size={18} />
            </button>
          </div>

          <div className="relative">
            <button
              onClick={toggleSortMenu}
              className="flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-neutral-800 dark:text-gray-200 bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 rounded-xl transition-all border border-black/5 dark:border-white/10 active:scale-95 shadow-sm"
            >
              <Filter size={14} className="text-indigo-500 dark:text-indigo-400" />
              <span>
                {sortBy === "name" ? t("sort_name") : sortBy === "age" ? t("sort_age") : t("sort_type")}
              </span>
              <ArrowUpDown size={12} className="ml-1 opacity-50" />
            </button>

            {showSortMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-black/5 dark:border-white/10 p-1.5 z-40 animate-in fade-in zoom-in-95 origin-top-right">
                <div className="px-3 py-2 text-[10px] font-black text-neutral-500 uppercase tracking-wider">
                  {t("sort_label")}
                </div>
                {[
                  { id: "name", label: t("sort_name") },
                  { id: "age", label: t("sort_age") },
                  { id: "type", label: t("sort_type") },
                ].map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => handleSortChange(opt.id)}
                    className={`w-full px-3 py-2.5 text-left text-xs font-bold rounded-xl flex items-center justify-between transition-colors ${
                      sortBy === opt.id
                        ? "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                        : "text-neutral-700 dark:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                    }`}
                  >
                    {opt.label}
                    {sortBy === opt.id && <Check size={14} className="text-indigo-500 dark:text-indigo-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* KART LİSTESİ */}
      <div
        className={`${
          viewMode === "grid" ? "grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3" : "flex flex-col gap-4"
        }`}
      >
        {sortedPets.map((pet, index) => {
          const TypeIcon = getIcon(pet.type);
          const ageInfo = calculateAge(pet.birthDate, t);
          const breedName = getLocalizedData(language, t).breedName(pet.breed, pet.type, pet.customBreed);

          const todayMood = moodHistory?.[todayStr]?.[pet.id];
          const moodImage = todayMood ? pet.moodImages?.[todayMood] : null;
          const bgImage =
            moodImage ||
            pet.image ||
            "https://images.unsplash.com/photo-1548767797-d8c844163c4c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";

          const isMenuOpen = activeMenuId === pet.id;

          return (
            <div
              key={pet.id}
              onClick={() => setPet(pet.id)}
              style={{ animationDelay: `${index * 50}ms` }}
              className={`group relative w-full cursor-pointer shadow-lg transition-all duration-500 active:scale-[0.98]
                bg-white/70 dark:bg-white/5 border border-black/5 dark:border-white/10 backdrop-blur-xl hover:bg-black/5 dark:hover:bg-white/10
                animate-in slide-in-from-bottom-4 fill-mode-backwards
                ${
                  viewMode === "grid"
                    ? "aspect-[4/5] md:aspect-[3/4] rounded-[2.5rem] flex flex-col"
                    : "h-40 flex flex-row items-center rounded-[2.5rem]"
                }
                overflow-visible
                ${isMenuOpen ? "z-50" : "z-0"}
              `}
            >
              {/* Görsel Kapsayıcı */}
              <div
                className={`absolute inset-0 overflow-hidden z-0 pointer-events-none
                  ${viewMode === "list" ? "w-1/3 min-w-[130px] rounded-l-[2.5rem]" : "rounded-[2.5rem]"}
                `}
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-1000 group-hover:scale-110 will-change-transform"
                  style={{ backgroundImage: `url(${bgImage})` }}
                />
                {viewMode === "grid" && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-70 group-hover:opacity-80 transition-opacity duration-500" />
                )}
              </div>

              {/* Liste Modu Sağ Arkaplan */}
              {viewMode === "list" && (
                <div className="absolute inset-0 bg-transparent ml-[33%] z-0 border-l border-black/5 dark:border-white/10 rounded-r-[2.5rem]"></div>
              )}

              {/* İÇERİK */}
              <div
                className={`relative z-20 w-full h-full p-6 flex flex-col justify-between
                  ${viewMode === "list" ? "flex-row items-center pl-[calc(33%+1.5rem)] pr-6" : ""}
                `}
              >
                {/* Grid Modu Üst Kısım */}
                {viewMode === "grid" && (
                  <div className="flex justify-between items-start w-full">
                    <div className="w-12 h-12 bg-white/50 dark:bg-white/10 backdrop-blur-xl border border-black/5 dark:border-white/20 rounded-2xl flex items-center justify-center text-neutral-900 dark:text-white shadow-lg">
                      <TypeIcon size={24} strokeWidth={1.5} />
                    </div>

                    <div className="relative">
                      <button
                        onClick={(e) => toggleMenu(e, pet.id)}
                        className="w-10 h-10 bg-white/50 dark:bg-black/40 backdrop-blur-md border border-black/5 dark:border-white/10 rounded-full flex items-center justify-center text-neutral-800 dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-all shadow-sm active:scale-90"
                      >
                        <MoreVertical size={20} />
                      </button>

                      {isMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl shadow-xl py-2 border border-black/5 dark:border-white/10 z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openEditModal(pet);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-gray-200 font-bold transition-colors"
                          >
                            <Edit3 size={18} className="text-indigo-500 dark:text-indigo-400" /> {t("edit")}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeletePet(pet.id);
                              setActiveMenuId(null);
                            }}
                            className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold transition-colors border-t border-black/5 dark:border-white/10"
                          >
                            <Trash2 size={18} /> {t("delete")}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Metin ve Bilgiler */}
                <div
                  className={`${
                    viewMode === "list"
                      ? "flex-1 flex flex-col justify-center h-full"
                      : "drop-shadow-md"
                  }`}
                >
                  {viewMode === "list" && (
                    <div className="flex justify-between items-start w-full mb-1">
                      <div>
                        <h3 className="text-3xl font-black tracking-tight leading-none text-neutral-900 dark:text-white">
                          {pet.name}
                        </h3>
                        <p className="text-sm font-bold mt-1 text-neutral-600 dark:text-gray-400">
                          {breedName || "N/A"}
                        </p>
                      </div>

                      <div className="relative">
                        <button
                          onClick={(e) => toggleMenu(e, pet.id)}
                          className="text-neutral-500 dark:text-gray-400 hover:text-neutral-900 dark:hover:text-white transition-colors p-1"
                        >
                          <MoreVertical size={20} />
                        </button>

                        {isMenuOpen && (
                          <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-black/90 backdrop-blur-xl rounded-2xl shadow-xl py-2 border border-black/5 dark:border-white/10 z-[100] animate-in fade-in zoom-in-95 origin-top-right">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                openEditModal(pet);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-gray-200 font-bold transition-colors"
                            >
                              <Edit3 size={18} className="text-indigo-500 dark:text-indigo-400" /> {t("edit")}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeletePet(pet.id);
                                setActiveMenuId(null);
                              }}
                              className="w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-red-500/10 text-red-600 dark:text-red-400 font-bold transition-colors border-t border-black/5 dark:border-white/10"
                            >
                              <Trash2 size={18} /> {t("delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {viewMode === "grid" && (
                    <>
                      <h3 className="text-2xl font-black tracking-tight mb-1 leading-tight text-white">
                        {pet.name}
                      </h3>
                      <p className="text-sm font-bold mb-4 text-white/80">{breedName}</p>
                    </>
                  )}

                  {/* CHIPS / ETIKETLER */}
                  <div className={`flex items-center gap-3 mt-3 ${viewMode === "grid" ? "" : "mt-auto"}`}>
                    {ageInfo && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-300 text-xs font-bold">
                        <Calendar size={14} />
                        <span>{ageInfo}</span>
                      </div>
                    )}

                    {pet.weight && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-bold">
                        <Weight size={14} />
                        <span>
                          {pet.weight} {weightUnit || "kg"}
                        </span>
                      </div>
                    )}
                  </div>
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
