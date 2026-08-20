"use client";

import { useState, useEffect } from "react";
import { Cookie, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur a déjà fait son choix
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("ayiba_cookie_consent");
      if (!consent) {
        // Petit délai pour laisser la page se charger proprement
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ayiba_cookie_consent", "accepted");
    }
    setVisible(false);
  };

  const handleClose = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("ayiba_cookie_consent", "dismissed");
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.aside
        initial={{ y: "100%", opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: "100%", opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed bottom-0 left-0 right-0 w-full z-[100] bg-white border-t border-gray-200 shadow-lg"
        aria-label="Bandeau d'information sur les cookies"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-3.5 md:py-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
          {/* Section Texte + Icône */}
          <div className="flex items-start md:items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-coral-50 text-coral-500 flex items-center justify-center shrink-0 mt-0.5 md:mt-0 shadow-2xs">
              <Cookie size={19} />
            </div>
            <div className="text-left min-w-0">
              <p className="text-xs md:text-sm font-extrabold text-gray-900 flex items-center gap-1.5">
                <span>Respect de votre vie privée</span>
                <span className="text-[10px] font-semibold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hidden sm:inline">
                  Ayiba
                </span>
              </p>
              <p className="text-[11px] md:text-xs text-gray-500 font-medium leading-tight mt-0.5">
                Nous utilisons des cookies essentiels pour assurer le maintien de votre session et le fonctionnement du panier.{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-coral-600 hover:underline underline-offset-2 inline-block"
                >
                  En savoir plus
                </Link>
              </p>
            </div>
          </div>

          {/* Section Boutons d'action (Pleine largeur sur mobile) */}
          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 justify-end pt-1 md:pt-0 border-t md:border-t-0 border-gray-100">
            <button
              onClick={handleClose}
              className="px-3.5 py-2 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Plus tard
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 md:flex-initial px-5 py-2 rounded-xl bg-coral-500 hover:bg-coral-600 active:scale-95 text-white font-extrabold text-xs shadow-md shadow-coral-500/20 transition-all duration-200 text-center whitespace-nowrap"
            >
              J'accepte
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors md:flex hidden"
              aria-label="Fermer"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
