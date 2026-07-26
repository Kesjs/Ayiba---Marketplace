"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export interface ChipOption {
  value: string;
  label: string;
  icon?: LucideIcon;
}

interface ChipSelectProps {
  /** Identifiant unique du groupe — nécessaire pour isoler l'animation
   *  partagée quand plusieurs ChipSelect apparaissent sur la même page. */
  layoutId: string;
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

// Remplace les champs texte libre (commune, type d'adresse) par un choix
// fermé — évite les saisies incohérentes ("Bbb", "cotonou", "COTONOU"...)
// et les libellés dupliqués (ex: deux adresses appelées "Domicile").
// Le fond du chip actif glisse d'une option à l'autre (layout animation
// Framer Motion) plutôt que de basculer brutalement.
export function ChipSelect({ layoutId, options, value, onChange, className }: ChipSelectProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className ?? ""}`}>
      {options.map((option) => {
        const isSelected = option.value === value;
        const Icon = option.icon;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            aria-pressed={isSelected}
            className={`relative flex items-center gap-1.5 h-10 px-4 rounded-full border-2 text-sm font-semibold transition-colors ${
              isSelected ? "border-coral-400 text-coral-700" : "border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {isSelected && (
              <motion.span
                layoutId={`chip-fond-${layoutId}`}
                className="absolute inset-0 rounded-full bg-coral-50"
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {Icon && <Icon size={14} />}
              {option.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
