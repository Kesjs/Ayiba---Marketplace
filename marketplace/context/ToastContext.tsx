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
    <div className="fixed bottom-20 lg:bottom-8 inset-x-0 lg:inset-x-auto lg:right-8 z-[100] flex flex-col items-center gap-2 px-4 w-full lg:w-auto pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const Icon = variantIcons[toast.variant];
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
              className={`
                pointer-events-auto bg-white border rounded-full pl-3 pr-2 py-2 flex items-center gap-2 shadow-lg shadow-black/10 max-w-[92vw] lg:max-w-sm
                ${variantColors[toast.variant]}
              `}
            >
              <Icon size={16} strokeWidth={2.5} className="shrink-0" />
              <p className="text-xs font-bold leading-tight truncate">{toast.message}</p>
              <button
                onClick={() => removeToast(toast.id)}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 p-1 -mr-1"
              >
                <X size={13} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
