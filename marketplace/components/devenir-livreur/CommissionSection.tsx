/**
 * Commission section for devenir-livreur page
 * Lazy-loaded via dynamic import to reduce main bundle
 */

"use client";

import { motion } from "framer-motion";
import { Wallet, ShieldCheck, CheckCircle } from "lucide-react";

export function CommissionSection() {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50 border-y border-gray-100">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
            Une rémunération transparente
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Gagnez jusqu'à 95% de chaque course. Votre travail, votre revenu.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card 1 - Vous gagnez */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-200 rounded-2xl p-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                <Wallet className="w-6 h-6 text-teal-600" strokeWidth={2} />
              </div>
              <div>
                <p className="text-5xl font-medium text-teal-600 mb-2">95%</p>
                <p className="text-sm font-medium text-gray-900 mb-1">Vous gagnez</p>
                <p className="text-xs text-gray-500">Par course livrée</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Paiement instantané sur Mobile Money</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Retrait disponible immédiatement</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Zéro frais cachés</span>
              </li>
            </ul>
          </motion.div>

          {/* Card 2 - Frais Ayiba */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="bg-white border border-gray-200 rounded-2xl p-8"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gray-100 border border-gray-200 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-6 h-6 text-gray-500" strokeWidth={2} />
              </div>
              <div>
                <p className="text-5xl font-medium text-gray-700 mb-2">5%</p>
                <p className="text-sm font-medium text-gray-900 mb-1">Frais Ayiba</p>
                <p className="text-xs text-gray-500">Commission plateforme</p>
              </div>
            </div>

            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Sécurité des transactions</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Application mobile et support</span>
              </li>
              <li className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" strokeWidth={2} />
                <span className="text-sm text-gray-700">Système OTP et tracking GPS</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Trust badge */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          viewport={{ once: true }}
          className="mt-8 flex items-center justify-center gap-3 p-4 bg-teal-50 border border-teal-100 rounded-xl max-w-md mx-auto"
        >
          <ShieldCheck className="w-5 h-5 text-teal-600" strokeWidth={2} />
          <p className="text-sm font-medium text-teal-900">
            Paiements garantis et sécurisés via Mobile Money
          </p>
        </motion.div>
      </div>
    </section>
  );
}
