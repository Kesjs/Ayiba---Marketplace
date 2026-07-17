"use client";

import { motion } from "framer-motion";

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
 * Zone sensible — pause / suppression de compte.
 * Confirmation inline (pas de modale) pour rester cohérent avec le style
 * "tout sur la page" du reste du formulaire.
 */
export function DangerZoneButton({
  icon: Icon,
  label,
  tone = "amber",
  onClick,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  tone?: "amber" | "red";
  onClick: () => void;
}) {
  const toneClasses =
    tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100"
      : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100";
  const iconToneClasses = tone === "amber" ? "text-amber-600" : "text-red-500";

  return (
    <button
      onClick={onClick}
      className={`w-full p-4 sm:p-5 rounded-2xl border flex items-center justify-between transition-colors group ${toneClasses}`}
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg bg-white flex items-center justify-center shadow-sm shrink-0 ${iconToneClasses}`}>
          <Icon size={20} />
        </div>
        <p className="font-bold text-sm text-left">{label}</p>
      </div>
    </button>
  );
}

export function DangerZoneConfirm({
  tone = "amber",
  description,
  error,
  confirmLabel,
  confirmDisabled,
  loading,
  onCancel,
  onConfirm,
  children,
}: {
  tone?: "amber" | "red";
  description: string;
  error?: string | null;
  confirmLabel: string;
  confirmDisabled?: boolean;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  children?: React.ReactNode;
}) {
  const confirmClasses =
    tone === "amber"
      ? "bg-amber-500 hover:bg-amber-600"
      : "bg-red-600 hover:bg-red-700";

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      className="rounded-2xl border border-gray-100 bg-gray-50 p-4 sm:p-5 space-y-4 overflow-hidden"
    >
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      {children}
      {error && (
        <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">
          {error}
        </p>
      )}
      <div className="flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 h-11 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-white transition-colors disabled:opacity-50"
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
  );
}
