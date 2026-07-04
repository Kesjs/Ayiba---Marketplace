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

const variantColors = {
  success: "bg-teal-50 border-teal-100 text-teal-600",
  error: "bg-red-50 border-red-100 text-red-600",
  warning: "bg-amber-50 border-amber-100 text-amber-600",
  info: "bg-blue-50 border-blue-100 text-blue-600"
};

export function Toast() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 md:top-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 z-[100] flex flex-col gap-3 w-[90%] max-w-sm md:w-auto">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              layout
              className={`
                bg-white/90 backdrop-blur-xl border rounded-2xl p-4 flex items-start gap-3 shadow-xl shadow-black/5
                ${variantColors[toast.variant]}
              `}
            >
              <div className="mt-0.5">
                <Icon size={20} strokeWidth={2.5} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold leading-tight">{toast.message}</p>
              </div>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1"
              >
                <X size={16} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
