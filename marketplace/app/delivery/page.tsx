"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AnimatePresence, animate, motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform, type Variants } from "framer-motion";
import { ArrowLeftRight, ArrowRight, Check, ChevronDown, Clock3, Loader2, MapPin, Navigation, Repeat, ShieldCheck, ShoppingBag, Wallet, X, Zap, Package } from "lucide-react";
import { useAdresseAutocomplete, type SuggestionAdresse } from "@/lib/hooks/useAdresseAutocomplete";
import type { RouteInfo } from "@/components/delivery/DeliveryRouteMap";

const DeliveryRouteMap = dynamic(() => import("@/components/delivery/DeliveryRouteMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-gray-50" />,
});

/* ───────────── Constantes ───────────── */

const LOGIN = "/connexion?role=livreur&redirect=%2Flivreur%2Fmissions%3Fplatform%3Ddelivery";
const FOCUS = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral-400";
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Trajet de démonstration (Cotonou) : les coordonnées sont approximatives, l'itinéraire est recalé sur la route par le service de routage.
const DEMO_FROM = { lat: 6.36, lng: 2.39 };
const DEMO_TO = { lat: 6.356, lng: 2.365 };

const STEPS = [
  { title: "Course créée", text: "Départ, destination et colis sont enregistrés." },
  { title: "Colis récupéré", text: "Le livreur confirme la collecte au point de départ." },
  { title: "En route vers vous", text: "Sa position avance en direct sur la carte." },
  { title: "Remise confirmée", text: "Le destinataire donne son code, la course est terminée." },
] as const;
const stepFor = (p: number) => (p < 0.04 ? 0 : p < 0.12 ? 1 : p < 0.94 ? 2 : 3);

const FAQS = [
  ["Pour quels besoins utiliser Ayiba Delivery ?", "Pour envoyer un colis, faire récupérer un article, livrer une commande Ayiba ou organiser des courses régulières pour votre activité."],
  ["Comment devenir livreur ?", "Vous déposez votre demande, transmettez les éléments nécessaires à la vérification, puis vous recevez des courses selon votre zone et votre disponibilité."],
  ["Puis-je suivre une course ?", "Oui. Chaque course possède un statut lisible et, lorsque le suivi est actif, la position du livreur est visible sur la carte."],
  ["Comment la remise est-elle confirmée ?", "La course peut être clôturée par un code de confirmation ou une preuve de remise selon le type de course."],
] as const;

/* ───────────── Hooks & utilitaires ───────────── */

function useCycle(length: number, ms: number, paused = false) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => setI((v) => (v + 1) % length), ms);
    return () => clearInterval(t);
  }, [length, ms, paused]);
  return i;
}

function useCountUp(target: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = ms <= 0 ? 1 : Math.min((t - t0) / ms, 1);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [run, target, ms]);
  return v;
}

