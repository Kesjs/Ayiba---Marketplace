"use client";

import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export interface GeoPoint {
  lat: number;
  lng: number;
}
export interface RouteInfo {
  km: number;
  minutes: number;
}

interface Props {
  from: GeoPoint;
  to: GeoPoint;
  fromLabel?: string;
  toLabel?: string;
  /** Appelé une fois l'itinéraire routier calculé (distance + durée). */
  onRoute?: (info: RouteInfo) => void;
  /** Progression du livreur sur l'itinéraire, de 0 à 1 (mise à jour par paliers de 2 %). */
  onProgress?: (progress: number) => void;
  /** Durée d'un aller complet, en ms. */
  loopMs?: number;
}

const OSM_TILES = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const CORAL = "#D85A30";
const CORAL_LIGHT = "#F0997B";
const TEAL = "#1D9E75";

const CSS = `
.ay-rider{position:relative;width:46px;height:46px;transform:translate(-50%,-50%)}
.ay-rider .ay-ring{position:absolute;inset:-10px;border-radius:999px;background:${TEAL};opacity:.25;animation:ayPulse 1.8s ease-out infinite}
.ay-rider .ay-face{position:absolute;inset:0;border-radius:999px;background:#fff;border:3px solid ${TEAL};box-shadow:0 8px 20px rgba(44,44,42,.3);display:flex;align-items:center;justify-content:center;overflow:hidden}
.ay-rider img{width:150%;height:150%;max-width:none;object-fit:contain}
@keyframes ayPulse{0%{transform:scale(.7);opacity:.45}100%{transform:scale(1.5);opacity:0}}
@media (prefers-reduced-motion:reduce){.ay-rider .ay-ring{animation:none}}
.leaflet-container{font-family:Inter,system-ui,sans-serif;background:#F1EFE8}
.leaflet-control-attribution{font-size:10px!important;background:rgba(255,255,255,.7)!important}
`;

const toRad = (d: number) => (d * Math.PI) / 180;
function haversine(a: GeoPoint, b: GeoPoint) {
  const R = 6371000;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string);

