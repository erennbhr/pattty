// VetLocator.jsx – FINAL FIXED VERSION (Visible Map + Theme Sync + API Clean)
import React, { useState, useRef } from "react";
import {
  Loader,
  MapPin,
  Stethoscope,
  Navigation,
  Star,
  ArrowRight,
  AlertCircle,
  ChevronLeft,
} from "lucide-react";

import { useLanguage } from "../context/LanguageContext";
import { useNotification } from "../context/NotificationContext";
import VetDetails from "./VetDetails";
import { mapsApiKey as apiKey } from "../utils/helpers";

/* -------------------------------------------------------------------------- */
/*                          GOOGLE MAPS LOADER FIXED                          */
/* -------------------------------------------------------------------------- */
function loadGoogleMaps() {
  return new Promise((resolve, reject) => {
    if (window.google?.maps?.importLibrary) {
      resolve(window.google.maps);
      return;
    }

    const callbackName = "__googleMapsCallback__";

    window[callbackName] = () => {
      if (window.google?.maps?.importLibrary) resolve(window.google.maps);
      else reject(new Error("Google Maps failed to load"));
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=beta&libraries=places&callback=${callbackName}`;
    script.async = true;
    script.defer = true;
    script.onerror = () => reject(new Error("Google Maps script failed to load"));

    document.head.appendChild(script);
  });
}
/* -------------------------------------------------------------------------- */

const VetLocator = ({ origin = "account", onBack }) => {
  const { t } = useLanguage();
  const showNotification = useNotification();

  const [loading, setLoading] = useState(false);
  const [vets, setVets] = useState([]);
  const [error, setError] = useState(null);
  const [selectedVet, setSelectedVet] = useState(null);

  const mapDivRef = useRef(null);
  const mapRef = useRef(null);

  const calcDist = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) ** 2;

    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(1) + " km";
  };

  const checkPermission = async () => {
    if (!navigator.permissions) return "unsupported";
    try {
      const p = await navigator.permissions.query({ name: "geolocation" });
      return p.state;
    } catch {
      return "error";
    }
  };

  const handleSearch = async () => {
    setLoading(true);
    setError(null);
    showNotification(t("vet_locating"));

    try {
      const perm = await checkPermission();
      if (perm === "denied") {
        const msg = t("err_loc_denied");
        setError(msg);
        showNotification(msg, "error");
        setLoading(false);
        return;
      }

      const pos = await new Promise((res, rej) =>
        navigator.geolocation.getCurrentPosition(res, rej, {
          enableHighAccuracy: true,
          timeout: 10000,
        })
      );

      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      const maps = await loadGoogleMaps();

      const { Map } = await maps.importLibrary("maps");
      const { Place } = await maps.importLibrary("places");

      // HARİTA ARTIK GÖRÜNÜR DIV ÜZERİNDE RENDER EDİLECEK
      mapRef.current = new Map(mapDivRef.current, {
        center: { lat, lng },
        zoom: 14,
      });

      const request = {
        fields: [
          "displayName",
          "formattedAddress",
          "location",
          "rating",
          "nationalPhoneNumber",
        ],
        locationRestriction: {
          center: { lat, lng },
          radius: 5000,
        },
        includedTypes: ["veterinary_care"],
        maxResultCount: 20,
      };

      const result = await Place.searchNearby(request);

      const formatted = (result.places || []).map((p) => ({
        id: p.id,
        name: p.displayName?.text || "Veteriner",
        address: p.formattedAddress || "",
        rating: p.rating || "N/A",
        phone: p.nationalPhoneNumber || null,
        location: {
          lat: p.location?.latLng?.latitude,
          lng: p.location?.latLng?.longitude,
        },
        dist:
          p.location?.latLng
            ? calcDist(lat, lng, p.location.latLng.latitude, p.location.latLng.longitude)
            : null,
      }));

      setVets(formatted);
      setLoading(false);
    } catch (err) {
      console.error("VetLocator ERROR:", err);
      const msg = t("err_loc_general");
      setError(msg);
      showNotification(msg, "error");
      setLoading(false);
    }
  };

  const goBack = () => {
    if (selectedVet) return setSelectedVet(null);
    onBack?.();
  };

  if (selectedVet) {
    return <VetDetails vet={selectedVet} onBack={goBack} />;
  }

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-4">

      {/* HEADER – Uygulamanın genel theme yapısına uygun */}
      <div className="flex items-center gap-3 px-4 py-3 bg-background border-b border-border">
        <button
          onClick={goBack}
          className="p-2 rounded-full bg-muted hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft size={22} className="text-foreground" />
        </button>
        <h2 className="text-lg font-bold text-foreground">{t("acc_find_vet")}</h2>
      </div>

      {/* HARİTA ARTIK GÖRÜNÜR VE SABİT YÜKSEKLİKLE ÇALIŞIYOR */}
      <div
        ref={mapDivRef}
        className="w-full h-[260px] rounded-3xl overflow-hidden mt-4 border border-border shadow-sm"
      />

      <div className="flex-1 p-6 space-y-6 overflow-y-auto pb-24">
        {/* SEARCH BUTTON BOX */}
        <div className="h-40 bg-muted rounded-3xl flex flex-col items-center justify-center border border-border relative overflow-hidden shadow-inner">
          {loading && (
            <>
              <div className="w-20 h-20 bg-primary/20 rounded-full animate-ping absolute" />
              <div className="w-28 h-28 bg-primary/10 rounded-full animate-ping absolute animation-delay-500" />
            </>
          )}

          <button
            onClick={!loading ? handleSearch : null}
            className="relative z-10 bg-card text-foreground px-8 py-4 rounded-2xl font-bold shadow-md flex items-center gap-3 hover:scale-105 transition-transform border border-border"
          >
            {loading ? <Loader className="animate-spin" /> : <MapPin />}
            {loading ? t("vet_searching") : t("vet_find_loc")}
          </button>
        </div>

        {/* ERROR BOX */}
        {error && (
          <div className="p-4 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center gap-2 text-sm border border-red-300/20">
            <AlertCircle size={18} /> {error}
          </div>
        )}

        {/* LIST HEADER */}
        <h3 className="font-bold text-muted-foreground text-sm uppercase ml-2">
          {vets.length > 0
            ? `${t("vet_nearby_clinics_title")} (${vets.length})`
            : t("vet_nearby_clinics_title")}
        </h3>

        {/* VET LIST */}
        <div className="space-y-4">
          {vets.map((v) => (
            <div
              key={v.id}
              onClick={() => setSelectedVet(v)}
              className="p-5 bg-card rounded-3xl shadow-sm border border-border flex justify-between items-center group hover:border-primary/60 transition-colors cursor-pointer"
            >
              <div className="flex gap-4 items-center flex-1 min-w-0">
                <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
                  <Stethoscope size={24} />
                </div>

                <div className="min-w-0">
                  <h3 className="font-bold text-base text-foreground truncate">{v.name}</h3>
                  <p className="text-xs text-muted-foreground truncate">{v.address}</p>

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    {v.dist && (
                      <span className="flex items-center gap-1">
                        <Navigation size={10} /> {v.dist}
                      </span>
                    )}

                    <span className="flex items-center gap-1 text-yellow-500">
                      <Star size={10} className="fill-yellow-500" /> {v.rating}
                    </span>
                  </div>
                </div>
              </div>

              <ArrowRight className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default VetLocator;
