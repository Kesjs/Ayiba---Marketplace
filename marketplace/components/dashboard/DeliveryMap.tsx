"use client";

import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DeliveryMapProps {
  points: { lat: number; lng: number; label: string; type: 'pickup' | 'delivery' }[];
}

export default function DeliveryMap({ points }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapInstance.current) return;

    // Fix for default markers in Leaflet with Next.js
    // @ts-ignore
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });

    // Cotonou center by default
    const center: [number, number] = [6.366, 2.418];
    mapInstance.current = L.map(mapContainer.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(center, 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(mapInstance.current);

    // Custom icons
    const pickupIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-teal-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const deliveryIcon = L.divIcon({
      html: `<div class="w-8 h-8 bg-coral-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-white"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg></div>`,
      className: '',
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    const bounds = L.latLngBounds([]);

    points.forEach(p => {
      const marker = L.marker([p.lat, p.lng], { 
        icon: p.type === 'pickup' ? pickupIcon : deliveryIcon 
      }).addTo(mapInstance.current!);
      
      marker.bindPopup(`<b class="font-bold text-sm">${p.label}</b>`, { closeButton: false });
      bounds.extend([p.lat, p.lng]);
    });

    if (points.length > 0) {
      mapInstance.current.fitBounds(bounds, { padding: [50, 50] });
    }

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [points]);

  return (
    <div className="w-full h-full relative overflow-hidden rounded-[32px] border border-gray-100 shadow-inner">
      <div ref={mapContainer} className="w-full h-full z-0" />
      {/* Overlay for map control hints */}
      <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-2">
         <div className="bg-white/90 backdrop-blur-sm p-2 rounded-xl shadow-lg border border-gray-100 flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-teal-500 rounded-full" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Retrait</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-coral-500 rounded-full" />
              <span className="text-[10px] font-bold text-gray-600 uppercase">Livraison</span>
            </div>
         </div>
      </div>
    </div>
  );
}
