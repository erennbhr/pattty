import React, { useState, useEffect } from 'react';
import { X, Edit3, Plus, CheckSquare, ChevronRight, ChevronDown, MoreHorizontal, Pipette, Cat, Dog, Bird, Rabbit, Fish, Turtle, PawPrint, Venus, Mars } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { calculateAge, getLocalizedData } from '../utils/helpers';
import InteractiveSleepingPet from './InteractiveSleepingPet';

const AddPetModal = ({ onClose, onAdd, initialData }) => {
  const { t, language, toUpper } = useLanguage();
  const { weightUnit } = useApp();
  const showNotification = useNotification();
  
  const [formData, setFormData] = useState(initialData || { name: '', type: 'cat', breed: '', age: '', birthDate: '', weight: '', gender: 'female', color: '#9ca3af', microchipId: '' });
  
  // Ağırlık state'lerini başlat
  const [valMajor, setValMajor] = useState(''); 
  const [valMinor, setValMinor] = useState(''); 

  // Modal açılışında kilo verilerini doldur (Aynı mantık)
  useEffect(() => {
      if (initialData?.weight) {
          const kgValue = parseFloat(initialData.weight);
          if (weightUnit === 'kg') {
              setValMajor(Math.floor(kgValue));
              setValMinor(Math.round((kgValue - Math.floor(kgValue)) * 1000));
          } else {
              const totalLbs = kgValue * 2.20462;
              setValMajor(Math.floor(totalLbs));
              setValMinor(Math.round((totalLbs - Math.floor(totalLbs)) * 16));
          }
      }
  }, [initialData, weightUnit]);

  const [errors, setErrors] = useState({});
  const [showOther, setShowOther] = useState(false);

  // Yaş hesaplama
  useEffect(() => {
      if(formData.birthDate) {
          const ageText = calculateAge(formData.birthDate, t);
          setFormData(prev => ({...prev, age: ageText}));
      }
  }, [formData.birthDate, t]);

  // Kilo hesaplama
  useEffect(() => {
      const major = parseFloat(valMajor) || 0;
      const minor = parseFloat(valMinor) || 0;
      let totalKg = 0;

      if (weightUnit === 'kg') {
          totalKg = major + (minor / 1000);
      } else {
          const totalLbs = major + (minor / 16);
          totalKg = totalLbs / 2.20462;
      }

      // Kilo değiştiğinde formData'yı güncelle ama validasyonu burada yapma, save anında yap.
      setFormData(prev => ({ ...prev, weight: totalKg > 0 ? parseFloat(totalKg.toFixed(3)) : '' }));
      if (totalKg > 0 && errors.weight) setErrors(prev => ({ ...prev, weight: false }));
  }, [valMajor, valMinor, weightUnit]);

  // --- GELİŞMİŞ VALIDASYON (YENİ) ---
  const validateForm = () => {
      const newErrors = {};
      
      // 1. Temel Boş Alan Kontrolü
      if (!formData.name) newErrors.name = true;
      if (!formData.breed) newErrors.breed = true;
      if (!formData.gender) newErrors.gender = true;
      if (!formData.birthDate) newErrors.birthDate = true;
      if (!formData.weight) newErrors.weight = true;

      // Hata varsa önce bunları göster
      if (Object.keys(newErrors).length > 0) {
          setErrors(newErrors);
          showNotification(t('err_missing_fields'), 'error');
          return false;
      }

      // 2. İsim Kontrolü (Sadece Harf ve Boşluk, Min 2 Karakter)
      const nameRegex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
      if (!nameRegex.test(formData.name)) {
          showNotification(t('err_name_format'), 'error');
          setErrors({ ...newErrors, name: true });
          return false;
      }
      if (formData.name.length < 2 || formData.name.length > 25) {
          showNotification(t('err_name_length'), 'error');
          setErrors({ ...newErrors, name: true });
          return false;
      }

      // 3. Doğum Tarihi Kontrolü (Gelecek ve Mantıksız Geçmiş)
      const today = new Date();
      const birth = new Date(formData.birthDate);
      
      if (birth > today) {
          showNotification(t('err_birth_future'), 'error');
          setErrors({ ...newErrors, birthDate: true });
          return false;
      }

      // Tür Bazlı Maksimum Yaş (Yıl)
      const maxAgeLimits = {
          'cat': 35,
          'dog': 35,
          'bird': 80, // Papağanlar uzun yaşar
          'turtle': 150,
          'rabbit': 20,
          'fish': 40,
          'other': 50
      };
      const limitYears = maxAgeLimits[formData.type] || 50;
      const minDate = new Date();
      minDate.setFullYear(today.getFullYear() - limitYears);

      if (birth < minDate) {
          showNotification(t('err_age_limit').replace('{limit}', limitYears), 'error');
          setErrors({ ...newErrors, birthDate: true });
          return false;
      }

      // 4. Kilo Kontrolü (Abartı Sınırları - KG cinsinden)
      const weightVal = parseFloat(formData.weight);
      const maxWeightLimits = {
          'cat': 30,    // En şişman kedi rekoru ~21kg
          'dog': 150,   // En ağır köpek ~140-150kg
          'bird': 10,   // Devekuşu değilse :)
          'rabbit': 25,
          'fish': 50,
          'turtle': 200, // Dev kaplumbağa olabilir
          'other': 500
      };
      const limitWeight = maxWeightLimits[formData.type] || 200;

      if (weightVal <= 0) {
          showNotification(t('err_weight_zero'), 'error');
          setErrors({ ...newErrors, weight: true });
          return false;
      }
      if (weightVal > limitWeight) {
          showNotification(t('err_weight_limit').replace('{limit}', limitWeight), 'error');
          setErrors({ ...newErrors, weight: true });
          return false;
      }

      return true;
  };

  const handleSave = () => {
      if (!validateForm()) return;

      const weightEntry = {
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(formData.weight)
      };

      const finalData = {
          ...formData,
          weights: initialData ? initialData.weights : [weightEntry] 
      };

      onAdd(finalData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if(errors[name]) setErrors(prev => ({...prev, [name]: false}));
  };

  const handleTypeSelect = (type) => { 
      setFormData(prev => ({ ...prev, type, breed: '' }));
  };
   
  const TypeOption = ({ type, label }) => {
      const icons = {
          cat: Cat, dog: Dog, bird: Bird, rabbit: Rabbit, fish: Fish, turtle: Turtle, other: MoreHorizontal
      };
      const Icon = icons[type] || PawPrint;
      const isSelected = formData.type === type;
      return (
        <button 
            onClick={() => handleTypeSelect(type)} 
            className={`p-3 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center justify-center gap-2 group active:scale-95 ${isSelected ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' : 'border-gray-100 dark:border-neutral-800 hover:border-indigo-200 dark:hover:border-neutral-700'}`}
        >
            <div className={`p-3 rounded-full transition-colors ${isSelected ? 'bg-white dark:bg-neutral-800 text-indigo-600 shadow-sm' : 'bg-gray-50 dark:bg-neutral-800 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'}`}>
                 <Icon size={24} strokeWidth={2} />
            </div>
            <span className={`text-xs font-bold ${isSelected ? 'text-indigo-700 dark:text-indigo-300' : 'text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300'}`}>{label}</span>
        </button>
      );
  };

  const primaryTypes = ['cat', 'dog', 'bird'];
  const secondaryTypes = ['rabbit', 'fish', 'turtle', 'other'];
  
  const colorPresets = [
      '#ffffff', '#000000', '#9ca3af', '#4b5563', 
      '#fb923c', '#fde68a', '#78350f', '#854d0e', 
      '#ef4444', '#3b82f6', '#8b5cf6', '#ec4899'
  ];

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      <div className="bg-white dark:bg-neutral-900 w-full max-w-lg sm:rounded-3xl rounded-none relative pointer-events-auto animate-in slide-in-from-bottom duration-300 shadow-2xl flex flex-col h-full sm:h-auto sm:max-h-[90vh]">
          
          <div className="p-4 border-b border-gray-100 dark:border-neutral-800 flex justify-between items-center bg-white/50 dark:bg-neutral-900/50 backdrop-blur-md sm:rounded-t-3xl sticky top-0 z-20 pt-safe">
               <h2 className="font-bold text-lg dark:text-white flex items-center gap-2">{initialData ? <Edit3 size={18} className="text-indigo-500"/> : <Plus size={18} className="text-indigo-500"/>} {initialData ? t('update') : t('form_grow')}</h2>
              <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-neutral-800 rounded-full hover:bg-gray-200 transition-colors"><X size={18}/></button>
          </div>

          <div className="shrink-0 flex justify-center py-6 bg-gray-50/50 dark:bg-neutral-900/50 border-b border-gray-50 dark:border-neutral-800/50 relative">
              <div className="w-56 h-56 relative overflow-visible drop-shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <InteractiveSleepingPet type={formData.type} color={formData.color} className="w-full h-full" />
              </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-6 pt-4 space-y-6">
              
              <div className="space-y-3">
                   <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_type'))}</label>
                  <div className="grid grid-cols-3 gap-3">
                      {primaryTypes.map(type => <TypeOption key={type} type={type} label={t(`type_${type}`)} />)}
                  </div>
                  {!showOther ? (
                      <button onClick={() => setShowOther(true)} className="w-full p-3 rounded-2xl border-2 border-dashed border-gray-200 dark:border-neutral-700 text-gray-400 font-bold text-sm flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-neutral-800 transition-colors">
                          <MoreHorizontal size={20} /> <span>{t('other_types')}</span>
                      </button>
                  ) : (
                      <div className="grid grid-cols-4 gap-3 animate-in slide-in-from-top-2 fade-in">
                          {secondaryTypes.map(type => <TypeOption key={type} type={type} label={t(`type_${type}`)} />)}
                          <button onClick={() => setShowOther(false)} className="col-span-4 p-2 text-xs text-gray-400 font-bold flex items-center justify-center gap-1 hover:text-gray-600"><ChevronDown className="rotate-180" size={14}/> {t('hide')}</button>
                      </div>
                  )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_name'))}</label>
                      <input name="name" value={formData.name} onChange={handleChange} placeholder={t('name_placeholder')} className={`w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white transition-all font-bold ${errors.name ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} />
                  </div>
                  <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 tracking-wider block">
                            {formData.type === 'other' ? toUpper(t('form_custom_type')) : toUpper(t('form_breed'))}
                        </label>
                        {formData.type === 'other' ? (
                            <input name="breed" value={formData.breed} onChange={handleChange} placeholder={t('custom_type_placeholder')} className={`w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold transition-all ${errors.breed ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} />
                        ) : (
                             <div className="relative">
                                <select name="breed" value={formData.breed} onChange={handleChange} className={`w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold appearance-none transition-all ${errors.breed ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`}>
                                    <option value="">{t('select')}</option>
                                    {getLocalizedData(language, t).breeds(formData.type).map(b => <option key={b} value={b}>{b}</option>)}
                                 </select>
                                <ChevronRight className="absolute right-4 top-4 text-gray-400 rotate-90 pointer-events-none" size={18}/>
                            </div>
                        )}
                  </div>
              </div>

              <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_gender'))}</label>
                      <div className={`flex bg-gray-100 dark:bg-neutral-800 p-1.5 rounded-2xl border-2 transition-all ${errors.gender ? 'border-red-500 ring-1 ring-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`}>
                          <button onClick={() => {setFormData({...formData, gender: 'female'}); if(errors.gender) setErrors({...errors, gender:false})}} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${formData.gender === 'female' ? 'bg-white dark:bg-neutral-700 shadow-sm text-pink-500' : 'text-gray-400'}`}><Venus size={16}/> {t('gender_f_label')}</button>
                          <button onClick={() => {setFormData({...formData, gender: 'male'}); if(errors.gender) setErrors({...errors, gender:false})}} className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${formData.gender === 'male' ? 'bg-white dark:bg-neutral-700 shadow-sm text-blue-500' : 'text-gray-400'}`}><Mars size={16}/> {t('gender_m_label')}</button>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_color'))}</label>
                      <div className="flex flex-wrap justify-start gap-4 p-2 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-gray-100 dark:border-neutral-800">
                          {colorPresets.map(color => (
                              <button 
                                key={color} 
                                onClick={() => setFormData({...formData, color})}
                                className={`w-10 h-10 rounded-full border-2 transition-all duration-300 transform 
                                    ${formData.color === color ? 'border-indigo-500 scale-125 ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-lg' : 'border-gray-200 dark:border-neutral-600 hover:scale-110'}
                                `}
                                style={{backgroundColor: color}}
                              />
                          ))}
                          
                          <div className="relative group">
                              <div className={`w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 border-2 transition-all duration-300 flex items-center justify-center
                                ${!colorPresets.includes(formData.color) ? 'border-indigo-500 scale-125 ring-2 ring-indigo-200 dark:ring-indigo-900 shadow-lg' : 'border-gray-200 dark:border-neutral-600 hover:scale-110'}
                              `}>
                                  <Pipette size={16} className="text-white drop-shadow-md"/>
                              </div>
                              <input 
                                type="color" 
                                value={formData.color} 
                                onChange={(e) => setFormData({...formData, color: e.target.value})} 
                                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                              />
                          </div>
                      </div>
                    </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_birth'))}</label>
                       <input type="date" name="birthDate" value={formData.birthDate} onChange={handleChange} className={`w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl outline-none border-2 focus:border-indigo-500/50 dark:text-white font-bold text-sm transition-all min-h-[56px] block ${errors.birthDate ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`} />
                  </div>
                  <div className="space-y-2">
                       <label className="text-xs font-bold text-gray-400 tracking-wider block">{toUpper(t('form_weight'))}</label>
                       
                       <div className={`flex gap-2 p-1.5 bg-gray-50 dark:bg-neutral-800 rounded-2xl border-2 transition-all ${errors.weight ? 'border-red-500 bg-red-50 dark:bg-red-900/10' : 'border-transparent'}`}>
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    min="0" 
                                    placeholder="0"
                                    value={valMajor} 
                                    onChange={e => setValMajor(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-neutral-700 rounded-xl text-center dark:text-white font-bold outline-none shadow-sm" 
                                />
                                <span className="absolute right-2 top-3 text-[10px] font-bold text-gray-400 pointer-events-none">
                                    {weightUnit === 'kg' ? t('lbl_kg') : t('lbl_lbs')}
                                </span>
                            </div>
                            <div className="relative flex-1">
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="999"
                                    placeholder="000"
                                    value={valMinor} 
                                    onChange={e => setValMinor(e.target.value)} 
                                    className="w-full p-2.5 bg-white dark:bg-neutral-700 rounded-xl text-center dark:text-white font-bold outline-none shadow-sm" 
                                />
                                <span className="absolute right-2 top-3 text-[10px] font-bold text-gray-400 pointer-events-none">
                                    {weightUnit === 'kg' ? t('lbl_gr') : t('lbl_oz')}
                                </span>
                            </div>
                       </div>
                  </div>
              </div>
           </div>

          <div className="p-6 bg-white dark:bg-neutral-900 border-t border-gray-100 dark:border-neutral-800 rounded-b-3xl sticky bottom-0 z-20">
              <button onClick={handleSave} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/30 active:scale-95 transition-transform flex items-center justify-center gap-2 hover:bg-indigo-700">
                 <CheckSquare size={22} /> {initialData ? t('update') : t('save')}
              </button>
          </div>
      </div>
    </div>
  );
}

export default AddPetModal;