async function fetchRoute(from: GeoPoint, to: GeoPoint, signal: AbortSignal): Promise<{ points: GeoPoint[]; km: number; minutes: number }> {
  // Repli si le service d'itinéraire est indisponible : ligne droite, distance majorée.
  const straight = () => {
    const km = (haversine(from, to) / 1000) * 1.3;
    return { points: [from, to], km, minutes: Math.max(1, Math.round((km / 20) * 60)) };
  };
  try {
    const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to.lng},${to.lat}?overview=full&geometries=geojson`;
    const res = await fetch(url, { signal });
    if (!res.ok) return straight();
    const data = await res.json();
    const r = data?.routes?.[0];
    if (!r?.geometry?.coordinates?.length) return straight();
    const points = (r.geometry.coordinates as [number, number][]).map(([lng, lat]) => ({ lat, lng }));
    return { points, km: r.distance / 1000, minutes: Math.max(1, Math.round(r.duration / 60)) };
  } catch (e) {
    if ((e as Error).name === "AbortError") throw e;
    return straight();
  }
}

function pinIcon(color: string, label: string) {
  return L.divIcon({
    className: "",
    iconSize: [0, 0],
    html: `<div style="transform:translate(-50%,calc(-100% + 9px));display:flex;flex-direction:column;align-items:center"><span style="background:#fff;color:#2C2C2A;font:600 12px Inter,system-ui,sans-serif;padding:4px 10px;border-radius:999px;box-shadow:0 4px 14px rgba(44,44,42,.2);white-space:nowrap;max-width:170px;overflow:hidden;text-overflow:ellipsis;margin-bottom:6px">${esc(label)}</span><span style="width:18px;height:18px;border-radius:999px;background:${color};border:4px solid #fff;box-shadow:0 4px 12px rgba(44,44,42,.35)"></span></div>`,
  });
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export default function DeliveryRouteMap({ from, to, fromLabel = "Départ", toLabel = "Arrivée", onRoute, onProgress, loopMs = 14000 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const onRouteRef = useRef(onRoute);
  const onProgressRef = useRef(onProgress);
  const fromPoint = useMemo(() => ({ lat: from.lat, lng: from.lng }), [from.lat, from.lng]);
  const toPoint = useMemo(() => ({ lat: to.lat, lng: to.lng }), [to.lat, to.lng]);
  useEffect(() => {
    onRouteRef.current = onRoute;
    onProgressRef.current = onProgress;
  });

  // Création unique de la carte
  useEffect(() => {
    const el = containerRef.current;
    if (!el || mapRef.current) return;
    const map = L.map(el, {
      zoomControl: false,
      scrollWheelZoom: false,
      touchZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      dragging: !L.Browser.mobile,
      attributionControl: true,
    }).setView([from.lat, from.lng], 14);
    map.attributionControl.setPrefix(false);
    L.tileLayer(OSM_TILES, { maxZoom: 19, attribution: "© OpenStreetMap" }).addTo(map);
    mapRef.current = map;
    const ro = new ResizeObserver(() => map.invalidateSize());
    ro.observe(el);
    return () => {
      ro.disconnect();
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Itinéraire + livreur animé
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const controller = new AbortController();
    const group = L.layerGroup().addTo(map);
    let raf = 0;
    let cancelled = false;
    const reduce = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    L.marker([fromPoint.lat, fromPoint.lng], { icon: pinIcon(TEAL, fromLabel), interactive: false }).addTo(group);
    L.marker([toPoint.lat, toPoint.lng], { icon: pinIcon(CORAL, toLabel), interactive: false }).addTo(group);
    map.fitBounds(L.latLngBounds([fromPoint.lat, fromPoint.lng], [toPoint.lat, toPoint.lng]), { padding: [60, 60], animate: false });

    fetchRoute(fromPoint, toPoint, controller.signal)
      .then(({ points, km, minutes }) => {
        if (cancelled) return;
        onRouteRef.current?.({ km, minutes });

        const latlngs = points.map((p) => [p.lat, p.lng] as [number, number]);
        L.polyline(latlngs, { color: "#fff", weight: 11, opacity: 0.95, lineCap: "round", lineJoin: "round", interactive: false }).addTo(group);
        L.polyline(latlngs, { color: CORAL_LIGHT, weight: 6, lineCap: "round", lineJoin: "round", interactive: false }).addTo(group);
        const trail = L.polyline([latlngs[0]], { color: CORAL, weight: 6, lineCap: "round", lineJoin: "round", interactive: false }).addTo(group);
        map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [64, 64], animate: false });
        setTimeout(() => {
          if (cancelled) return;
          map.invalidateSize();
          map.fitBounds(L.polyline(latlngs).getBounds(), { padding: [64, 64], animate: false });
        }, 80);

        // distances cumulées pour interpoler la position
        const cum = [0];
        for (let i = 1; i < points.length; i++) cum.push(cum[i - 1] + haversine(points[i - 1], points[i]));
        const total = cum[cum.length - 1] || 1;

        const rider = L.marker(latlngs[0], {
          icon: L.divIcon({ className: "", iconSize: [0, 0], html: '<div class="ay-rider"><span class="ay-ring"></span><span class="ay-face"><img src="/icon-ayiba-delivery.svg" alt="" /></span></div>' }),
          interactive: false,
          zIndexOffset: 1000,
        }).addTo(group);

        const place = (p: number) => {
          const target = p * total;
          let i = 1;
          while (i < cum.length - 1 && cum[i] < target) i++;
          const seg = cum[i] - cum[i - 1] || 1;
          const t = Math.min(1, Math.max(0, (target - cum[i - 1]) / seg));
          const a = points[i - 1];
          const b = points[i] ?? a;
          const cur: [number, number] = [a.lat + (b.lat - a.lat) * t, a.lng + (b.lng - a.lng) * t];
          rider.setLatLng(cur);
          trail.setLatLngs([...latlngs.slice(0, i), cur]);
        };

        if (reduce) {
          place(0.55);
          onProgressRef.current?.(0.55);
          return;
        }

        const pause = 2000;
        const start = performance.now();
        let lastBucket = -1;
        const tick = (now: number) => {
          const t = (now - start) % (loopMs + pause);
          const p = easeInOut(Math.min(t / loopMs, 1));
          place(p);
          const bucket = Math.round(p * 50);
          if (bucket !== lastBucket) {
            lastBucket = bucket;
            onProgressRef.current?.(bucket / 50);
          }
          raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
      })
      .catch(() => {
        /* annulé */
      });

    return () => {
      cancelled = true;
      controller.abort();
      cancelAnimationFrame(raf);
      group.remove();
    };
  }, [fromPoint, toPoint, fromLabel, toLabel, loopMs]);

  return (
    <>
      <style>{CSS}</style>
      <div ref={containerRef} className="h-full w-full" />
    </>
  );
}


