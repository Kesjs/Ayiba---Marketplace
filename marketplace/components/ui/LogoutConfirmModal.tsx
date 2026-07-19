"use client";

import { AnimatePresence, motion } from "framer-motion";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmation avant déconnexion, partagée par les 3 dashboards (admin,
 * vendeur, livreur) et le dashboard client — évite qu'un appui accidentel
 * sur "Déconnexion" ferme la session sans y penser.
 * Même gabarit visuel que le ConfirmModal de VendeurKycWizard.tsx.
 */
export function LogoutConfirmModal({ open, onConfirm, onCancel }: LogoutConfirmModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-white rounded-3xl p-6 shadow-xl"
          >
            <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center mb-4">
              <LogOut size={22} />
            </div>
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Se déconnecter ?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tu devras te reconnecter pour accéder à ton compte.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Déconnexion
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
