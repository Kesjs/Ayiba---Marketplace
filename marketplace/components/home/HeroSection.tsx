"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, LucideIcon, Store, ShieldCheck, Star, Bike, Wallet, MapPin, PackageCheck, Sparkles } from "lucide-react";

// ============================================
// CONFIG PAR TAB — texte, CTA, images, badges
// ============================================

type TabKey = "acheter" | "vendre" | "livrer";

interface TrustBadge {
  icon: LucideIcon;
  value: string;
  label: string;
}

interface HeroTabConfig {
  key: TabKey;
  tabLabel: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  // 3 images en éventail à droite — remplace ces chemins par tes propres visuels
  images: [string, string, string];
  badges: [TrustBadge, TrustBadge, TrustBadge];
}

const HERO_TABS: HeroTabConfig[] = [
  {
    key: "acheter",
    tabLabel: "Acheter",
    title: "Trouvez vos pépites près de chez vous",
    subtitle: "Des vendeurs vérifiés à Cotonou et Abomey-Calavi.",
    ctaLabel: "Découvrir la marketplace",
    ctaHref: "/catalogue",
    images: [
      "/images/hero/acheter-1.jpg",
      "/images/hero/acheter-2.jpg",
      "/images/hero/acheter-3.jpg",
    ],
    badges: [
      { icon: Store, value: "120+", label: "Articles en ligne" },
      { icon: Star, value: "4.8/5", label: "Note moyenne" },
      { icon: ShieldCheck, value: "100%", label: "Paiement sécurisé" },
    ],
  },
  {
    key: "vendre",
    tabLabel: "Vendre",
    title: "Ouvrez votre boutique en quelques clics",
    subtitle: "Publiez vos articles et recevez vos paiements en toute sécurité.",
    ctaLabel: "Vendre mes articles",
    ctaHref: "/devenir-vendeur",
    images: [
      "/images/hero/vendre-1.jpg",
      "/images/hero/vendre-2.jpg",
      "/images/hero/vendre-3.jpg",
    ],
    badges: [
      { icon: Sparkles, value: "30+", label: "Vendeurs actifs" },
      { icon: Wallet, value: "24h", label: "Paiement rapide" },
      { icon: PackageCheck, value: "5 min", label: "Mise en ligne" },
    ],
  },
  {
    key: "livrer",
    tabLabel: "Livrer",
    title: "Livrez, gagnez, en toute liberté",
    subtitle: "Rejoignez nos livreurs et touchez votre gain à chaque course.",
    ctaLabel: "Devenir livreur",
    ctaHref: "/devenir-livreur",
    images: [
      "/images/hero/livrer-1.jpg",
      "/images/hero/livrer-2.jpg",
      "/images/hero/livrer-3.jpg",
    ],
    badges: [
      { icon: Bike, value: "15+", label: "Livreurs actifs" },
      { icon: Wallet, value: "Instant", label: "Paiement par course" },
      { icon: MapPin, value: "Régional", label: "Ville et alentours" },
    ],
  },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("acheter");
  const active = HERO_TABS.find((t) => t.key === activeTab)!;

  return (
    <section className="relative w-full bg-[#F8F9FA] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-10">
        {/* --- TABS ANIMEES --- */}
        <div className="inline-flex p-1 bg-gray-200/80 rounded-full gap-1 mb-6 relative">
          {HERO_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 rounded-full text-sm font-extrabold transition-colors duration-200 z-10 ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="hero-tab-active-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-gray-900 rounded-full z-[-1] shadow-sm"
                />
              )}
              {tab.tabLabel}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center min-h-[280px] md:min-h-[320px]">
          {/* --- COLONNE TEXTE --- */}
          <AnimatePresence mode="wait">
            <motion.div
              key={active.key}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight leading-[1.15]">
                {active.title}
              </h1>

              <p className="text-sm md:text-base text-gray-600 mt-3 leading-relaxed">
                {active.subtitle}
              </p>

              <Link
                href={active.ctaHref}
                className="group relative mt-6 inline-flex items-center gap-3 py-3.5 px-7 rounded-2xl bg-white hover:bg-coral-500 border-2 border-coral-500 font-black text-sm text-coral-600 shadow-md shadow-coral-500/10 hover:shadow-xl hover:shadow-coral-500/25 active:scale-[0.98] overflow-hidden transition-all duration-200 ring-2 ring-coral-500/20 ring-offset-2 ring-offset-white"
              >
                {/* Couche Vague Liquide animée — 100% invisible et inactive hors survol pour une lisibilité parfaite */}
                <div className="absolute left-1/2 bottom-0 translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 w-[220%] h-[320%] bg-gradient-to-tr from-coral-700 via-coral-600 to-coral-500 rounded-[38%] group-hover:animate-liquid-spin transition-all duration-300 ease-out pointer-events-none z-0" />

                {/* Texte et flèche : lisibilité maximale en mode repos (corail sur blanc) et survol (blanc sur corail) */}
                <span className="relative z-10 font-black text-coral-600 group-hover:text-white transition-colors duration-200">
                  {active.ctaLabel}
                </span>
                <ArrowRight
                  size={18}
                  strokeWidth={2.5}
                  className="relative z-10 text-coral-500 group-hover:text-white group-hover:translate-x-1 transition-all duration-200"
                />
              </Link>

              {/* --- 3 BADGES DE CONFIANCE (varient selon le tab) --- */}
              <div className="mt-8 grid grid-cols-3 gap-3 max-w-md">
                {active.badges.map((badge, i) => {
                  const Icon = badge.icon;
                  return (
                    <div key={i} className="flex flex-col gap-1">
                      <Icon size={18} className="text-coral-400" strokeWidth={2} />
                      <span className="text-sm md:text-base font-black text-gray-900 leading-none">
                        {badge.value}
                      </span>
                      <span className="text-[11px] text-gray-500 font-medium leading-tight">
                        {badge.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </AnimatePresence>

          {/* --- CLUSTER DE 3 IMAGES EN ÉVENTAIL ANIME ET FLOTTANT --- */}
          <div className="relative hidden md:flex items-center justify-center h-[320px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* Halo lumineux d'arrière-plan */}
                <div className="absolute w-72 h-72 bg-gradient-to-tr from-coral-400/20 via-amber-300/20 to-teal-400/20 rounded-full blur-3xl -z-10 animate-pulse pointer-events-none" />

                {/* Image gauche */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotate: 0, x: 0, y: 30 }}
                  animate={{ opacity: 1, scale: 1, rotate: -12, x: -140, y: 0 }}
                  whileHover={{ scale: 1.08, rotate: -4, y: -12, zIndex: 10 }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.05 },
                    scale: { duration: 0.5, delay: 0.05, type: "spring", stiffness: 260, damping: 22 },
                    rotate: { duration: 0.5, delay: 0.05, type: "spring", stiffness: 260, damping: 22 },
                    x: { duration: 0.5, delay: 0.05, type: "spring", stiffness: 260, damping: 22 },
                    y: { duration: 0.5, delay: 0.05, type: "spring", stiffness: 260, damping: 22 },
                  }}
                  className="absolute w-40 h-52 md:w-44 md:h-60 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-stone-100 cursor-pointer"
                  style={{ zIndex: 1 }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.2, ease: "easeInOut", delay: 0.5 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={active.images[0]}
                      alt="Image 1"
                      fill
                      priority
                      sizes="(max-width: 768px) 160px, 176px"
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </motion.div>
                </motion.div>

                {/* Image centrale (au-dessus) */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotate: 0, y: 40 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0, y: -10 }}
                  whileHover={{ scale: 1.08, y: -20, zIndex: 10 }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.15 },
                    scale: { duration: 0.5, delay: 0.15, type: "spring", stiffness: 260, damping: 22 },
                    y: { duration: 0.5, delay: 0.15, type: "spring", stiffness: 260, damping: 22 },
                  }}
                  className="relative w-44 h-56 md:w-48 md:h-64 rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-stone-100 cursor-pointer"
                  style={{ zIndex: 3 }}
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut", delay: 0.7 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={active.images[1]}
                      alt="Image 2"
                      fill
                      priority
                      sizes="(max-width: 768px) 176px, 192px"
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </motion.div>
                </motion.div>

                {/* Image droite */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.7, rotate: 0, x: 0, y: 30 }}
                  animate={{ opacity: 1, scale: 1, rotate: 12, x: 140, y: 0 }}
                  whileHover={{ scale: 1.08, rotate: 4, y: -12, zIndex: 10 }}
                  transition={{
                    opacity: { duration: 0.5, delay: 0.25 },
                    scale: { duration: 0.5, delay: 0.25, type: "spring", stiffness: 260, damping: 22 },
                    rotate: { duration: 0.5, delay: 0.25, type: "spring", stiffness: 260, damping: 22 },
                    x: { duration: 0.5, delay: 0.25, type: "spring", stiffness: 260, damping: 22 },
                    y: { duration: 0.5, delay: 0.25, type: "spring", stiffness: 260, damping: 22 },
                  }}
                  className="absolute w-40 h-52 md:w-44 md:h-60 rounded-3xl overflow-hidden shadow-xl border-4 border-white bg-stone-100 cursor-pointer"
                  style={{ zIndex: 2 }}
                >
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 4.5, ease: "easeInOut", delay: 0.9 }}
                    className="w-full h-full relative"
                  >
                    <Image
                      src={active.images[2]}
                      alt="Image 3"
                      fill
                      priority
                      sizes="(max-width: 768px) 160px, 176px"
                      className="object-cover transition-transform duration-500 hover:scale-110"
                    />
                  </motion.div>
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
