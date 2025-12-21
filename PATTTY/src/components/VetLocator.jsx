import React, { useState, useRef, useEffect } from "react";
import {
  MapPin,
  Search,
  Star,
  ChevronLeft,
  Crosshair,
  ListFilter,
  ArrowRight,
  Navigation,
  AlignJustify,
  Store,        // Pet Shop ikonu
  Stethoscope,  // Veteriner ikonu
  X,            // Kapatma ikonu (MODAL İÇİN)
  Check         // Seçim ikonu
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import VetDetails from "./VetDetails";
import { mapsApiKey as apiKey } from "../utils/helpers";

/* -------------------------------------------------------------------------- */
/* GOOGLE MAPS LOADER (SINGLETON)                                             */
/* -------------------------------------------------------------------------- */
let mapsLoadingPromise = null;

function loadGoogleMaps() {
  if (mapsLoadingPromise) return mapsLoadingPromise;

  mapsLoadingPromise = new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps);
      return;
    }

    const callbackName = "__googleMapsCallback__";
    window[callbackName] = () => {
      if (window.google?.maps?.importLibrary) {
        resolve(window.google.maps);
      } else {
        reject(new Error("GOOGLE_MAPS_LOAD_ERROR"));
      }
    };

    if (document.querySelector(`script[src*="maps.googleapis.com/maps/api/js"]`)) {
        return; 
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly&libraries=places,marker,geometry&loading=async&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => {
      mapsLoadingPromise = null;
      reject(new Error("GOOGLE_MAPS_SCRIPT_ERROR"));
    };
    document.head.appendChild(script);
  });

  return mapsLoadingPromise;
}

