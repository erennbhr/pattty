import React, { useState } from 'react';
import { Syringe, Check, Calendar, Plus, Sparkles, Loader, X, Lock, ScanLine, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; // KAMERA EKLENDİ
import { GoogleGenerativeAI } from "@google/generative-ai";
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePremium } from '../context/PremiumContext'; 
import { getLocalizedData, fetchWithRetry, geminiApiKey as apiKey, generateID } from '../utils/helpers';
import PaywallModal from './PaywallModal'; 

const VaccineManager = ({ pet, setPets, onGoToVetLocator }) => {
  const { t, language } = useLanguage();
  const showNotification = useNotification();

  const { canUseFeature, isPremium } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);

  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newVaccine, setNewVaccine] = useState({ name: '', date: '' });

  const [showAiPreModal, setShowAiPreModal] = useState(false);
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [aiSuggestedVaccines, setAiSuggestedVaccines] = useState([]);

  const vaccines = pet.vaccines || [];
  const localizedData = getLocalizedData(language || 'tr', t);
  const commonVaccines = localizedData.vaccines(pet.type) || [];

  // --- SAĞLIK DURUMU ÖZETİ ---
  const getHealthStatus = () => {
      const today = new Date();
      const upcoming = vaccines.filter(v => !v.done && new Date(v.date) >= today);
      const overdue = vaccines.filter(v => !v.done && new Date(v.date) < today);
      
      if (overdue.length > 0) return { status: 'risk', label: t('vac_stat_risk'), color: 'bg-red-500', icon: AlertCircle, desc: `${overdue.length} ${t('vac_stat_overdue_desc')}` };
      if (upcoming.length > 0) return { status: 'ok', label: t('vac_stat_ok'), color: 'bg-blue-500', icon: Clock, desc: `${upcoming.length} ${t('vac_stat_upcoming_desc')}` };
      if (vaccines.length > 0 && vaccines.every(v => v.done)) return { status: 'perfect', label: t('vac_stat_perfect'), color: 'bg-green-500', icon: ShieldCheck, desc: t('vac_stat_perfect_desc') };
      return { status: 'empty', label: t('vac_stat_empty'), color: 'bg-gray-400', icon: Syringe, desc: t('vac_stat_empty_desc') };
  };

  const status = getHealthStatus();
  const StatusIcon = status.icon;

  // --- MANUEL EKLEME ---
  const handleAdd = () => {
    if (!newVaccine.name || !newVaccine.date) {
      showNotification(t('vac_name_date_error'), 'error');
      return;
    }
    const vaccineDate = new Date(newVaccine.date);
    const birthDate = new Date(pet.birthDate);
    if (pet.birthDate && vaccineDate < birthDate) {
        showNotification(t('err_vaccine_date_invalid'), 'error');
        return;
    }
    const v = { id: generateID(), name: newVaccine.name, date: newVaccine.date, done: false };
    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...(p.vaccines || []), v] } : p));
    setNewVaccine({ name: '', date: '' });
    setShowForm(false);
    showNotification(t('vac_added_notif'), 'success');
  };

  const toggleDone = (vid) => {
    setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: (p.vaccines || []).map(v => v.id === vid ? { ...v, done: !v.done } : v) } : p));
  };

  // --- KAMERA / GALERİ İLE TARAMA (GÜNCELLENDİ) ---
  const handleScanClick = async () => {
      // 1. Premium Kontrolü
      const check = canUseFeature('vaccine_scan');
      if (!check.allowed) {
          setPaywallFeature('vaccine_scan');
          setShowPaywall(true);
          return;
      }

      try {
          // 2. Kamera/Galeri Seçimi (Native Prompt)
          const image = await Camera.getPhoto({
              quality: 80,
              allowEditing: false, // İsteğe bağlı crop özelliği açılabilir
              resultType: CameraResultType.Base64,
              source: CameraSource.Prompt, // BU SATIR: Kullanıcıya "Kamera" mı "Galeri" mi diye sorar
              promptLabelHeader: t('vac_scan_btn'), // Başlık (Opsiyonel)
              promptLabelPhoto: t('scan_upload'),   // "Fotoğraf Seç" metni
              promptLabelPicture: t('scan_camera')  // "Fotoğraf Çek" metni (helpers.js'e eklenecek)
          });

          // 3. Tarama Başlat
          setScanning(true);
          
          if (!apiKey) throw new Error("API Key missing");

          const genAI = new GoogleGenerativeAI(apiKey);
          const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
          
          // Gelen Base64 verisi
          const base64Data = image.base64String;
          const mimeType = `image/${image.format}`;
          
          const prompt = `Analyze this image of a pet vaccination card. Extract vaccine names and dates (administered or due). Return ONLY a JSON array: [{"name": "Vaccine Name", "date": "YYYY-MM-DD"}]. If date is missing or unreadable, estimate a future date based on common schedules or use today's date. Translate vaccine names to ${language === 'tr' ? 'Turkish' : 'English'}.`;

          const result = await model.generateContent([prompt, { inlineData: { data: base64Data, mimeType } }]);
          const response = await result.response;
          const text = response.text();
          
          const cleanText = text.replace(/```json|```/g, '').trim();
          
          if (!cleanText.startsWith('[') && !cleanText.startsWith('{')) {
              throw new Error("AI geçerli veri döndürmedi.");
          }

          const parsed = JSON.parse(cleanText);

          if (Array.isArray(parsed) && parsed.length > 0) {
              const mapped = parsed.map(v => ({ id: generateID(), name: v.name, date: v.date, done: true })); 
              setAiSuggestedVaccines(mapped);
              setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...(p.vaccines || []), ...mapped] } : p));
              showNotification(t('vac_scan_success'), 'success');
              setShowAiResultModal(true);
          } else {
              throw new Error("No vaccines found");
          }

      } catch (error) {
          // Kullanıcı kamerayı açıp vazgeçerse hata fırlatır, bunu yutuyoruz.
          if (error.message !== 'User cancelled photos app') {
              console.error("Scan Error:", error);
              showNotification(t('vac_scan_error'), 'error');
          }
      } finally {
          setScanning(false);
      }
  };

  // --- AI SUGGEST (MANUEL TETİKLEME) ---
  const handleAiButtonClick = () => {
    const check = canUseFeature('ai_vaccine');
    if (check.allowed) setShowAiPreModal(true);
    else { setPaywallFeature('ai_vaccine'); setShowPaywall(true); }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setShowAiPreModal(false);
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
      const existingList = vaccines.length ? vaccines.map(v => `${v.name} (${v.date})`).join(', ') : (language === 'tr' ? 'Yok' : 'None');
      const prompt = `You are a licensed veterinary clinical assistant... (Create vaccine schedule for ${pet.name}, ${pet.type}, Existing: ${existingList})`; 
      
      const data = await fetchWithRetry(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }) });
      let aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
      let clean = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) clean = clean.slice(firstBrace, lastBrace + 1);
      
      const parsed = JSON.parse(clean);
      const aiVaccines = Array.isArray(parsed.vaccines) ? parsed.vaccines : [];
      let mapped = aiVaccines.filter(v => v && v.name && v.date).map(v => ({ id: generateID(), name: v.name, date: v.date, done: false }));
      
      const today = new Date();
      mapped.forEach(v => {
        const d = new Date(v.date);
        if (isNaN(d.getTime()) || d < today) { const fixed = new Date(); fixed.setDate(fixed.getDate() + 10); v.date = fixed.toISOString().split('T')[0]; }
      });

      if (!mapped.length) throw new Error('NO_VALID_VACCINES');
      setAiSuggestedVaccines(mapped);
      setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...(p.vaccines || []), ...mapped] } : p));
      showNotification(t('vac_ai_success_notif'), 'success');
      setShowAiResultModal(true);
    } catch (err) {
      console.error(err);
      showNotification(t('vac_ai_error_generic'), 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const sortedVaccines = [...vaccines].sort((a, b) => new Date(a.date) - new Date(b.date));

  // --- VET LOCATOR BUTTON ---
  const handleGoToVets = () => {
    const check = canUseFeature('vet_locator');
    if (!check.allowed) { setPaywallFeature('vet_locator'); setShowPaywall(true); return; }
    setShowAiResultModal(false);
    setAiSuggestedVaccines([]);
    if (onGoToVetLocator) onGoToVetLocator();
    else if (typeof window !== 'undefined' && typeof window.openVetLocatorFromVaccine === 'function') window.openVetLocatorFromVaccine();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 relative">
      
      {/* --- SAĞLIK ÖZET KARTI --- */}
      <div className={`p-5 rounded-[2rem] text-white shadow-lg flex items-center justify-between ${status.color}`}>
          <div>
              <div className="flex items-center gap-2 mb-1">
                  <StatusIcon size={20} className="opacity-90"/>
                  <h3 className="font-bold text-lg">{status.label}</h3>
              </div>
              <p className="text-xs opacity-90 font-medium">{status.desc}</p>
          </div>
          {status.status === 'risk' && <button onClick={handleGoToVets} className="bg-white text-red-500 px-4 py-2 rounded-xl text-xs font-bold shadow-sm">{t('acc_find_vet')}</button>}
      </div>

      {/* --- BUTON GRUBU --- */}
      <div className="grid grid-cols-2 gap-3">
          {/* AI Tarama Butonu (Native Camera) */}
          <button 
            onClick={handleScanClick} 
            disabled={scanning}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-white dark:bg-neutral-800 rounded-3xl border border-gray-100 dark:border-white/10 shadow-sm relative overflow-hidden group active:scale-95 transition-all"
          >
              {!isPremium && <div className="absolute top-2 right-2 text-yellow-500"><Lock size={14}/></div>}
              {scanning ? <Loader size={24} className="animate-spin text-indigo-500"/> : <ScanLine size={24} className="text-indigo-500"/>}
              <span className="text-xs font-bold text-gray-700 dark:text-white">{scanning ? t('vac_scan_analyzing') : t('vac_scan_btn')}</span>
          </button>

          {/* AI Planlama Butonu */}
          <button 
            onClick={handleAiButtonClick}
            disabled={aiLoading}
            className="flex flex-col items-center justify-center gap-2 p-4 bg-gradient-to-br from-indigo-600 to-purple-600 text-white rounded-3xl shadow-lg shadow-indigo-500/30 relative overflow-hidden active:scale-95 transition-all"
          >
              {!isPremium && !aiLoading && <div className="absolute top-2 right-2 text-white/50"><Lock size={14}/></div>}
              {aiLoading ? <Loader size={24} className="animate-spin text-white"/> : <Sparkles size={24} className="text-white"/>}
              <span className="text-xs font-bold text-white">{aiLoading ? t('ai_generating') : t('vac_ai_btn')}</span>
          </button>
      </div>

      {/* --- TIMELINE (PROFESYONEL LİSTE) --- */}
      <div className="bg-white dark:bg-neutral-900 rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-white/5">
          <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">{t('vaccine_title')}</h3>
              <button onClick={() => setShowForm(true)} className="w-8 h-8 bg-gray-100 dark:bg-neutral-800 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200"><Plus size={18}/></button>
          </div>

          <div className="space-y-0 relative">
              <div className="absolute left-[19px] top-4 bottom-4 w-0.5 bg-gray-100 dark:bg-neutral-800"></div>

              {sortedVaccines.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">{t('vac_no_vaccines')}</div>
              )}

              {sortedVaccines.map((v, i) => {
                  const isPast = new Date(v.date) < new Date();
                  const isDone = v.done;
                  let statusColor = isDone ? 'bg-green-500' : isPast ? 'bg-red-500' : 'bg-blue-500';
                  
                  return (
                      <div key={v.id} className="relative pl-10 py-3 group">
                          <div className={`absolute left-3 top-5 w-4 h-4 rounded-full border-2 border-white dark:border-neutral-900 shadow-sm z-10 ${statusColor}`}></div>
                          
                          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-800/50 rounded-2xl border border-transparent hover:border-gray-200 dark:hover:border-neutral-700 transition-all">
                              <div>
                                  <h4 className={`font-bold text-sm ${v.done ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>{v.name}</h4>
                                  <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {v.date}</p>
                              </div>
                              <button onClick={() => toggleDone(v.id)} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${v.done ? 'bg-green-100 text-green-600' : 'bg-white dark:bg-neutral-800 text-gray-300 hover:text-gray-500'}`}>
                                  <Check size={16} />
                              </button>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
            <div className="bg-white dark:bg-neutral-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl relative animate-in zoom-in-95">
                <button onClick={() => setShowForm(false)} className="absolute right-4 top-4 text-gray-400"><X size={20}/></button>
                <h3 className="font-bold text-lg mb-4 dark:text-white">{t('vac_add')}</h3>
                <div className="space-y-3">
                    <select value={newVaccine.name} onChange={e => setNewVaccine(prev => ({ ...prev, name: e.target.value }))} className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold text-sm outline-none dark:text-white">
                        <option value="">{t('select_vaccine')}</option>
                        {commonVaccines.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <input type="date" value={newVaccine.date} onChange={e => setNewVaccine(prev => ({ ...prev, date: e.target.value }))} className="w-full p-4 bg-gray-50 dark:bg-neutral-800 rounded-2xl font-bold text-sm outline-none dark:text-white min-h-[56px]" />
                    <button onClick={handleAdd} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold shadow-lg">{t('save')}</button>
                </div>
            </div>
        </div>
      )}

      {showAiPreModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-5 relative">
            <button onClick={() => setShowAiPreModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18} /></button>
            <h2 className="text-base font-bold mb-3 text-gray-800 dark:text-gray-100">{t('vac_ai_suggest_title')}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-5">{t('vac_ai_pre_desc')}</p>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setShowAiPreModal(false); setShowForm(true); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200">{t('vac_add_manually_btn')}</button>
              <button onClick={handleAiSuggest} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">{t('vac_continue_with_ai_btn')}</button>
            </div>
          </div>
        </div>
      )}

      {showAiResultModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-3xl shadow-xl p-5 relative">
            <button onClick={() => setShowAiResultModal(false)} className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={18} /></button>
            <h2 className="text-base font-bold mb-3 text-gray-800 dark:text-gray-100">{t('vac_ai_result_title')}</h2>
            {aiSuggestedVaccines.length > 0 ? (
              <div className="max-h-56 overflow-y-auto space-y-2 mb-4">
                {aiSuggestedVaccines.map(v => (
                  <div key={v.id} className="px-3 py-2 rounded-2xl bg-gray-50 dark:bg-neutral-800 border border-gray-100 dark:border-neutral-700 flex justify-between items-center">
                    <div><div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{v.name}</div><div className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10} /> {v.date}</div></div>
                  </div>
                ))}
              </div>
            ) : (<p className="text-sm text-gray-500 mb-4">{t('vac_ai_no_new_suggestion')}</p>)}
            <div className="flex gap-2 mt-2">
              <button onClick={() => { setShowAiResultModal(false); setAiSuggestedVaccines([]); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-gray-100 dark:bg-neutral-800 text-gray-800 dark:text-gray-100 hover:bg-gray-200">{t('ok_btn')}</button>
              <button onClick={handleGoToVets} className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-indigo-600 text-white hover:bg-indigo-700">{t('acc_find_vet')}</button>
            </div>
          </div>
        </div>
      )}

      {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

export default VaccineManager;