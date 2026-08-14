"use client";

import { useEffect, useRef, useState } from "react";
import { detecterCommune } from "@/lib/hooks/useGeolocationAdresse";

export interface SuggestionAdresse {
  id: string;
  texte: string;
  latitude: number;
  longitude: number;
  commune: string | null;
  quartier: string | null;
}

const DEBOUNCE_MS = 400;
const LONGUEUR_MIN = 3;

/**
 * Autocomplétion d'adresse en temps réel via Nominatim (OpenStreetMap),
 * restreinte au Bénin (countrycodes=bj). Gratuit, sans clé — même service
 * que le reverse-geocoding déjà utilisé par useGeolocationAdresse. Debounce
 * de 400ms et annulation de la requête précédente pour éviter de spammer
 * l'API pendant la frappe.
 */
export function useAdresseAutocomplete(requete: string) {
  const [suggestions, setSuggestions] = useState<SuggestionAdresse[]>([]);
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const texte = requete.trim();

    if (texte.length < LONGUEUR_MIN) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timeout = setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=jsonv2&q=${encodeURIComponent(
            texte
          )}&countrycodes=bj&addressdetails=1&limit=6&accept-language=fr`,
          { signal: controller.signal }
        );

        if (!res.ok) {
          setSuggestions([]);
          return;
        }

        const data = await res.json();
        const resultats: SuggestionAdresse[] = (Array.isArray(data) ? data : []).map((item: any) => {
          const address = (item.address ?? {}) as Record<string, string | undefined>;
          return {
            id: String(item.place_id),
            texte: item.display_name as string,
            latitude: parseFloat(item.lat),
            longitude: parseFloat(item.lon),
            commune: detecterCommune(address),
            quartier: address.suburb || address.neighbourhood || address.quarter || address.village || null,
          };
        });

        setSuggestions(resultats);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          console.error("[useAdresseAutocomplete] erreur de recherche:", err);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timeout);
  }, [requete]);

  return { suggestions, loading };
}
