"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShieldAlert } from "lucide-react";

export function SettingsSection({
  icon: Icon,
  title,
  delay = 0,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  delay?: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <Icon size={18} className="text-teal-600" />
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{title}</h3>
      </div>
      <div className="space-y-4">{children}</div>
    </motion.div>
  );
}

export function SettingsField({
  label,
  error,
  children,
}: {
  label: string;
  error?: string | null;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
        {label}
      </label>
      {children}
      {error && <p className="text-xs font-semibold text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

export function SettingsToggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      disabled={disabled}
      className="w-full flex items-center justify-between py-2 disabled:opacity-50"
    >
      <span className="text-sm font-bold text-gray-700">{label}</span>
      <span
        className={`relative w-11 h-7 rounded-full transition-colors duration-300 ${
          checked ? "bg-teal-500" : "bg-gray-300"
        }`}
      >
        <motion.span
          layout
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm"
          style={{ left: checked ? "calc(100% - 24px)" : "4px" }}
        />
      </span>
    </button>
  );
}

/**
 * Zone sensible — regroupement des actions destructives/sensibles
 * (pause, suppression de compte…) dans une carte unique au format
 * "danger zone" utilisé par les plateformes pro (GitHub, Stripe…) :
 * une carte à bordure d'alerte, des lignes sobres avec description,
 * et une confirmation en modale plutôt qu'un bloc qui pousse la page.
 */
export function DangerZoneCard({
  title = "Zone sensible",
  subtitle = "Ces actions concernent directement l'activité et l'accès à ton compte.",
  children,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-3xl border border-red-100 bg-white overflow-hidden mb-10"
    >
      <div className="flex items-center gap-3 px-6 sm:px-8 py-5 border-b border-red-100 bg-red-50/60">
        <div className="w-9 h-9 rounded-lg bg-white flex items-center justify-center text-red-500 shrink-0 shadow-sm">
          <ShieldAlert size={18} />
        </div>
        <div className="min-w-0">
          <h4 className="text-sm font-bold text-red-800">{title}</h4>
          <p className="text-xs text-red-400 font-medium mt-0.5">{subtitle}</p>
        </div>
      </div>
      <div className="divide-y divide-gray-100">{children}</div>
    </motion.div>
  );
}

export function DangerZoneRow({
  icon: Icon,
  title,
  description,
  actionLabel,
  tone = "amber",
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  actionLabel: string;
  tone?: "amber" | "red";
  onClick: () => void;
  disabled?: boolean;
}) {
  const iconToneClasses = tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500";
  const buttonToneClasses =
    tone === "amber"
      ? "border-amber-200 text-amber-700 hover:bg-amber-50"
      : "border-red-200 text-red-600 hover:bg-red-50";

  return (
    <div className="flex items-center justify-between gap-4 px-6 sm:px-8 py-5">
      <div className="flex items-start gap-3 min-w-0">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconToneClasses}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900">{title}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5 leading-relaxed">{description}</p>
        </div>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`shrink-0 h-9 px-4 rounded-xl border text-xs font-bold transition-colors disabled:opacity-50 ${buttonToneClasses}`}
      >
        {actionLabel}
      </button>
    </div>
  );
}

export function DangerZoneModal({
  open,
  tone = "amber",
  title,
  description,
  error,
  confirmLabel,
  confirmDisabled,
  loading,
  onClose,
  onConfirm,
  children,
}: {
  open: boolean;
  tone?: "amber" | "red";
  title: string;
  description: string;
  error?: string | null;
  confirmLabel: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [open, onClose]);

  const confirmClasses = tone === "amber" ? "bg-amber-500 hover:bg-amber-600" : "bg-red-600 hover:bg-red-700";
  const iconToneClasses = tone === "amber" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-500";

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gray-900/50"
            onClick={loading ? undefined : onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white rounded-3xl border border-gray-100 shadow-xl w-full max-w-md p-6 sm:p-7"
          >
            <div className="flex items-start justify-between gap-4 mb-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconToneClasses}`}>
                  <ShieldAlert size={20} />
                </div>
                <h3 className="text-base font-bold text-gray-900">{title}</h3>
              </div>
              <button
                onClick={onClose}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 transition-colors shrink-0 disabled:opacity-50"
              >
                <X size={20} />
              </button>
            </div>

            <p className="text-sm text-gray-600 leading-relaxed mb-4">{description}</p>

            {children && <div className="mb-4">{children}</div>}

            {error && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={loading}
                className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Annuler
              </button>
              <button
                onClick={onConfirm}
                disabled={confirmDisabled || loading}
                className={`flex-1 h-11 rounded-xl text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center ${confirmClasses}`}
              >
                {loading ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  confirmLabel
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
