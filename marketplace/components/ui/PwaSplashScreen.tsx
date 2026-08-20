"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LogoAyiba from "@/components/ui/LogoAyiba";

export function PwaSplashScreen() {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Masque le splash screen après le chargement initial
    const timer = setTimeout(() => {
      setVisible(false);
    }, 650);

    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-6 select-none pointer-events-none"
        >
          <div className="flex flex-col items-center gap-5">
            {/* Vrai Logo Ayiba du Header du site avec animation d'apparition douce */}
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="relative flex items-center justify-center"
            >
              <LogoAyiba className="h-16 sm:h-20 w-auto" />
            </motion.div>

            {/* Tagline en noir (Marketplace de proximité) */}
            <motion.p
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="text-xs font-bold uppercase tracking-[0.2em] text-gray-900"
            >
              Marketplace de proximité
            </motion.p>

            {/* Indicateur de chargement discret */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="mt-2 flex items-center gap-1.5"
            >
              <div className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 rounded-full bg-coral-500 animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 rounded-full bg-coral-500 animate-bounce" />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
