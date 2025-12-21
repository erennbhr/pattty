// src/components/AddPetModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Edit3, Plus, CheckSquare, ChevronRight, ChevronLeft, ChevronDown,
  Camera, Upload, Sparkles, Loader2, Info, Check, AlertCircle, AlertTriangle,
  Cat, Dog, Bird, Rabbit, Fish, Turtle, PawPrint, MoreHorizontal,
  Venus, Mars, Target, RefreshCcw, Lock, Scissors, Trash2
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { useApp } from '../context/AppContext';
import { usePremium } from '../context/PremiumContext'; 
import { calculateAge, getLocalizedData, analyzePetPhoto, generateID, getScanStatusSteps, generateStyledPetImage } from '../utils/helpers';

// 🟢 AKILLI TOOLTIP BİLEŞENİ
const Tooltip = ({ text }) => {
  const [visible, setVisible] = useState(false);
  const [align, setAlign] = useState('center'); 
  const buttonRef = useRef(null);

  const handleInteraction = () => {
      if (buttonRef.current) {
          const rect = buttonRef.current.getBoundingClientRect();
          const screenWidth = window.innerWidth;
          
          if (rect.left < 150) {
              setAlign('left');
          } else if (rect.right > screenWidth - 150) {
              setAlign('right');
          } else {
              setAlign('center');
          }
      }
      setVisible(true);
  };

  const handleLeave = () => {
      setVisible(false);
  };

  const handleClick = (e) => {
      e.stopPropagation(); 
      if (visible) handleLeave();
      else handleInteraction();
  };

  let containerClasses = "absolute bottom-full mb-2 w-48 p-3 bg-gray-900/95 dark:bg-black/95 text-white text-xs rounded-xl backdrop-blur-md z-50 text-left shadow-2xl border border-white/10 animate-in fade-in zoom-in-95 leading-relaxed pointer-events-none";
  let arrowClasses = "absolute top-full border-4 border-transparent border-t-gray-900/95 dark:border-t-black/95";

  if (align === 'left') {
      containerClasses += " left-0 origin-bottom-left"; 
      arrowClasses += " left-2";
  } else if (align === 'right') {
      containerClasses += " right-0 origin-bottom-right";
      arrowClasses += " right-2";
  } else {
      containerClasses += " left-1/2 -translate-x-1/2 origin-bottom";
      arrowClasses += " left-1/2 -translate-x-1/2";
  }

  return (
    <div className="relative flex items-center z-50">
      <button 
        ref={buttonRef}
        type="button"
        onMouseEnter={handleInteraction} 
        onMouseLeave={handleLeave}
        onClick={handleClick}
        className="text-amber-500 hover:text-amber-600 transition-colors focus:outline-none p-1"
      >
        <AlertCircle size={16} />
      </button>
      {visible && (
        <div className={containerClasses}>
          {text}
          <div className={arrowClasses} />
        </div>
      )}
    </div>
  );
};

