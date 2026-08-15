"use client";

import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from "lucide-react";

const variantIcons = {
  success: CheckCircle2,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
};

const variantIconColors = {
  success: "text-emerald-400",
  error: "text-red-400",
  warning: "text-amber-400",
  info: "text-neutral-200"
};

export function Toast() {
  const { toasts, removeToast } = useToast();

  // Le plus récent doit apparaître devant les précédents (façon empilement
  // de notifications iPhone), donc du plus récent au plus ancien.
  const stacked = [...toasts].reverse();

  return (
    <div className="fixed top-4 inset-x-0 z-[100] flex justify-center px-4 w-full pointer-events-none">
      <div className="relative w-full max-w-[92vw] lg:max-w-sm">
        <AnimatePresence>
          {stacked.map((toast, index) => {
            const Icon = variantIcons[toast.variant];
            const isTop = index === 0;
            return (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.94 }}
                animate={{
                  opacity: 1 - index * 0.22,
                  y: index * 8,
                  scale: 1 - index * 0.05,
                }}
                exit={{ opacity: 0, y: -8, scale: 0.94, transition: { duration: 0.15 } }}
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
                style={{ zIndex: stacked.length - index }}
                className={`absolute top-0 inset-x-0 bg-neutral-900/95 backdrop-blur border border-neutral-800 rounded-2xl pl-4 pr-3 py-3 flex items-center gap-3 shadow-xl shadow-black/30 min-w-[220px] ${
                  isTop ? "pointer-events-auto" : "pointer-events-none"
                }`}
              >
                <Icon size={20} strokeWidth={2} className={`shrink-0 ${variantIconColors[toast.variant]}`} />
                <p className="text-sm font-medium text-neutral-100 leading-tight flex-1">{toast.message}</p>
                {isTop && (
                  <button
                    onClick={() => removeToast(toast.id)}
                    className="text-neutral-400 hover:text-neutral-200 transition-colors shrink-0 p-1 rounded-full hover:bg-neutral-800"
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
