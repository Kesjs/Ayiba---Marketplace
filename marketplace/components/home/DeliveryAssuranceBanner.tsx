"use client";

import { useState } from "react";
import { ShieldCheck, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function DeliveryAssuranceBanner() {
  const [isVisible, setIsVisible] = useState(true);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, padding: 0 }}
          className="w-full bg-[#FAF9F6] border-b border-gray-200/70 px-3 sm:px-4 py-2 flex justify-center"
        >
          <div className="relative flex items-center justify-between sm:justify-center gap-2 max-w-4xl w-full text-xs font-medium text-gray-700">
            <div className="flex items-center gap-2 flex-1 pr-6 sm:pr-0 sm:justify-center">
              <div className="inline-flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/80 shrink-0 font-bold text-[11px]">
                <ShieldCheck size={13} />
                <span>Garantie</span>
              </div>
              <p className="leading-snug text-left sm:text-center text-[11.5px] sm:text-xs text-gray-700">
                <span className="font-bold text-gray-900">Livraison en toute sérénité :</span> paiement sécurisé bloqué jusqu'à validation de votre colis.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="shrink-0 p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
              aria-label="Fermer"
            >
              <X size={14} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
