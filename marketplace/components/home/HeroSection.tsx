"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function HeroSection() {
  return (
    <section className="relative w-full min-h-[540px] md:min-h-[600px] overflow-hidden bg-[#F1EFE8] flex items-center">
      {/* Background Subtle Gradient Overlay (Désactivé selon demande) */}
      {/* <div className="absolute inset-0 bg-gradient-to-r from-[#F1EFE8] via-[#F1EFE8]/90 to-transparent z-10 w-full md:w-3/4 pointer-events-none" /> */}

      {/* Hero Visual Image */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/hero/hero-artisan.webp"
          alt="Artisanat et création locale au Bénin"
          fill
          priority
          sizes="100vw"
          className="object-cover object-[75%_center] md:object-[85%_center]"
          onError={(e) => {
            // Fallback si l'image n'est pas encore présente
            (e.currentTarget as HTMLElement).style.display = 'none';
          }}
        />
        {/* Léger Overlay (Très discret) */}
        <div className="absolute inset-0 bg-black/5 pointer-events-none" />
      </div>

      {/* Hero Content Container */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-16 md:py-24 w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-[460px] bg-white/95 backdrop-blur-md p-6 sm:p-7 rounded-3xl border border-gray-100 shadow-xl shadow-gray-900/5"
        >
          {/* Badge Chaleureux */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-coral-50 border border-coral-100 mb-5">
            <Sparkles size={14} className="text-coral-500" />
            <span className="text-xs font-bold text-coral-800 tracking-wide uppercase">
              Marché Local & Artisanal Béninois
            </span>
          </div>

          {/* Titre Principal Éditorial */}
          <h1 className="text-3xl sm:text-4xl lg:text-[40px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-3">
            Trouvez des pépites uniques créées près de chez vous.
          </h1>

          {/* Sous-titre */}
          <p className="text-[13px] sm:text-sm text-gray-600 font-medium leading-relaxed mb-6">
            Mode, décoration, gadgets et créations locales à Cotonou, Calavi et Porto-Novo. Achetez directement auprès de créateurs et vendeurs locaux vérifiés.
          </p>

          {/* CTA Principal & Secondaire */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <Link
              href="/catalogue"
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-coral-500 hover:bg-coral-600 active:scale-[0.98] text-white font-extrabold text-sm rounded-2xl shadow-md shadow-coral-500/20 transition-all duration-200"
            >
              <span>Explorer le catalogue</span>
              <ArrowRight size={16} strokeWidth={2.5} />
            </Link>

            <Link
              href="#pour-vous"
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 bg-gray-50 hover:bg-gray-100 text-gray-800 font-bold text-sm rounded-2xl border border-gray-200/70 transition-all duration-200"
            >
              <span>Voir les tendances</span>
            </Link>
          </div>

        </motion.div>
      </div>
    </section>
  );
}
