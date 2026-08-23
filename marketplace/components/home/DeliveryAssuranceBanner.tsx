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
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, height: 0, padding: 0 }}
          className="w-full bg-white px-4 pt-4 pb-2 flex justify-center overflow-hidden"
        >
          <div className="relative bg-[#F7F6F2] border border-gray-200/60 shadow-sm rounded-2xl p-4 pr-12 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 max-w-4xl w-full text-center sm:text-left">
            <div className="flex items-center gap-2 text-gray-700 bg-white p-2 rounded-xl shrink-0 shadow-xs">
              <ShieldCheck size={20} className="text-gray-700" />
              <QrCode size={20} className="text-gray-700" />
            </div>
            <p className="text-sm font-medium text-gray-800 leading-snug">
              <span className="font-bold">Faites-vous livrer en toute sérénité :</span> votre paiement est bloqué jusqu'à ce que vous validiez la réception avec votre code secret ou QR code.
            </p>
            <button
              onClick={() => setIsVisible(false)}
              className="absolute top-1/2 -translate-y-1/2 right-3 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-200/50 rounded-full transition-colors"
              aria-label="Fermer"
            >
              <X size={16} strokeWidth={2.5} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
