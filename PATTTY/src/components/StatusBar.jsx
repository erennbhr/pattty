import React, { useState, useEffect } from 'react';
import { Signal, Wifi, Battery } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StatusBar = ({ darkMode }) => {
  const { language } = useLanguage();
  const [time, setTime] = useState();

  useEffect(() => {
    // Dil ayarına göre saat formatı (TR veya EN)
    const locale = language === 'tr' ? 'tr-TR' : 'en-US';
    
    const updateTime = () => {
        setTime(new Date().toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' }));
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [language]);

  return (
    <div className={`w-full flex justify-between items-center px-6 pt-safe pb-2 text-xs font-semibold select-none z-50 ${darkMode ? 'text-white' : 'text-gray-900'}`}> 
      <span>{time}</span>
      <div className="flex items-center gap-1.5">
          <Signal size={14} />
          <Wifi size={14} />
          <Battery size={16} className="rotate-90" />
      </div>
    </div>
  );
};

export default StatusBar;