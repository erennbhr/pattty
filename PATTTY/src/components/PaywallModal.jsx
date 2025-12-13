import React, { useState } from 'react';
import { X, Check, Star, ShieldCheck, Zap, Crown } from 'lucide-react';
import { usePremium } from '../context/PremiumContext';
import { useLanguage } from '../context/LanguageContext';

const PaywallModal = ({ feature, onClose }) => {
  const { upgradeToPremium } = usePremium();
  const { t } = useLanguage();
  
  const [plan, setPlan] = useState('yearly'); 

  const handleUpgrade = () => {
    upgradeToPremium();
    onClose();
  };

  const getDynamicHeader = () => {
    if (!feature) return null;
    let title = "";
    switch (feature) {
        case 'food_scan': title = t('pw_feat_food'); break;
        case 'vet_locator': title = t('pw_feat_vet'); break;
        case 'ai_chat': title = t('pw_feat_chat'); break;
        case 'multi_pet': title = t('pw_feat_multi'); break;
        case 'ai_vaccine': title = t('pw_vaccine_title'); break;
        case 'vaccine_scan': title = t('pw_scan_card_title'); break; // YENİ
        case 'expense_charts': title = t('pw_expense_title'); break;
        case 'export_report': title = t('pw_report_title'); break;
        default: return null;
    }
    return (
        <div className="flex items-center justify-center gap-2 bg-indigo-500/20 text-indigo-200 py-2 px-4 rounded-full mb-6 animate-in fade-in slide-in-from-top-2 mx-auto w-fit">
            <Zap size={14} className="fill-indigo-400 text-indigo-400" />
            <span className="text-xs font-bold uppercase tracking-wide">{title} {t('pw_feat_unlock')}</span>
        </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-gray-900/80 backdrop-blur-md transition-opacity" onClick={onClose} />
      
      <div className="bg-[#0f0f13] w-full max-w-md sm:rounded-[2.5rem] rounded-t-[2.5rem] relative z-10 animate-in slide-in-from-bottom duration-500 overflow-hidden shadow-2xl border border-white/10 flex flex-col max-h-[90vh]">
        
        <div className="relative h-40 bg-gradient-to-br from-indigo-600 via-purple-700 to-fuchsia-800 shrink-0 overflow-visible">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
            <div className="absolute -bottom-1 left-0 right-0 h-16 bg-gradient-to-t from-[#0f0f13] to-transparent z-0"></div>
            
            <button 
                onClick={onClose}
                className="absolute top-5 right-5 p-2 bg-black/20 hover:bg-black/40 text-white rounded-full transition-all backdrop-blur-md z-50 active:scale-90"
            >
                <X size={20}/>
            </button>

            <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-20">
                <div className="w-20 h-20 bg-gradient-to-tr from-yellow-300 to-amber-500 rounded-3xl rotate-3 flex items-center justify-center shadow-[0_10px_20px_rgba(245,158,11,0.4)] animate-pulse border-4 border-[#0f0f13]">
                    <Crown size={40} className="text-white fill-white" />
                </div>
            </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-14 pb-6 no-scrollbar">
            
            <div className="text-center mb-6">
                <h2 className="text-3xl font-black text-white leading-tight mb-2">
                    {t('pw_hero_title')} <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-500">PLUS</span>
                </h2>
                <p className="text-gray-400 text-sm leading-relaxed px-2">
                    {t('pw_hero_desc')}
                </p>
            </div>

            {getDynamicHeader()}

            <div className="space-y-3 mb-8">
                <BenefitItem text={t('pw_benefit_1')} sub={t('pw_benefit_1_sub')} />
                <BenefitItem text={t('pw_benefit_2')} sub={t('pw_benefit_2_sub')} />
                <BenefitItem text={t('pw_benefit_3')} sub={t('pw_benefit_3_sub')} />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
                <div 
                    onClick={() => setPlan('monthly')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 ${plan === 'monthly' ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 bg-white/5'}`}
                >
                    <div className="text-center">
                        <span className={`text-xs font-bold uppercase tracking-wider ${plan === 'monthly' ? 'text-indigo-300' : 'text-gray-500'}`}>{t('pw_plan_monthly')}</span>
                        <div className="text-xl font-bold text-white mt-1">₺39.99<span className="text-xs font-normal text-gray-400">/mo</span></div>
                    </div>
                </div>

                <div 
                    onClick={() => setPlan('yearly')}
                    className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all active:scale-95 ${plan === 'yearly' ? 'border-yellow-500 bg-yellow-500/10 shadow-[0_0_20px_rgba(234,179,8,0.2)]' : 'border-white/10 bg-white/5'}`}
                >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md whitespace-nowrap">
                        {t('pw_best_value')}
                    </div>
                    <div className="text-center">
                        <span className={`text-xs font-bold uppercase tracking-wider ${plan === 'yearly' ? 'text-yellow-300' : 'text-gray-500'}`}>{t('pw_plan_yearly')}</span>
                        <div className="text-xl font-bold text-white mt-1">₺29.99<span className="text-xs font-normal text-gray-400">/mo</span></div>
                        <div className="text-[10px] text-gray-400 line-through mt-0.5">₺479.88</div>
                    </div>
                </div>
            </div>

            <div className="bg-white/5 rounded-xl p-3 flex items-center justify-center gap-3 mb-6 border border-white/5">
                <div className="text-2xl">🥫</div>
                <p className="text-xs text-gray-300 font-medium">
                    {t('pw_food_compare')} <strong>{t('pw_food_compare_bold')}</strong>
                </p>
            </div>

            <button 
                onClick={handleUpgrade}
                className="w-full py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white rounded-2xl font-bold text-lg shadow-xl shadow-indigo-500/40 active:scale-95 transition-all group relative overflow-hidden"
            >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 blur-md"></div>
                <span className="relative flex items-center justify-center gap-2">
                    {plan === 'yearly' ? t('pw_cta_year') : t('pw_cta_month')} <Zap size={20} className="fill-white"/>
                </span>
            </button>

            <div className="mt-6 flex flex-col items-center gap-3 pb-safe-bottom">
                <div className="flex items-center gap-1.5 text-[10px] text-green-400 font-bold bg-green-900/20 px-2 py-1 rounded-md">
                    <ShieldCheck size={12}/> {t('pw_secure')}
                </div>
                <p className="text-[10px] text-gray-500 text-center max-w-xs leading-normal">
                    {t('pw_terms')}
                </p>
                <button className="text-[10px] text-gray-400 font-bold uppercase tracking-wide hover:text-white transition-colors">
                    {t('pw_restore')}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};

const BenefitItem = ({ text, sub }) => (
    <div className="flex items-start gap-4 p-3 rounded-2xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
        <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
            <Check size={18} className="text-indigo-400" strokeWidth={3} />
        </div>
        <div>
            <h4 className="text-white font-bold text-sm">{text}</h4>
            <p className="text-gray-400 text-xs mt-0.5 leading-snug">{sub}</p>
        </div>
    </div>
);

export default PaywallModal;