import React, { useState } from 'react';
import { 
  Syringe, Check, Calendar, Plus, Sparkles, Loader, X, Lock, 
  ScanLine, AlertCircle, ShieldCheck, Clock, ChevronRight 
} from 'lucide-react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'; 
import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { usePremium } from '../context/PremiumContext'; 
import { getLocalizedData, generateID } from '../utils/helpers'; 
import PaywallModal from './PaywallModal'; 

const VaccineManager = ({ pet, setPets, onGoToVetLocator }) => {
  const { t, language } = useLanguage();
  const showNotification = useNotification();

  // Premium Kontrolleri
  const { canUseFeature, isPremium, recordAction } = usePremium();
  const [showPaywall, setShowPaywall] = useState(false);
  const [paywallFeature, setPaywallFeature] = useState(null);

  // State Yönetimi
  const [showForm, setShowForm] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [newVaccine, setNewVaccine] = useState({ name: '', date: '' });

  const [showAiPreModal, setShowAiPreModal] = useState(false);
  const [showAiResultModal, setShowAiResultModal] = useState(false);
  const [aiSuggestedVaccines, setAiSuggestedVaccines] = useState([]);

  // 🔴 GÜVENLİ BACKEND ADRESİ
  const SERVER_URL = "https://us-central1-pattty-7adff.cloudfunctions.net/chatWithAI";

  const vaccines = pet.vaccines || [];
  const localizedData = getLocalizedData(language || 'tr', t);
  const commonVaccines = localizedData.vaccines(pet.type) || [];

  // --- 1. SAĞLIK DURUMU ANALİZİ (DASHBOARD) ---
  const getHealthStatus = () => {
      const today = new Date();
      // Tarihi geçmiş ve yapılmamış aşılar
      const overdue = vaccines.filter(v => !v.done && new Date(v.date) < today);
      // Gelecek aşılar
      const upcoming = vaccines.filter(v => !v.done && new Date(v.date) >= today);
      
      if (overdue.length > 0) return { 
          status: 'risk', 
          label: t('vac_stat_risk'), 
          color: 'bg-gradient-to-r from-red-500 to-rose-600', 
          icon: AlertCircle, 
          desc: `${overdue.length} ${t('vac_stat_overdue_desc')}` 
      };
      
      if (upcoming.length > 0) return { 
          status: 'ok', 
          label: t('vac_stat_ok'), 
          color: 'bg-gradient-to-r from-blue-500 to-indigo-600', 
          icon: Clock, 
          desc: `${upcoming.length} ${t('vac_stat_upcoming_desc')}` 
      };
      
      if (vaccines.length > 0 && vaccines.every(v => v.done)) return { 
          status: 'perfect', 
          label: t('vac_stat_perfect'), 
          color: 'bg-gradient-to-r from-green-500 to-emerald-600', 
          icon: ShieldCheck, 
          desc: t('vac_stat_perfect_desc') 
      };
      
      return { 
          status: 'empty', 
          label: t('vac_stat_empty'), 
          color: 'bg-gradient-to-r from-gray-400 to-gray-500', 
          icon: Syringe, 
          desc: t('vac_stat_empty_desc') 
      };
  };

  const status = getHealthStatus();
  const StatusIcon = status.icon;

  // --- 2. MANUEL AŞI EKLEME ---
  const handleAdd = () => {
    if (!newVaccine.name || !newVaccine.date) {
      showNotification(t('vac_name_date_error'), 'error');
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

  // --- 3. KARNE TARAMA (SCAN CARD - PREMIUM) ---
  const handleScanClick = async () => {
      // A. Premium Kontrolü
      const check = canUseFeature('vaccine_scan');
      if (!check.allowed) {
          setPaywallFeature('vaccine_scan');
          setShowPaywall(true);
          return;
      }

      try {
          // B. Kamera/Galeri Seçimi
          const image = await Camera.getPhoto({
              quality: 80,
              allowEditing: false, 
              resultType: CameraResultType.Base64,
              source: CameraSource.Prompt, 
              promptLabelHeader: t('vac_scan_btn'),
              promptLabelPhoto: t('scan_gallery'),
              promptLabelPicture: t('scan_camera')
          });

          // C. Analiz Başlıyor
          setScanning(true);
          recordAction(); // Kullanım hakkından düş

          // D. AI Talimatı
          const systemPrompt = `
            GÖREV: Bu görsel bir evcil hayvan aşı karnesidir. Görseldeki aşı isimlerini ve tarihlerini (yapılmış veya yapılacak) analiz et.
            
            ÇIKTI FORMATI: SADECE geçerli bir JSON dizisi (array) döndür. Başka hiçbir metin yazma.
            JSON Örneği: [{"name": "Karma Aşı", "date": "2024-05-20"}, {"name": "Kuduz", "date": "2024-06-15"}]
            
            KURALLAR:
            - Tarih okunamazsa veya yoksa, bugünün tarihinden 1 ay sonrasını yaz.
            - Aşı isimlerini ${language === 'tr' ? 'Türkçe' : 'İngilizce'} diline çevir.
            - Eğer aşı listesi bulunamazsa boş dizi [] döndür.
          `;

          // E. Güvenli Sunucuya İstek
          const response = await fetch(SERVER_URL, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ 
                  contents: [{
                      role: "user",
                      parts: [
                          { text: systemPrompt },
                          { inlineData: { mimeType: `image/${image.format}`, data: image.base64String } }
                      ]
                  }]
              })
          });

          if (!response.ok) throw new Error("Sunucu hatası");

          const data = await response.json();
          const cleanText = data.text.replace(/```json|```/g, '').trim();
          const parsed = JSON.parse(cleanText);

          if (Array.isArray(parsed) && parsed.length > 0) {
              const mapped = parsed.map(v => ({ id: generateID(), name: v.name, date: v.date, done: true })); 
              setAiSuggestedVaccines(mapped);
              setPets(prev => prev.map(p => p.id === pet.id ? { ...p, vaccines: [...(p.vaccines || []), ...mapped] } : p));
              showNotification(t('vac_scan_success'), 'success');
              setShowAiResultModal(true);
          } else {
              showNotification(t('vac_scan_error'), 'error');
          }

      } catch (error) {
          if (error.message !== 'User cancelled photos app') {
              console.error("Scan Error:", error);
              showNotification(t('vac_scan_error'), 'error');
          }
      } finally {
          setScanning(false);
      }
  };

  // --- 4. AI İLE ÖNER (PREMIUM) ---
  const handleAiButtonClick = () => {
    const check = canUseFeature('ai_vaccine');
    if (check.allowed) setShowAiPreModal(true);
    else { setPaywallFeature('ai_vaccine'); setShowPaywall(true); }
  };

  const handleAiSuggest = async () => {
    setAiLoading(true);
    setShowAiPreModal(false);
    recordAction(); 

    try {
      const existingList = vaccines.length ? vaccines.map(v => `${v.name}`).join(', ') : (language === 'tr' ? 'Hiç yok' : 'None');
      
      const systemPrompt = `
        GÖREV: Lisanslı bir veteriner asistanı gibi davran. Aşağıdaki evcil hayvan için EKSİK olan veya ZAMANI GELMİŞ aşı takvimini oluştur.
        HAYVAN: ${pet.name}, Tür: ${pet.type}, Yaş: ${pet.age}.
        MEVCUT AŞILAR: ${existingList}
        
        ÇIKTI FORMATI: SADECE geçerli bir JSON objesi döndür.
        JSON Şeması: { "vaccines": [{"name": "Aşı Adı", "date": "YYYY-MM-DD"}] }
        
        KURALLAR:
        - Sadece gerekli olan aşıları öner.
        - Tarihleri bugünden (${new Date().toISOString().split('T')[0]}) en az 1 hafta sonraya ver.
        - Cevabı ${language === 'tr' ? 'Türkçe' : 'İngilizce'} ver.
      `;

      const response = await fetch(SERVER_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              contents: [{ role: 'user', parts: [{ text: systemPrompt }] }] 
          })
      });

      if (!response.ok) throw new Error("Sunucu hatası");

      const data = await response.json();
      let clean = data.text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const firstBrace = clean.indexOf('{');
      const lastBrace = clean.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) clean = clean.slice(firstBrace, lastBrace + 1);
      
      const parsed = JSON.parse(clean);
      const aiVaccines = Array.isArray(parsed.vaccines) ? parsed.vaccines : [];
      
      const mapped = aiVaccines.map(v => ({ id: generateID(), name: v.name, date: v.date, done: false }));
      
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

  // --- 5. VET LOCATOR ---
  const handleGoToVets = () => {
    const check = canUseFeature('vet_locator');
    if (!check.allowed) { setPaywallFeature('vet_locator'); setShowPaywall(true); return; }
    setShowAiResultModal(false);
    setAiSuggestedVaccines([]);
    if (onGoToVetLocator) onGoToVetLocator();
    else if (typeof window !== 'undefined' && typeof window.openVetLocatorFromVaccine === 'function') window.openVetLocatorFromVaccine();
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom duration-500 relative pb-20">
      
      {/* A. SAĞLIK DURUMU KARTI */}
      <div className={`p-6 rounded-[2rem] text-white shadow-xl shadow-gray-200/50 dark:shadow-none flex items-center justify-between transition-all hover:scale-[1.01] ${status.color}`}>
          <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                  <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                    <StatusIcon size={20} className="text-white"/>
                  </div>
                  <h3 className="font-extrabold text-lg tracking-tight">{status.label}</h3>
              </div>
              <p className="text-white/90 text-sm font-medium ml-1">{status.desc}</p>
          </div>
          {status.status === 'risk' && (
            <button onClick={handleGoToVets} className="bg-white/90 hover:bg-white text-red-600 px-4 py-2.5 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all flex items-center gap-1">
                {t('acc_find_vet')} <ChevronRight size={14}/>
            </button>
          )}
      </div>

      {/* B. PREMIUM AKSİYON BUTONLARI */}
      <div className="grid grid-cols-2 gap-4">
          
          {/* 1. AI Karne Tarama */}
          <button 
            onClick={handleScanClick} 
            disabled={scanning}
            className={`
                relative flex flex-col items-center justify-center gap-3 p-5 rounded-[1.8rem] shadow-sm border transition-all duration-300 group overflow-hidden
                ${isPremium 
                    ? 'bg-white dark:bg-neutral-800 border-gray-100 dark:border-white/10 hover:border-indigo-500/30 active:scale-95' 
                    : 'bg-gray-50 dark:bg-neutral-900 border-gray-200 dark:border-white/5 opacity-90'
                }
            `}
          >
              {!isPremium && (
                  <div className="absolute top-3 right-3 bg-yellow-400 text-black p-1.5 rounded-full shadow-lg shadow-yellow-400/20 z-10 animate-pulse">
                      <Lock size={12} strokeWidth={3}/>
                  </div>
              )}
              
              <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-500
                  ${scanning 
                      ? 'bg-indigo-100 text-indigo-600 animate-spin' 
                      : isPremium 
                          ? 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-indigo-500/20' 
                          : 'bg-gray-200 text-gray-400 dark:bg-white/5 grayscale'
                  }
              `}>
                  {scanning ? <Loader size={26}/> : <ScanLine size={26} strokeWidth={2}/>}
              </div>
              
              <div className="text-center">
                  <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-0.5">{t('vac_scan_btn')}</h4>
                  <p className="text-[10px] text-gray-400 font-medium">{t('vac_scan_subtitle') || "Fotoğraftan Otomatik"}</p>
              </div>
          </button>

          {/* 2. AI Akıllı Planlayıcı */}
          <button 
            onClick={handleAiButtonClick}
            disabled={aiLoading}
            className={`
                relative flex flex-col items-center justify-center gap-3 p-5 rounded-[1.8rem] shadow-lg transition-all duration-300 group overflow-hidden active:scale-95
                ${isPremium 
                    ? 'bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 text-white shadow-indigo-500/30' 
                    : 'bg-gray-800 text-gray-400 border border-gray-700'
                }
            `}
          >
              {!isPremium && (
                  <div className="absolute top-3 right-3 bg-white/20 backdrop-blur-md p-1.5 rounded-full z-10">
                      <Lock size={12} className="text-white"/>
                  </div>
              )}

              {/* Arka Plan Efekti */}
              {isPremium && <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>}

              <div className={`
                  w-14 h-14 rounded-2xl flex items-center justify-center bg-white/20 backdrop-blur-md border border-white/10 transition-transform duration-500 group-hover:rotate-12
                  ${aiLoading ? 'animate-pulse' : ''}
              `}>
                  {aiLoading ? <Loader size={26} className="animate-spin text-white"/> : <Sparkles size={26} className="text-white fill-white"/>}
              </div>

              <div className="text-center z-10">
                  <h4 className={`font-bold text-sm mb-0.5 ${!isPremium ? 'text-gray-300' : 'text-white'}`}>
                      {aiLoading ? t('ai_generating') : t('vac_ai_btn')}
                  </h4>
                  <p className={`text-[10px] font-medium ${!isPremium ? 'text-gray-500' : 'text-indigo-100'}`}>{t('vac_ai_subtitle') || "Akıllı Takvim"}</p>
              </div>
          </button>
      </div>

      {/* C. AŞI ZAMAN ÇİZELGESİ (TIMELINE) */}
      <div className="bg-white dark:bg-[#1A1D21] rounded-[2.5rem] p-6 shadow-sm border border-gray-100 dark:border-white/5 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6 relative z-10">
              <h3 className="font-extrabold text-gray-900 dark:text-white text-lg tracking-tight flex items-center gap-2">
                  <Syringe size={20} className="text-indigo-500"/>
                  {t('vaccine_title')}
              </h3>
              <button 
                onClick={() => setShowForm(true)} 
                className="w-10 h-10 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-indigo-600 hover:text-white transition-all shadow-sm active:scale-90"
              >
                  <Plus size={20} strokeWidth={2.5}/>
              </button>
          </div>

          <div className="space-y-0 relative z-10">
              {/* Dikey Çizgi */}
              <div className="absolute left-[21px] top-3 bottom-5 w-0.5 bg-gray-100 dark:bg-white/10 rounded-full"></div>

              {sortedVaccines.length === 0 && (
                  <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-300">
                          <Calendar size={32}/>
                      </div>
                      <p className="text-gray-400 text-sm font-medium">{t('vac_no_vaccines')}</p>
                  </div>
              )}

              {sortedVaccines.map((v, i) => {
                  const isPast = new Date(v.date) < new Date();
                  const isDone = v.done;
                  
                  let dotColor = isDone ? 'bg-green-500 shadow-green-500/40' : isPast ? 'bg-red-500 shadow-red-500/40' : 'bg-blue-500 shadow-blue-500/40';
                  let cardBg = isDone ? 'bg-green-50/50 dark:bg-green-900/10' : 'bg-white dark:bg-neutral-800';
                  
                  return (
                      <div key={v.id} className="relative pl-12 py-3 group">
                          <div className={`absolute left-3.5 top-6 w-3.5 h-3.5 rounded-full border-[3px] border-white dark:border-[#1A1D21] z-20 transition-all group-hover:scale-125 ${dotColor} shadow-lg`}></div>
                          
                          <div className={`flex items-center justify-between p-4 rounded-2xl border border-gray-100 dark:border-white/5 transition-all hover:shadow-md ${cardBg}`}>
                              <div>
                                  <h4 className={`font-bold text-sm mb-1 ${v.done ? 'text-gray-400 line-through decoration-2' : 'text-gray-900 dark:text-white'}`}>
                                      {v.name}
                                  </h4>
                                  <div className={`text-xs font-semibold flex items-center gap-1.5 ${v.done ? 'text-gray-400' : isPast ? 'text-red-500' : 'text-blue-500'}`}>
                                      <Calendar size={12} strokeWidth={2.5} /> 
                                      {new Date(v.date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                                  </div>
                              </div>
                              
                              <button 
                                onClick={() => toggleDone(v.id)} 
                                className={`
                                    w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90
                                    ${v.done 
                                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20'
                                    }
                                `}
                              >
                                  <Check size={20} strokeWidth={3} />
                              </button>
                          </div>
                      </div>
                  )
              })}
          </div>
      </div>

      {/* D. MANUEL EKLEME MODALI - NOTCH UYUMLU */}
      {showForm && (
        // DÜZELTME: pt-safe-top eklendi
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300 pt-safe-top pb-safe-bottom">
            <div className="bg-white dark:bg-[#1A1D21] w-full max-w-sm rounded-[2rem] p-6 shadow-2xl relative animate-in zoom-in-95 border border-white/10">
                <button onClick={() => setShowForm(false)} className="absolute right-5 top-5 p-2 bg-gray-100 dark:bg-white/5 rounded-full text-gray-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X size={18}/></button>
                
                <h3 className="font-extrabold text-xl mb-6 dark:text-white flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-indigo-500 rounded-full"></div>
                    {t('vac_add')}
                </h3>
                
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('lbl_vaccine_name')}</label>
                        <select 
                            value={newVaccine.name} 
                            onChange={e => setNewVaccine(prev => ({ ...prev, name: e.target.value }))} 
                            className="w-full p-4 bg-gray-50 dark:bg-black/30 rounded-2xl font-bold text-sm outline-none dark:text-white border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all appearance-none"
                        >
                            <option value="">{t('select_vaccine')}</option>
                            {commonVaccines.map(v => <option key={v} value={v}>{v}</option>)}
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-400 uppercase ml-1">{t('lbl_date')}</label>
                        <input 
                            type="date" 
                            value={newVaccine.date} 
                            onChange={e => setNewVaccine(prev => ({ ...prev, date: e.target.value }))} 
                            className="w-full p-4 bg-gray-50 dark:bg-black/30 rounded-2xl font-bold text-sm outline-none dark:text-white border-2 border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-black transition-all min-h-[56px]" 
                        />
                    </div>

                    <button onClick={handleAdd} className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-indigo-500/30 active:scale-95 transition-all mt-2">
                        {t('save')}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* E. AI ÖNERİ ÖN İZLEME MODALI - NOTCH UYUMLU */}
      {showAiPreModal && (
        // DÜZELTME: pt-safe-top eklendi
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md px-6 pt-safe-top pb-safe-bottom">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1D21] rounded-[2rem] shadow-2xl p-6 relative border border-white/10 animate-in slide-in-from-bottom-10">
            <button onClick={() => setShowAiPreModal(false)} className="absolute right-5 top-5 text-gray-400 hover:text-white"><X size={20} /></button>
            
            <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mb-4">
                <Sparkles size={32} className="text-white fill-white animate-pulse"/>
            </div>

            <h2 className="text-xl font-black mb-2 text-gray-900 dark:text-white">
                {t('vac_ai_suggest_title')}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
                {t('vac_ai_pre_desc')}
            </p>
            
            <div className="flex flex-col gap-3">
              <button 
                onClick={handleAiSuggest} 
                className="w-full py-4 rounded-2xl text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-xl shadow-indigo-500/20 active:scale-95 transition-all"
              >
                  {t('vac_continue_with_ai_btn')}
              </button>
              <button 
                onClick={() => { setShowAiPreModal(false); setShowForm(true); }} 
                className="w-full py-4 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10 active:scale-95 transition-all"
              >
                  {t('vac_add_manually_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* F. AI SONUÇ MODALI - NOTCH UYUMLU */}
      {showAiResultModal && (
        // DÜZELTME: pt-safe-top eklendi
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md px-6 pt-safe-top pb-safe-bottom">
          <div className="w-full max-w-md bg-white dark:bg-[#1A1D21] rounded-[2rem] shadow-2xl p-6 relative border border-white/10 animate-in zoom-in-95">
            
            <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full mb-3">
                    <Check size={24} strokeWidth={3}/>
                </div>
                <h2 className="text-xl font-black text-gray-900 dark:text-white">{t('vac_ai_result_title')}</h2>
                <p className="text-xs text-gray-500 mt-1">{aiSuggestedVaccines.length} {t('vac_ai_added_count_suffix')}</p>
            </div>

            {aiSuggestedVaccines.length > 0 ? (
              <div className="max-h-60 overflow-y-auto space-y-2 mb-6 pr-1 custom-scrollbar">
                {aiSuggestedVaccines.map(v => (
                  <div key={v.id} className="p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 flex justify-between items-center">
                    <div>
                        <div className="text-sm font-bold text-gray-800 dark:text-white">{v.name}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5"><Calendar size={10} /> {v.date}</div>
                    </div>
                    <Check size={16} className="text-green-500"/>
                  </div>
                ))}
              </div>
            ) : (<p className="text-sm text-center text-gray-500 mb-6 bg-gray-50 dark:bg-white/5 p-4 rounded-xl">{t('vac_ai_no_new_suggestion')}</p>)}
            
            <div className="flex gap-3">
              <button onClick={() => { setShowAiResultModal(false); setAiSuggestedVaccines([]); }} className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-gray-100 dark:bg-white/10 text-gray-800 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20 transition-colors">
                  {t('ok_btn')}
              </button>
              <button onClick={handleGoToVets} className="flex-1 py-3.5 rounded-2xl text-sm font-bold bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors">
                  {t('acc_find_vet')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* G. PAYWALL MODALI (GLOBAL) */}
      {showPaywall && <PaywallModal feature={paywallFeature} onClose={() => setShowPaywall(false)} />}
    </div>
  );
};

export default VaccineManager;