import React, { useState } from 'react';
import { Camera as CameraIcon, ChevronLeft, ScanLine, CheckCircle2, AlertTriangle, Info, Loader, Image as ImageIcon } from 'lucide-react';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; 
import { useLanguage } from '../context/LanguageContext';
import { geminiApiKey } from '../utils/helpers';

const FoodAnalyzer = ({ onBack }) => {
  const { t } = useLanguage();
  const [image, setImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  // --- KAMERA / GALERİ İLE TARAMA ---
  const handleCapture = async () => {
    try {
        const photo = await Camera.getPhoto({
            quality: 90,
            allowEditing: false,
            resultType: CameraResultType.Base64,
            source: CameraSource.Prompt, // Kullanıcıya sorar: Kamera mı Galeri mi?
            promptLabelHeader: t('food_scan_title'),
            promptLabelPhoto: t('scan_gallery'),
            promptLabelPicture: t('scan_camera')
        });

        // Önizleme oluştur
        const base64Data = photo.base64String;
        const mimeType = `image/${photo.format}`;
        setImage(`data:${mimeType};base64,${base64Data}`);
        setResult(null);
        
        // Analizi başlat
        analyzeImage(base64Data, mimeType);

    } catch (error) {
        if (error.message !== 'User cancelled photos app') {
            console.error("Camera Error:", error);
        }
    }
  };

  // AI Analiz Fonksiyonu
  const analyzeImage = async (base64Data, mimeType) => {
    setAnalyzing(true);
    try {
      if (!geminiApiKey) {
        throw new Error("API Key eksik. Lütfen helpers.js dosyasını kontrol et.");
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType: mimeType
        },
      };
      
      const prompt = `
        You are an expert Veterinary Nutritionist. Analyze this image of a pet food label (ingredients list or nutritional info).
        
        Strictly output ONLY a valid JSON object. Do not add markdown formatting like \`\`\`json.
        
        JSON Structure:
        {
          "score": (integer 1-10, 10 is best),
          "productName": (string, detected name or "Unknown Product"),
          "summary": (string, short verdict in the language: ${t('current_lang_code') || 'tr'}),
          "pros": [(string array of good ingredients/features in ${t('current_lang_code') || 'tr'})],
          "cons": [(string array of bad ingredients/fillers/allergens in ${t('current_lang_code') || 'tr'})],
          "nutritional_alert": (boolean, true if dangerous ingredients found)
        }

        If the image is NOT a food label, return score: 0 and summary: "Not a label".
        Respond in ${t('current_lang_name') || 'Turkish'}.
      `;

      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      const text = response.text();
      
      const cleanText = text.replace(/```json|```/g, '').trim();
      const jsonResult = JSON.parse(cleanText);
      
      setResult(jsonResult);
    } catch (error) {
      console.error("Analiz hatası:", error);
      setResult({ error: true });
    } finally {
      setAnalyzing(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 8) return 'text-emerald-500 border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20';
    if (score >= 5) return 'text-yellow-500 border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20';
    return 'text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20';
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-black animate-in slide-in-from-right duration-300">
      
      {/* Üst Bar */}
      <div className="p-4 pt-safe-top flex items-center gap-4 bg-white/80 dark:bg-black/80 backdrop-blur-md sticky top-0 z-20 border-b border-gray-100 dark:border-white/10">
        <button onClick={onBack} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full hover:scale-105 transition-transform">
          <ChevronLeft size={24} className="dark:text-white" />
        </button>
        <h1 className="text-lg font-bold dark:text-white">{t('food_scan_title')}</h1>
      </div>

      <div className="flex-1 overflow-y-auto p-6 pb-24">
        
        {/* Kamera / Görsel Alanı */}
        <div className="relative w-full aspect-[4/3] bg-gray-200 dark:bg-gray-800 rounded-3xl overflow-hidden shadow-inner mb-6 border-2 border-dashed border-gray-300 dark:border-gray-700 group transition-all">
          {image ? (
            <>
                <img src={image} alt="Scan" className="w-full h-full object-cover" />
                {/* Analiz Sırasında Overlay */}
                {analyzing && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center backdrop-blur-sm z-10">
                        <Loader size={48} className="text-white animate-spin mb-4" />
                        <p className="text-white font-bold animate-pulse tracking-wide">{t('analyzing')}</p>
                    </div>
                )}
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/30 rounded-full flex items-center justify-center mb-4">
                    <ScanLine size={32} className="text-indigo-500" />
                </div>
                <p className="text-sm font-medium px-6 text-center">{t('scan_instruction')}</p>
            </div>
          )}
          
          {/* Yükleme Butonu (Analiz sırasında gizlenir) */}
          {!analyzing && (
              <div className="absolute bottom-4 left-0 right-0 flex justify-center z-10">
                  <button 
                    onClick={handleCapture}
                    className="bg-white text-gray-900 px-6 py-3 rounded-full font-bold shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 border border-gray-100"
                  >
                    {image ? (
                        <><CameraIcon size={18} /> {t('scan_retake')}</>
                    ) : (
                        <><CameraIcon size={18} /> {t('scan_upload')}</>
                    )}
                  </button>
              </div>
          )}
        </div>

        {/* --- SONUÇ KARTI --- */}
        {result && !result.error && (
            <div className="animate-in slide-in-from-bottom-10 duration-700">
                
                {/* Skor Kartı */}
                <div className="bg-white dark:bg-[#1A1D21] rounded-[2rem] p-6 shadow-xl border border-gray-100 dark:border-white/5 mb-4 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-500/10 to-transparent rounded-bl-full -mr-10 -mt-10 pointer-events-none" />
                    
                    <div className="flex items-center gap-6 relative z-10">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-[6px] text-4xl font-black shadow-inner shrink-0 ${getScoreColor(result.score)}`}>
                            {result.score}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <h2 className="text-xl font-bold dark:text-white leading-tight mb-2 truncate">{result.productName}</h2>
                            <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${result.score >= 7 ? 'bg-green-100 text-green-700' : result.score >= 4 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                                {result.score >= 7 ? t('score_good') : result.score >= 4 ? t('score_avg') : t('score_bad')}
                            </span>
                        </div>
                    </div>
                    
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
                        <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                            {result.summary}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div className="bg-white dark:bg-[#1A1D21] rounded-3xl p-5 border border-green-100 dark:border-green-900/20 shadow-sm">
                        <h3 className="flex items-center gap-2 text-green-600 dark:text-green-400 font-bold mb-3 text-sm uppercase tracking-wide">
                            <CheckCircle2 size={18} /> {t('scan_pros')}
                        </h3>
                        <ul className="space-y-2.5">
                            {result.pros.map((item, i) => (
                                <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-3">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]" />
                                    <span className="leading-snug">{item}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {result.cons.length > 0 && (
                        <div className="bg-white dark:bg-[#1A1D21] rounded-3xl p-5 border border-red-100 dark:border-red-900/20 shadow-sm">
                            <h3 className="flex items-center gap-2 text-red-500 dark:text-red-400 font-bold mb-3 text-sm uppercase tracking-wide">
                                <AlertTriangle size={18} /> {t('scan_cons')}
                            </h3>
                            <ul className="space-y-2.5">
                                {result.cons.map((item, i) => (
                                    <li key={i} className="text-sm text-gray-600 dark:text-gray-400 flex items-start gap-3">
                                        <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0 shadow-[0_0_8px_rgba(248,113,113,0.5)]" />
                                        <span className="leading-snug">{item}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>

                <div className="mt-8 mb-4 flex items-start justify-center gap-2 text-[10px] text-gray-400 text-center max-w-xs mx-auto opacity-70">
                    <Info size={12} className="shrink-0 mt-0.5" />
                    <p>{t('scan_disclaimer')}</p>
                </div>
            </div>
        )}

        {result && result.error && (
            <div className="bg-red-50 dark:bg-red-900/10 p-6 rounded-3xl text-center mt-6 border border-red-100 dark:border-red-900/20 animate-in shake">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-3 text-red-500">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="font-bold text-red-700 dark:text-red-400 mb-1">{t('scan_error_title')}</h3>
                <p className="text-xs text-red-600/80 dark:text-red-400/70">{t('scan_error_desc')}</p>
            </div>
        )}

      </div>
    </div>
  );
};

export default FoodAnalyzer;