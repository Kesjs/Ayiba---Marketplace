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
      label: "Vendre mes articles",
      sublabel: "Faites du tri & gagnez de l'argent",
      href: "/devenir-vendeur",
      icon: Store,
      badgeText: "Vendeur",
      badgeColor: "bg-coral-50 text-coral-600 border-coral-200",
      btnBg: "bg-coral-500 hover:bg-coral-600 text-white shadow-coral-500/25",
    },
    {
      role: "livreur",
      label: "Devenir Livreur",
      sublabel: "Effectuez des courses & gagnez des revenus",
      href: "/devenir-livreur",
      icon: Bike,
      badgeText: "Livreur",
      badgeColor: "bg-teal-50 text-teal-700 border-teal-200",
      btnBg: "bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/25",
    },
  ];

  // Rotation automatique du CTA toutes les 3.5 secondes
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
      <section className="relative overflow-hidden pt-4 pb-8 md:py-12 bg-gradient-to-b from-coral-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          {/* Conteneur Hero Banner avec visuel d'arrière-plan */}
          <div className="relative rounded-[32px] md:rounded-[40px] overflow-hidden min-h-[460px] md:min-h-[520px] flex items-center p-6 md:p-12 lg:p-14 border border-gray-100 shadow-xl shadow-gray-200/50">
            
            {/* Visuel Arrière-plan Lifestyle */}
            <div className="absolute inset-0 z-0">
              <img
                src="/images/hero-illustration.png"
                alt="Ayiba Marketplace Hero"
                className="w-full h-full object-cover object-center md:object-right opacity-85 md:opacity-100 scale-105 transition-transform duration-1000 hover:scale-100"
              />
              {/* Masque dégradé pour lisibilité parfaite sur mobile & desktop */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 md:via-white/80 to-transparent z-10" />
            </div>

            {/* Carte Flottante Vinted-Style (Glassmorphism) */}
            <div className="relative z-20 w-full max-w-lg lg:max-w-xl bg-white/90 backdrop-blur-xl border border-white/80 rounded-[28px] md:rounded-[36px] p-6 md:p-8 shadow-2xl shadow-gray-900/10">
              
              {/* Badge d'en-tête */}
              <div className="flex items-center gap-2 mb-3">
                <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-coral-50 text-coral-600 border border-coral-100/80 flex items-center gap-1.5 shadow-xs">
                  <Sparkles size={13} className="text-coral-500 animate-pulse" />
                  100% Béninoise & Sécurisée
                </span>
              </div>

              {/* Titre Principal */}
              <h1 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight leading-[1.15]">
                Prêt à faire du tri ou à dénicher des pépites ?
              </h1>

              {/* Sous-titre */}
              <p className="text-xs md:text-sm text-gray-600 mt-2.5 leading-relaxed font-medium">
                Vendez vos articles en quelques clics, ou gagnez des revenus en effectuant des livraisons en toute simplicité.
              </p>

              {/* Zone CTA Principale : Bouton Animé Rotatif */}
              <div className="mt-6 flex flex-col gap-3">
                <div className="relative overflow-hidden rounded-2xl">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentCta.role}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      transition={{ duration: 0.35, ease: "easeOut" }}
                    >
                      <Link
                        href={currentCta.href}
                        className={`w-full py-4 px-6 rounded-2xl font-extrabold text-sm md:text-base flex items-center justify-between shadow-lg transition-all duration-300 active:scale-[0.98] ${currentCta.btnBg}`}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
                            <CurrentIcon size={22} />
                          </div>
                          <div className="text-left min-w-0">
                            <p className="font-extrabold truncate">{currentCta.label}</p>
                            <p className="text-[11px] font-medium opacity-90 truncate">{currentCta.sublabel}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="hidden sm:inline-block text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                            {currentCta.badgeText}
                          </span>
                          <ArrowRight size={18} strokeWidth={2.5} />
                        </div>
                      </Link>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Sélecteurs directs rapides Vendeur / Livreur (pour ne pas attendre l'animation) */}
                <div className="flex items-center gap-2 justify-between px-1">
                  <span className="text-[11px] text-gray-400 font-semibold">Accès direct :</span>
                  <div className="flex items-center gap-2">
                    <Link
                      href="/devenir-vendeur"
                      className="text-xs font-bold text-coral-600 hover:text-coral-700 bg-coral-50/80 hover:bg-coral-50 px-3 py-1.5 rounded-xl border border-coral-100 transition-colors flex items-center gap-1.5"
                    >
                      <Store size={14} />
                      <span>Vendre</span>
                    </Link>
                    <Link
                      href="/devenir-livreur"
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 bg-teal-50/80 hover:bg-teal-50 px-3 py-1.5 rounded-xl border border-teal-100 transition-colors flex items-center gap-1.5"
                    >
                      <Bike size={14} />
                      <span>Livrer</span>
                    </Link>
                  </div>
                </div>

                {/* Bouton Secondaire "Comment ça marche ?" */}
                <button
                  onClick={() => setIsHowItWorksOpen(true)}
                  className="w-full mt-1 py-3 px-5 rounded-2xl border border-gray-200 hover:border-gray-300 bg-white/80 hover:bg-white text-gray-700 hover:text-gray-900 font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all duration-200 shadow-xs cursor-pointer active:scale-[0.98]"
                >
                  <HelpCircle size={16} className="text-coral-500" />
                  <span>Comment ça marche ?</span>
                </button>
              </div>

              {/* Micro-puces de réassurance au bas de la carte */}
              <div className="mt-6 pt-5 border-t border-gray-100 grid grid-cols-3 gap-2">
                <div className="flex flex-col items-center text-center">
                  <Wallet size={16} className="text-amber-500 mb-1" />
                  <span className="text-[10px] font-bold text-gray-800 leading-tight">Paiement Sécurisé</span>
                  <span className="text-[9px] text-gray-400">Escrow garanti</span>
                </div>
                <div className="flex flex-col items-center text-center border-x border-gray-100 px-1">
                  <QrCode size={16} className="text-coral-500 mb-1" />
                  <span className="text-[10px] font-bold text-gray-800 leading-tight">Code Secret</span>
                  <span className="text-[9px] text-gray-400">À la remise</span>
                </div>
                <div className="flex flex-col items-center text-center">
                  <ShieldCheck size={16} className="text-teal-600 mb-1" />
                  <span className="text-[10px] font-bold text-gray-800 leading-tight">Vendeurs Vérifiés</span>
                  <span className="text-[9px] text-gray-400">Confiance 100%</span>
                </div>
              </div>

            </div>

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
