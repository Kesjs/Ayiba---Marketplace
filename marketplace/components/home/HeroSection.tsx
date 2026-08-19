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
  // dans /public/images/hero/ (garde les mêmes noms ou change-les ici)
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
        {/* --- TABS --- */}
        <div className="flex items-center gap-2 mb-6">
          {HERO_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                activeTab === tab.key
                  ? "bg-gray-900 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
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
                className="mt-6 inline-flex items-center gap-2.5 py-3.5 px-6 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-sm transition-all duration-200 active:scale-[0.98] shadow-lg shadow-coral-500/20"
              >
                <span>{active.ctaLabel}</span>
                <ArrowRight size={18} strokeWidth={2.5} />
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

          {/* --- CLUSTER DE 3 IMAGES EN ÉVENTAIL --- */}
          <div className="relative hidden md:flex items-center justify-center h-[300px]">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="relative w-full h-full flex items-center justify-center"
              >
                {/* Image gauche */}
                <motion.div
                  initial={{ rotate: -6, x: 0 }}
                  animate={{ rotate: -12, x: -140 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute w-40 h-52 md:w-44 md:h-60 rounded-2xl overflow-hidden shadow-xl"
                  style={{ zIndex: 1 }}
                >
                  <Image
                    src={active.images[0]}
                    alt="Image 1"
                    fill
                    priority
                    sizes="(max-width: 768px) 160px, 176px"
                    className="object-cover"
                  />
                </motion.div>

                {/* Image centrale (au-dessus) */}
                <motion.div
                  initial={{ rotate: 0, y: 10 }}
                  animate={{ rotate: 0, y: -10 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="relative w-44 h-56 md:w-48 md:h-64 rounded-2xl overflow-hidden shadow-2xl"
                  style={{ zIndex: 3 }}
                >
                  <Image
                    src={active.images[1]}
                    alt="Image 2"
                    fill
                    priority
                    sizes="(max-width: 768px) 176px, 192px"
                    className="object-cover"
                  />
                </motion.div>

                {/* Image droite */}
                <motion.div
                  initial={{ rotate: 6, x: 0 }}
                  animate={{ rotate: 12, x: 140 }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                  className="absolute w-40 h-52 md:w-44 md:h-60 rounded-2xl overflow-hidden shadow-xl"
                  style={{ zIndex: 2 }}
                >
                  <Image
                    src={active.images[2]}
                    alt="Image 3"
                    fill
                    priority
                    sizes="(max-width: 768px) 160px, 176px"
                    className="object-cover"
                  />
                </motion.div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
