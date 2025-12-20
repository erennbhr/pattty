// src/components/FoodAnalyzer.jsx
import React, { useState } from 'react';
import { 
  Camera, Upload, X, Check, AlertCircle, ScanLine, Loader, ChevronLeft, 
  ThumbsUp, ThumbsDown, Star, Utensils, Biohazard, PackageSearch, PawPrint 
} from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useLanguage } from '../context/LanguageContext';
import { usePremium } from '../context/PremiumContext'; 
import { useApp } from '../context/AppContext'; 
import { askAIWithImage } from '../utils/helpers';
import PaywallModal from './PaywallModal';

const FoodAnalyzer = ({ onBack }) => {
  const { t, language } = useLanguage();
  const { canUseFeature, recordAction } = usePremium(); 
  const { pets } = useApp();

  const [activeTab, setActiveTab] = useState('food'); // food | poop | ingredients
  const [selectedPetId, setSelectedPetId] = useState(pets.length > 0 ? pets[0].id : null);
  
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);

  const selectedPet = pets.find(p => p.id === selectedPetId) || { name: 'Pet', type: 'dog' };

  // --- MOD AYARLARI ---
  const MODES = {
      food: {
          id: 'food',
          icon: Utensils,
          label: t('analysis_mode_food'),
          color: 'text-orange-500',
          bg: 'bg-orange-500',
          border: 'border-orange-500',
          featureKey: 'analyze_food',
          promptKey: 'food_analysis_prompt',
          btnText: t('btn_analyze_food'),
          loadingText: t('analyzing_food')
      },
      poop: {
          id: 'poop',
          icon: Biohazard,
          label: t('analysis_mode_poop'),
          color: 'text-emerald-500',
          bg: 'bg-emerald-500',
          border: 'border-emerald-500',
          featureKey: 'analyze_poop',
          promptKey: 'poop_analysis_prompt',
          btnText: t('btn_analyze_poop'),
          loadingText: t('analyzing_poop')
      },
      ingredients: {
          id: 'ingredients',
          icon: PackageSearch,
          label: t('analysis_mode_ingredients'),
          color: 'text-blue-500',
          bg: 'bg-blue-500',
          border: 'border-blue-500',
          featureKey: 'food_scan', // Mevcut limit anahtarı
          btnText: t('analyze_btn'),
          loadingText: t('analyzing_text')
      }
  };

  const currentMode = MODES[activeTab];

  const handleCapture = async (mode) => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 80,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: mode === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        promptLabelHeader: currentMode.label,
        promptLabelPhoto: t('scan_gallery'),
        promptLabelPicture: t('scan_camera')
      });

      setImage({
        base64: photo.base64String,
        mime: `image/${photo.format}`,
        preview: `data:image/${photo.format};base64,${photo.base64String}`
      });
      setError(null);
      setResult(null);

    } catch (err) {
      console.log("Camera cancelled or error:", err);
    }
  };

  const handleAnalyze = async () => {
    if (!image) return;

    // Premium Kontrolü
    const check = canUseFeature(currentMode.featureKey);
    if (!check.allowed) {
        setPaywallFeature(currentMode.featureKey);
        setShowPaywall(true);
        return;
    }

    setAnalyzing(true);
    setError(null);
    recordAction(currentMode.featureKey); 

    try {
      let prompt = "";
      
      // 1. Prompt Hazırlama
      if (activeTab === 'ingredients') {
          // Eski Mama Analizi Prompt'u (Özelleştirilmiş)
          const targetLang = language === 'tr' ? 'Türkçe' : 'English';
          prompt = `
            GÖREV: Sen uzman bir Veteriner Beslenme Uzmanısın.
            ANALİZ EDİLECEK: Kullanıcının yüklediği fotoğraftaki kedi/köpek maması içerik listesi.
            HEDEF KİTLE: ${selectedPet.type} (${selectedPet.name})
            BEKLENEN ÇIKTI (JSON):
            {
              "score": 0-10 arası puan (sayı),
              "quality": "Düşük/Low" | "Orta/Medium" | "İyi/Good" | "Premium",
              "pros": ["Olumlu özellik 1", "Olumlu özellik 2 (detaylı)"],
              "cons": ["Olumsuz özellik 1", "Olumsuz özellik 2 (detaylı)"],
              "summary": "Genel değerlendirme (${targetLang})."
            }
            Eğer içerik okunamazsa JSON içinde "error": "NOT_READABLE" döndür.
          `;
      } else {
          // Yeni Modlar (Yemek & Kaka) için helper'dan prompt template'i al
          prompt = t(currentMode.promptKey)
              .replace('{petType}', selectedPet.type)
              .replace('{petName}', selectedPet.name);
      }

      // 2. AI İsteği
      const response = await askAIWithImage(prompt, image.base64, image.mime);
      
      if (response.error) {
          setError(t('scan_error_desc'));
      } else {
          setResult(response);
      }

    } catch (err) {
      console.error(err);
      setError(t('ai_error_generic'));
    } finally {
      setAnalyzing(false);
    }
  };

  // --- RENDER HELPERS ---
  
  const renderResultCard = () => {
      if (!result) return null;

      // 1. İÇERİK ANALİZİ SONUCU (Geliştirilmiş Tasarım)
      if (activeTab === 'ingredients') {
          return (
            <div className="w-full bg-white/90 dark:bg-neutral-800/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500">
                
                {/* Puan ve Kalite */}
                <div className="flex items-start justify-between mb-6 border-b border-gray-100 dark:border-white/5 pb-4">
                    <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-5xl font-black tracking-tighter ${result.score >= 7 ? 'text-green-500' : result.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {result.score}
                            </span>
                            <span className="text-gray-400 font-bold text-xl">/10</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Star size={12} className="fill-current"/> {result.quality}
                        </div>
                    </div>
                    <div className={`p-4 rounded-2xl shadow-sm ${result.score >= 7 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                        {result.score >= 7 ? <ThumbsUp size={28} /> : <ThumbsDown size={28} />}
                    </div>
                </div>
                
                {/* Özet */}
                <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5 mb-6">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase mb-2 tracking-wider">Analiz Özeti</h4>
                    <p className="text-gray-800 dark:text-gray-200 text-sm leading-relaxed font-medium">
                        {result.summary}
                    </p>
                </div>

                {/* Artılar ve Eksiler - 🟢 GÜNCELLENDİ: Alt Alta ve Wrap Yapısı */}
                <div className="flex flex-col gap-4">
                    <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-green-600 uppercase tracking-wide flex items-center gap-2">
                            <div className="bg-green-100 p-1 rounded-full"><Check size={12} /></div>
                            {t('food_scan_pros')}
                        </h4>
                        <ul className="space-y-2">
                            {result.pros?.map((p, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 bg-green-50/50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/20 leading-relaxed">
                                    {p}
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="text-xs font-extrabold text-red-500 uppercase tracking-wide flex items-center gap-2">
                            <div className="bg-red-100 p-1 rounded-full"><AlertCircle size={12}/></div>
                            {t('food_scan_cons')}
                        </h4>
                        <ul className="space-y-2">
                            {result.cons?.map((c, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-300 bg-red-50/50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20 leading-relaxed">
                                    {c}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
          );
      }

      // 2. YEMEK ANALİZİ SONUCU
      if (activeTab === 'food') {
          let statusColor = result.safety_level === 'safe' ? 'green' : result.safety_level === 'caution' ? 'yellow' : 'red';
          let StatusIcon = result.safety_level === 'safe' ? Check : AlertCircle;
          let titleText = result.safety_level === 'safe' ? t('food_safe_title') : result.safety_level === 'caution' ? t('food_caution_title') : t('food_danger_title');

          return (
              <div className="w-full bg-white/90 dark:bg-neutral-800/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500">
                  <div className={`flex items-center gap-3 mb-4 p-3 rounded-2xl bg-${statusColor}-50 dark:bg-${statusColor}-900/20 border border-${statusColor}-100 dark:border-${statusColor}-900/30`}>
                      <div className={`p-2 bg-${statusColor}-500 text-white rounded-full`}>
                          <StatusIcon size={24} />
                      </div>
                      <div>
                          <h3 className={`text-lg font-black text-${statusColor}-600 dark:text-${statusColor}-400`}>{titleText}</h3>
                          <p className="text-xs font-bold text-gray-500 uppercase">{result.food_name}</p>
                      </div>
                  </div>
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-4 leading-relaxed">
                      {result.description}
                  </p>
                  <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/5">
                      <h4 className="text-xs font-bold text-gray-400 uppercase mb-1">Pattty Tavsiyesi</h4>
                      <p className="text-sm font-medium text-gray-800 dark:text-white italic">"{result.advice}"</p>
                  </div>
              </div>
          );
      }

      // 3. DIŞKI ANALİZİ SONUCU
      if (activeTab === 'poop') {
          let statusColor = result.status === 'healthy' ? 'green' : result.status === 'concern' ? 'yellow' : 'red';
          let titleText = result.status === 'healthy' ? t('poop_healthy_title') : result.status === 'concern' ? t('poop_concern_title') : t('poop_emergency_title');

          return (
              <div className="w-full bg-white/90 dark:bg-neutral-800/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500">
                   <div className={`text-center mb-6 p-4 rounded-3xl bg-${statusColor}-50 dark:bg-${statusColor}-900/20`}>
                       <h3 className={`text-xl font-black text-${statusColor}-600 dark:text-${statusColor}-400 mb-1`}>{titleText}</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">AI Ön Değerlendirmesi</p>
                   </div>
                   
                   <div className="space-y-4">
                       <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Bulgular</h4>
                           <p className="text-sm text-gray-700 dark:text-gray-200 bg-white dark:bg-black/20 p-3 rounded-xl border border-gray-100 dark:border-white/5">{result.details}</p>
                       </div>
                       <div>
                           <h4 className="text-xs font-bold text-gray-400 uppercase mb-2">Öneri</h4>
                           <p className="text-sm font-medium text-gray-900 dark:text-white">{result.recommendation}</p>
                       </div>
                   </div>
                   
                   <p className="text-[10px] text-gray-400 mt-6 text-center">
                       * Bu sonuçlar tıbbi teşhis değildir. Endişeniz varsa veterinerinize danışın.
                   </p>
              </div>
          );
      }
  };

  // --- ARAYÜZ (UI) ---
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      
      {/* Üst Bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-col p-4 pt-safe-top bg-gradient-to-b from-black/90 via-black/60 to-transparent">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-95">
                <ChevronLeft size={24} />
            </button>
            <h2 className="text-white font-bold text-lg tracking-tight">{t('analysis_hub_title')}</h2>
            <div className="w-10"></div>
        </div>

        {/* Tab Selector */}
        <div className="flex p-1 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 overflow-x-auto no-scrollbar">
            {Object.values(MODES).map((mode) => {
                const isActive = activeTab === mode.id;
                const ModeIcon = mode.icon;
                return (
                    <button
                        key={mode.id}
                        onClick={() => { setActiveTab(mode.id); setImage(null); setResult(null); }}
                        className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition-all whitespace-nowrap
                            ${isActive ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}
                        `}
                    >
                        <ModeIcon size={16} className={isActive ? mode.color : ''} />
                        {mode.label}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Ana Alan */}
      <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center p-6 overflow-hidden">
        
        {/* Dinamik Arka Plan */}
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-50 transition-colors duration-500 ${currentMode.bg.replace('bg-', 'from-').replace('500', '900')}`}></div>

        {image ? (
          <div className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 group">
            <img src={image.preview} alt="Scan" className="w-full h-auto object-cover max-h-[50vh]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            
            <button 
              onClick={() => { setImage(null); setResult(null); setError(null); }}
              className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="relative text-center space-y-6 z-10 w-full max-w-xs">
              {/* Pet Seçimi (Varsa) */}
              {pets.length > 0 && (
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 p-1 rounded-2xl flex items-center justify-center mb-4">
                      {pets.map(pet => (
                          <button 
                              key={pet.id}
                              onClick={() => setSelectedPetId(pet.id)}
                              className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl transition-all ${selectedPetId === pet.id ? 'bg-white/10 text-white shadow-sm' : 'text-gray-500 hover:text-gray-300'}`}
                          >
                              <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/10">
                                  {/* Eğer pet resmi varsa buraya koyulabilir */}
                                  <PawPrint size={14} />
                              </div>
                              <span className="text-[10px] font-bold">{pet.name}</span>
                          </button>
                      ))}
                  </div>
              )}

              <div className={`w-64 h-64 border-2 border-dashed ${currentMode.border} rounded-[2.5rem] flex items-center justify-center mx-auto bg-gray-800/30 backdrop-blur-sm relative overflow-hidden transition-all duration-300`}>
                <div className={`absolute inset-0 bg-gradient-to-tr ${currentMode.bg.replace('bg-', 'from-')}/10 to-transparent animate-pulse`}></div>
                <currentMode.icon size={64} className="text-gray-500/50" />
                
                {/* Vizör Çizgileri - Rengi dinamik */}
                <div className={`absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 ${currentMode.border}/50 rounded-tl-xl`}></div>
                <div className={`absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 ${currentMode.border}/50 rounded-tr-xl`}></div>
                <div className={`absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 ${currentMode.border}/50 rounded-bl-xl`}></div>
                <div className={`absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 ${currentMode.border}/50 rounded-br-xl`}></div>
              </div>
              
              <div>
                  <p className="text-white font-bold text-lg mb-1">{currentMode.label}</p>
                  <p className="text-gray-400 text-xs">
                      {t('select_pet_label')} <span className="text-white font-bold">{selectedPet.name}</span>
                  </p>
              </div>
          </div>
        )}

        {/* Sonuç Kartı */}
        {result && (
           <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom z-30 flex justify-center w-full">
               <div className="w-full max-w-md max-h-[70vh] overflow-y-auto">
                   {renderResultCard()}
               </div>
           </div>
        )}

        {error && (
            <div className="absolute bottom-32 left-4 right-4 z-30 animate-in slide-in-from-bottom">
                <div className="bg-red-500/90 backdrop-blur-md text-white px-4 py-4 rounded-2xl flex items-center gap-3 text-sm font-bold shadow-lg shadow-red-500/20">
                    <AlertCircle size={24} className="shrink-0" /> 
                    <span>{error}</span>
                </div>
            </div>
        )}
      </div>

      {/* Alt Butonlar */}
      {!analyzing && !result && (
        <div className="p-6 pb-safe-bottom bg-gradient-to-t from-black via-black/90 to-transparent flex gap-4 justify-center absolute bottom-0 left-0 right-0 z-20">
            {!image ? (
                <>
                    <button onClick={() => handleCapture('camera')} className="flex-1 bg-white text-black py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 active:scale-95">
                        <Camera size={20} /> {t('scan_camera')}
                    </button>
                    <button onClick={() => handleCapture('gallery')} className="flex-1 bg-white/10 backdrop-blur-md text-white border border-white/10 py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-white/20 transition-colors active:scale-95">
                        <Upload size={20} /> {t('scan_gallery')}
                    </button>
                </>
            ) : (
                <button onClick={handleAnalyze} className={`w-full bg-gradient-to-r ${currentMode.bg.replace('bg-', 'from-')} to-black text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2`}>
                    <ScanLine size={20}/> {currentMode.btnText}
                </button>
            )}
        </div>
      )}

      {/* Yükleniyor Ekranı */}
      {analyzing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="relative">
                <div className={`w-20 h-20 border-4 ${currentMode.border}/30 rounded-full animate-ping absolute inset-0`}></div>
                <div className={`w-20 h-20 border-4 border-t-${currentMode.color.split('-')[1]}-500 border-r-transparent border-b-${currentMode.color.split('-')[1]}-500 border-l-transparent rounded-full animate-spin relative z-10`}></div>
            </div>
            <p className="text-white font-bold mt-6 animate-pulse tracking-wide">{currentMode.loadingText}</p>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}

    </div>
  );
};

export default FoodAnalyzer;