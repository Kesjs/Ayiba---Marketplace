"use client";

import { useCallback, useState } from "react";
import { COMMUNES_COUVERTES } from "@/lib/constants/communes";

export interface ResultatLocalisation {
  latitude: number;
  longitude: number;
  communeDetectee: string | null;
  quartierDetecte: string | null;
}

// Reconnaît une commune couverte dans la réponse de reverse-geocoding,
// en comparant plusieurs champs possibles (le découpage administratif
// OpenStreetMap ne colle pas toujours exactement à nos communes).
function detecterCommune(address: Record<string, string | undefined>): string | null {
  const candidats = [address.city, address.town, address.county, address.municipality, address.suburb];
  for (const candidat of candidats) {
    if (!candidat) continue;
    const match = COMMUNES_COUVERTES.find((c) => c.toLowerCase() === candidat.toLowerCase());
    if (match) return match;
  }
  return null;
}

/**
 * Localise l'utilisateur via l'API de géolocalisation du navigateur, puis
 * tente un reverse-geocoding (Nominatim/OpenStreetMap, gratuit, sans clé)
 * pour proposer une commune/quartier. Les coordonnées exactes sont de
 * toute façon toujours renvoyées, même si le reverse-geocoding échoue —
 * c'est elles qui comptent le plus pour le calcul futur des frais de
 * livraison, la commune/quartier ne sont qu'une aide de saisie.
 */
export function useGeolocationAdresse() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const localiser = useCallback((): Promise<ResultatLocalisation> => {
    return new Promise((resolve, reject) => {
      if (!("geolocation" in navigator)) {
        const message = "Géolocalisation non disponible sur cet appareil";
        setError(message);
        reject(new Error(message));
        return;
      }

      setLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let communeDetectee: string | null = null;
          let quartierDetecte: string | null = null;

          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&addressdetails=1&accept-language=fr`
            );
            if (res.ok) {
              const data = await res.json();
              const address = (data?.address ?? {}) as Record<string, string | undefined>;
              communeDetectee = detecterCommune(address);
              quartierDetecte = address.suburb || address.neighbourhood || address.quarter || null;
            }
          } catch (geocodeErr) {
            // Échec silencieux : on garde les coordonnées, l'utilisateur
            // complète commune/quartier à la main via les chips.
            console.error("[useGeolocationAdresse] reverse geocoding error:", geocodeErr);
          }

          setLoading(false);
          resolve({ latitude, longitude, communeDetectee, quartierDetecte });
        },
        (geoErr) => {
          setLoading(false);
          const message =
            geoErr.code === geoErr.PERMISSION_DENIED
              ? "Localisation refusée — tu peux choisir ta commune manuellement ci-dessous"
              : "Impossible d'obtenir ta position";
          setError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000 }
      );
    });
  }, []);

  return { localiser, loading, error };
}
