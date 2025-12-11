import React, { useEffect, useState } from 'react';
import { ChevronLeft, MapPin, Navigation, Phone, Star, Clock, Share2, AlertCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const VetDetails = ({ vet, onBack }) => {
  const { t } = useLanguage();
  const [photoUrl, setPhotoUrl] = useState(null);

  // Sadece bu detay sayfasına girildiğinde fotoğrafı çek
  useEffect(() => {
    if (vet?.id && window.google?.maps?.places) {
      const fetchPhoto = async () => {
        try {
          // Google Maps Places kütüphanesini yükle
          const { Place } = await window.google.maps.importLibrary("places");
          
          // Place nesnesini oluştur
          const place = new Place({ id: vet.id });
          
          // Sadece 'photos' alanını iste (Maliyet optimizasyonu)
          await place.fetchFields({ fields: ['photos'] });
          
          // Fotoğraf varsa URL'ini al (max genişlik/yükseklik belirterek)
          if (place.photos && place.photos.length > 0) {
            const url = place.photos[0].getURI({ maxWidth: 1200, maxHeight: 800 });
            setPhotoUrl(url);
          }
        } catch (err) {
          console.warn("Klinik fotoğrafı yüklenemedi:", err);
        }
      };
      
      fetchPhoto();
    }
  }, [vet]);

  if (!vet) return null;

  // Koordinat veya adres kullanarak hedef oluştur
  const destCoords = vet.location && vet.location.lat 
    ? `${vet.location.lat},${vet.location.lng}` 
    : vet.address;
  
  const handleOpenMaps = () => {
    // Cihaza göre doğru harita uygulamasını aç
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const url = isIOS
      ? `http://maps.apple.com/?daddr=${destCoords}`
      : `https://www.google.com/maps/dir/?api=1&destination=${destCoords}`;
    window.open(url, '_blank');
  };

  const handleCall = () => {
    if (vet.phone) window.location.href = `tel:${vet.phone.replace(/\s+/g, '')}`;
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-black animate-in slide-in-from-right-8 duration-300 z-50 fixed inset-0">
      
      {/* --- HERO IMAGE (Klinik Fotoğrafı veya Desen) --- */}
      <div className="relative h-72 w-full bg-gray-900 overflow-hidden shrink-0">
         
         {/* Fotoğraf Varsa Göster */}
         {photoUrl ? (
             <div className="absolute inset-0 animate-in fade-in duration-700">
                 <img src={photoUrl} alt={vet.name} className="w-full h-full object-cover opacity-90" />
                 {/* Alttan karartma efekti (yazıların okunması için) */}
                 <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-black via-transparent to-black/30" />
             </div>
         ) : (
             /* Fotoğraf Yoksa Varsayılan Desen */
             <div className="absolute inset-0 flex items-center justify-center">
                <div className="absolute inset-0 opacity-20 bg-[url('https://upload.wikimedia.org/wikipedia/commons/e/ec/World_map_blank_without_borders.svg')] bg-cover bg-center grayscale mix-blend-overlay"></div>
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 dark:from-black to-transparent via-transparent/50" />
                <MapPin size={64} className="text-white/10" />
             </div>
         )}
         
         {/* Üst Bar */}
         <div className="absolute top-0 left-0 w-full p-4 pt-safe-top z-20 flex justify-between items-center">
            <button onClick={onBack} className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/30 transition-transform active:scale-95">
                <ChevronLeft size={24} />
            </button>
            <div className="flex gap-2">
                <button className="p-3 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/30 transition-transform active:scale-95">
                    <Share2 size={20} />
                </button>
            </div>
         </div>

         {/* Klinik Başlık ve Puan */}
         <div className="absolute bottom-8 left-6 right-6 z-10">
            <div className="flex items-end justify-between">
                <div className="flex-1 pr-4">
                    <div className="flex items-center gap-2 mb-2">
                        {/* DÜZELTİLDİ: "Veteriner" -> t('veterinarian') */}
                        <span className="px-3 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-indigo-500/40">{t('veterinarian')}</span>
                        {/* DÜZELTİLDİ: "Açık" -> t('open') */}
                        {vet.isOpen && <span className="px-3 py-1 rounded-lg bg-green-500 text-white text-[10px] font-bold tracking-wider uppercase shadow-lg shadow-green-500/40">{t('open')}</span>}
                    </div>
                    <h1 className="text-3xl font-extrabold text-white leading-tight drop-shadow-lg line-clamp-2">{vet.name}</h1>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1 bg-yellow-400 text-black px-3 py-1.5 rounded-xl shadow-lg shadow-yellow-400/20">
                        <Star size={16} className="fill-black" />
                        <span className="text-sm font-bold">{vet.rating}</span>
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* --- İÇERİK --- */}
      <div className="flex-1 px-6 -mt-6 relative z-20 overflow-y-auto pb-24 rounded-t-3xl bg-gray-50 dark:bg-black pt-6">
        
        {/* Adres Kartı */}
        <div className="bg-white dark:bg-[#1A1D21] p-5 rounded-[2rem] shadow-xl border border-gray-100 dark:border-white/5 mb-6 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin size={28} />
            </div>
            <div className="flex-1">
                {/* DÜZELTİLDİ: "ADRES" -> t('address') */}
                <h3 className="text-xs font-bold text-gray-400 uppercase mb-1">{t('address')}</h3>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{vet.address}</p>
                {/* DÜZELTİLDİ: "km uzakta" -> t('km_away') (veya benzeri, burada t('km') ve suffix mantığı kurulabilir) */}
                {vet.dist && <p className="text-xs text-indigo-500 mt-2 font-bold flex items-center gap-1"><Navigation size={12}/> {vet.dist} {t('km')}</p>}
            </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="grid grid-cols-2 gap-3 mb-6">
            <button 
                onClick={handleCall}
                disabled={!vet.phone}
                className="group py-4 rounded-3xl bg-gray-200 dark:bg-[#23262B] text-gray-900 dark:text-white font-bold flex flex-col items-center justify-center gap-2 hover:bg-gray-300 dark:hover:bg-[#2A2E33] transition-all active:scale-95 disabled:opacity-50"
            >
                <div className="p-2 bg-white dark:bg-black/20 rounded-full group-hover:scale-110 transition-transform">
                    <Phone size={24} className="text-gray-900 dark:text-white"/>
                </div>
                {/* DÜZELTİLDİ: "Telefonla Ara" -> t('call_phone') */}
                <span className="text-xs opacity-80">{t('call_phone')}</span>
            </button>

            <button 
                onClick={handleOpenMaps}
                className="group py-4 rounded-3xl bg-indigo-600 text-white font-bold flex flex-col items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 transition-all active:scale-95"
            >
                <div className="p-2 bg-white/20 rounded-full group-hover:scale-110 transition-transform">
                    <Navigation size={24} className="text-white"/>
                </div>
                {/* DÜZELTİLDİ: "Yol Tarifi Al" -> t('get_directions') */}
                <span className="text-xs opacity-90">{t('get_directions')}</span>
            </button>
        </div>

        {/* Çalışma Saatleri */}
        <div className="bg-white dark:bg-[#1A1D21] p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-white/5 mb-6">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-xl text-orange-500">
                    <Clock size={20} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">{t('vet_hours')}</h3>
            </div>
            
            {vet.openingHours && vet.openingHours.length > 0 ? (
                <ul className="space-y-3">
                    {vet.openingHours.map((day, i) => (
                        <li key={i} className="flex justify-between items-center text-xs border-b border-dashed border-gray-100 dark:border-white/10 pb-2 last:border-0 last:pb-0">
                            <span className="text-gray-500 dark:text-gray-400 font-medium">{day.split(': ')[0]}</span>
                            <span className="text-gray-900 dark:text-white font-bold bg-gray-50 dark:bg-white/5 px-2 py-1 rounded-md">{day.split(': ')[1] || t('not_specified')}</span>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="text-center py-4 text-gray-400 text-xs flex flex-col items-center gap-2">
                    <AlertCircle size={24} className="opacity-20"/>
                    <p>{t('vet_no_hours')}</p>
                </div>
            )}
        </div>

      </div>
    </div>
  );
};

export default VetDetails;