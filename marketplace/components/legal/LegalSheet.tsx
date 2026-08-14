"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";

export function LegalSheet({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  // Empêche le scroll de la page derrière pendant que la sheet est ouverte
  useEffect(() => {
    if (open) {
      const original = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = original;
      };
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-[80] bg-white rounded-t-[32px] shadow-2xl
                       h-[92vh] sm:h-[85vh] sm:max-w-3xl sm:mx-auto sm:inset-x-0 sm:rounded-[32px] sm:bottom-6
                       flex flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-gray-100 shrink-0">
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
              <button
                onClick={onClose}
                aria-label="Fermer"
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 transition-colors"
              >
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 bg-gray-50/50">{children}</div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