const AddPetModal = ({ onClose, onAdd, initialData }) => {
  const { t, language } = useLanguage();
  const { weightUnit } = useApp();
  const { isPremium } = usePremium();
  
  const notificationCtx = useNotification();
  const showNotification = (notificationCtx && typeof notificationCtx.showNotification === 'function')
    ? notificationCtx.showNotification
    : (typeof notificationCtx === 'function' ? notificationCtx : () => console.warn("Bildirim sistemi yüklenemedi"));

  const fileInputRef = useRef(null);
  
  // --- STATE YÖNETİMİ ---
  const [step, setStep] = useState(initialData ? 3 : 1);
  
  const [formData, setFormData] = useState(initialData || { 
    name: '', type: 'cat', customType: '',
    breed: '', customBreed: '',
    visual_details: '', 
    age: '', birthDate: '', weight: '', 
    gender: '', 
    isNeutered: null,
    color: '#9ca3af', microchipId: '', image: null 
  });

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(initialData?.image || null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [autoFilledFields, setAutoFilledFields] = useState({}); 
  const [scanStatus, setScanStatus] = useState("");
  
  const [showSecondaryTypes, setShowSecondaryTypes] = useState(false);

  const [isStyleGenerating, setIsStyleGenerating] = useState(false);
  const [regenCount, setRegenCount] = useState(0);
  const [showRegenInput, setShowRegenInput] = useState(false); 
  const [regenPrompt, setRegenPrompt] = useState("");
  const [generatedImageUrl, setGeneratedImageUrl] = useState(null);

  const [valMajor, setValMajor] = useState(''); 
  const [valMinor, setValMinor] = useState(''); 
  const [errors, setErrors] = useState({});

  const localizedBreeds = getLocalizedData(language, t).breeds(formData.type);
  const otherOptionLabel = localizedBreeds[localizedBreeds.length - 1];

  const maxRegens = isPremium ? 3 : 1;

  // İlk Yükleme
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

  // Yaş Hesaplama
  useEffect(() => {
      if(formData.birthDate) {
          const ageText = calculateAge(formData.birthDate, t);
          setFormData(prev => ({...prev, age: ageText}));
      }
  }, [formData.birthDate, t]);

  // Kilo Hesaplama
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

      setFormData(prev => ({ ...prev, weight: totalKg > 0 ? parseFloat(totalKg.toFixed(3)) : '' }));
      
      if (totalKg > 0 && errors.weight) {
          setErrors(prev => {
              const newErr = {...prev};
              delete newErr.weight;
              return newErr;
          });
      }
  }, [valMajor, valMinor, weightUnit]);

  // 🔴 VALIDASYON 🔴

  const isValidName = (name) => {
      const regex = /^[a-zA-ZğüşıöçĞÜŞİÖÇ\s]+$/;
      return regex.test(name);
  };

  const validateStep3 = () => {
      const newErrors = {};
      
      if (!formData.name || formData.name.trim().length < 2) {
          newErrors.name = true;
          showNotification(t('err_name_length'), 'error');
      } else if (formData.name.length > 25) {
          newErrors.name = true;
          showNotification(t('err_name_length'), 'error');
      } else if (!isValidName(formData.name)) {
          newErrors.name = true;
          showNotification(t('err_name_format'), 'error');
      }

      if (formData.type === 'other' && !formData.customType) {
          newErrors.customType = true;
          showNotification(t('err_custom_type_required'), 'error');
      }

      if (!formData.breed) {
          newErrors.breed = true;
          showNotification(t('err_missing_fields'), 'error');
      }

      if (formData.breed === otherOptionLabel && !formData.customBreed) {
          newErrors.customBreed = true;
          showNotification(t('err_custom_breed_required'), 'error');
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
      const newErrors = {};
      const today = new Date();
      
      if (!formData.birthDate) {
          newErrors.birthDate = true;
          showNotification(t('err_missing_fields'), 'error');
      } else {
          const birth = new Date(formData.birthDate);
          if (birth > today) {
              newErrors.birthDate = true;
              showNotification(t('err_birth_future'), 'error');
          } else {
              const maxAgeLimits = {
                  'cat': 35, 'dog': 35, 'bird': 80, 'turtle': 150,
                  'rabbit': 20, 'fish': 40, 'other': 100
              };
              const limitYears = maxAgeLimits[formData.type] || 50;
              const minDate = new Date();
              minDate.setFullYear(today.getFullYear() - limitYears);

              if (birth < minDate) {
                  newErrors.birthDate = true;
                  showNotification(t('err_age_limit').replace('{limit}', limitYears), 'error');
              }
          }
      }

      if (!formData.gender) {
          newErrors.gender = true;
          showNotification(t('err_missing_fields'), 'error');
      }

      const weightVal = parseFloat(formData.weight);
      if (!weightVal || weightVal <= 0) {
          newErrors.weight = true;
          showNotification(t('err_weight_zero'), 'error');
      } else {
          const maxWeightLimits = {
              'cat': 30, 'dog': 150, 'bird': 10, 'rabbit': 25,
              'fish': 50, 'turtle': 200, 'other': 1000
          };
          const limitWeight = maxWeightLimits[formData.type] || 500;
          
          if (weightVal > limitWeight) {
              newErrors.weight = true;
              showNotification(t('err_weight_limit').replace('{limit}', limitWeight), 'error');
          }
      }

      if (['cat', 'dog', 'rabbit'].includes(formData.type)) {
          if (formData.isNeutered === null) {
              newErrors.isNeutered = true;
              showNotification(t('err_neutered_required'), 'error');
          }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
  };

  // --- HANDLERS ---

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { 
          showNotification(t('err_file_too_large'), 'error');
          return;
      }
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPreviewUrl(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const startAnalysis = async () => {
    if (!selectedFile) return;
    
    setStep(2);
    setIsAnalyzing(true);

    const statusSteps = getScanStatusSteps(t);
    let stepIndex = 0;
    setScanStatus(statusSteps[0]);
    
    const interval = setInterval(() => {
        stepIndex++;
        if (stepIndex < statusSteps.length) {
            setScanStatus(statusSteps[stepIndex]);
        }
    }, 1000);

    try {
        const result = await analyzePetPhoto(selectedFile);
        clearInterval(interval);

        const predictedBreed = result.breed || '';
        let detectedType = result.species || 'other';
        const supportedTypes = ['cat', 'dog', 'bird', 'rabbit', 'fish', 'turtle'];
        
        let finalCustomType = '';

        if (!supportedTypes.includes(detectedType)) {
            finalCustomType = detectedType; 
            detectedType = 'other';
        }

        const typeBreeds = getLocalizedData(language, t).breeds(detectedType);
        const matchedBreed = typeBreeds.find(b => b.toLowerCase() === predictedBreed.toLowerCase());

        let finalBreedVal = matchedBreed ? matchedBreed : otherOptionLabel;
        let finalCustomBreed = matchedBreed ? '' : predictedBreed;

        setFormData(prev => ({
            ...prev,
            type: detectedType,
            customType: finalCustomType,
            breed: finalBreedVal,
            customBreed: finalCustomBreed,
            color: result.fur_color || '#9ca3af',
            visual_details: result.visual_details || "", // Detaylar
            image: previewUrl 
        }));

        setAutoFilledFields({ type: true, breed: true, color: true });

        setTimeout(() => {
            setIsAnalyzing(false);
            setStep(3);
        }, 800); 

    } catch (error) {
        clearInterval(interval);
        console.error("Analiz hatası:", error);
        showNotification(t('err_analysis_failed'), "error");
        setIsAnalyzing(false);
        setStep(3);
    }
  };

  const handleNext = () => {
      if (step === 3) {
          if (!validateStep3()) return; 
      }
      setStep(prev => prev + 1);
  };

  const handleGoToConfirmation = async () => {
      if (!validateStep4()) return; 
      
      if (initialData) {
          handleFinalSave();
          return;
      }

      setStep(5);
      if (!generatedImageUrl && selectedFile) {
          generateImage();
      }
  };

  const generateImage = async (prompt = "") => {
      if (!formData.visual_details && !prompt) {
         showNotification(t('err_missing_pet_details'), "error"); 
         return;
      }

      setIsStyleGenerating(true);
      try {
          const url = await generateStyledPetImage(formData, prompt);
          
          setGeneratedImageUrl(url);
          setFormData(prev => ({ ...prev, image: url }));
      
      } catch (e) {
          console.error(e);
          showNotification(t('err_image_gen_failed'), "error"); 
      } finally {
          setIsStyleGenerating(false);
      }
  };

  const handleRegenerate = () => {
      if (regenCount >= maxRegens) {
          showNotification(t('regen_limit_reached'), 'error');
          return;
      }
      generateImage(regenPrompt);
      setRegenCount(prev => prev + 1);
      setShowRegenInput(false);
      setRegenPrompt("");
  };

  const handleBack = () => {
      if (initialData && step === 3) {
          onClose();
          return;
      }
      setStep(prev => prev - 1);
  };

  const handleFinalSave = async () => {
      const weightEntry = {
          date: new Date().toISOString().split('T')[0],
          weight: parseFloat(formData.weight) || 0
      };

      const finalBreedName = (formData.breed === otherOptionLabel && formData.customBreed) 
          ? formData.customBreed 
          : formData.breed;
      
      const finalData = {
          ...formData,
          breed: finalBreedName,
          id: initialData?.id || generateID(),
          weights: initialData ? (formData.weight ? [...(initialData.weights || []), weightEntry] : initialData.weights) : [weightEntry],
          image: generatedImageUrl || formData.image 
      };
      
      delete finalData.customBreed;
      if (!finalData.visual_details) delete finalData.visual_details;

      try {
          await onAdd(finalData); 
          onClose();
      } catch (error) {
          console.error("Kayıt sırasında hata oluştu:", error);
          showNotification(t('err_save_failed'), "error"); 
      }
  };

  const AutoFillIndicator = () => (
      <div className="ml-2 animate-in zoom-in">
          <Tooltip text={t('ai_auto_fill_tooltip')} />
      </div>
  );

  const TypeButton = ({ type, label, icon: Icon }) => (
      <button 
        type="button"
        onClick={() => {
            setFormData({...formData, type});
            if(formData.type !== type) {
                setFormData(prev => ({...prev, type, breed: '', customBreed: '', customType: '', isNeutered: null}));
            }
            if(errors.type) setErrors(prev => ({...prev, type: false}));
        }}
        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all active:scale-95 duration-300
          ${formData.type === type 
            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 shadow-xl shadow-indigo-500/10 scale-105' 
            : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'
          }`}
      >
          <Icon size={32} strokeWidth={1.5} className={formData.type === type ? "animate-bounce-slow" : ""} />
          <span className="text-xs font-bold tracking-wide uppercase">{label}</span>
      </button>
  );

  const ScanStyles = () => (
    <style>{`
        @keyframes scan {
            0% { top: 0%; opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { top: 100%; opacity: 0; }
        }
        .scan-animation {
            animation: scan 2s linear infinite;
            box-shadow: 0 0 20px rgba(99, 102, 241, 0.6);
        }
    `}</style>
  );

  const getStepTitle = () => {
      if (initialData) return t('edit_pet_title') || "Düzenle";
      switch(step) {
          case 1: return t('step_1_title');
          case 2: return t('step_2_title');
          case 3: return t('step_3_title');
          case 4: return t('step_4_title');
          case 5: return t('step_5_title');
          default: return "";
      }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 sm:p-6">
      <ScanStyles />
      <div className="absolute inset-0 bg-gray-900/60 dark:bg-black/80 backdrop-blur-xl transition-opacity animate-in fade-in duration-500" onClick={onClose} />
      
      {/* Modal Container: Glassmorphism */}
      <div className="w-full max-w-lg bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-[2.5rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] transition-all duration-500 animate-in zoom-in-95 slide-in-from-bottom-8">
        
        {/* Header: Glassmorphism */}
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl sticky top-0 z-20">
            <div>
                <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter flex items-center gap-2">
                    {getStepTitle()}
                </h2>
                <div className="flex gap-1 mt-1.5">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${i <= step ? 'w-6 bg-indigo-500' : 'w-2 bg-gray-200 dark:bg-white/10'}`} />
                    ))}
                </div>
            </div>
            <button onClick={onClose} className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/20 hover:text-red-500 transition-all active:scale-90">
                <X size={20} />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scroll-smooth custom-scrollbar">
            
            {step === 1 && !initialData && (
                <div className="flex flex-col h-full justify-center gap-8 animate-in slide-in-from-right duration-500">
                    <div 
                        onClick={() => fileInputRef.current.click()}
                        className="flex-1 min-h-[320px] border-2 border-dashed border-indigo-200 dark:border-white/10 rounded-[2.5rem] bg-indigo-50/30 dark:bg-white/5 hover:bg-indigo-50 dark:hover:bg-white/10 transition-all cursor-pointer flex flex-col items-center justify-center group relative overflow-hidden active:scale-[0.99]"
                    >
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
                        
                        {previewUrl ? (
                            <>
                                <img src={previewUrl} alt={t('preview_alt_text')} className="w-full h-full object-cover absolute inset-0 transition-transform duration-700 group-hover:scale-105" />
                                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors backdrop-blur-[2px] group-hover:backdrop-blur-none" />
                                <div className="z-10 bg-white/90 dark:bg-white/10 backdrop-blur-xl px-6 py-3 rounded-2xl text-gray-900 dark:text-white font-bold flex items-center gap-3 shadow-2xl border border-white/20 transform group-hover:-translate-y-1 transition-transform">
                                    <Edit3 size={18} className="text-indigo-500 dark:text-white"/> {t('change_photo')} 
                                </div>
                            </>
                        ) : (
                            <div className="text-center p-6">
                                <div className="w-28 h-28 bg-white dark:bg-white/5 rounded-full flex items-center justify-center text-indigo-500 dark:text-white mb-6 group-hover:scale-110 transition-transform duration-500 shadow-xl shadow-indigo-500/10">
                                    <Upload size={48} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">{t('upload_area_title')}</h3>
                                <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('upload_area_desc')}</p>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={startAnalysis}
                        disabled={!selectedFile}
                        className="w-full py-5 bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold text-lg rounded-2xl shadow-xl shadow-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 hover:shadow-2xl hover:brightness-110 active:scale-[0.98] transition-all duration-300"
                    >
                        <Sparkles className="animate-pulse" /> {t('ai_analyzing_btn')}
                    </button>
                </div>
            )}

            {step === 2 && (
                <div className="flex flex-col items-center justify-center h-full py-8 animate-in zoom-in duration-700 relative">
                    <div className="relative w-72 h-72 rounded-[2.5rem] overflow-hidden border-4 border-indigo-500/30 dark:border-white/10 shadow-[0_0_100px_-20px_rgba(99,102,241,0.5)] bg-black">
                        <img src={previewUrl} className="w-full h-full object-cover opacity-60 scale-110" alt={t('scan_alt_text')} />
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-20 mix-blend-overlay" />
                        <div className="absolute left-0 w-full h-1 bg-indigo-400 scan-animation z-10 box-shadow-[0_0_20px_#818cf8]" />
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Target size={64} className="text-white/80 animate-spin-slow opacity-80" strokeWidth={1} />
                        </div>
                    </div>
                    <div className="mt-10 text-center space-y-3">
                        <div className="flex items-center justify-center gap-3">
                            <Loader2 size={24} className="text-indigo-500 animate-spin" />
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight animate-pulse">
                                {scanStatus}
                            </h3>
                        </div>
                        <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">{t('step_2_desc')}</p>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    <div className="group">
                        <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block ml-1">{t('form_name')}</label>
                        <input 
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            placeholder={t('name_placeholder')}
                            className={`w-full p-5 rounded-2xl font-bold text-lg outline-none transition-all appearance-none placeholder:font-medium
                                ${errors.name 
                                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500 text-red-900 dark:text-red-100' 
                                    : 'bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-white/10 text-gray-900 dark:text-white shadow-sm'
                                }`}
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t('form_type')}</label>
                            {autoFilledFields.type && <AutoFillIndicator />}
                        </div>
                        
                        {/* 🟢 DÜZELTME: SADECE KEDİ, KÖPEK, KUŞ VE DİĞER */}
                        <div className="grid grid-cols-4 gap-3">
                            <TypeButton type="cat" label={t('type_cat')} icon={Cat} />
                            <TypeButton type="dog" label={t('type_dog')} icon={Dog} />
                            <TypeButton type="bird" label={t('type_bird')} icon={Bird} />
                            <TypeButton type="other" label={t('type_other')} icon={PawPrint} />
                        </div>
                        
                        {formData.type === 'other' && (
                            <div className="mt-4 animate-in slide-in-from-top-4">
                                <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block ml-1">{t('form_custom_type')}</label>
                                <input 
                                    value={formData.customType}
                                    onChange={(e) => setFormData({...formData, customType: e.target.value})}
                                    placeholder={t('custom_type_placeholder')} 
                                    className={`w-full p-5 rounded-2xl font-bold outline-none transition-all appearance-none
                                        ${errors.customType
                                            ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500' 
                                            : 'bg-indigo-50 dark:bg-white/5 border-2 border-indigo-100 dark:border-white/10 text-indigo-900 dark:text-white focus:border-indigo-500'
                                        }`}
                                />
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t('form_breed')}</label>
                                {autoFilledFields.breed && <AutoFillIndicator />}
                            </div>
                            <div className="relative group">
                                <select 
                                    value={formData.breed}
                                    onChange={(e) => setFormData({...formData, breed: e.target.value})}
                                    className={`w-full p-5 rounded-2xl font-bold outline-none transition-all appearance-none bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 text-gray-900 dark:text-white
                                        ${errors.breed ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : ''}`}
                                >
                                    <option value="" className="bg-white dark:bg-[#111417]">{t('select')}</option>
                                    {localizedBreeds.map(b => (
                                        <option key={b} value={b} className="bg-white dark:bg-[#111417]">{b}</option>
                                    ))}
                                </select>
                                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-indigo-500 rotate-90 pointer-events-none transition-colors" size={20}/>
                            </div>
                            {formData.breed === otherOptionLabel && (
                                <div className="mt-3 animate-in slide-in-from-top-2">
                                    <input 
                                        value={formData.customBreed}
                                        onChange={(e) => setFormData({...formData, customBreed: e.target.value})}
                                        placeholder={t('custom_type_placeholder')}
                                        className={`w-full p-4 rounded-xl font-bold outline-none transition-all text-sm
                                            ${errors.customBreed
                                                ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500'
                                                : 'bg-indigo-50 dark:bg-white/5 border-2 border-indigo-100 dark:border-white/10'
                                            }`}
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t('form_color')}</label>
                                {autoFilledFields.color && <AutoFillIndicator />}
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 dark:bg-white/5 border-2 border-transparent hover:border-gray-200 dark:hover:border-white/10 p-2.5 rounded-2xl transition-all h-[68px]">
                                <input 
                                    type="color" 
                                    value={formData.color}
                                    onChange={(e) => setFormData({...formData, color: e.target.value})}
                                    className="w-12 h-12 rounded-xl border-none cursor-pointer bg-transparent shadow-sm"
                                />
                                <span className="text-sm font-mono font-bold text-gray-600 dark:text-gray-300 uppercase tracking-widest">{formData.color}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    <div>
                        <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block ml-1">{t('form_birth')}</label>
                        <input 
                            type="date"
                            value={formData.birthDate}
                            onChange={(e) => setFormData({...formData, birthDate: e.target.value})}
                            className={`w-full p-5 rounded-2xl font-bold text-lg outline-none transition-all appearance-none
                                ${errors.birthDate
                                    ? 'bg-red-50 dark:bg-red-900/20 border-2 border-red-500' 
                                    : 'bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 text-gray-900 dark:text-white' 
                                }`}
                        />
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t('form_gender')}</label>
                        </div>
                        <div className={`flex gap-4 p-1.5 rounded-2xl transition-all ${errors.gender ? 'bg-red-50 dark:bg-red-900/10 ring-2 ring-red-500' : ''}`}>
                            <button 
                                onClick={() => setFormData({...formData, gender: 'female'})}
                                className={`flex-1 py-5 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 active:scale-95 ${formData.gender === 'female' ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-500 shadow-lg shadow-pink-500/20' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                            >
                                <Venus size={24} /> {t('gender_f_label')}
                            </button>
                            <button 
                                onClick={() => setFormData({...formData, gender: 'male'})}
                                className={`flex-1 py-5 rounded-2xl border-2 flex items-center justify-center gap-3 font-bold text-lg transition-all duration-300 active:scale-95 ${formData.gender === 'male' ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 text-gray-400 hover:bg-gray-50 dark:hover:bg-white/10'}`}
                            >
                                <Mars size={24} /> {t('gender_m_label')}
                            </button>
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center gap-2 mb-3">
                            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest">{t('form_weight')}</label>
                            {autoFilledFields.estimated_weight && <AutoFillIndicator />}
                        </div>
                        <div className={`flex gap-4 p-1 rounded-2xl transition-all ${errors.weight ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500' : ''}`}>
                            <div className="relative flex-1 group">
                                <input 
                                    type="number" min="0" placeholder="0"
                                    value={valMajor} onChange={e => setValMajor(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 p-5 rounded-2xl text-gray-900 dark:text-white font-black text-2xl text-center outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-black tracking-widest">{weightUnit === 'kg' ? 'KG' : 'LBS'}</span>
                            </div>
                            <div className="relative flex-1 group">
                                <input 
                                    type="number" min="0" max="999" placeholder="000"
                                    value={valMinor} onChange={e => setValMinor(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-indigo-500 p-5 rounded-2xl text-gray-900 dark:text-white font-black text-2xl text-center outline-none"
                                />
                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-black tracking-widest">{weightUnit === 'kg' ? 'GR' : 'OZ'}</span>
                            </div>
                        </div>
                    </div>

                    {['cat', 'dog', 'rabbit'].includes(formData.type) && (
                        <div className="animate-in slide-in-from-right pt-2">
                            <label className="text-xs font-black text-indigo-500 uppercase tracking-widest mb-3 block ml-1">{t('form_neutered')}</label>
                            
                            <div className={`relative w-full h-16 bg-gray-100 dark:bg-white/5 rounded-2xl p-1.5 flex items-center cursor-pointer transition-all ${errors.isNeutered ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/10' : ''}`}>
                                <div 
                                    className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-white/10 rounded-xl shadow-lg transition-all duration-500 ease-spring ${formData.isNeutered ? 'left-[calc(50%+3px)]' : 'left-1.5'} ${formData.isNeutered === null ? 'opacity-0' : 'opacity-100'}`}
                                />

                                <button 
                                    onClick={() => setFormData({...formData, isNeutered: false})}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 font-bold text-sm transition-colors duration-300 ${formData.isNeutered === false ? 'text-red-500' : 'text-gray-400'}`}
                                >
                                    <X size={18} strokeWidth={3} /> {t('neutered_no')}
                                </button>

                                <button 
                                    onClick={() => setFormData({...formData, isNeutered: true})}
                                    className={`relative z-10 flex-1 flex items-center justify-center gap-2 font-bold text-sm transition-colors duration-300 ${formData.isNeutered === true ? 'text-green-500' : 'text-gray-400'}`}
                                >
                                    <Scissors size={18} strokeWidth={2.5} /> {t('neutered_yes')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 5 && (
                <div className="space-y-8 animate-in slide-in-from-right duration-500">
                    <div className={`p-5 rounded-3xl flex items-start gap-4 border-2 ${isPremium ? 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-500/30' : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/30'}`}>
                        <div className={`p-2.5 rounded-full ${isPremium ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600' : 'bg-amber-100 dark:bg-amber-500/20 text-amber-600'}`}>
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h4 className={`text-sm font-black mb-1.5 ${isPremium ? 'text-indigo-900 dark:text-indigo-200' : 'text-amber-900 dark:text-amber-200'}`}>
                                {t('confirm_details_title')}
                            </h4>
                            <p className={`text-xs font-medium leading-relaxed ${isPremium ? 'text-indigo-700 dark:text-indigo-300' : 'text-amber-700 dark:text-amber-300'}`}>
                                {isPremium ? t('confirm_details_desc_premium') : t('confirm_details_desc_free')}
                            </p>
                        </div>
                    </div>

                    <div className="relative aspect-square w-full bg-gray-900 rounded-[2.5rem] overflow-hidden shadow-2xl group border border-white/10 ring-1 ring-black/5">
                        {isStyleGenerating ? (
                            <div className="absolute inset-0 flex flex-col items-center justify-center text-white bg-black/80 backdrop-blur-sm">
                                <Loader2 size={56} className="animate-spin mb-6 text-indigo-500" />
                                <p className="font-bold text-lg animate-pulse">{t('ai_style_generating')}</p>
                            </div>
                        ) : (
                            <>
                                <img src={generatedImageUrl || previewUrl} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" alt={t('ai_generated_alt_text')} />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-80" />
                                
                                <div className="absolute bottom-6 left-6 right-6 space-y-3">
                                    <button 
                                        onClick={() => setShowRegenInput(true)}
                                        className="w-full py-4 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl text-white font-bold hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                                    >
                                        <RefreshCcw size={18} /> {t('btn_not_suitable')}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}

        </div>

        {step !== 2 && (
            <div className="p-6 border-t border-gray-100 dark:border-white/5 bg-white/80 dark:bg-white/5 backdrop-blur-xl flex gap-4 sticky bottom-0 z-20">
                {step > 1 && step < 5 && (
                    <button 
                        onClick={handleBack}
                        className="px-6 py-4 rounded-2xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 text-gray-700 dark:text-white font-bold transition-all border border-transparent dark:border-white/5 active:scale-95"
                    >
                        <ChevronLeft size={24} />
                    </button>
                )}
                
                {step === 1 ? null : (
                    <button 
                        onClick={step === 4 ? handleGoToConfirmation : (step === 5 ? handleFinalSave : handleNext)}
                        className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:shadow-lg hover:shadow-indigo-500/40 text-white font-bold text-lg rounded-2xl py-4 flex items-center justify-center gap-3 active:scale-[0.98] transition-all duration-300"
                    >
                        {step === 5 || initialData ? (
                            <>{initialData ? t('update') : t('btn_save_pet')} <CheckSquare size={22} /></>
                        ) : (
                            <>{t('btn_next')} <ChevronRight size={22} /></>
                        )}
                    </button>
                )}
            </div>
        )}

        {showRegenInput && (
            <div className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
                <div className="bg-white dark:bg-white/5 dark:backdrop-blur-xl border border-gray-200 dark:border-white/10 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 duration-300">
                    
                    <button 
                        onClick={() => setShowRegenInput(false)}
                        className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:text-red-500 transition-colors"
                    >
                        <X size={20} />
                    </button>

                    <h3 className="text-xl font-black text-gray-900 dark:text-white mb-6 flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 dark:bg-indigo-500/20 rounded-full text-indigo-600 dark:text-indigo-400">
                            <Edit3 size={20} />
                        </div>
                        {t('btn_regenerate')}
                    </h3>

                    <textarea 
                        value={regenPrompt}
                        onChange={(e) => setRegenPrompt(e.target.value)}
                        placeholder={t('regen_prompt_placeholder')}
                        className="w-full bg-gray-50 dark:bg-white/5 border-2 border-gray-100 dark:border-white/10 rounded-2xl p-4 text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-indigo-500 mb-6 resize-none h-32 transition-colors placeholder:text-gray-400"
                    />
                    
                    <div className="flex flex-col gap-4">
                        <div className="flex justify-between items-center text-xs font-bold px-1 uppercase tracking-wider">
                            <span className="text-gray-400">{t('regen_remaining')}</span>
                            <div className={`px-2 py-1 rounded-md ${regenCount >= maxRegens ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}>
                                {maxRegens - regenCount}/{maxRegens}
                            </div>
                        </div>

                        <button 
                            onClick={handleRegenerate}
                            disabled={regenCount >= maxRegens}
                            className="w-full py-4 bg-indigo-600 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
                        >
                            <RefreshCcw size={20} className={regenCount < maxRegens ? "group-hover:rotate-180 transition-transform" : ""} /> {t('btn_regenerate')}
                        </button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
}

export default AddPetModal;