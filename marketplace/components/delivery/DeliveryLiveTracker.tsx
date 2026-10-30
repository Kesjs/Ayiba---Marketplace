"use client";

import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { createClient } from "@/lib/supabase/client";
import { Bike, Clock3, Navigation, ShieldCheck } from "lucide-react";
import { getDistanceRoutiereKm, getLienNavigationGoogleMaps } from "@/lib/osrm";
import type { DeliveryCourse } from "@/lib/delivery";

export default function DeliveryLiveTracker({ course, livreurNom }: { course: DeliveryCourse; livreurNom?: string | null }) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const driverMarkerRef = useRef<L.Marker | null>(null);
  const [driverPosition, setDriverPosition] = useState(
    course.livreur_latitude != null && course.livreur_longitude != null
      ? { lat: course.livreur_latitude, lng: course.livreur_longitude }
      : null,
  );
  const [distanceKm, setDistanceKm] = useState<number | null>(null);
  const [etaMinutes, setEtaMinutes] = useState<number | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;
    const map = L.map(mapContainerRef.current, { zoomControl: false, attributionControl: false }).setView(
      [course.destination_latitude, course.destination_longitude],
      13,
    );
    mapRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19 }).addTo(map);
    const origin = L.circleMarker([course.depart_latitude, course.depart_longitude], { radius: 8, color: "#1d9e75", fillColor: "#1d9e75", fillOpacity: 1, weight: 3 }).addTo(map);
    origin.bindTooltip("Départ", { direction: "top" });
    const destination = L.circleMarker([course.destination_latitude, course.destination_longitude], { radius: 8, color: "#d85a30", fillColor: "#d85a30", fillOpacity: 1, weight: 3 }).addTo(map);
    destination.bindTooltip("Destination", { direction: "top" });
    map.fitBounds(L.latLngBounds([origin.getLatLng(), destination.getLatLng()]), { padding: [36, 36] });
    return () => {
      map.remove();
      mapRef.current = null;
      driverMarkerRef.current = null;
    };
  }, [course.depart_latitude, course.depart_longitude, course.destination_latitude, course.destination_longitude]);

  useEffect(() => {
    if (!mapRef.current || !driverPosition) return;
    const icon = L.divIcon({
      className: "",
      html: '<div style="width:38px;height:38px;border-radius:14px;background:#111827;border:3px solid #1d9e75;box-shadow:0 8px 20px rgba(17,24,39,.25);display:flex;align-items:center;justify-content:center"><span style="width:10px;height:10px;border-radius:999px;background:#79d8b5;display:block"></span></div>',
      iconSize: [38, 38],
      iconAnchor: [19, 19],
    });
    if (driverMarkerRef.current) driverMarkerRef.current.setLatLng([driverPosition.lat, driverPosition.lng]);
    else driverMarkerRef.current = L.marker([driverPosition.lat, driverPosition.lng], { icon }).addTo(mapRef.current);
  }, [driverPosition]);

  useEffect(() => {
    const supabase = createClient();
    const courseChannel = supabase.channel(`delivery-course-${course.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "courses_delivery", filter: `id=eq.${course.id}` }, (payload: any) => {
      const row = payload.new;
      if (row?.livreur_latitude != null && row?.livreur_longitude != null) setDriverPosition({ lat: Number(row.livreur_latitude), lng: Number(row.livreur_longitude) });
    }).subscribe();
    const driverChannel = course.livreur_id
      ? supabase.channel(`delivery-driver-${course.livreur_id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "livreurs", filter: `id=eq.${course.livreur_id}` }, (payload: any) => {
          const row = payload.new;
          if (row?.latitude != null && row?.longitude != null) setDriverPosition({ lat: Number(row.latitude), lng: Number(row.longitude) });
        }).subscribe()
      : null;
    return () => {
      supabase.removeChannel(courseChannel);
      if (driverChannel) supabase.removeChannel(driverChannel);
    };
  }, [course.id, course.livreur_id]);

  useEffect(() => {
    if (!driverPosition) return;
    getDistanceRoutiereKm(driverPosition.lat, driverPosition.lng, course.destination_latitude, course.destination_longitude).then((distance) => {
      if (distance == null) return;
      setDistanceKm(distance);
      setEtaMinutes(Math.max(2, Math.round((distance / 25) * 60) + 3));
    });
  }, [course.destination_latitude, course.destination_longitude, driverPosition]);

  const navUrl = getLienNavigationGoogleMaps({ latitude: course.destination_latitude, longitude: course.destination_longitude, adresseTexte: course.destination_adresse });

  return (
    <div className="overflow-hidden rounded-[26px] border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-4 bg-gray-900 px-5 py-4 text-white">
        <div className="flex items-center gap-3"><span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[#79d8b5]" /><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#79d8b5]">Suivi en direct</p><p className="mt-1 text-sm font-semibold">{livreurNom || "Recherche d’un livreur"}</p></div></div>
        {etaMinutes != null && <div className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-bold"><Clock3 size={13} className="mr-1 inline text-[#f6a287]" />~{etaMinutes} min · {distanceKm?.toFixed(1)} km</div>}
      </div>
      <div className="relative h-[300px] sm:h-[360px]"><div ref={mapContainerRef} className="h-full w-full" />{navUrl && <a href={navUrl} target="_blank" rel="noopener noreferrer" className="absolute right-3 top-3 z-[400] inline-flex items-center gap-1.5 rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white shadow-lg"><Navigation size={14} /> Itinéraire</a>}</div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 bg-gray-50 px-5 py-4 text-xs text-gray-500"><span className="inline-flex items-center gap-2"><Bike size={15} className="text-[#1d9e75]" /> Position actualisée en temps réel</span><span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#1d9e75]" /> Paiement sécurisé</span></div>
    </div>
  );
}
