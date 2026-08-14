/**
 * Steps section for devenir-livreur page
 * Lazy-loaded via dynamic import to reduce main bundle
 */

"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

interface Step {
  readonly number: string;
  readonly illustration: string;
  readonly title: string;
  readonly desc: string;
  readonly icon: LucideIcon;
}

interface StepsSectionProps {
  steps: readonly Step[];
}

export function StepsSection({ steps }: StepsSectionProps) {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-600">
            Devenez livreur en 3 étapes simples et sécurisées
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.15, duration: 0.6 }}
                viewport={{ once: true }}
                className="relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Numéro */}
                <div className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-teal-600">{step.number}</span>
                </div>

                {/* Illustration */}
                <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-8 mt-4">
                  <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-40" />
                  <img
                    src={step.illustration}
                    alt={step.title}
                    className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Icone + titre */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-teal-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">{step.title}</h3>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
