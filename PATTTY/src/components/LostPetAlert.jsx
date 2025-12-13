import React from 'react';
import { AlertTriangle, MapPin, Phone, Navigation, X, PawPrint, Info } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LostPetAlert = ({ alert, onDismiss }) => {
  const { t } = useLanguage();

  const handleNavigate = () => {
    if (alert.location && alert.location.lat) {
      const url = `https://www.google.com/maps/search/?api=1&query=${alert.location.lat},${alert.location.lng}`;
      window.open(url, '_blank');
    }
  };

  return (
    <div className="w-full bg-red-600 rounded-3xl p-1 shadow-xl shadow-red-500/30 animate-pulse-slow mb-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_10px,rgba(0,0,0,0.1)_10px,rgba(0,0,0,0.1)_20px)]"></div>
      
      <div className="relative bg-red-600 rounded-[1.3rem] p-4 text-white">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
            <AlertTriangle size={16} className="text-yellow-300 fill-yellow-300 animate-pulse"/>
            <span className="text-xs font-black uppercase tracking-wider text-white">{t('alert_header')}</span>
          </div>
          <span className="text-[10px] font-bold opacity-80 bg-black/20 px-2 py-1 rounded-lg">
            {alert.distance} km {t('alert_near')}
          </span>
        </div>

        {/* Ana İçerik */}
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-white rounded-2xl p-1 shrink-0 shadow-lg rotate-3 overflow-hidden border-2 border-white/50">
             {alert.photo ? (
               <img src={alert.photo} alt={alert.petName} className="w-full h-full object-cover rounded-xl" />
             ) : (
               <div className="w-full h-full bg-gray-100 rounded-xl flex items-center justify-center text-gray-400">
                 <PawPrint size={32} />
               </div>
             )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-black leading-tight mb-1">{alert.petName} {t('alert_lost_suffix')}</h3>
            
            {/* Detay Etiketleri */}
            <div className="flex flex-wrap gap-1.5 mb-2">
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold border border-white/10">{alert.details?.breed}</span>
                <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold border border-white/10">{alert.details?.weight}kg</span>
                {alert.details?.color && (
                    <span className="px-1.5 py-0.5 bg-white/20 rounded text-[9px] font-bold border border-white/10 flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full border border-white/30" style={{backgroundColor: alert.details.color}}/>
                        {t('alert_detail_color')}
                    </span>
                )}
            </div>

            <div className="flex items-start gap-1.5 bg-black/20 p-2 rounded-lg">
              <Info size={12} className="shrink-0 mt-0.5 opacity-70"/>
              <p className="text-xs text-white font-medium line-clamp-2 leading-snug">
                "{alert.message}"
              </p>
            </div>
          </div>
        </div>

        {/* Konum ve Aksiyonlar */}
        <div className="mt-3 pt-3 border-t border-white/10">
            <div className="flex items-center gap-1 text-[10px] opacity-90 font-bold mb-3">
              <MapPin size={12}/> {alert.address}
            </div>

            <div className="grid grid-cols-2 gap-3">
                <a href={`tel:${alert.ownerPhone}`} className="bg-white text-red-600 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:bg-gray-100 active:scale-95 transition-all">
                    <Phone size={16} className="fill-red-600"/> {t('alert_seen_call')}
                </a>
                <button onClick={handleNavigate} className="bg-black/30 text-white py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-black/40 active:scale-95 transition-all border border-white/10">
                    <Navigation size={16}/> {t('alert_navigate_btn')}
                </button>
            </div>
        </div>

        <button onClick={onDismiss} className="absolute top-2 right-2 p-2 text-white/50 hover:text-white"><X size={16}/></button>
      </div>
    </div>
  );
};

export default LostPetAlert;