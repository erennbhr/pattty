import React, { useState, useRef } from 'react';
import {
  Loader,
  MapPin,
  Stethoscope,
  Navigation,
  Star,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
} from 'lucide-react';

import { useLanguage } from '../context/LanguageContext';
import { useNotification } from '../context/NotificationContext';
import { mapsApiKey as apiKey } from '../utils/helpers';
import VetDetails from './VetDetails';

/**
 * VetLocator
 * origin: 'account' | 'vaccine' (nereden gelindiğini bilmek için)
 * onBack: geri basınca nereye döneceğini AppContent belirliyor
 */
const VetLocator = ({ origin = 'account', onBack }) => {
  const { t, language } = useLanguage();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);

  // Google Maps servisi için görünmez element
  const mapDivRef = useRef(null);

  // Mesafe hesaplama (km)
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return (R * c).toFixed(1) + ' km';
  };

  // Konum izni kontrolü
  const checkLocationPermission = async () => {
    if (!navigator.permissions) {
      return 'unsupported';
    }

    try {
      const status = await navigator.permissions.query({ name: 'geolocation' });

      if (status.state === 'granted') return 'granted';
      if (status.state === 'prompt') return 'prompt';
      if (status.state === 'denied') return 'denied';

      return 'unknown';
    } catch (err) {
      console.log('Konum izin durumu alınamadı:', err);
      return 'error';
    }
  };

  // Google Maps Scriptini yükle
  const loadGoogleMaps = () => {
    return new Promise((resolve, reject) => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
        return;
      }
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve(window.google.maps);
      script.onerror = (err) => reject(err);
      document.head.appendChild(script);
    });
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    showNotification(t('vet_locating') || (language === 'tr' ? 'Konum aranıyor...' : 'Locating...'));

    try {
      if (!navigator.geolocation) {
        const msg =
          language === 'tr'
            ? 'Cihazınız konum servislerini desteklemiyor.'
            : 'Your device does not support location services.';
        setError(msg);
        showNotification(msg, 'error');
        setLoading(false);
        return;
      }

      const permission = await checkLocationPermission();

      if (permission === 'denied') {
        const msg =
          language === 'tr'
            ? 'Konum iznine izin vermediğiniz için yakın veterinerleri bulamıyorum. Lütfen ayarlardan konum izni verin.'
            : 'Location permission was denied. Please enable it in settings to find nearby vets.';
        setError(msg);
        showNotification(msg, 'error');
        setLoading(false);
        return;
      }

      // Konumu al
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
      });

      const userLat = position.coords.latitude;
      const userLng = position.coords.longitude;

      const googleMaps = await loadGoogleMaps();

      if (!googleMaps || !googleMaps.places) {
        const msg =
          language === 'tr'
            ? 'Google Haritalar servisleri yüklenemedi.'
            : 'Google Maps services could not be loaded.';
        setError(msg);
        showNotification(msg, 'error');
        setLoading(false);
        return;
      }

      const service = new googleMaps.places.PlacesService(mapDivRef.current);

      const request = {
        location: new googleMaps.LatLng(userLat, userLng),
        radius: '5000',
        type: ['veterinary_care'],
      };

      service.nearbySearch(request, (results, status) => {
        if (status === googleMaps.places.PlacesServiceStatus.OK && results) {
          const formattedVets = results.map((place) => ({
            id: place.place_id,
            name: place.name,
            dist: calculateDistance(
              userLat,
              userLng,
              place.geometry.location.lat(),
              place.geometry.location.lng()
            ),
            open: place.opening_hours ? place.opening_hours.isOpen() : null,
            rating: place.rating || 'N/A',
            address: place.vicinity || place.formatted_address || '',
            openingHours: place.opening_hours?.weekday_text || null,
            location: {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            },
            // telefon ve detaylar nearbySearch'te her zaman gelmeyebilir
            phone: place.formatted_phone_number || null,
          }));

          setVets(formattedVets);
          setLoading(false);
        } else {
          const msg =
            language === 'tr'
              ? 'Yakınlarda veteriner bulunamadı veya API hatası oluştu.'
              : 'No nearby vets found or an API error occurred.';
          setError(msg);
          showNotification(
            language === 'tr' ? 'Sonuç bulunamadı.' : 'No results found.',
            'error'
          );
          setLoading(false);
        }
      });
    } catch (err) {
      console.error(err);
      let msg;

      if (err && typeof err === 'object' && 'code' in err) {
        if (err.code === 1) {
          msg =
            language === 'tr'
              ? 'Konum iznini reddettiniz. Ayarlardan izin vermeniz gerekiyor.'
              : 'Location permission was denied. Please enable it in settings.';
        } else if (err.code === 2) {
          msg =
            language === 'tr'
              ? 'Konum servisleri kapalı olabilir. Lütfen GPS\'i açın.'
              : 'Location services may be disabled. Please enable GPS.';
        } else if (err.code === 3) {
          msg =
            language === 'tr'
              ? 'Konum isteği zaman aşımına uğradı. Lütfen tekrar deneyin.'
              : 'Location request timed out. Please try again.';
        } else {
          msg =
            language === 'tr'
              ? 'Konum alınırken bir hata oluştu.'
              : 'An error occurred while getting location.';
        }
      } else {
        msg =
          language === 'tr'
            ? 'Konum alınamadı veya harita yüklenemedi.'
            : 'Could not get location or load the map.';
      }

      setError(msg);
      showNotification(msg, 'error');
      setLoading(false);
    }
  };

  const handleBackPress = () => {
    if (selectedVet) {
      setSelectedVet(null);
      return;
    }
    if (onBack) {
      onBack();
    }
  };

  // Eğer klinik seçildiyse detay ekrana geç
  if (selectedVet) {
    return (
      <VetDetails
        vet={selectedVet}
        onBack={handleBackPress}
      />
    );
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#111417] border-b border-white/5">
        <button
          onClick={handleBackPress}
          className="p-2 rounded-full bg-[#1A1D21] hover:bg-[#23262B] transition-colors"
        >
          <ChevronLeft size={22} className="text-gray-200" />
        </button>
        <h2 className="text-lg font-bold text-gray-100">
          {t('acc_find_vet') || (language === 'tr' ? 'Yakındaki Veterinerleri Bul' : 'Find Nearby Vets')}
        </h2>
      </div>

      {/* GÖRÜNMEZ MAP DIV */}
      <div ref={mapDivRef} style={{ display: 'none' }}></div>

      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-24">

        {/* HARİTA / ARAMA ALANI */}
        <div className="h-56 bg-gray-100 dark:bg-neutral-800 rounded-[2.5rem] flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-neutral-700 relative overflow-hidden group shadow-inner">
          <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/city-map.png')]"></div>

          {loading && (
            <>
              <div className="w-24 h-24 bg-indigo-100/50 rounded-full animate-ping absolute"></div>
              <div className="w-32 h-32 bg-indigo-100/30 rounded-full animate-ping absolute animation-delay-500"></div>
            </>
          )}

          <button
            onClick={handleSearch}
            disabled={loading}
            className="relative z-10 bg-white dark:bg-neutral-900 px-8 py-4 rounded-2xl font-bold shadow-xl flex items-center gap-3 text-indigo-600 dark:text-gray-300 disabled:opacity-80 hover:scale-105 transition-transform border border-gray-100 dark:border-neutral-700"
          >
            {loading ? <Loader className="animate-spin" /> : <MapPin className="fill-indigo-100" />}
            {loading
              ? language === 'tr'
                ? 'Aranıyor...'
                : 'Searching...'
              : t('vet_find_loc') || (language === 'tr' ? 'Yakındaki veterinerleri bul' : 'Find nearby vets')}
          </button>
        </div>

        {/* HATA MESAJI */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl flex items-center gap-2 text-sm">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* SONUÇLAR */}
        <div className="space-y-4">
          <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider ml-2">
            {vets.length > 0
              ? language === 'tr'
                ? `Yakındaki Klinikler (${vets.length})`
                : `Nearby Clinics (${vets.length})`
              : language === 'tr'
              ? 'Yakındaki Klinikler'
              : 'Nearby Clinics'}
          </h3>

          {vets.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVet(v)}
              className="p-5 bg-[#111417] dark:bg-neutral-900 rounded-3xl shadow-sm border border-white/5 flex justify-between items-center group hover:border-indigo-400/60 transition-colors cursor-pointer"
            >
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex-shrink-0 flex items-center justify-center text-indigo-400">
                  <Stethoscope size={24} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-bold text-base text-gray-100 truncate">
                    {v.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate mb-1">{v.address}</p>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-400">
                    <span className="flex items-center gap-1">
                      <Navigation size={10} /> {v.dist}
                    </span>
                    <span className="w-1 h-1 bg-gray-600 rounded-full" />

                    {v.open !== null && (
                      <>
                        <span
                          className={`flex items-center gap-1 ${
                            v.open ? 'text-emerald-400' : 'text-red-400'
                          }`}
                        >
                          {v.open ? (t('vet_open') || 'Open') : (t('vet_closed') || 'Closed')}
                        </span>
                        <span className="w-1 h-1 bg-gray-600 rounded-full" />
                      </>
                    )}

                    <span className="flex items-center gap-1 text-yellow-400">
                      <Star size={10} className="fill-yellow-400" /> {v.rating}
                    </span>
                  </div>
                </div>
              </div>
              <button className="p-3 bg-[#1A1D21] rounded-xl text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight size={20} />
              </button>
            </div>
          ))}

          {vets.length === 0 && !loading && !error && (
            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
              <Navigation size={40} className="opacity-20 mb-2" />
              {language === 'tr' ? 'Konum araması yapın.' : 'Start a location search.'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VetLocator;
