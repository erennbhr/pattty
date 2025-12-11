import React from 'react';
import { ChevronLeft, MapPin, Navigation, Phone, Star, Clock } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VetDetails = ({ vet, onBack }) => {
  const { t, language } = useLanguage();

  if (!vet) return null;

  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const dest =
    vet.location && vet.location.lat && vet.location.lng
      ? `${vet.location.lat},${vet.location.lng}`
      : encodeURIComponent(vet.address || vet.name);

  const handleOpenMaps = () => {
    const url = isIOS
      ? `http://maps.apple.com/?daddr=${dest}`
      : `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (!vet.phone) return;
    const normalized = vet.phone.replace(/\s+/g, '');
    window.location.href = `tel:${normalized}`;
  };

  return (
    <div className="flex flex-col h-full bg-black animate-in fade-in slide-in-from-right-4">
      {/* HEADER */}
      <div className="p-4 flex items-center gap-3 bg-[#111417] border-b border-white/5">
        <button
          onClick={onBack}
          className="p-2 rounded-full bg-[#1A1D21] hover:bg-[#23262B] transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-200" />
        </button>
        <div className="flex flex-col">
          <h2 className="text-lg font-bold text-gray-100 truncate">
            {vet.name}
          </h2>
          <span className="text-xs text-gray-500">
            {t('vet_details') || (language === 'tr' ? 'Klinik Detayları' : 'Clinic Details')}
          </span>
        </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 p-5 space-y-4 overflow-y-auto pb-24">
        {/* CARD */}
        <div className="bg-[#111417] rounded-3xl border border-white/5 p-4 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
              <MapPin size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-300 font-semibold truncate">
                {vet.address || (language === 'tr' ? 'Adres bilgisi yok' : 'No address info')}
              </div>
              {vet.dist && (
                <div className="text-xs text-gray-500 flex items-center gap-1 mt-1">
                  <Navigation size={12} /> {vet.dist}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <Star size={12} className="text-yellow-400 fill-yellow-400" />
              <span>{(t('vet_rating') || 'Rating') + ': '}{vet.rating}</span>
            </div>
          </div>
        </div>

        {/* HOURS */}
        <div className="bg-[#111417] rounded-3xl border border-white/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-indigo-400" />
            <span className="text-sm font-semibold text-gray-100">
              {t('vet_hours') || (language === 'tr' ? 'Çalışma Saatleri' : 'Working Hours')}
            </span>
          </div>

          {Array.isArray(vet.openingHours) && vet.openingHours.length > 0 ? (
            <ul className="space-y-1 text-xs text-gray-300">
              {vet.openingHours.map((line, idx) => (
                <li key={idx}>{line}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500">
              {t('vet_no_hours') ||
                (language === 'tr'
                  ? 'Çalışma saatleri bilgisi bulunmuyor.'
                  : 'No working hours information.')}
            </p>
          )}
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleOpenMaps}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white text-sm font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
          >
            <Navigation size={18} />
            {t('vet_navigate') ||
              (language === 'tr' ? 'Haritada Aç' : 'Open in Maps')}
          </button>

          <button
            onClick={handleCall}
            disabled={!vet.phone}
            className={`w-full py-3 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-colors ${
              vet.phone
                ? 'bg-[#1A1D21] text-gray-100 hover:bg-[#23262B]'
                : 'bg-[#1A1D21] text-gray-500 opacity-60 cursor-not-allowed'
            }`}
          >
            <Phone size={18} />
            {t('vet_call') || (language === 'tr' ? 'Kliniği Ara' : 'Call Clinic')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VetDetails;
