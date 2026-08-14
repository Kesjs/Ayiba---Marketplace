"use client";

import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface AdresseCarteProps {
  latitude: number;
  longitude: number;
  /** Si true, le pin peut être déplacé par l'utilisateur (écran d'ajustement).
   *  Si false, carte statique de confirmation (écran de récap). */
  draggable?: boolean;
  onPositionChange?: (lat: number, lng: number) => void;
  className?: string;
}

const ICONE_PIN = L.divIcon({
  html: `<div class="w-9 h-9 -mt-9 -ml-[18px] bg-coral-400 rounded-full rounded-bl-none rotate-45 border-4 border-white shadow-lg flex items-center justify-center"><div class="w-2.5 h-2.5 bg-white rounded-full -rotate-45"></div></div>`,
  className: "",
  iconSize: [0, 0],
});

/**
 * Carte Leaflet + OpenStreetMap (gratuite, même stack que useAdresseAutocomplete)
 * utilisée à deux endroits du flux d'ajout d'adresse : écran 2 (confirmation
 * statique) et écran 3 (ajustement du pin, façon Glovo). Le pin reste fixe au
 * centre visuel de la carte ; on déplace la carte dessous et on lit son
 * centre au relâchement, plutôt que de rendre un marker draggable — plus
 * fiable sur mobile (pas de conflit avec le geste de pan).
 */
export function AdresseCarte({ latitude, longitude, draggable = false, onPositionChange, className }: AdresseCarteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onPositionChangeRef = useRef(onPositionChange);
  onPositionChangeRef.current = onPositionChange;

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: draggable,
      scrollWheelZoom: draggable,
      doubleClickZoom: draggable,
      touchZoom: draggable,
    }).setView([latitude, longitude], 17);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);

    if (draggable) {
      map.on("moveend", () => {
        const c = map.getCenter();
        onPositionChangeRef.current?.(c.lat, c.lng);
      });
    } else {
      L.marker([latitude, longitude], { icon: ICONE_PIN }).addTo(map);
    }

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggable]);

  // Recentre si la position initiale change après montage (ex: nouvelle
  // suggestion choisie) — sans ça la carte resterait bloquée sur l'ancien point.
  useEffect(() => {
    if (mapRef.current && !draggable) {
      mapRef.current.setView([latitude, longitude], 17);
    }
  }, [latitude, longitude, draggable]);

  return (
    <div className={`relative w-full h-full overflow-hidden ${className ?? ""}`}>
      <div ref={containerRef} className="w-full h-full z-0" />
      {draggable && (
        <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-10">
          <div className="w-9 h-9 bg-coral-400 rounded-full rounded-bl-none rotate-45 border-4 border-white shadow-lg" />
        </div>
      )}
    </div>
  );
}