const VetLocator = ({ onBack }) => {
  const { t } = useLanguage();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(true);
  const [vets, setVets] = useState([]);
  const [filteredVets, setFilteredVets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVet, setSelectedVet] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  
  // --- FİLTRE VE SIRALAMA STATE ---
  const [showFilters, setShowFilters] = useState(false);
  const [activeTypes, setActiveTypes] = useState({ veterinary_care: true, pet_store: false });
  const [sortBy, setSortBy] = useState('distance'); // 'distance', 'rating', 'name'

  // PANEL DURUMU
  const [sheetMode, setSheetMode] = useState('half'); 
  const startY = useRef(0);
  const isDragging = useRef(false);

  const mapDivRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const isMapInitialized = useRef(false);

  // Mesafe Hesaplama
  const calcDist = (lat1, lon1, lat2, lon2) => {
    if (!lat1 || !lon1 || !lat2 || !lon2) return null;
    if (!window.google?.maps?.geometry?.spherical) return null;
    
    const from = new window.google.maps.LatLng(lat1, lon1);
    const to = new window.google.maps.LatLng(lat2, lon2);
    const distMeters = window.google.maps.geometry.spherical.computeDistanceBetween(from, to);
    return (distMeters / 1000).toFixed(1);
  };

  // --- ARAMA VE SIRALAMA FONKSİYONU ---
  const fetchPlaces = async (location) => {
      if (!window.google?.maps?.places || !mapInstanceRef.current) return;
      
      setLoading(true);
      // Eski markerları temizle
      markersRef.current.forEach(m => m.map = null);
      markersRef.current = [];

      try {
        const { Place } = await window.google.maps.importLibrary("places");
        const { AdvancedMarkerElement, PinElement } = await window.google.maps.importLibrary("marker");

        // Seçili tipleri array'e çevir
        const selectedTypes = Object.keys(activeTypes).filter(type => activeTypes[type]);
        
        // Eğer hiçbir tip seçili değilse boş dön
        if (selectedTypes.length === 0) {
            setVets([]);
            setFilteredVets([]);
            setLoading(false);
            return;
        }

        const request = {
            fields: ["id", "displayName", "formattedAddress", "location", "rating", "nationalPhoneNumber", "businessStatus", "regularOpeningHours", "photos", "types"],
            locationRestriction: { center: location, radius: 5000 },
            includedTypes: selectedTypes,
            maxResultCount: 20,
        };

        const result = await Place.searchNearby(request);
        
        let formattedVets = (result.places || []).map((p) => {
            let lat, lng;
            if (p.location) {
                lat = typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat;
                lng = typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng;
            }

            const distance = calcDist(location.lat, location.lng, lat, lng);
            const finalName = p.displayName?.text || p.displayName || t('default_vet_name');
            
            // Tip tespiti (ikon için)
            const isPetStore = p.types && p.types.includes('pet_store');

            return {
                id: p.id,
                name: finalName,
                address: p.formattedAddress || "",
                rating: p.rating || 0,
                phone: p.nationalPhoneNumber || null,
                isOpen: p.businessStatus === "OPERATIONAL",
                location: { lat, lng },
                dist: distance,
                openingHours: p.regularOpeningHours?.weekdayDescriptions || [],
                photoReference: p.photos && p.photos.length > 0 ? p.photos[0] : null,
                isPetStore: isPetStore // UI'da ikon değiştirmek için
            };
        });

        // SIRALAMA MANTIĞI
        formattedVets = sortPlaces(formattedVets, sortBy);

        setVets(formattedVets);
        setFilteredVets(formattedVets);

        // Pinleri Ekle
        formattedVets.forEach((place) => {
            if (!place.location.lat) return;
            
            // Pet Shop için farklı, Veteriner için farklı renk
            const pinColor = place.isPetStore ? "#10b981" : "#ef4444"; // Yeşil (Shop) vs Kırmızı (Vet)
            const borderColor = place.isPetStore ? "#047857" : "#b91c1c";

            const pin = new PinElement({
                background: pinColor,
                borderColor: borderColor,
                glyphColor: "white",
                scale: 0.9,
            });

            const marker = new AdvancedMarkerElement({
                map: mapInstanceRef.current,
                position: place.location,
                content: pin.element,
                title: place.name,
            });

            marker.addListener("click", () => {
                setSelectedVet(place);
                setSheetMode('mini');
                smoothPanTo(place.location, 140); 
            });
            
            markersRef.current.push(marker);
        });

      } catch (err) {
          console.error("Yer arama hatası:", err);
          showNotification(t("err_vet_api"), "error");
      } finally {
          setLoading(false);
      }
  };

  // Sıralama Yardımcısı
  const sortPlaces = (data, criterion) => {
      const sorted = [...data];
      if (criterion === 'distance') {
          return sorted.sort((a, b) => parseFloat(a.dist || 999) - parseFloat(b.dist || 999));
      }
      if (criterion === 'rating') {
          return sorted.sort((a, b) => b.rating - a.rating);
      }
      if (criterion === 'name') {
          return sorted.sort((a, b) => a.name.localeCompare(b.name));
      }
      return sorted;
  };

  // Filtre veya Sıralama Değiştiğinde Tekrar Çek/Sırala
  useEffect(() => {
      if (userLocation && isMapInitialized.current) {
          fetchPlaces(userLocation);
      }
  }, [activeTypes, sortBy]); // Bu değerler değişince tetiklenir

  const initMap = async () => {
    if (isMapInitialized.current) return;
    isMapInitialized.current = true;

    setLoading(true);
    try {
      const pos = await new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
            resolve, 
            (err) => {
                console.warn("Konum alınamadı:", err);
                resolve({ coords: { latitude: 41.0082, longitude: 28.9784 } });
            }, 
            { enableHighAccuracy: true, timeout: 5000 }
        );
      });

      const userLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUserLocation(userLoc);

      const maps = await loadGoogleMaps();
      const { Map } = await maps.importLibrary("maps");
      const { AdvancedMarkerElement, PinElement } = await maps.importLibrary("marker");

      if (!mapDivRef.current) return;

      mapInstanceRef.current = new Map(mapDivRef.current, {
        center: userLoc,
        zoom: 14,
        mapId: "DEMO_MAP_ID",
        disableDefaultUI: true,
        clickableIcons: false,
        gestureHandling: "greedy",
      });

      const userPin = new PinElement({
        background: "#3b82f6",
        borderColor: "#ffffff",
        glyphColor: "#ffffff",
        scale: 1.1,
      });
      
      new AdvancedMarkerElement({
        map: mapInstanceRef.current,
        position: userLoc,
        content: userPin.element,
        title: t('my_location'),
      });

      // İlk aramayı başlat
      fetchPlaces(userLoc);
      
      // Padding ayarla
      setTimeout(() => updateMapPosition('half'), 500);

    } catch (err) {
      console.error("Init Error:", err);
      showNotification(t("err_loc_general"), "error");
      setLoading(false);
    }
  };

  // --- HARİTA POSİZYONLAMA ---
  const updateMapPosition = (mode) => {
      if (!mapInstanceRef.current || !userLocation) return;
      mapInstanceRef.current.setCenter(userLocation);
      const h = window.innerHeight;
      let offsetY = 0;
      if (mode === 'half') offsetY = h * 0.15;
      if (offsetY !== 0) mapInstanceRef.current.panBy(0, offsetY);
  };

  const smoothPanTo = (targetLoc, offset = 100) => {
      if (!mapInstanceRef.current) return;
      mapInstanceRef.current.setCenter(targetLoc);
      mapInstanceRef.current.setZoom(16);
      mapInstanceRef.current.panBy(0, offset);
  };

  useEffect(() => {
    initMap();
    return () => {
        markersRef.current.forEach(marker => marker.map = null);
        markersRef.current = [];
        isMapInitialized.current = false;
    };
  }, []);

  // Liste içi arama (Client side filtering)
  useEffect(() => {
    if (!searchQuery) {
        // Sıralamayı koruyarak orijinal listeyi göster
        setFilteredVets(sortPlaces(vets, sortBy));
    } else {
        const lower = searchQuery.toLowerCase();
        const filtered = vets.filter(v => v.name.toLowerCase().includes(lower) || v.address.toLowerCase().includes(lower));
        setFilteredVets(sortPlaces(filtered, sortBy));
    }
  }, [searchQuery, vets, sortBy]);

  const centerMapToUser = () => {
      if(userLocation && mapInstanceRef.current) {
          mapInstanceRef.current.setCenter(userLocation);
          mapInstanceRef.current.setZoom(15);
          mapInstanceRef.current.setZoom(15);
          setSheetMode('half');
      }
  };

  // --- SÜRÜKLEME ---
  const handlePointerDown = (e) => {
    isDragging.current = true;
    startY.current = e.clientY;
    e.target.setPointerCapture(e.pointerId);
  };

  const handlePointerUp = (e) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    e.target.releasePointerCapture(e.pointerId);
    const diff = e.clientY - startY.current;
    if (diff > 50) {
        if (sheetMode === 'full') setSheetMode('half');
        else if (sheetMode === 'half') setSheetMode('mini');
    } else if (diff < -50) {
        if (sheetMode === 'mini') setSheetMode('half');
        else if (sheetMode === 'half') setSheetMode('full');
    }
  };

  const getSheetHeight = () => {
      switch(sheetMode) {
          case 'full': return 'h-[92%]';
          case 'half': return 'h-[50%]';
          case 'mini': return 'h-[140px]';
          default: return 'h-[50%]';
      }
  };

  // --- FİLTRE PANELİ BİLEŞENİ ---
  const FilterPanel = () => (
      <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center animate-in fade-in duration-200 pb-safe-bottom">
          <div className="bg-white dark:bg-[#1A1D21] w-full sm:w-96 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl animate-in slide-in-from-bottom duration-300 mb-0 sm:mb-10">
              
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t('filter_title')}</h2>
                  <button onClick={() => setShowFilters(false)} className="p-2 bg-gray-100 dark:bg-white/10 rounded-full text-gray-500 hover:text-red-500 transition-colors">
                      <X size={20} />
                  </button>
              </div>

              {/* TÜR SEÇİMİ */}
              <div className="mb-6">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t('show_category')}</h3>
                  <div className="flex gap-3">
                      <button 
                          onClick={() => setActiveTypes(prev => ({ ...prev, veterinary_care: !prev.veterinary_care }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${activeTypes.veterinary_care ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                      >
                          <Stethoscope size={20} />
                          <span className="text-sm font-bold">{t('type_vet')}</span>
                          {activeTypes.veterinary_care && <div className="w-2 h-2 bg-indigo-500 rounded-full ml-1" />}
                      </button>
                      <button 
                          onClick={() => setActiveTypes(prev => ({ ...prev, pet_store: !prev.pet_store }))}
                          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 transition-all ${activeTypes.pet_store ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400' : 'border-gray-200 dark:border-white/10 text-gray-500'}`}
                      >
                          <Store size={20} />
                          <span className="text-sm font-bold">{t('type_petshop')}</span>
                          {activeTypes.pet_store && <div className="w-2 h-2 bg-green-500 rounded-full ml-1" />}
                      </button>
                  </div>
              </div>

              {/* SIRALAMA */}
              <div className="mb-8">
                  <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 tracking-wider">{t('sort_by')}</h3>
                  <div className="space-y-2">
                      {[
                          { id: 'distance', label: t('sort_dist'), icon: Navigation },
                          { id: 'rating', label: t('sort_rating'), icon: Star },
                          { id: 'name', label: t('sort_name'), icon: AlignJustify }
                      ].map((opt) => (
                          <button
                              key={opt.id}
                              onClick={() => setSortBy(opt.id)}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all ${sortBy === opt.id ? 'bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white font-bold' : 'text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5'}`}
                          >
                              <div className="flex items-center gap-3">
                                  <opt.icon size={18} />
                                  <span className="text-sm">{opt.label}</span>
                              </div>
                              {sortBy === opt.id && <Check size={18} className="text-indigo-500" />}
                          </button>
                      ))}
                  </div>
              </div>

              <button 
                  onClick={() => setShowFilters(false)}
                  className="w-full py-4 rounded-2xl bg-indigo-600 text-white font-bold shadow-lg hover:bg-indigo-700 active:scale-95 transition-all"
              >
                  {t('apply')}
              </button>
          </div>
      </div>
  );

  return (
    <div className="relative w-full h-full flex flex-col bg-gray-50 dark:bg-black overflow-hidden">
      
      {/* MAP */}
      <div className="absolute inset-0 z-0">
        <div ref={mapDivRef} className="w-full h-full bg-gray-200 dark:bg-gray-800" />
      </div>

      {/* FILTRE MODALI */}
      {showFilters && <FilterPanel />}

      {/* DETAY SAYFASI */}
      {selectedVet && (
        <div className="absolute inset-0 z-50">
            <VetDetails 
                vet={selectedVet} 
                onBack={() => setSelectedVet(null)} 
                userLoc={userLocation} 
            />
        </div>
      )}

      {/* ÜST BAR - GÜVENLİ ALAN DÜZELTMESİ (pt-safe-top mt-2) */}
      {!selectedVet && (
        <div className="absolute top-0 left-0 right-0 p-4 pt-safe-top mt-2 z-10 flex items-center gap-3 pointer-events-none">
            <button onClick={onBack} className="pointer-events-auto p-3 bg-white/80 dark:bg-black/60 backdrop-blur-md border border-white/20 rounded-full text-gray-800 dark:text-white shadow-lg active:scale-90 transition-transform">
                {/* 🟢 MODAL İÇİN KAPATMA İKONU KULLANILDI (X) */}
                <X size={24} />
            </button>
        </div>
      )}

      {/* KONUM BUTONU */}
      {!selectedVet && (
        <button 
            onClick={centerMapToUser}
            className={`absolute right-4 p-3 bg-white dark:bg-neutral-800 rounded-full shadow-xl text-indigo-600 dark:text-indigo-400 z-10 hover:scale-110 transition-all active:scale-90 border border-gray-100 dark:border-neutral-700
                ${sheetMode === 'full' ? 'bottom-[94%]' : sheetMode === 'half' ? 'bottom-[52%]' : 'bottom-[160px]'}
                transition-all duration-300 ease-out`}
        >
            <Crosshair size={24} />
        </button>
      )}

      {/* BOTTOM SHEET */}
      <div 
        className={`absolute bottom-0 left-0 right-0 bg-white dark:bg-[#111417] rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.2)] flex flex-col z-20 border-t border-white/50 dark:border-white/5 backdrop-blur-sm transition-all duration-300 ease-out 
        ${getSheetHeight()} ${selectedVet ? 'translate-y-full' : 'translate-y-0'}`}
      >
        {/* TUTAMAÇ */}
        <div 
            className="w-full flex justify-center pt-4 pb-4 cursor-grab active:cursor-grabbing touch-none select-none"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onClick={() => setSheetMode(sheetMode === 'mini' ? 'half' : sheetMode === 'half' ? 'full' : 'mini')} 
        >
            <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-700 rounded-full pointer-events-none" />
        </div>

        {/* İÇERİK */}
        <div className="flex flex-col h-full overflow-hidden">
            
            {/* Arama & Başlık */}
            <div className="px-6 pb-2 shrink-0">
                <div className="flex items-center gap-3 bg-gray-100 dark:bg-[#1A1D21] p-3.5 rounded-2xl border border-transparent focus-within:border-indigo-500/50 transition-all shadow-inner mb-3">
                    <Search size={20} className="text-gray-400" />
                    <input 
                        type="text" 
                        placeholder={t('search_placeholder')} 
                        className="bg-transparent w-full outline-none text-gray-900 dark:text-white font-medium placeholder-gray-400 text-sm"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onFocus={() => setSheetMode('full')}
                    />
                    {loading && <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"/>}
                </div>

                <div className="flex justify-between items-center opacity-70">
                    <h3 className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                        <MapPin size={10}/> {filteredVets.length} {t('clinics')}
                    </h3>
                    <button onClick={() => setShowFilters(true)} className="p-2 -mr-2 text-gray-500 hover:text-indigo-500 transition-colors">
                        <ListFilter size={20} />
                    </button>
                </div>
            </div>

            {/* Liste - GÜVENLİ ALAN DÜZELTMESİ (pb-safe-bottom ve pb-20) */}
            <div className="flex-1 overflow-y-auto px-4 pb-24 pb-safe-bottom space-y-3 scroll-smooth no-scrollbar">
                {filteredVets.map((vet) => (
                    <div 
                        key={vet.id}
                        onClick={() => setSelectedVet(vet)}
                        className="group bg-white dark:bg-[#1A1D21] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex gap-4"
                    >
                        {/* İkon Kutusu (Türe göre renk değişir) */}
                        <div className={`flex flex-col items-center justify-center gap-1 min-w-[3.5rem] rounded-2xl p-2 border ${vet.isPetStore ? 'bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-white/5' : 'bg-indigo-50 dark:bg-indigo-900/10 border-indigo-100 dark:border-white/5'}`}>
                            {vet.isPetStore ? (
                                <Store size={20} className="text-green-600 dark:text-green-400 mb-1" />
                            ) : (
                                <Stethoscope size={20} className="text-indigo-600 dark:text-indigo-400 mb-1" />
                            )}
                            <span className={`text-[10px] font-black ${vet.isPetStore ? 'text-green-700 dark:text-green-300' : 'text-indigo-700 dark:text-indigo-300'}`}>
                                {vet.dist}
                            </span>
                            <span className={`text-[8px] font-medium uppercase ${vet.isPetStore ? 'text-green-400' : 'text-indigo-400'}`}>{t('km')}</span>
                        </div>

                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                                <h3 className="font-bold text-base text-gray-900 dark:text-white truncate pr-2">{vet.name}</h3>
                                {vet.rating > 0 && (
                                    <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/10 px-1.5 py-0.5 rounded-lg shrink-0">
                                        <Star size={10} className="fill-yellow-500 text-yellow-500" />
                                        <span className="text-10px font-bold text-yellow-700 dark:text-yellow-500">{vet.rating}</span>
                                    </div>
                                )}
                            </div>
                            
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{vet.address}</p>
                            
                            <div className="flex items-center gap-3 mt-2.5">
                                {vet.isOpen ? (
                                    <span className="text-[9px] font-bold text-green-600 dark:text-green-400 flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-md">
                                        {t('open')}
                                    </span>
                                ) : (
                                    <span className="text-[9px] font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-md">
                                        {t('closed')}
                                    </span>
                                )}
                                <span className="text-[9px] font-medium text-gray-400 border border-gray-100 dark:border-white/10 px-2 py-0.5 rounded-md">
                                    {vet.isPetStore ? t('type_petshop') : t('veterinarian')}
                                </span>
                            </div>
                        </div>

                        <div className="self-center">
                            <ArrowRight size={18} className="text-gray-300 dark:text-gray-600 group-hover:text-indigo-500 transition-colors"/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

export default VetLocator;