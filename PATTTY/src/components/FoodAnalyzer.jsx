import React, { useState } from 'react';
import { Camera, Upload, X, Check, AlertCircle, ScanLine, Loader, ChevronLeft, ThumbsUp, ThumbsDown, Star } from 'lucide-react';
import { Camera as CapCamera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useLanguage } from '../context/LanguageContext';
import { usePremium } from '../context/PremiumContext'; 
import PaywallModal from './PaywallModal';

const FoodAnalyzer = ({ onBack }) => {
  const { t, language } = useLanguage();
  const { canUseFeature, recordAction } = usePremium(); 

  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [showPaywall, setShowPaywall] = useState(false);

  // 🔴 GÜVENLİ BACKEND ADRESİ
  const SERVER_URL = "https://us-central1-pattty-7adff.cloudfunctions.net/chatWithAI";

  const handleCapture = async (mode) => {
    try {
      const photo = await CapCamera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: mode === 'camera' ? CameraSource.Camera : CameraSource.Photos,
        promptLabelHeader: t('food_scan_title'),
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
    const check = canUseFeature('food_scan');
    if (!check.allowed) {
        setShowPaywall(true);
        return;
    }

    setAnalyzing(true);
    setError(null);
    recordAction(); 

    try {
      // 1. Sistem Talimatı 
      // Dil desteği dinamik hale getirildi.
      const targetLang = language === 'tr' ? 'Türkçe' : 'English';
      
      const systemPrompt = `
        GÖREV: Sen uzman bir Veteriner Beslenme Uzmanısın.
        ANALİZ EDİLECEK: Kullanıcının yüklediği fotoğraftaki kedi/köpek maması içerik listesi.
        
        BEKLENEN ÇIKTI (JSON FORMATINDA):
        Lütfen cevabı SADECE geçerli bir JSON objesi olarak ver. Başka hiçbir yazı yazma.
        Cevap dili: ${targetLang}
        
        JSON Şeması:
        {
          "score": 0-10 arası puan (sayı),
          "quality": "Düşük/Low" | "Orta/Medium" | "İyi/Good" | "Premium",
          "pros": ["Olumlu özellik 1", "Olumlu özellik 2"],
          "cons": ["Olumsuz özellik 1", "Olumsuz özellik 2"],
          "summary": "Genel değerlendirme cümlesi (maksimum 2 cümle)."
        }

        Eğer fotoğrafta okunabilir bir mama içeriği yoksa, JSON içinde "error" alanı döndür: { "error": "NOT_READABLE" }
      `;

      // 2. Veriyi Hazırla
      const contents = [
        {
          role: "user",
          parts: [
            { text: systemPrompt },
            {
              inlineData: {
                mimeType: image.mime,
                data: image.base64
              }
            }
          ]
        }
      ];

      // 3. Güvenli Sunucuya İstek
      const response = await fetch(SERVER_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents })
      });

      if (!response.ok) throw new Error("Server Error");

      const data = await response.json();
      let aiText = data.text;

      // 4. JSON Temizle ve Parse Et
      const jsonStr = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(jsonStr);

      if (parsedResult.error) {
        setError(t('food_scan_error_text'));
      } else {
        setResult(parsedResult);
      }

    } catch (err) {
      console.error(err);
      setError(t('ai_error_generic'));
    } finally {
      setAnalyzing(false);
    }
  };

  // --- ARAYÜZ (UI) ---
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col animate-in fade-in duration-300">
      
      {/* Üst Bar - GÜVENLİ ALAN DÜZELTMESİ (pt-safe-top mt-2) */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-4 pt-safe-top mt-2 bg-gradient-to-b from-black/80 to-transparent">
        <button onClick={onBack} className="p-2.5 bg-white/10 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all active:scale-95">
          <ChevronLeft size={24} />
        </button>
        <h2 className="text-white font-bold flex items-center gap-2 bg-black/30 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/10">
          <ScanLine size={16} className="text-orange-500" /> 
          <span className="text-sm tracking-wide">{t('food_scan_title')}</span>
        </h2>
        <div className="w-10"></div>
      </div>

      {/* Ana Alan */}
      <div className="flex-1 relative bg-gray-900 flex flex-col items-center justify-center p-6 overflow-hidden">
        
        {/* Arka Plan Efekti */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-gray-900 to-black opacity-50"></div>

        {image ? (
          <div className="relative w-full max-w-sm rounded-[2rem] overflow-hidden shadow-2xl border border-white/20 group">
            <img src={image.preview} alt="Scan" className="w-full h-auto object-cover max-h-[60vh]" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60"></div>
            
            <button 
              onClick={() => { setImage(null); setResult(null); setError(null); }}
              className="absolute top-3 right-3 p-2 bg-black/60 backdrop-blur-md text-white rounded-full hover:bg-red-500/80 transition-colors border border-white/10"
            >
              <X size={18} />
            </button>
          </div>
        ) : (
          <div className="relative text-center space-y-6 z-10">
             <div className="w-72 h-72 border-2 border-dashed border-gray-600 rounded-[2.5rem] flex items-center justify-center mx-auto bg-gray-800/30 backdrop-blur-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-tr from-orange-500/10 to-transparent animate-pulse"></div>
                <ScanLine size={64} className="text-gray-500/50" />
                
                {/* Vizör Çizgileri */}
                <div className="absolute top-8 left-8 w-8 h-8 border-t-4 border-l-4 border-orange-500/50 rounded-tl-xl"></div>
                <div className="absolute top-8 right-8 w-8 h-8 border-t-4 border-r-4 border-orange-500/50 rounded-tr-xl"></div>
                <div className="absolute bottom-8 left-8 w-8 h-8 border-b-4 border-l-4 border-orange-500/50 rounded-bl-xl"></div>
                <div className="absolute bottom-8 right-8 w-8 h-8 border-b-4 border-r-4 border-orange-500/50 rounded-br-xl"></div>
             </div>
             <div className="max-w-xs mx-auto">
                 <p className="text-white font-bold text-lg mb-1">{t('food_scan_instruction_title')}</p>
                 <p className="text-gray-400 text-sm leading-relaxed">{t('food_scan_desc')}</p>
             </div>
          </div>
        )}

        {/* Sonuç Kartı - Milyar Dolarlık Tasarım */}
        {result && (
           <div className="absolute bottom-0 left-0 right-0 p-4 pb-safe-bottom z-30 flex justify-center">
               <div className="w-full max-w-md bg-white/90 dark:bg-neutral-800/95 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl border border-white/20 animate-in slide-in-from-bottom duration-500">
                  <div className="flex items-start justify-between mb-4">
                     <div>
                        <div className="flex items-baseline gap-1">
                            <span className={`text-4xl font-black tracking-tighter ${result.score >= 7 ? 'text-green-500' : result.score >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>
                                {result.score}
                            </span>
                            <span className="text-gray-400 font-bold text-lg">/10</span>
                        </div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1 flex items-center gap-1">
                            <Star size={12} className="fill-current"/> {result.quality}
                        </div>
                     </div>
                     <div className={`p-3 rounded-2xl ${result.score >= 7 ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                         {result.score >= 7 ? <ThumbsUp size={24} /> : <ThumbsDown size={24} />}
                     </div>
                  </div>
                  
                  <p className="text-gray-700 dark:text-gray-200 text-sm mb-5 leading-relaxed font-medium bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-100 dark:border-white/5">
                     {result.summary}
                  </p>

                  <div className="grid grid-cols-2 gap-3">
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-extrabold text-green-600 uppercase tracking-wide flex items-center gap-1">
                            <Check size={12}/> {t('food_scan_pros')}
                        </h4>
                        <ul className="space-y-1.5">
                           {result.pros.map((p, i) => (
                               <li key={i} className="text-xs text-gray-500 dark:text-gray-400 bg-green-50/50 dark:bg-green-900/10 px-2 py-1 rounded-lg border border-green-100 dark:border-green-900/20 truncate">
                                   {p}
                               </li>
                           ))}
                        </ul>
                     </div>
                     <div className="space-y-2">
                        <h4 className="text-[10px] font-extrabold text-red-500 uppercase tracking-wide flex items-center gap-1">
                            <AlertCircle size={12}/> {t('food_scan_cons')}
                        </h4>
                        <ul className="space-y-1.5">
                           {result.cons.map((c, i) => (
                               <li key={i} className="text-xs text-gray-500 dark:text-gray-400 bg-red-50/50 dark:bg-red-900/10 px-2 py-1 rounded-lg border border-red-100 dark:border-red-900/20 truncate">
                                   {c}
                               </li>
                           ))}
                        </ul>
                     </div>
                  </div>
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

      {/* Alt Butonlar - GÜVENLİ ALAN DÜZELTMESİ (pb-safe-bottom) */}
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
                <button onClick={handleAnalyze} className="w-full bg-gradient-to-r from-orange-500 to-red-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-orange-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2">
                    <ScanLine size={20}/> {t('analyze_btn')}
                </button>
            )}
        </div>
      )}

      {/* Yükleniyor Ekranı - Vizör Animasyonu */}
      {analyzing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-orange-500/30 rounded-full animate-ping absolute inset-0"></div>
                <div className="w-20 h-20 border-4 border-t-orange-500 border-r-transparent border-b-orange-500 border-l-transparent rounded-full animate-spin relative z-10"></div>
            </div>
            <p className="text-white font-bold mt-6 animate-pulse tracking-wide">{t('analyzing_text')}</p>
        </div>
      )}

      {/* Paywall Modal */}
      {showPaywall && <PaywallModal feature="food_scan" onClose={() => setShowPaywall(false)} />}

    </div>
  );
};

export default FoodAnalyzer;