"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MapPin, Store, Star, ShieldCheck, Sparkles, Wallet, PackageCheck, Bike } from "lucide-react";

type TabKey = "acheter" | "vendre" | "livrer";

interface HeroTabConfig {
  key: TabKey;
  tabLabel: string;
  title: string;
  subtitle: string;
  ctaLabel: string;
  ctaHref: string;
  image: string;
  badges: { icon: any; value: string; label: string }[];
}

const HERO_TABS: HeroTabConfig[] = [
  {
    key: "acheter",
    tabLabel: "Acheter",
    title: "Trouvez vos pépites près de chez vous",
    subtitle: "Des milliers d'annonces vérifiées et des remises en main propre à Cotonou et Calavi.",
    ctaLabel: "Explorer les annonces",
    ctaHref: "/catalogue",
    image: "/images/hero/acheter-1.jpg",
    badges: [
      { icon: Store, value: "120+", label: "Articles en ligne" },
      { icon: Star, value: "4.8/5", label: "Note moyenne" },
      { icon: ShieldCheck, value: "100%", label: "Paiement direct" },
    ],
  },
  {
    key: "vendre",
    tabLabel: "Vendre",
    title: "Ouvrez votre boutique en 2 minutes",
    subtitle: "Publiez gratuitement vos articles et recevez vos paiements directement sur Mobile Money.",
    ctaLabel: "Créer ma boutique",
    ctaHref: "/devenir-vendeur",
    image: "/images/hero/vendre-1.jpg",
    badges: [
      { icon: Sparkles, value: "30+", label: "Boutiques actives" },
      { icon: Wallet, value: "Instant", label: "Mobile Money" },
      { icon: PackageCheck, value: "0 F", label: "Frais de création" },
    ],
  },
  {
    key: "livrer",
    tabLabel: "Livrer",
    title: "Livrez, gagnez, en toute liberté",
    subtitle: "Rejoignez nos livreurs partenaires et touchez votre gain à chaque course.",
    ctaLabel: "Devenir livreur",
    ctaHref: "/devenir-livreur",
    image: "/images/hero/livrer-1.jpg",
    badges: [
      { icon: Bike, value: "15+", label: "Livreurs actifs" },
      { icon: Wallet, value: "Instant", label: "Paiement par course" },
      { icon: MapPin, value: "Régional", label: "Cotonou & environs" },
    ],
  },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("acheter");
  const active = HERO_TABS.find((t) => t.key === activeTab)!;

  return (
    <section className="relative w-full h-[560px] md:h-[620px] overflow-hidden bg-gray-100">
      {/* --- PHOTO PLEINE LARGEUR EN FOND, PAR ONGLET --- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active.key}
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="absolute inset-0"
        >
          <Image
            src={active.image}
            alt={active.title}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center"
          />
        </motion.div>
      </AnimatePresence>

      {/* --- CARTE BLANCHE POSÉE SUR LA PHOTO, ANGLES DROITS --- */}
      <div className="relative z-10 h-full max-w-7xl mx-auto px-4 md:px-8 lg:px-12 flex items-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={active.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full max-w-md md:max-w-lg bg-white shadow-2xl p-6 md:p-8"
          >
            {/* Onglets — angles droits, pas de pilule */}
            <div className="inline-flex border border-gray-200 mb-5">
              {HERO_TABS.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-4 py-2 text-xs md:text-sm font-black transition-colors duration-200 cursor-pointer ${
                    activeTab === tab.key
                      ? "bg-coral-500 text-white"
                      : "bg-white text-gray-600 hover:text-gray-900"
                  }`}
                >
                  {tab.tabLabel}
                </button>
              ))}
            </div>

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-gray-900 tracking-tight leading-[1.15]">
              {active.title}
            </h1>

            <p className="text-sm text-gray-600 mt-3 leading-relaxed">
              {active.subtitle}
            </p>

            <div className="mt-5">
              <Link
                href={active.ctaHref}
                className="inline-flex items-center gap-2 px-5 py-3 bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-xs md:text-sm active:scale-[0.98] transition-all duration-200"
              >
                <span>{active.ctaLabel}</span>
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
            </div>

            {/* --- BADGES --- */}
            <div className="mt-5 pt-4 border-t border-gray-100 flex flex-wrap gap-x-5 gap-y-2">
              {active.badges.map((badge, i) => {
                const Icon = badge.icon;
                return (
                  <div key={i} className="flex items-center gap-2">
                    <Icon size={14} strokeWidth={2.2} className="text-coral-500 shrink-0" />
                    <div className="flex flex-col leading-tight">
                      <span className="text-xs font-black text-gray-900">{badge.value}</span>
                      <span className="text-[10px] text-gray-500 font-medium">{badge.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
