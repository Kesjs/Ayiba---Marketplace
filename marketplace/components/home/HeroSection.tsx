"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Store, Bike, ShieldCheck, ArrowRight, Sparkles, HelpCircle, Wallet, QrCode } from "lucide-react";
import { HowItWorksModal } from "@/components/modals/HowItWorksModal";

export function HeroSection() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);
  const [activeCtaIndex, setActiveCtaIndex] = useState(0);

  const ctaItems = [
    {
      role: "vendeur",
      label: "Vendre sur Ayiba",
      sublabel: "Publiez vos articles gratuitement & gagnez des revenus",
      href: "/devenir-vendeur",
      icon: Store,
      badgeText: "Boutique",
      btnBg: "bg-coral-500 hover:bg-coral-600 text-white shadow-xl shadow-coral-500/30",
    },
    {
      role: "livreur",
      label: "Devenir Livreur",
      sublabel: "Faites des courses à Cotonou & Calavi en toute liberté",
      href: "/devenir-livreur",
      icon: Bike,
      badgeText: "Livraison",
      btnBg: "bg-teal-500 hover:bg-teal-600 text-white shadow-xl shadow-teal-500/30",
    },
  ];

  // Rotation automatique du CTA principal toutes les 3.5 secondes
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveCtaIndex((prev) => (prev + 1) % ctaItems.length);
    }, 3500);
    return () => clearInterval(timer);
  }, [ctaItems.length]);

  const currentCta = ctaItems[activeCtaIndex];
  const CurrentIcon = currentCta.icon;

  return (
    <>
      <section className="relative w-full overflow-hidden min-h-[540px] md:min-h-[620px] flex items-center bg-gray-900 text-white">
        {/* --- Image d'Arrière-Plan Africaine Fraîche & Pleine Largeur --- */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-bg.jpg"
            alt="Ayiba Marketplace Africa"
            className="w-full h-full object-cover object-center scale-105 transition-transform duration-1000"
          />
          {/* Overlay élégant : Dégradé sombre directionnel pour lisibilité parfaite sans surcharger */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/65 to-black/40 z-10" />
          <div className="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-10" />
        </div>

        {/* --- Contenu Texte & Boutons au-dessus --- */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full py-12 md:py-16">
          <div className="max-w-2xl">
            
            {/* Badge d'en-tête lumineux */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-white mb-4 shadow-lg"
            >
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>La Marketplace 100% Locale & Sécurisée</span>
            </motion.div>

            {/* Titre Principal Épuré & Puissant */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]"
            >
              Achetez, vendez et livreurs locaux en <span className="text-transparent bg-clip-text bg-gradient-to-r from-coral-400 via-amber-300 to-teal-300">toute confiance.</span>
            </motion.h1>

            {/* Sous-titre Aéré */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-gray-200 mt-4 leading-relaxed font-medium max-w-xl"
            >
              Faites du tri dans vos placards, trouvez des pépites uniques ou rejoignez notre flotte de livraison à Cotonou, Calavi et environs.
            </motion.p>

            {/* Zone CTA Principale & Bouton "Comment ça marche ?" */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"
            >
              {/* Bouton CTA Principal Rotatif Animé */}
              <div className="relative overflow-hidden rounded-2xl min-w-[280px]">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCta.role}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  >
                    <Link
                      href={currentCta.href}
                      className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm md:text-base flex items-center justify-between transition-all duration-300 active:scale-[0.98] ${currentCta.btnBg}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shrink-0">
                          <CurrentIcon size={22} />
                        </div>
                        <div className="text-left">
                          <p className="font-extrabold leading-tight">{currentCta.label}</p>
                          <p className="text-[10px] opacity-90 font-medium">{currentCta.badgeText}</p>
                        </div>
                      </div>
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </Link>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Bouton Secondaire "Comment ça marche ?" */}
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-bold text-sm flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <HelpCircle size={18} className="text-amber-400" />
                <span>Comment ça marche ?</span>
              </button>
            </motion.div>

            {/* Raccourcis d'accès direct rapide Vendeur / Livreur */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-4 flex items-center gap-3 text-xs text-gray-300"
            >
              <span className="font-medium">Direct :</span>
              <Link
                href="/devenir-vendeur"
                className="font-bold text-coral-300 hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
              >
                <Store size={13} />
                <span>Créer ma boutique</span>
              </Link>
              <span>•</span>
              <Link
                href="/devenir-livreur"
                className="font-bold text-teal-300 hover:text-white underline underline-offset-4 flex items-center gap-1 transition-colors"
              >
                <Bike size={13} />
                <span>Postuler comme livreur</span>
              </Link>
            </motion.div>

            {/* --- Bandeau Puces de Réassurance Translucides --- */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-10 pt-6 border-t border-white/15 grid grid-cols-3 gap-4 max-w-xl"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                  <Wallet size={16} className="text-amber-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Paiement Escrow</p>
                  <p className="text-[10px] text-gray-300">100% Sécurisé</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                  <QrCode size={16} className="text-coral-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Code Secret</p>
                  <p className="text-[10px] text-gray-300">À la livraison</p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-md border border-white/15 flex items-center justify-center shrink-0">
                  <ShieldCheck size={16} className="text-teal-400" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white leading-tight">Vendeurs Vérifiés</p>
                  <p className="text-[10px] text-gray-300">Confiance locale</p>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Modal interactif Comment ça marche ? */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </>
  );
}