function Magnetic({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 220, damping: 16 });
  const y = useSpring(my, { stiffness: 220, damping: 16 });
  return (
    <motion.div
      style={{ x, y }}
      className={`inline-block ${className}`}
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - (r.left + r.width / 2)) * 0.22);
        my.set((e.clientY - (r.top + r.height / 2)) * 0.3);
      }}
      onPointerLeave={() => {
        mx.set(0);
        my.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

function Logo({ className = "h-9" }: { className?: string }) {
  return (
    <span className="flex items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/logo-ayiba-delivery.svg" alt="Ayiba Delivery" className={`${className} w-auto`} />
    </span>
  );
}

/* ───────────── Champ d'adresse (autocomplétion réelle, Bénin) ───────────── */

type Place = SuggestionAdresse | null;

function AddressField({ label, placeholder, dot, text, picked, onText, onPick }: { label: string; placeholder: string; dot: string; text: string; picked: boolean; onText: (v: string) => void; onPick: (s: Place) => void }) {
  const [open, setOpen] = useState(false);
  const { suggestions, loading } = useAdresseAutocomplete(picked ? "" : text);
  const show = open && !picked && text.trim().length >= 3;
  return (
    <div className="relative">
      <span className={`pointer-events-none absolute left-4 top-1/2 h-3 w-3 -translate-y-1/2 rounded-full ring-4 ring-white ${dot}`} />
      <input
        value={text}
        aria-label={label}
        placeholder={placeholder}
        autoComplete="off"
        onChange={(e) => {
          onText(e.target.value);
          onPick(null);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && show && suggestions[0]) {
            e.preventDefault();
            onText(suggestions[0].texte);
            onPick(suggestions[0]);
            setOpen(false);
          }
          if (e.key === "Escape") setOpen(false);
        }}
        className="h-14 w-full rounded-2xl bg-gray-50 pl-11 pr-11 text-base font-semibold text-gray-900 outline-none transition placeholder:font-medium placeholder:text-gray-400 focus:bg-white focus:ring-2 focus:ring-coral-400"
      />
      <span className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center">
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        ) : picked ? (
          <Check className="h-4 w-4 text-teal-400" />
        ) : text ? (
          <button type="button" aria-label="Effacer" onClick={() => { onText(""); onPick(null); }} className="flex h-8 w-8 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100"><X className="h-4 w-4" /></button>
        ) : null}
      </span>
      <AnimatePresence>
        {show && (
          <motion.ul initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.16 }} className="absolute inset-x-0 top-full z-30 mt-2 max-h-64 overflow-y-auto rounded-2xl border border-gray-100 bg-white p-1.5 shadow-[0_20px_50px_-12px_rgba(44,44,42,.35)]">
            {suggestions.length === 0 && !loading && <li className="px-3 py-3 text-sm text-gray-500">Aucune adresse trouvée</li>}
            {suggestions.map((s) => (
              <li key={s.id}>
                <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => { onText(s.texte); onPick(s); setOpen(false); }} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-coral-50">
                  <MapPin className="h-4 w-4 shrink-0 text-coral-400" />
                  <span className="truncate font-semibold text-gray-900">{s.texte}</span>
                </button>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

function BookingCard({ info, onTrip }: { info: RouteInfo | null; onTrip: (f: Place, t: Place) => void }) {
  const router = useRouter();
  const [fromText, setFromText] = useState("");
  const [toText, setToText] = useState("");
  const [from, setFrom] = useState<Place>(null);
  const [to, setTo] = useState<Place>(null);
  const ready = !!from && !!to;

  useEffect(() => {
    onTrip(from, to);
  }, [from, to, onTrip]);

  const swap = () => {
    setFromText(toText);
    setToText(fromText);
    setFrom(to);
    setTo(from);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const q = new URLSearchParams();
    if (from) { q.set("depart", from.texte); q.set("departLat", String(from.latitude)); q.set("departLng", String(from.longitude)); }
    if (to) { q.set("destination", to.texte); q.set("destinationLat", String(to.latitude)); q.set("destinationLng", String(to.longitude)); }
    const qs = q.toString();
    router.push(`/delivery/course${qs ? `?${qs}` : ""}`);
  };

  return (
    <form onSubmit={submit} className="mt-8 w-full max-w-[500px] rounded-3xl border border-gray-100 bg-white p-3 shadow-[0_24px_60px_-24px_rgba(44,44,42,.35)] sm:p-4">
      <div className="relative space-y-2">
        <AddressField label="Adresse de départ" placeholder="Où récupérer le colis ?" dot="bg-teal-400" text={fromText} picked={!!from} onText={setFromText} onPick={setFrom} />
        <AddressField label="Adresse d’arrivée" placeholder="Où le livrer ?" dot="bg-coral-400" text={toText} picked={!!to} onText={setToText} onPick={setTo} />
        <button type="button" onClick={swap} aria-label="Inverser départ et arrivée" className={`absolute right-12 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-gray-100 bg-white text-gray-700 shadow-sm transition hover:rotate-180 hover:bg-gray-50 active:scale-90 ${FOCUS}`}>
          <ArrowLeftRight className="h-4 w-4 rotate-90" />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {ready && info && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
            <div className="mt-3 flex items-center justify-between rounded-2xl bg-teal-50 px-4 py-3 text-sm font-semibold text-teal-700">
              <span className="flex items-center gap-2"><Navigation className="h-4 w-4" />{info.km.toLocaleString("fr-FR", { maximumFractionDigits: 1 })} km</span>
              <span className="flex items-center gap-2"><Clock3 className="h-4 w-4" />environ {info.minutes} min</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button type="submit" className={`group mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-coral-400 text-base font-bold text-white shadow-lg shadow-coral-400/25 transition hover:bg-coral-500 active:scale-[.98] ${FOCUS}`}>
        {ready ? "Commander cette course" : "Voir le tarif"}
        <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
      </button>
    </form>
  );
}

/* ───────────── Hero ───────────── */

const headingParent: Variants = { hidden: {}, visible: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } } };
const headingLine: Variants = { hidden: { y: "110%" }, visible: { y: 0, transition: { duration: 0.75, ease: EASE } } };
const LIVE = ["Colis récupéré", "En route vers vous", "Remise confirmée"] as const;

function HeroVisual({ trip, onRoute }: { trip: { from: Place; to: Place }; onRoute: (i: RouteInfo) => void }) {
  const reduce = useReducedMotion();
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 90, damping: 18 });
  const sy = useSpring(my, { stiffness: 90, damping: 18 });
  const photoX = useTransform(sx, [-0.5, 0.5], [12, -12]);
  const photoY = useTransform(sy, [-0.5, 0.5], [8, -8]);
  const cardX = useTransform(sx, [-0.5, 0.5], [-22, 22]);
  const cardY = useTransform(sy, [-0.5, 0.5], [-14, 14]);
  const live = useCycle(LIVE.length, 2600, !!reduce);
  const showMap = !!trip.from && !!trip.to;

  return (
    <div
      className="relative aspect-[4/5] w-full overflow-hidden rounded-[32px] bg-gray-50 sm:aspect-[8/7] lg:aspect-auto lg:h-[640px]"
      onPointerMove={(e) => {
        if (e.pointerType !== "mouse") return;
        const r = e.currentTarget.getBoundingClientRect();
        mx.set((e.clientX - r.left) / r.width - 0.5);
        my.set((e.clientY - r.top) / r.height - 0.5);
      }}
      onPointerLeave={() => { mx.set(0); my.set(0); }}
    >
      <motion.div style={reduce ? undefined : { x: photoX, y: photoY, scale: 1.08 }} className="absolute inset-0">
        <Image src="/images/hero/hero-livreur-choisi.png" alt="Livreur Ayiba avec un colis, scooter garé en bord de route" fill priority sizes="(min-width:1024px) 55vw, 100vw" className="object-cover object-[72%_50%]" />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/45 via-transparent to-transparent" />

      <motion.div style={reduce ? undefined : { x: cardX, y: cardY }} className="absolute left-4 top-4 flex items-center gap-2 rounded-full bg-white/95 py-2 pl-3 pr-4 text-sm font-bold text-gray-900 shadow-lg backdrop-blur">
        <span className="relative flex h-2.5 w-2.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-60" /><span className="relative h-2.5 w-2.5 rounded-full bg-teal-400" /></span>
        Suivi en direct
      </motion.div>

      <motion.div style={reduce ? undefined : { x: cardX, y: cardY }} className="absolute inset-x-4 bottom-4 rounded-3xl bg-white p-4 shadow-[0_20px_50px_-12px_rgba(44,44,42,.45)] md:inset-x-auto md:bottom-6 md:left-6 md:w-[340px]">
        <div className="flex items-center gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-teal-400 bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="" className="h-[150%] w-[150%] max-w-none object-contain" />
          </span>
          <div className="min-w-0 flex-1 overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.p key={live} initial={{ y: 14, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -14, opacity: 0 }} transition={{ duration: 0.22 }} className="truncate text-base font-bold text-gray-900">{LIVE[live]}</motion.p>
            </AnimatePresence>
            <p className="text-sm text-gray-500">Livreur Ayiba</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-1.5" aria-hidden="true">
          {LIVE.map((l, i) => (
            <div key={l} className="h-1.5 overflow-hidden rounded-full bg-gray-100">
              <motion.div className="h-full bg-teal-400" initial={false} animate={{ width: i <= live ? "100%" : "0%" }} transition={{ duration: 0.5, ease: EASE }} />
            </div>
          ))}
        </div>
      </motion.div>

      <AnimatePresence>
        {showMap && trip.from && trip.to && (
          <motion.div key="map" initial={{ opacity: 0, scale: 1.04 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.5, ease: EASE }} className="absolute inset-0 isolate z-20 bg-gray-50">
            <DeliveryRouteMap from={{ lat: trip.from.latitude, lng: trip.from.longitude }} to={{ lat: trip.to.latitude, lng: trip.to.longitude }} fromLabel={trip.from.texte} toLabel={trip.to.texte} onRoute={onRoute} loopMs={10000} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Hero() {
  const [trip, setTrip] = useState<{ from: Place; to: Place }>({ from: null, to: null });
  const [info, setInfo] = useState<RouteInfo | null>(null);
  const onTrip = useCallback((from: Place, to: Place) => {
    setTrip({ from, to });
    if (!from || !to) setInfo(null);
  }, []);
  return (
    <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-5 pb-16 pt-8 md:px-8 md:pt-12 lg:grid-cols-[minmax(0,520px)_1fr] lg:gap-14 lg:pb-24">
      <div className="flex flex-col items-start">
        <motion.h1 initial="hidden" animate="visible" variants={headingParent} className="text-[44px] font-extrabold leading-[1.02] tracking-[-0.04em] text-gray-900 sm:text-6xl lg:text-[66px]">
          {["Envoyez un colis.", "Suivez-le en direct."].map((line, i) => (
            <span key={line} className="block overflow-hidden pb-[0.1em]">
              <motion.span variants={headingLine} className={`block ${i === 1 ? "text-coral-400" : ""}`}>{line}</motion.span>
            </span>
          ))}
        </motion.h1>
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.5 }} className="mt-5 max-w-md text-lg leading-7 text-gray-500">
          Choisissez deux adresses : un livreur récupère, vous suivez le trajet sur la carte, la remise est confirmée par code.
        </motion.p>
        <BookingCard info={info} onTrip={onTrip} />
      </div>
      <HeroVisual trip={trip} onRoute={setInfo} />
    </section>
  );
}

/* ───────────── Services ───────────── */

const SERVICES = [
  { icon: ShoppingBag, title: "Commandes Ayiba", text: "Du vendeur au client, dans le même système.", tone: "bg-teal-50", ink: "text-teal-700" },
  { icon: Repeat, title: "Courses planifiées", text: "Préparez les trajets récurrents de votre activité.", tone: "bg-gray-50", ink: "text-gray-900" },
  { icon: Zap, title: "Récupération d’article", text: "Faites récupérer un achat et livrer là où vous êtes.", tone: "bg-gray-50", ink: "text-gray-900" },
] as const;

function Services() {
  return (
    <section id="services" className="scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="max-w-2xl text-4xl font-extrabold tracking-[-0.035em] text-gray-900 md:text-5xl">Un seul réseau, plusieurs façons de livrer.</h2>
        <div className="mt-12 grid gap-3 md:grid-cols-3 md:grid-rows-2">
          <Link href="/delivery/course" className={`group relative flex min-h-[320px] flex-col justify-between overflow-hidden rounded-[28px] bg-coral-50 p-7 transition-colors duration-300 hover:bg-coral-100 md:col-span-2 md:row-span-2 md:min-h-[520px] ${FOCUS}`}>
            <div>
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-coral-400"><Package className="h-6 w-6" strokeWidth={1.8} /></span>
              <h3 className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 md:text-4xl">Colis et documents</h3>
              <p className="mt-2 max-w-xs text-base leading-6 text-gray-700">Une course ponctuelle avec les informations essentielles, de porte à porte.</p>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/illustrations/delivery.svg" alt="" className="pointer-events-none absolute -bottom-6 -right-6 w-[300px] max-w-[70%] transition-transform duration-500 ease-out group-hover:-translate-x-6 group-hover:rotate-[-3deg] md:w-[400px]" />
            <span className="relative mt-8 flex h-12 w-12 items-center justify-center rounded-full bg-gray-900 text-white transition-transform group-hover:translate-x-1"><ArrowRight className="h-5 w-5" /></span>
          </Link>
          {SERVICES.map(({ icon: Icon, title, text, tone, ink }) => (
            <Link key={title} href="/delivery/course" className={`group flex min-h-[250px] flex-col justify-between rounded-[28px] p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-20px_rgba(44,44,42,.35)] ${tone} ${FOCUS}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-full bg-white ${ink} transition-transform duration-300 group-hover:rotate-[-12deg] group-hover:scale-110`}><Icon className="h-6 w-6" strokeWidth={1.8} /></span>
              <div>
                <h3 className="text-xl font-extrabold tracking-tight text-gray-900">{title}</h3>
                <p className="mt-1.5 text-[15px] leading-6 text-gray-500">{text}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── Suivi en direct (vraie carte) ───────────── */

function Tracking() {
  const ref = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const [info, setInfo] = useState<RouteInfo | null>(null);
  const step = stepFor(progress);
  const remainMin = info ? (step === 3 ? 0 : Math.max(1, Math.round(info.minutes * (1 - progress)))) : null;
  const remainKm = info ? info.km * (1 - progress) : null;

  return (
    <section id="fonctionnement" ref={ref} className="scroll-mt-20 bg-gray-50 px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <h2 className="max-w-2xl text-4xl font-extrabold tracking-[-0.035em] text-gray-900 md:text-5xl">Vous voyez le livreur avancer sur la route.</h2>
        <div className="mt-12 grid gap-6 lg:grid-cols-[1.25fr_1fr]">
          <div className="relative isolate h-[420px] overflow-hidden rounded-[28px] bg-white shadow-[0_20px_50px_-24px_rgba(44,44,42,.35)] md:h-[560px]">
            <DeliveryRouteMap from={DEMO_FROM} to={DEMO_TO} fromLabel="Cadjèhoun" toLabel="Fidjrossè" onRoute={setInfo} onProgress={setProgress} />
            <div className="pointer-events-none absolute inset-x-4 bottom-4 z-[1100] rounded-2xl bg-white p-4 shadow-xl md:inset-x-auto md:left-5 md:w-[320px]">
              <div className="flex items-center justify-between">
                <div className="overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p key={step} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -12, opacity: 0 }} transition={{ duration: 0.2 }} className="font-bold text-gray-900">{STEPS[step].title}</motion.p>
                  </AnimatePresence>
                  <p className="text-sm text-gray-500">{step === 3 ? "Course terminée" : remainMin ? `Arrivée dans ${remainMin} min` : "Calcul de l’itinéraire…"}</p>
                </div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-600">Aperçu</span>
              </div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-gray-100"><div className="h-full rounded-full bg-coral-400" style={{ width: `${progress * 100}%`, transition: "width .2s linear" }} /></div>
            </div>
          </div>

          <div className="flex flex-col justify-between gap-6">
            <ol>
              {STEPS.map((s, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={s.title} className="flex gap-4" aria-current={current ? "step" : undefined}>
                    <span className="flex flex-col items-center">
                      <motion.span animate={{ scale: current ? 1.12 : 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }} className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-extrabold transition-colors duration-300 ${done ? "bg-teal-400 text-white" : current ? "bg-coral-400 text-white" : "bg-white text-gray-400"}`}>
                        {done ? <Check className="h-5 w-5" /> : i + 1}
                      </motion.span>
                      {i < STEPS.length - 1 && <span className="my-1 w-0.5 flex-1 overflow-hidden rounded bg-gray-100"><span className={`block w-full bg-teal-400 transition-all duration-500 ${done ? "h-full" : "h-0"}`} /></span>}
                    </span>
                    <span className="pb-6">
                      <span className={`block text-lg font-extrabold transition-colors ${current || done ? "text-gray-900" : "text-gray-400"}`}>{s.title}</span>
                      <span className="mt-0.5 block max-w-sm text-[15px] leading-6 text-gray-500">{s.text}</span>
                    </span>
                  </li>
                );
              })}
            </ol>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white p-5"><p className="text-sm font-semibold text-gray-500">Distance restante</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">{remainKm !== null ? remainKm.toLocaleString("fr-FR", { maximumFractionDigits: 1 }) : "–"} <span className="text-lg text-gray-400">km</span></p></div>
              <div className="rounded-2xl bg-white p-5"><p className="text-sm font-semibold text-gray-500">Temps restant</p><p className="mt-1 text-3xl font-extrabold tracking-tight text-gray-900 tabular-nums">{remainMin !== null ? remainMin : "–"} <span className="text-lg text-gray-400">min</span></p></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Livreurs ───────────── */

function SlideToAccept() {
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [max, setMax] = useState(0);
  const [done, setDone] = useState(false);
  const labelOpacity = useTransform(x, [0, Math.max(max * 0.5, 1)], [1, 0]);
  const fill = useTransform(x, (v) => v + 56);

  useEffect(() => {
    const measure = () => setMax(Math.max(0, (trackRef.current?.clientWidth ?? 0) - 56 - 8));
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => { animate(x, 0, { type: "spring", stiffness: 200, damping: 24 }); setDone(false); }, 2600);
    return () => clearTimeout(t);
  }, [done, x]);

  const accept = () => { animate(x, max, { type: "spring", stiffness: 260, damping: 26 }); setDone(true); };

  return (
    <div ref={trackRef} className="relative h-16 overflow-hidden rounded-full bg-coral-50 p-1">
      <motion.div style={{ width: fill }} className={`absolute inset-y-1 left-1 rounded-full transition-colors duration-300 ${done ? "bg-teal-400" : "bg-coral-100"}`} />
      <motion.span style={{ opacity: labelOpacity }} className="pointer-events-none absolute inset-0 flex items-center justify-center pl-10 text-[15px] font-bold text-coral-600">Glissez pour accepter</motion.span>
      <AnimatePresence>
        {done && <motion.span initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 pr-12 text-[15px] font-bold text-white"><Check className="h-5 w-5" />Course acceptée</motion.span>}
      </AnimatePresence>
      <motion.div
        role="button"
        tabIndex={0}
        aria-label="Glisser pour accepter la course"
        drag={done ? false : "x"}
        dragConstraints={{ left: 0, right: max }}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={() => (x.get() > max * 0.8 ? accept() : animate(x, 0, { type: "spring", stiffness: 300, damping: 26 }))}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); if (!done) accept(); } }}
        whileTap={{ scale: 0.94 }}
        className={`relative z-10 flex h-14 w-14 cursor-grab items-center justify-center rounded-full bg-coral-400 text-white shadow-lg active:cursor-grabbing ${FOCUS}`}
      >
        <ArrowRight className="h-6 w-6" />
      </motion.div>
    </div>
  );
}

const DRIVER_STEPS = [
  { img: "/illustrations/rider-step-1.svg", title: "Déposez votre dossier", text: "Vous transmettez les éléments nécessaires à la vérification." },
  { img: "/illustrations/rider-step-2.svg", title: "Recevez des courses", text: "Les courses de votre zone apparaissent sur la carte." },
  { img: "/illustrations/rider-step-3.svg", title: "Acceptez et roulez", text: "Un geste suffit pour prendre la course." },
] as const;

function Drivers() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.35 });
  const reduce = useReducedMotion();
  const gains = useCountUp(8400, inView, reduce ? 0 : 1500);
  const bars = [40, 65, 30, 80, 55, 90, 45];
  const days = ["L", "M", "M", "J", "V", "S", "D"];
  const features = [[Wallet, "Gains visibles"], [MapPin, "Trajets localisés"], [Navigation, "Navigation"], [ShieldCheck, "Preuve de remise"]] as const;

  return (
    <section id="livreurs" ref={ref} className="scroll-mt-20 bg-gray-900 px-5 py-20 text-white md:px-8 md:py-28">
      <div className="mx-auto max-w-[1280px]">
        <div className="grid items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-16">
          <div>
            <h2 className="max-w-xl text-4xl font-extrabold tracking-[-0.035em] md:text-6xl">Roulez quand vous voulez. <span className="text-coral-300">Gagnez à chaque course.</span></h2>
            <p className="mt-6 max-w-lg text-lg leading-8 text-white/70">Le dashboard Ayiba devient votre centre de courses : vous voyez ce qui est disponible, choisissez votre rythme et gardez le contrôle de vos gains.</p>
            <ul className="mt-8 grid max-w-lg gap-x-8 sm:grid-cols-2">
              {features.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-3 border-b border-white/15 py-4"><Icon className="h-5 w-5 text-teal-200" strokeWidth={1.8} /><span className="font-semibold">{label}</span></li>
              ))}
            </ul>
            <Magnetic className="mt-10">
              <Link href={LOGIN} className="inline-flex h-14 items-center gap-2 rounded-2xl bg-coral-400 px-7 text-base font-bold text-white shadow-lg shadow-coral-400/30 transition hover:bg-coral-300 active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">
                Devenir livreur <ArrowRight className="h-5 w-5" />
              </Link>
            </Magnetic>
          </div>

          <div className="relative h-[560px] overflow-hidden rounded-[32px] bg-gray-100 md:h-[600px]">
            <Image src="/images/hero/hero-livreur.webp" alt="Livreur Ayiba présentant l’app sur son téléphone" fill sizes="(min-width:1024px) 45vw, 100vw" className="object-cover object-[78%_30%]" />
            <div className="absolute inset-x-3 bottom-3 rounded-3xl bg-white p-5 text-gray-900 shadow-2xl md:inset-x-5 md:bottom-5">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-500">Aujourd’hui</p>
                  <p className="text-4xl font-extrabold tracking-[-0.04em] tabular-nums">{gains.toLocaleString("fr-FR")} F</p>
                </div>
                <div className="flex h-12 items-end gap-1" aria-hidden="true">
                  {bars.map((h, i) => (
                    <div key={i} className="flex h-full w-3 flex-col justify-end">
                      <motion.div className={`w-full rounded ${i === 5 ? "bg-coral-400" : "bg-gray-100"}`} initial={{ height: 0 }} animate={{ height: inView ? `${h}%` : 0 }} transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.2 + i * 0.06, ease: EASE }} title={days[i]} />
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm"><span className="font-bold">Cadjèhoun → Fidjrossè</span><span className="font-extrabold text-coral-500">2 500 F</span></div>
              <p className="mb-3 text-sm text-gray-500">4,8 km · Colis · exemple de course</p>
              <SlideToAccept />
            </div>
          </div>
        </div>

        <div className="mt-14 grid gap-3 md:grid-cols-3">
          {DRIVER_STEPS.map((s, i) => (
            <div key={s.title} className="group overflow-hidden rounded-[28px] bg-white p-6 text-gray-900 transition duration-300 hover:-translate-y-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={s.img} alt="" className="mx-auto h-40 w-40 object-contain transition-transform duration-500 group-hover:scale-110" />
              <p className="mt-4 text-sm font-bold text-coral-500">Étape {i + 1}</p>
              <h3 className="mt-1 text-xl font-extrabold tracking-tight">{s.title}</h3>
              <p className="mt-1.5 text-[15px] leading-6 text-gray-500">{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── FAQ & CTA ───────────── */

function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section id="faq" className="scroll-mt-20 px-5 py-20 md:px-8 md:py-28">
      <div className="mx-auto grid max-w-[1280px] gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
        <h2 className="text-4xl font-extrabold tracking-[-0.035em] text-gray-900 md:text-5xl">Questions fréquentes</h2>
        <div className="divide-y divide-gray-100 border-y border-gray-100">
          {FAQS.map(([q, a], i) => {
            const isOpen = open === i;
            return (
              <div key={q}>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : i)} className={`flex w-full items-center justify-between gap-6 py-6 text-left text-lg font-bold text-gray-900 ${FOCUS}`}>
                  <span>{q}</span>
                  <motion.span animate={{ rotate: isOpen ? 180 : 0 }} transition={{ duration: 0.25 }} className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-colors ${isOpen ? "bg-coral-400 text-white" : "bg-gray-50 text-gray-700"}`}><ChevronDown className="h-5 w-5" /></motion.span>
                </button>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3, ease: EASE }} className="overflow-hidden">
                      <p className="max-w-xl pb-6 pr-12 text-[17px] leading-7 text-gray-500">{a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section id="demarrer" className="px-5 pb-20 md:px-8 md:pb-28">
      <div className="relative mx-auto max-w-[1280px] overflow-hidden rounded-[32px] bg-coral-400 px-6 py-16 md:px-14 md:py-24">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/illustrations/delivery.svg" alt="" className="pointer-events-none absolute -bottom-10 -right-10 hidden w-[380px] opacity-95 md:block" />
        <h2 className="relative max-w-2xl text-4xl font-extrabold tracking-[-0.04em] text-white md:text-6xl">Votre prochaine course part d’ici.</h2>
        <div className="relative mt-9 flex flex-col gap-3 sm:flex-row">
          <Magnetic><Link href="/delivery/course" className="inline-flex h-14 items-center justify-center gap-2 rounded-2xl bg-white px-8 text-base font-bold text-coral-600 transition hover:bg-coral-50 active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Créer une course <ArrowRight className="h-5 w-5" /></Link></Magnetic>
          <Magnetic><Link href={LOGIN} className="inline-flex h-14 items-center justify-center rounded-2xl bg-gray-900 px-8 text-base font-bold text-white transition hover:bg-gray-800 active:scale-[.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white">Devenir livreur</Link></Magnetic>
        </div>
      </div>
    </section>
  );
}

/* ───────────── Page ───────────── */

export default function DeliveryLandingPage() {
  return (
    <main className="min-h-screen bg-white text-gray-900">
      <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-[68px] max-w-[1280px] items-center justify-between gap-6 px-5 md:px-8">
          <Link href="/delivery" aria-label="Ayiba Delivery" className={`rounded-md ${FOCUS}`}><Logo /></Link>
          <nav className="hidden items-center gap-1 text-[15px] font-semibold md:flex" aria-label="Sections">
            {[["#services", "Services"], ["#fonctionnement", "Suivi"], ["#livreurs", "Livreurs"], ["#faq", "FAQ"]].map(([href, label]) => (
              <a key={href} href={href} className={`rounded-full px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50 ${FOCUS}`}>{label}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <Link href={LOGIN} className={`hidden rounded-full px-4 py-2.5 text-[15px] font-semibold text-gray-700 transition-colors hover:bg-gray-50 sm:block ${FOCUS}`}>Se connecter</Link>
            <Link href="/delivery/course" className={`rounded-full bg-coral-400 px-5 py-2.5 text-[15px] font-bold text-white transition hover:bg-coral-500 active:scale-95 ${FOCUS}`}>Commander</Link>
          </div>
        </div>
      </header>

      <Hero />
      <Services />
      <Tracking />
      <Drivers />
      <Faq />
      <FinalCta />

      <footer className="border-t border-gray-100 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-[1280px] flex-col items-center justify-between gap-4 text-sm text-gray-500 sm:flex-row">
          <Logo className="h-8" />
          <span>Ayiba Delivery, du départ à l’arrivée.</span>
        </div>
      </footer>
    </main>
  );
}
