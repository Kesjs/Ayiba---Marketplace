"use client";

import { useState } from "react";
import { ShieldCheck, QrCode, X } from "lucide-react";
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
          className="w-full bg-[#FAF9F6] border-b border-gray-200/70 px-4 py-2 flex justify-center"
        >
          <div className="relative flex items-center justify-center gap-2.5 max-w-4xl w-full text-center text-xs font-medium text-gray-700 pr-8">
            <div className="flex items-center gap-1 text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100/80 shrink-0 font-bold">
              <ShieldCheck size={13} />
              <span>Garantie</span>
            </div>
            <p className="leading-snug truncate sm:whitespace-normal">
              <span className="font-semibold text-gray-900">Livraison en toute sérénité :</span> paiement sécurisé bloqué jusqu'à validation de votre colis.
            </p>
            <button
              type="button"
              onClick={() => setIsVisible(false)}
              className="absolute right-0 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-700 rounded-md transition-colors"
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
