import React, { useState } from 'react';
import { Check, Sliders, Plus, Venus, Mars, Trash2, Edit3, PawPrint } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useApp } from '../context/AppContext';
import InteractiveSleepingPet from './InteractiveSleepingPet';

const MyPetsHub = ({ setPet, openAddModal, openEditModal, onDeletePet }) => {
  const { t } = useLanguage();
  // Verileri Context'ten çekiyoruz
  const { pets } = useApp();
  
  // Düzenleme modunu açıp kapatan state
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <div className="p-6 space-y-6 animate-in fade-in slide-in-from-right-4 pb-32">
      {/* Başlık ve Butonlar */}
      <div className="flex justify-between items-center mb-2">
          <h2 className="text-3xl font-bold dark:text-white">{t('nav_pets')}</h2>
          <div className="flex gap-3">
              {/* Düzenleme Modu Butonu */}
              <button 
                onClick={() => setIsEditMode(!isEditMode)} 
                className={`p-3 rounded-xl transition-all ${isEditMode ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' : 'bg-white dark:bg-neutral-800 text-gray-500 border border-gray-200 dark:border-neutral-700'}`}
              >
                {isEditMode ? <Check size={20} /> : <Sliders size={20} />}
              </button>
              
              {/* Yeni Ekle Butonu */}
              <button 
                onClick={openAddModal} 
                className="flex items-center gap-2 px-5 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/30 active:scale-95 transition-all hover:bg-indigo-700"
              >
                <Plus size={18} /> <span>{t('add_new')}</span>
              </button>
          </div>
      </div>

      {/* Hayvan Kartları Izgarası */}
      <div className="grid grid-cols-2 gap-4">
        {pets.map((pet) => (
           <div key={pet.id} className="relative group">
             {/* Ana Kart Butonu */}
             <button 
                onClick={() => setPet(pet.id)} // Detay sayfasına git
                className={`w-full bg-white dark:bg-neutral-900 rounded-[2rem] flex flex-col items-center text-center active:scale-[0.98] transition-all overflow-hidden border border-gray-100 dark:border-neutral-800 shadow-xl shadow-gray-200/50 dark:shadow-none p-4 h-64 justify-between 
                ${isEditMode ? 'ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-black' : ''}`}
             >
                {/* İsim ve Tür Bilgisi */}
                <div className="w-full flex justify-between items-start z-10">
                   <div className="text-left">
                       <h3 className="font-extrabold text-lg text-gray-900 dark:text-white leading-tight truncate max-w-[80px]">{pet.name}</h3>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{pet.type}</p>
                   </div>
                   {/* Cinsiyet İkonu */}
                   <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${pet.gender==='female'?'bg-pink-50 text-pink-500':'bg-blue-50 text-blue-500'}`}>
                       {pet.gender === 'female' ? <Venus size={14}/> : <Mars size={14}/>}
                   </div>
                </div>
                
                {/* Görsel */}
                <div className="w-32 h-32 transform scale-125 translate-y-2 drop-shadow-lg">
                    <InteractiveSleepingPet type={pet.type} color={pet.color} className="w-full h-full"/>
                </div>
                
                {/* Irk Bilgisi */}
                <div className="w-full pt-2 border-t border-gray-50 dark:border-neutral-800 mt-2">
                    <p className="text-xs font-medium text-gray-500">{pet.breed}</p>
                </div>
             </button>
             
             {/* Düzenleme Modu Aktifse Silme Butonu Göster */}
             {isEditMode ? (
                 <button 
                    onClick={() => onDeletePet(pet.id)} 
                    className="absolute -top-2 -right-2 w-10 h-10 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg active:scale-90 z-20 animate-in zoom-in"
                 >
                    <Trash2 size={18}/>
                 </button>
             ) : (
                 // Değilse Edit Butonu (Hover ile görünür)
                 <button 
                    onClick={(e) => { e.stopPropagation(); openEditModal(pet); }} 
                    className="absolute top-4 right-4 p-2 bg-white/80 dark:bg-black/50 text-gray-400 hover:text-indigo-600 rounded-xl active:scale-90 transition-colors z-20 backdrop-blur opacity-0 group-hover:opacity-100"
                 >
                    <Edit3 size={16}/>
                 </button>
             )}
           </div>
        ))}

        {/* Liste Boşsa Gösterilecek Mesaj */}
        {pets.length === 0 && (
            <div className="col-span-2 text-center text-gray-400 py-20 flex flex-col items-center">
                <PawPrint size={48} className="opacity-10 mb-4"/>
                {t('no_pets_desc')}
            </div>
        )}
      </div>
    </div>
  );
}

export default MyPetsHub;