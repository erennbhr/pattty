import React, { useState } from 'react';
import { 
  X, Check, ShieldCheck, Zap, Crown, Loader2, 
  Star, Lock, TrendingUp, Sparkles 
} from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import { useLanguage } from '../context/LanguageContext';
// import { useApp } from '../context/AppContext'; // Artık gerek yok, para birimi RevenueCat'ten geliyor

const PaywallModal = ({ feature, onClose }) => {
  // 1. GÜNCELLEME: 'offerings' verisini çekiyoruz
  const { purchasePackage, restorePurchases, offerings } = usePremium();
  const { t } = useLanguage();
  
  const [selectedPlan, setSelectedPlan] = useState('yearly'); 
  const [processing, setProcessing] = useState(false);

  // 2. GÜNCELLEME: Gerçek Yıllık Paket Üzerinden Aylık Maliyeti Hesaplama
  const getMonthlyBreakdown = () => {
    if (offerings?.annual?.product) {
        const price = offerings.annual.product.price;
        const symbol = offerings.annual.product.currencySymbol;
        // Yıllık fiyatı 12'ye bölüp 2 basamak gösteriyoruz
        return `${symbol}${(price / 12).toFixed(2)}`;
    }
    return "...";
  };

  const handlePurchase = async () => {
    setProcessing(true);
    const result = await purchasePackage(selectedPlan);
    if (result.success) {
      setTimeout(() => { setProcessing(false); onClose(); }, 500);
    } else {
      setProcessing(false);
      // Kullanıcı iptal ettiyse alert göstermeyebiliriz, context hallediyor
      if (result.error) alert(t('pay_error_title') || "Error"); 
    }
  };

  const handleRestore = async () => {
    setProcessing(true);
    const result = await restorePurchases();
    setProcessing(false);
    if (result.success) { alert(t('pay_restore_success')); onClose(); } 
    else { alert(t('pay_restore_fail')); }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4 font-sans">
      
      {/* 1. KATMAN: Arka Plan Blur & Karartma */}
      <div className="absolute inset-0 bg-[#000000]/90 backdrop-blur-xl transition-opacity duration-500" onClick={onClose} />
      
      {/* 2. KATMAN: Modal Gövdesi */}
      <div className="bg-[#0f0f13] w-full max-w-lg sm:rounded-[3rem] rounded-t-[3rem] relative z-10 animate-in slide-in-from-bottom duration-500 overflow-hidden shadow-[0_0_100px_rgba(79,70,229,0.3)] border border-white/10 flex flex-col max-h-[95vh]">
        
        {/* --- HERO HEADER --- */}
        <div className="relative h-56 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900 via-[#0f0f13] to-[#0f0f13] shrink-0">
            
            {/* Kapat Butonu */}
            <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all z-50 text-white/60 hover:text-white active:scale-90">
                <X size={24}/>
            </button>

            {/* Animasyonlu Arka Plan Parçacıkları */}
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 animate-pulse"></div>

            {/* İçerik */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pt-4">
                <div className="relative">
                    <div className="absolute -inset-4 bg-indigo-500/30 rounded-full blur-xl animate-pulse"></div>
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl rotate-6 flex items-center justify-center shadow-2xl ring-4 ring-black/50 relative z-10">
                        <Crown size={40} className="text-white fill-white drop-shadow-md" />
                    </div>
                    {/* Küçük Yıldızlar */}
                    <Star size={16} className="absolute -top-2 -right-6 text-yellow-400 fill-yellow-400 animate-bounce delay-100" />
                    <Star size={12} className="absolute bottom-0 -left-6 text-yellow-400 fill-yellow-400 animate-bounce delay-300" />
                </div>
                
                <h2 className="text-3xl font-black text-white mt-6 tracking-tight">
                    Pattty <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">PREMIUM</span>
                </h2>
                <div className="flex items-center gap-1 mt-1">
                    <div className="flex">
                        {[1,2,3,4,5].map(i => <Star key={i} size={12} className="text-yellow-500 fill-yellow-500"/>)}
                    </div>
                    <span className="text-xs text-gray-400 font-medium ml-1">4.9/5 Average Rating</span>
                </div>
            </div>
        </div>

        {/* --- SCROLLABLE CONTENT --- */}
        <div className="flex-1 overflow-y-auto px-6 pb-8 no-scrollbar -mt-4 relative z-20">
            
            {/* Trust / Review Section (Sosyal Kanıt) */}
            <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 mb-6 border border-white/5 mx-2">
                <p className="text-gray-300 text-sm italic leading-relaxed">"{t('pay_review_text') || 'My pet loves this app!'}"</p>
                <div className="flex items-center gap-2 mt-2">
                    <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] font-bold text-white">E</div>
                    <span className="text-xs text-gray-400 font-bold">{t('pay_review_author') || 'Dr. Emily'}</span>
                </div>
            </div>

            {/* --- KARŞILAŞTIRMA TABLOSU --- */}
            <div className="mb-8 px-2">
                <div className="flex justify-between text-xs font-bold text-gray-500 mb-2 px-4">
                    <span>{t('pay_feat_compare_free') || 'Free'}</span>
                    <span className="text-indigo-400">{t('pay_feat_compare_prem') || 'Premium'}</span>
                </div>
                
                <div className="space-y-2">
                    <CompareRow text={t('pay_feat_row_1') || 'Basic Tracking'} free={true} premium={true} />
                    <CompareRow text={t('pay_feat_row_2') || 'Vaccine Reminders'} free={false} premium={true} highlight />
                    <CompareRow text={t('pay_feat_row_3') || 'AI Vet Chat'} free={false} premium={true} highlight />
                    <CompareRow text={t('pay_feat_row_4') || 'Health Analysis'} free={false} premium={true} highlight />
                </div>
            </div>

            {/* --- PLAN KARTLARI --- */}
            <div className="space-y-4 mb-6">
                
                {/* YILLIK PLAN (HERO CARD) */}
                <div 
                    onClick={() => setSelectedPlan('yearly')}
                    className={`relative overflow-hidden p-0.5 rounded-3xl transition-all duration-300 active:scale-[0.98] cursor-pointer group
                        ${selectedPlan === 'yearly' ? 'ring-2 ring-indigo-500 shadow-[0_0_40px_-10px_rgba(99,102,241,0.5)]' : 'opacity-80 hover:opacity-100'}
                    `}
                >
                    {/* Hareketli Gradient Border */}
                    <div className={`absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-spin-slow opacity-100`}></div>
                    
                    <div className="relative bg-[#16161e] rounded-[22px] p-5 h-full flex items-center justify-between">
                        {/* Sol Taraf */}
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-white">{t('pay_plan_yearly_label')}</span>
                                <span className="bg-indigo-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full animate-pulse">
                                    {t('pay_badge_save')}
                                </span>
                            </div>
                            
                            {/* Eski Fiyat (Sadece görsel amaçlı, gerçek fiyatın %20 fazlasını gösterelim) */}
                            <div className="text-xs text-gray-400 line-through">
                                {offerings?.annual?.product ? offerings.annual.product.currencySymbol + (offerings.annual.product.price * 1.2).toFixed(2) : "..."}
                            </div>
                            
                            {/* 3. GÜNCELLEME: Gerçek Fiyat Gösterimi */}
                            <div className="text-2xl font-black text-white tracking-tight">
                                {offerings?.annual?.product?.priceString || "..."}
                            </div>
                            
                            <div className="text-xs text-indigo-300 font-medium mt-1">
                                {t('pay_text_just_per_month').replace('{price}', getMonthlyBreakdown())}
                            </div>
                        </div>

                        {/* Sağ Taraf */}
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                            ${selectedPlan === 'yearly' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600 bg-transparent'}
                        `}>
                            {selectedPlan === 'yearly' && <Check size={14} className="text-white" strokeWidth={4}/>}
                        </div>
                    </div>
                </div>

                {/* AYLIK PLAN */}
                <div 
                    onClick={() => setSelectedPlan('monthly')}
                    className={`relative p-5 rounded-3xl border-2 transition-all cursor-pointer flex items-center justify-between bg-[#16161e]
                        ${selectedPlan === 'monthly' ? 'border-indigo-500/50' : 'border-white/5 hover:border-white/10'}
                    `}
                >
                    <div>
                        <span className="text-sm font-bold text-gray-300">{t('pay_plan_monthly_label')}</span>
                        {/* 3. GÜNCELLEME: Gerçek Fiyat Gösterimi */}
                        <div className="text-lg font-bold text-white mt-1">
                            {offerings?.monthly?.product?.priceString || "..."}
                        </div>
                    </div>
                    
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                        ${selectedPlan === 'monthly' ? 'border-indigo-500 bg-indigo-500' : 'border-gray-600 bg-transparent'}
                    `}>
                        {selectedPlan === 'monthly' && <Check size={14} className="text-white" strokeWidth={4}/>}
                    </div>
                </div>

            </div>

            {/* --- CTA BUTTON --- */}
            <button 
                onClick={handlePurchase}
                disabled={processing || !offerings} // Paketler yüklenmeden tıklanamasın
                className="group relative w-full py-5 bg-white text-black rounded-2xl font-black text-xl shadow-[0_0_50px_-10px_rgba(255,255,255,0.3)] active:scale-[0.98] transition-all overflow-hidden disabled:opacity-70"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-100 via-white to-indigo-100 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <span className="relative z-10 flex items-center justify-center gap-2">
                    {processing ? <Loader2 className="animate-spin"/> : t('pay_btn_start')}
                    {!processing && <Zap size={24} className="fill-black" />}
                </span>
            </button>

            {/* --- GÜVENLİK --- */}
            <div className="mt-6 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                    <ShieldCheck size={12} className="text-green-500"/>
                    {t('pay_secure') || 'Secured by Apple & Google'}
                </div>
                <button onClick={handleRestore} className="text-[10px] text-gray-500 font-bold hover:text-white transition-colors uppercase tracking-widest">
                    {t('pay_btn_restore')}
                </button>
                <div className="flex gap-4 text-[9px] text-gray-600">
                    <button>{t('pay_terms')}</button>
                    <button>{t('pay_privacy')}</button>
                </div>
            </div>

        </div>
      </div>
      
      {/* CSS Animasyonları */}
      <style>{`
        .animate-spin-slow { animation: spin 4s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

// --- YARDIMCI BİLEŞEN ---
const CompareRow = ({ text, free, premium, highlight }) => (
    <div className={`flex items-center justify-between p-3 rounded-xl ${highlight ? 'bg-white/5 border border-white/5' : ''}`}>
        <div className="flex items-center gap-3 flex-1">
            <div className={`w-1.5 h-1.5 rounded-full ${highlight ? 'bg-indigo-500' : 'bg-gray-600'}`}></div>
            <span className={`text-xs font-medium ${highlight ? 'text-white' : 'text-gray-400'}`}>{text}</span>
        </div>
        <div className="flex items-center gap-8 px-2">
            {free ? <Check size={14} className="text-gray-500"/> : <Lock size={12} className="text-gray-700"/>}
            <div className="w-5 h-5 rounded-full bg-indigo-500 flex items-center justify-center shadow-[0_0_10px_rgba(99,102,241,0.5)]">
                <Check size={12} className="text-white font-bold" strokeWidth={4}/>
            </div>
        </div>
    </div>
);

export default PaywallModal;