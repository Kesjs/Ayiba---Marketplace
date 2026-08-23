"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Store, Bike, type LucideIcon } from "lucide-react";

interface Slide {
  id: string;
  badge: string;
  badgeIcon: LucideIcon;
  theme: "coral" | "teal";
  h1: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
}

const SLIDES: Slide[] = [
  {
    id: "vendeur",
    badge: "Deviens vendeur sur Ayiba",
    badgeIcon: Store,
    theme: "coral",
    h1: "Créez votre boutique, partagez-la partout, on gère paiement et livraison.",
    subtitle: "Rejoignez les créateurs et vendeurs qui vendent déjà sur Ayiba, sans site web ni frais de démarrage.",
    ctaLabel: "Devenir vendeur",
    ctaHref: "/devenir-vendeur",
    image: "/images/hero/hero-artisan.webp",
    imageAlt: "Vendeuse préparant ses articles pour Ayiba",
    imagePosition: "object-[75%_center] md:object-[85%_center]",
  },
  {
    id: "livreur",
    badge: "Devenir livreur partenaire",
    badgeIcon: Bike,
    theme: "teal",
    h1: "Livrez votre quartier, gagnez en liberté.",
    subtitle: "95% de gains par course, paiement Mobile Money instantané. Roulez quand vous voulez.",
    ctaLabel: "Devenir livreur",
    ctaHref: "/devenir-livreur",
    image: "/illustrations/delivery.svg",
    imageAlt: "Illustration livreur Ayiba",
    imagePosition: "object-center",
  },
];

const AUTO_ROTATE_MS = 5000;

const THEME = {
  coral: {
    badgeBg: "bg-coral-50 border-coral-100",
    badgeText: "text-coral-800",
    badgeIcon: "text-coral-500",
    cta: "bg-coral-500 hover:bg-coral-600 shadow-coral-500/20",
    dotActive: "bg-coral-500",
  },
  teal: {
    badgeBg: "bg-teal-50 border-teal-100",
    badgeText: "text-teal-800",
    badgeIcon: "text-teal-600",
    cta: "bg-teal-600 hover:bg-teal-700 shadow-teal-600/20",
    dotActive: "bg-teal-600",
  },
} as const;

export function HeroSection() {
  const [index, setIndex] = useState(0);
  const slide = SLIDES[index];
  const t = THEME[slide.theme];

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % SLIDES.length);
    }, AUTO_ROTATE_MS);
    return () => clearInterval(timer);
  }, []);

  const Dots = ({ className = "" }: { className?: string }) => (
    <div className={`flex items-center gap-1.5 ${className}`}>
      {SLIDES.map((s, i) => (
        <button
          key={s.id}
          onClick={() => setIndex(i)}
          aria-label={`Voir : ${s.badge}`}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            i === index ? `w-6 ${t.dotActive}` : "w-1.5 bg-gray-300"
          }`}
        />
      ))}
    </div>
  );

  return (
    <section className="relative w-full overflow-hidden bg-[#F1EFE8]">
      {/* ============ MOBILE : image en bloc + carte qui chevauche le bas ============ */}
      <div className="md:hidden">
        <div className="relative w-full h-[380px] overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                fill
                priority
                sizes="100vw"
                className={`object-cover ${slide.imagePosition}`}
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-10 -mt-14 px-4 pb-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl shadow-gray-900/10 text-center"
            >
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-4 ${t.badgeBg}`}>
                <slide.badgeIcon size={14} className={t.badgeIcon} />
                <span className={`text-xs font-bold tracking-wide uppercase ${t.badgeText}`}>
                  {slide.badge}
                </span>
              </div>

              <h1 className="text-2xl font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-3">
                {slide.h1}
              </h1>

              <p className="text-[13px] text-gray-600 font-medium leading-relaxed mb-5">
                {slide.subtitle}
              </p>

              <Link
                href={slide.ctaHref}
                className={`inline-flex items-center justify-center gap-2.5 w-full px-6 py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all duration-200 active:scale-[0.98] mb-4 ${t.cta}`}
              >
                <span>{slide.ctaLabel}</span>
                <ArrowRight size={16} strokeWidth={2.5} />
              </Link>

              <Dots className="justify-center" />
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ============ DESKTOP : image plein fond + carte flottante ============ */}
      <div className="hidden md:flex relative min-h-[600px] items-center">
        <div className="absolute inset-0 z-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6 }}
              className="absolute inset-0"
            >
              <Image
                src={slide.image}
                alt={slide.imageAlt}
                fill
                priority
                sizes="100vw"
                className={`object-cover ${slide.imagePosition}`}
              />
              <div className="absolute inset-0 bg-black/5 pointer-events-none" />
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="relative z-20 max-w-7xl mx-auto px-8 lg:px-12 py-24 w-full">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="max-w-[460px] bg-white/95 backdrop-blur-md p-7 rounded-3xl border border-gray-100 shadow-xl shadow-gray-900/5"
            >
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border mb-5 ${t.badgeBg}`}>
                <slide.badgeIcon size={14} className={t.badgeIcon} />
                <span className={`text-xs font-bold tracking-wide uppercase ${t.badgeText}`}>
                  {slide.badge}
                </span>
              </div>

              <h1 className="text-3xl lg:text-[40px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-3">
                {slide.h1}
              </h1>

              <p className="text-sm text-gray-600 font-medium leading-relaxed mb-6">
                {slide.subtitle}
              </p>

              <div className="flex items-center gap-5">
                <Link
                  href={slide.ctaHref}
                  className={`inline-flex items-center justify-center gap-2.5 px-6 py-3.5 text-white font-extrabold text-sm rounded-2xl shadow-md transition-all duration-200 active:scale-[0.98] ${t.cta}`}
                >
                  <span>{slide.ctaLabel}</span>
                  <ArrowRight size={16} strokeWidth={2.5} />
                </Link>

                <Dots />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
