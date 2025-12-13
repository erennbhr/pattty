import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

const PremiumContext = createContext();

export const PremiumProvider = ({ children }) => {
  const { t } = useLanguage();

  const [isPremium, setIsPremium] = useState(() => {
    return localStorage.getItem('pattty_is_premium') === 'true';
  });

  const [aiStats, setAiStats] = useState(() => {
    const saved = localStorage.getItem('pattty_ai_stats');
    const today = new Date().toISOString().split('T')[0]; 
    if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.date === today) return parsed;
    }
    return { date: today, msgCount: 0, actionCount: 0 };
  });

  const LIMITS = {
      MAX_MSGS_PER_DAY: 10,
      MAX_ACTIONS_PER_DAY: 1 
  };

  useEffect(() => {
    localStorage.setItem('pattty_is_premium', isPremium);
  }, [isPremium]);

  useEffect(() => {
    localStorage.setItem('pattty_ai_stats', JSON.stringify(aiStats));
  }, [aiStats]);

  const checkDailyReset = () => {
      const today = new Date().toISOString().split('T')[0];
      if (aiStats.date !== today) {
          setAiStats({ date: today, msgCount: 0, actionCount: 0 });
          return true;
      }
      return false; 
  };
  
  const canUseFeature = (featureKey) => {
    if (isPremium) return { allowed: true };
    
    checkDailyReset();

    switch (featureKey) {
      case 'multi_pet':
        return { allowed: false, type: 'limit', msg: t('prem_limit_multi_pet') };
      
      case 'food_scan': 
      case 'vet_locator': 
      case 'ai_vaccine': 
      case 'export_report': 
      case 'expense_charts': 
      case 'vaccine_scan': // YENİ: Aşı Karnesi Tarama
        return { allowed: false, type: 'locked', msg: t('prem_locked_feature') };

      case 'ai_chat': 
        if (aiStats.actionCount >= LIMITS.MAX_ACTIONS_PER_DAY) {
            return { allowed: false, type: 'action_limit', msg: t('prem_action_limit') };
        }
        if (aiStats.msgCount >= LIMITS.MAX_MSGS_PER_DAY) {
            return { allowed: false, type: 'msg_limit', msg: t('prem_chat_limit') };
        }
        return { allowed: true };
        
      case 'ai_image': 
        return { allowed: false, type: 'locked', msg: t('prem_img_limit') };

      default:
        return { allowed: true };
    }
  };

  const recordMessage = () => { if (!isPremium) setAiStats(prev => ({ ...prev, msgCount: prev.msgCount + 1 })); };
  const recordAction = () => { if (!isPremium) setAiStats(prev => ({ ...prev, actionCount: prev.actionCount + 1 })); };

  const upgradeToPremium = () => { setIsPremium(true); alert(t('prem_upgrade_success')); };
  const downgradeToFree = () => { setIsPremium(false); };

  return (
    <PremiumContext.Provider value={{ isPremium, aiStats, canUseFeature, recordMessage, recordAction, upgradeToPremium, downgradeToFree }}>
      {children}
    </PremiumContext.Provider>
  );
};

export const usePremium = () => useContext(PremiumContext);