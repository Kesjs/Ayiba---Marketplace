"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, HelpCircle, Sparkles } from "lucide-react";
import { HowItWorksModal } from "@/components/modals/HowItWorksModal";

export function HeroSection() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  return (
    <>
      <section className="relative w-full overflow-hidden min-h-[480px] sm:min-h-[540px] md:min-h-[600px] flex items-center bg-[#0d0d0f] text-white">
        
        {/* --- 100% FOND IMAGE PLEINE LARGEUR (EDGE-TO-EDGE) --- */}
        <div className="absolute inset-0 z-0">
          <img
            src="/images/hero-gold-cart.jpg"
            alt="Ayiba Shopping Chariot Doré"
            className="w-full h-full object-cover object-left-center md:object-center scale-100"
          />
          {/* Overlay très léger et progressif à droite pour lisibilité du texte sans assombrir la photo */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/50 to-transparent md:from-black/40 md:via-black/70 md:to-black/90 z-10" />
        </div>

        {/* --- CONTENU TEXTE POSÉ DIRECTEMENT SUR L'IMAGE (À DROITE) --- */}
        <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 w-full py-12 md:py-16 flex justify-center md:justify-end">
          <div className="max-w-xl text-left">
            
            {/* Badge discret */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-white/15 backdrop-blur-md border border-white/20 text-white mb-4 shadow-lg"
            >
              <Sparkles size={14} className="text-amber-400 animate-pulse" />
              <span>Marketplace Sécurisée au Bénin</span>
            </motion.div>

            {/* Titre Puissant sur l'image */}
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]"
            >
              Prêt à dénicher des <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF5A5F] via-amber-300 to-teal-300">pépites ?</span>
            </motion.h1>

            {/* Sous-titre aéré */}
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm md:text-base text-gray-200 mt-4 leading-relaxed font-medium"
            >
              Vendez vos trésors cachés en toute simplicité et rejoignez la 1ère communauté passionnée de mode et d'articles d'exception au Bénin.
            </motion.p>

            {/* BOUTONS D'ACTION SUR L'IMAGE */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5"
            >
              {/* Bouton CTA Principal Coral */}
              <Link
                href="/devenir-vendeur"
                className="py-4 px-7 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-extrabold text-sm md:text-base flex items-center justify-center gap-2.5 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-rose-900/30"
              >
                <span>Vendre mes articles</span>
                <ArrowRight size={18} strokeWidth={2.5} />
              </Link>

              {/* Bouton Secondaire Contour */}
              <button
                onClick={() => setIsHowItWorksOpen(true)}
                className="py-4 px-6 rounded-xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/30 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
              >
                <HelpCircle size={17} className="text-amber-400" />
                <span>Comment ça marche ?</span>
              </button>
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
