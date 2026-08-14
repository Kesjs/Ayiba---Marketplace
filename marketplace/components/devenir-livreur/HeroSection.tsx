/**
 * Hero section for devenir-livreur page
 * Lazy-loaded via dynamic import to reduce main bundle
 */

"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Bike } from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface Benefit {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface HeroSectionProps {
  benefits: Benefit[];
  onCTAClick: () => void;
}

export function HeroSection({ benefits, onCTAClick }: HeroSectionProps) {
  return (
    <section className="relative bg-gradient-to-br from-white via-teal-50/30 to-coral-50/20 border-b border-gray-100 py-20 md:py-28">
      <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex flex-col items-center text-center"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-2 mb-8">
            <Bike className="w-4 h-4 text-teal-600" strokeWidth={2} />
            <span className="text-sm font-medium text-teal-800">
              Devenir livreur partenaire
            </span>
          </div>

          {/* H1 */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.1] mb-6 tracking-tight max-w-3xl">
            Livrez votre quartier, gagnez en liberté
          </h1>

          {/* Subtexte */}
          <p className="text-lg md:text-xl text-gray-600 mb-10 leading-relaxed max-w-2xl">
            Rejoignez le réseau Ayiba et transformez votre disponibilité en opportunité. 95% de gains par course, paiement Mobile Money instantané.
          </p>

          {/* Boutons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-12">
            <Button
              variant="primary"
              onClick={onCTAClick}
              className="min-w-[200px] !bg-teal-600 hover:!bg-teal-700 !text-white !font-medium !shadow-lg hover:!shadow-xl"
            >
              Commencer maintenant
            </Button>
            <Button
              variant="secondary"
              className="min-w-[200px] !bg-white !border-2 !border-teal-600 !text-teal-600 hover:!bg-teal-50 !font-medium"
            >
              Comment ça marche
            </Button>
          </div>

          {/* Stats rapides */}
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12">
            {benefits.map((benefit, i) => {
              const Icon = benefit.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.1, duration: 0.5 }}
                  className="flex items-center gap-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-teal-600" strokeWidth={2} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{benefit.title}</p>
                    <p className="text-xs text-gray-500">{benefit.desc}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
