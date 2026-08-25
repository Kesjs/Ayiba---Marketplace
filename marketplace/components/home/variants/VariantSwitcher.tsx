"use client";

import { Palette } from "lucide-react";

export type HeroVariantId = "vinted" | "split" | "search" | "bento" | "editorial";

interface VariantSwitcherProps {
  active: HeroVariantId;
  onChange: (id: HeroVariantId) => void;
}

const VARIANTS: { id: HeroVariantId; label: string; tag: string }[] = [
  { id: "vinted", label: "1. Vinted Frame", tag: "Photo + Carte" },
  { id: "split", label: "2. Split 50/50", tag: "Studio" },
  { id: "search", label: "3. Search First", tag: "Recherche" },
  { id: "bento", label: "4. Bento Grid", tag: "Moderne" },
  { id: "editorial", label: "5. Éditorial", tag: "Minimaliste" },
];

export function VariantSwitcher({ active, onChange }: VariantSwitcherProps) {
  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 max-w-[95vw] sm:max-w-fit">
      <div className="flex items-center gap-1 bg-[#111827] text-white p-1.5 rounded-2xl shadow-2xl border border-gray-700/80">
        
        {/* Label Icon */}
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 text-xs font-bold text-gray-400 border-r border-gray-700/70 mr-1">
          <Palette size={14} className="text-coral-400" />
          <span>Variantes :</span>
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {VARIANTS.map((v) => {
            const isActive = active === v.id;
            return (
              <button
                key={v.id}
                type="button"
                onClick={() => onChange(v.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? "bg-coral-500 text-white shadow-sm"
                    : "text-gray-300 hover:text-white hover:bg-gray-800/80"
                }`}
              >
                {v.label}
              </button>
            );
          })}
        </div>

      </div>
    </div>
  );
}
