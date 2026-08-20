"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Search, MapPin, Store, Star, ShieldCheck, Sparkles, Wallet, PackageCheck, Bike } from "lucide-react";

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
    image: "/images/hero-illustration.png",
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
    image: "/images/hero-illustration.png",
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
    image: "/images/hero-illustration.png",
    badges: [
      { icon: Bike, value: "15+", label: "Livreurs actifs" },
      { icon: Wallet, value: "Instant", label: "Paiement par course" },
      { icon: MapPin, value: "Régional", label: "Cotonou & environs" },
    ],
  },
];

export function HeroSection() {
  const [activeTab, setActiveTab] = useState<TabKey>("acheter");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("Toutes les villes");
  const router = useRouter();

  const active = HERO_TABS.find((t) => t.key === activeTab)!;

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim() && selectedLocation === "Toutes les villes") {
      router.push("/catalogue");
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery.trim()) params.set("q", searchQuery.trim());
    if (selectedLocation !== "Toutes les villes") params.set("ville", selectedLocation);
    router.push(`/catalogue?${params.toString()}`);
  };

  return (
    <section className="relative w-full bg-[#FAF9F6] border-b border-gray-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {/* --- ONGLETS HERO STYLE CLASSIFIED TNC (ROBUSTES & NETS) --- */}
        <div className="inline-flex p-1 bg-gray-100/90 rounded-xl gap-1 mb-6 border border-gray-200/80">
          {HERO_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`relative px-5 py-2 rounded-lg text-xs md:text-sm font-black transition-colors duration-200 z-10 ${
                activeTab === tab.key
                  ? "text-white"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              {activeTab === tab.key && (
                <motion.div
                  layoutId="hero-tab-active-pill"
                  transition={{ type: "spring", stiffness: 450, damping: 32 }}
                  className="absolute inset-0 bg-coral-500 rounded-lg z-[-1] shadow-xs"
                />
              )}
              {tab.tabLabel}
            </button>
          ))}
        </div>

        <div className="grid md:grid-cols-12 gap-8 md:gap-12 items-center">
          {/* --- COLONNE CONTENU & RECHERCHE (7 cols) --- */}
          <div className="md:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
              >
                <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15]">
                  {active.title}
                </h1>

                <p className="text-sm md:text-base text-gray-600 mt-3 md:mt-4 leading-relaxed max-w-xl">
                  {active.subtitle}
                </p>

                {/* --- BARRE DE RECHERCHE INTÉGRÉE STYLE CLASSIFIED TNC (Uniquement sur l'onglet Acheter) --- */}
                {activeTab === "acheter" ? (
                  <form
                    onSubmit={handleHeroSearch}
                    className="mt-6 p-2 bg-white rounded-2xl border border-gray-200 shadow-lg shadow-gray-200/50 flex flex-col sm:flex-row items-stretch gap-2"
                  >
                    {/* Champ mot-clé */}
                    <div className="flex-1 flex items-center gap-2.5 px-3.5 py-2.5 bg-gray-50/70 rounded-xl border border-gray-100">
                      <Search size={18} className="text-coral-500 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Que cherchez-vous ? (iPhone, Sac, Robe...)"
                        className="w-full bg-transparent text-xs md:text-sm font-bold text-gray-900 placeholder:text-gray-400 outline-none"
                      />
                    </div>

                    {/* Sélecteur Ville / Commune */}
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50/70 rounded-xl border border-gray-100 shrink-0">
                      <MapPin size={16} className="text-gray-400 shrink-0" />
                      <select
                        value={selectedLocation}
                        onChange={(e) => setSelectedLocation(e.target.value)}
                        className="bg-transparent text-xs font-bold text-gray-700 outline-none cursor-pointer pr-1"
                      >
                        <option value="Toutes les villes">Toutes les villes</option>
                        <option value="Cotonou">Cotonou</option>
                        <option value="Abomey-Calavi">Abomey-Calavi</option>
                        <option value="Porto-Novo">Porto-Novo</option>
                        <option value="Parakou">Parakou</option>
                      </select>
                    </div>

                    {/* Bouton Lancer la recherche */}
                    <button
                      type="submit"
                      className="px-5 py-3 rounded-xl bg-coral-500 hover:bg-coral-600 active:scale-98 text-white font-black text-xs md:text-sm flex items-center justify-center gap-2 shadow-md shadow-coral-500/20 transition-all duration-200 whitespace-nowrap cursor-pointer"
                    >
                      <Search size={16} strokeWidth={2.5} />
                      <span>Chercher</span>
                    </button>
                  </form>
                ) : (
                  <div className="mt-6 md:mt-8 flex items-center gap-4">
                    <Link
                      href={active.ctaHref}
                      className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-xs md:text-sm shadow-md shadow-coral-500/20 active:scale-[0.98] transition-all duration-200"
                    >
                      <span>{active.ctaLabel}</span>
                      <ArrowRight size={16} strokeWidth={2.5} />
                    </Link>
                  </div>
                )}

                {/* --- BADGES SOBRES & SOIGNÉS EN BAS DU HERO --- */}
                <div className="mt-8 pt-6 border-t border-gray-200/60 grid grid-cols-3 gap-4 max-w-lg">
                  {active.badges.map((badge, i) => {
                    const Icon = badge.icon;
                    return (
                      <div key={i} className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-1.5 text-coral-600">
                          <Icon size={16} strokeWidth={2.2} />
                          <span className="text-sm md:text-base font-black text-gray-900 leading-none">
                            {badge.value}
                          </span>
                        </div>
                        <span className="text-[11px] text-gray-500 font-medium leading-tight">
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* --- BANNIÈRE IMAGE DE COUVERTURE DU HERO (5 cols) --- */}
          <div className="md:col-span-5 h-[280px] md:h-[360px] relative w-full rounded-2xl overflow-hidden border border-gray-200/80 bg-white shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={active.key}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ duration: 0.3 }}
                className="w-full h-full relative"
              >
                <Image
                  src={active.image}
                  alt={active.title}
                  fill
                  priority
                  sizes="(max-width: 768px) 100vw, 450px"
                  className="object-cover object-center"
                />
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
