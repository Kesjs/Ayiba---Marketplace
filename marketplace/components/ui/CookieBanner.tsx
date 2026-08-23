"use client";

import { useState, useEffect } from "react";
import { Cookie, X, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUiChrome } from "@/context/UiChromeContext";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const { hideBottomNav } = useUiChrome();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("ayiba_cookie_consent");
      if (!consent) {
        const timer = setTimeout(() => setVisible(true), 600);
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
        initial={{ y: 80, opacity: 0, scale: 0.95 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 80, opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={`fixed left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-t border-gray-200/90 shadow-2xl rounded-t-2xl p-5 md:left-4 md:right-4 md:max-w-3xl md:mx-auto md:border md:rounded-3xl md:p-6 transition-all duration-300 ${
          hideBottomNav ? "bottom-0 md:bottom-4" : "bottom-20 lg:bottom-6"
        }`}
        aria-label="Bandeau d'information sur les cookies"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 md:gap-6">
          {/* Section Texte + Icône */}
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-12 h-12 rounded-2xl bg-coral-50 text-coral-500 border border-coral-100/60 flex items-center justify-center shrink-0 shadow-xs">
              <Cookie size={24} />
            </div>
            <div className="text-left min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm md:text-base font-black text-gray-900">
                  Respect de votre vie privée
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-teal-50 text-teal-700 border border-teal-100 px-2 py-0.5 rounded-full">
                  <ShieldCheck size={11} /> 100% Sécurisé
                </span>
              </div>
              <p className="text-xs md:text-sm text-gray-600 font-medium leading-relaxed">
                Ayiba utilise des cookies essentiels pour sécuriser vos paiements Mobile Money, maintenir votre panier et enregistrer vos préférences.{" "}
                <Link
                  href="/privacy"
                  className="font-bold text-coral-600 hover:underline underline-offset-2"
                >
                  Politique de confidentialité
                </Link>
              </p>
            </div>
          </div>

          {/* Section Boutons d'action */}
          <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100">
            <button
              onClick={handleClose}
              className="px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors whitespace-nowrap"
            >
              Plus tard
            </button>
            <button
              onClick={handleAccept}
              className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-coral-500 hover:bg-coral-600 active:scale-98 text-white font-black text-xs sm:text-sm shadow-lg shadow-coral-500/25 transition-all duration-200 text-center whitespace-nowrap"
            >
              J'accepte
            </button>
            <button
              onClick={handleClose}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors hidden md:block"
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </motion.aside>
    </AnimatePresence>
  );
}
