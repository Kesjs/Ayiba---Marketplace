"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";
import { Bike, MapPin, Store, Navigation, Clock, ShieldCheck } from "lucide-react";
import { getDistanceRoutiereKm, getLienNavigationGoogleMaps } from "@/lib/osrm";

export interface LiveDeliveryTrackerProps {
  commandeId: string;
  statutCommande: string;
  vendeurCoords?: { lat: number; lng: number; nom: string } | null;
  clientCoords?: { lat: number; lng: number; adresse: string } | null;
  initialLivreurCoords?: { lat: number; lng: number } | null;
  livreurNom?: string | null;
  livreurTelephone?: string | null;
}

export default function LiveDeliveryTracker({
  commandeId,
  statutCommande,
  vendeurCoords,
  clientCoords,
  initialLivreurCoords,
  livreurNom,
  livreurTelephone,
}: LiveDeliveryTrackerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const livreurMarkerRef = useRef<L.Marker | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);

  const [livreurPos, setLivreurPos] = useState<{ lat: number; lng: number } | null>(
    initialLivreurCoords || null
  );
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Fix default marker icon issues in Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    const defaultCenter: [number, number] = [
      clientCoords?.lat || vendeurCoords?.lat || 6.366,
      clientCoords?.lng || vendeurCoords?.lng || 2.418,
    ];

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
    }).setView(defaultCenter, 14);

    mapRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
    }).addTo(map);

    // Custom HTML Icons
    const vendorIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-teal-600 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold">
            🏬
          </div>
        </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const clientIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-10 h-10 bg-coral-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center text-white font-bold">
            🏠
          </div>
        </div>`,
      className: "",
      iconSize: [40, 40],
      iconAnchor: [20, 20],
    });

    const bounds = L.latLngBounds([]);

    if (vendeurCoords) {
      const m = L.marker([vendeurCoords.lat, vendeurCoords.lng], { icon: vendorIcon }).addTo(map);
      m.bindPopup(`<div class="p-1 font-bold text-xs">🏬 ${vendeurCoords.nom} (Boutique)</div>`);
      bounds.extend([vendeurCoords.lat, vendeurCoords.lng]);
    }

    if (clientCoords) {
      const m = L.marker([clientCoords.lat, clientCoords.lng], { icon: clientIcon }).addTo(map);
      m.bindPopup(`<div class="p-1 font-bold text-xs">🏠 Destination : ${clientCoords.adresse}</div>`);
      bounds.extend([clientCoords.lat, clientCoords.lng]);
    }

    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [60, 60] });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [vendeurCoords, clientCoords]);

  // Update or animate Livreur Marker on map
  useEffect(() => {
    if (!mapRef.current) return;

    const currentPos = livreurPos || (vendeurCoords ? { lat: vendeurCoords.lat, lng: vendeurCoords.lng } : null);
    if (!currentPos) return;

    const livreurIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center">
          <span class="absolute inline-flex h-12 w-12 rounded-full bg-coral-500/40 animate-ping"></span>
          <div class="relative w-11 h-11 bg-gray-900 rounded-full border-4 border-coral-500 shadow-2xl flex items-center justify-center text-white font-black">
            🛵
          </div>
        </div>`,
      className: "",
      iconSize: [44, 44],
      iconAnchor: [22, 22],
    });

    if (livreurMarkerRef.current) {
      livreurMarkerRef.current.setLatLng([currentPos.lat, currentPos.lng]);
    } else {
      livreurMarkerRef.current = L.marker([currentPos.lat, currentPos.lng], { icon: livreurIcon }).addTo(mapRef.current);
      livreurMarkerRef.current.bindPopup(`<div class="p-1 font-bold text-xs">🛵 Livreur en déplacement (${livreurNom || 'Ayiba Express'})</div>`);
    }

    // Draw route line from livreur to client
    const points: [number, number][] = [];
    if (vendeurCoords) points.push([vendeurCoords.lat, vendeurCoords.lng]);
    points.push([currentPos.lat, currentPos.lng]);
    if (clientCoords) points.push([clientCoords.lat, clientCoords.lng]);

    if (polylineRef.current) {
      polylineRef.current.setLatLngs(points);
    } else if (points.length >= 2) {
      polylineRef.current = L.polyline(points, {
        color: "#f97316",
        weight: 4,
        dashArray: "8, 8",
        opacity: 0.85,
      }).addTo(mapRef.current);
    }
  }, [livreurPos, vendeurCoords, clientCoords, livreurNom]);

  // Realtime Supabase Subscription to listen to Livreur position updates
  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`realtime-commande-${commandeId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "commandes",
          filter: `id=eq.${commandeId}`,
        },
        (payload: any) => {
          const newRow = payload.new;
          if (newRow?.livreur_latitude && newRow?.livreur_longitude) {
            setLivreurPos({
              lat: Number(newRow.livreur_latitude),
              lng: Number(newRow.livreur_longitude),
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [commandeId]);

  // Recalculate Distance & ETA when positions change
  useEffect(() => {
    async function calculateRoute() {
      const fromPos = livreurPos || vendeurCoords;
      if (!fromPos || !clientCoords) return;

      const dist = await getDistanceRoutiereKm(
        fromPos.lat,
        fromPos.lng,
        clientCoords.lat,
        clientCoords.lng
      );

      if (dist !== null) {
        setDistanceKm(dist);
        // Estimate time: average urban speed 25 km/h + 3 min buffer
        const mins = Math.max(2, Math.round((dist / 25) * 60) + 3);
        setEtaMinutes(mins);
      }
    }

    calculateRoute();
  }, [livreurPos, vendeurCoords, clientCoords]);

  const navUrl = clientCoords
    ? getLienNavigationGoogleMaps({
        latitude: clientCoords.lat,
        longitude: clientCoords.lng,
        adresseTexte: clientCoords.adresse,
      })
    : null;

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-xl overflow-hidden flex flex-col">
      {/* Header en direct */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-4 px-6 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">Suivi GPS en direct</p>
            <p className="text-sm font-semibold text-white truncate">
              {livreurNom ? `Livreur : ${livreurNom}` : "Livraison en cours"}
            </p>
          </div>
        </div>

        {etaMinutes !== null && (
          <div className="bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/15 flex items-center gap-2">
            <Clock size={14} className="text-coral-400" />
            <span className="text-xs font-black text-white">~{etaMinutes} min ({distanceKm?.toFixed(1) || '0'} km)</span>
          </div>
        )}
      </div>

      {/* Carte Leaflet */}
      <div className="relative w-full h-[280px] sm:h-[340px]">
        <div ref={mapContainerRef} className="w-full h-full z-0" />

        {/* Legend Overlay */}
        <div className="absolute bottom-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-2 rounded-2xl shadow-lg border border-gray-100 flex items-center gap-3 text-[11px] font-bold text-gray-700">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-600"></span>
            <span>Boutique</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-coral-500"></span>
            <span>Client</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-900 animate-pulse"></span>
            <span>Livreur 🛵</span>
          </div>
        </div>

        {navUrl && (
          <a
            href={navUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute top-3 right-3 z-10 bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs px-3.5 py-2 rounded-xl shadow-lg flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Navigation size={14} />
            <span>Ouvrir Google Maps</span>
          </a>
        )}
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3 text-xs text-gray-600">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-teal-600 shrink-0" />
          <span>Code de sécurité & QR Code requis pour la remise du colis</span>
        </div>
        {livreurTelephone && (
          <a
            href={`tel:${livreurTelephone}`}
            className="shrink-0 bg-white hover:bg-gray-100 border border-gray-200 text-gray-900 font-bold px-3 py-1.5 rounded-lg shadow-sm transition-colors"
          >
            📞 Appeler
          </a>
        )}
      </div>
    </div>
  );
}
