"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { detecterCommune, extraireQuartier } from "@/lib/hooks/useGeolocationAdresse";

const GEO_RESULT_KEY = "ayiba_geo_result";
const GEO_BANNER_KEY = "ayiba_geo_banner_dismissed";

export interface SmartGeoResult {
  latitude: number;
  longitude: number;
  commune: string | null;
  quartier: string | null;
  displayLabel: string;
}

export function useSmartGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detectAndSave = useCallback(async (): Promise<SmartGeoResult | null> => {
    if (!("geolocation" in navigator)) {
      setError("Géolocalisation non disponible sur cet appareil");
      return null;
    }

    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let commune: string | null = null;
          let quartier: string | null = null;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`
            );
            if (res.ok) {
              const data = await res.json();
              const address = (data?.address ?? {}) as Record<string, string | undefined>;
              commune = detecterCommune(address);
              quartier = extraireQuartier(address);
            }
          } catch (e) {
            console.error("[useSmartGeolocation] reverse geocoding error:", e);
          }

          const displayLabel = commune ? `${commune}, Bénin` : "Bénin";
          const result: SmartGeoResult = { latitude, longitude, commune, quartier, displayLabel };

          try {
            localStorage.setItem(GEO_RESULT_KEY, JSON.stringify(result));
            localStorage.setItem("ayiba_user_location", displayLabel);
          } catch (_) {}

          try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user && commune) {
              const { count } = await supabase
                .from("addresses")
                .select("id", { count: "exact", head: true })
                .eq("user_id", user.id);

              if (!count || count === 0) {
                await supabase.from("addresses").insert({
                  user_id: user.id,
                  label: "domicile",
                  adresse_complete: quartier ? `${quartier}, ${commune}` : commune,
                  quartier: quartier ?? "",
                  commune,
                  latitude,
                  longitude,
                  est_defaut: true,
                });
              }
            }
          } catch (e) {
            console.error("[useSmartGeolocation] supabase save error:", e);
          }

          setLoading(false);
          resolve(result);
        },
        (geoErr) => {
          setLoading(false);
          const message =
            geoErr.code === geoErr.PERMISSION_DENIED
              ? "Localisation refusée"
              : "Impossible d'obtenir votre position";
          setError(message);
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 12000 }
      );
    });
  }, []);

  const getSavedResult = useCallback((): SmartGeoResult | null => {
    try {
      const raw = localStorage.getItem(GEO_RESULT_KEY);
      return raw ? (JSON.parse(raw) as SmartGeoResult) : null;
    } catch {
      return null;
    }
  }, []);

  const isBannerDismissed = useCallback((): boolean => {
    try {
      return localStorage.getItem(GEO_BANNER_KEY) === "1";
    } catch {
      return false;
    }
  }, []);

  const dismissBanner = useCallback(() => {
    try {
      localStorage.setItem(GEO_BANNER_KEY, "1");
    } catch {}
  }, []);

  const syncGeoToProfileIfNeeded = useCallback(async (userId: string): Promise<boolean> => {
    try {
      const raw = localStorage.getItem(GEO_RESULT_KEY);
      if (!raw) return false;
      const saved: SmartGeoResult = JSON.parse(raw);
      if (!saved || !saved.commune) return false;

      const supabase = createClient();
      const { count } = await supabase
        .from("addresses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId);

      if (!count || count === 0) {
        await supabase.from("addresses").insert({
          user_id: userId,
          label: "domicile",
          adresse_complete: saved.quartier ? `${saved.quartier}, ${saved.commune}` : saved.commune,
          quartier: saved.quartier ?? "",
          commune: saved.commune,
          latitude: saved.latitude,
          longitude: saved.longitude,
          est_defaut: true,
        });
        return true;
      }
    } catch (e) {
      console.error("[syncGeoToProfileIfNeeded] error:", e);
    }
    return false;
  }, []);

  return {
    detectAndSave,
    getSavedResult,
    isBannerDismissed,
    dismissBanner,
    syncGeoToProfileIfNeeded,
    loading,
    error,
  };
}
