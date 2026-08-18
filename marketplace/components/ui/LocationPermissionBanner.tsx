"use client";

import { useState, useEffect } from "react";
import { MapPin, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSmartGeolocation } from "@/lib/hooks/useSmartGeolocation";
import { useToast } from "@/context/ToastContext";

/**
 * Bannière custom de demande de géolocalisation.
 * Apparaît une seule fois (slide-in depuis le bas) — ne déclenche JAMAIS
 * la popup native du navigateur sans action de l'utilisateur.
 * Une fois acceptée ou refusée, elle ne réapparaît plus (localStorage).
 */
export function LocationPermissionBanner() {
  const [visible, setVisible] = useState(false);
  const { detectAndSave, dismissBanner, isBannerDismissed, loading } = useSmartGeolocation();
  const { showToast } = useToast();

  useEffect(() => {
    // Délai de 3s avant d'afficher pour ne pas surcharger le premier chargement
    const timer = setTimeout(() => {
      if (!isBannerDismissed()) {
        setVisible(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [isBannerDismissed]);

  const handleAllow = async () => {
    dismissBanner();
    setVisible(false);
    const result = await detectAndSave();
    if (result?.commune) {
      showToast(`📍 Position détectée : ${result.commune}`, "success");
    } else {
      showToast("Localisation impossible, vous pouvez choisir votre commune manuellement", "error");
    }
  };

  const handleDismiss = () => {
    dismissBanner();
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-20 md:bottom-6 left-0 right-0 z-40 flex justify-center px-4"
          role="dialog"
          aria-label="Demande d'autorisation de localisation"
        >
          <div className="bg-white border border-gray-100 rounded-2xl shadow-2xl shadow-black/10 p-4 md:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 w-full max-w-lg">
            {/* Icône */}
            <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
              <MapPin size={20} />
            </div>

            {/* Texte */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-900 mb-0.5">
                Trouvez des vendeurs près de chez vous
              </p>
              <p className="text-xs text-gray-500 leading-relaxed">
                Activez la localisation pour voir les produits et boutiques disponibles dans votre zone.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
              <button
                onClick={handleAllow}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-colors shadow-md shadow-coral-500/20 disabled:opacity-60 cursor-pointer"
              >
                {loading ? (
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Détection...
                  </span>
                ) : (
                  <>
                    <MapPin size={13} />
                    Autoriser
                  </>
                )}
              </button>
              <button
                onClick={handleDismiss}
                className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                aria-label="Fermer"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
