"use client";

import type { LucideIcon } from "lucide-react";
import { Pencil } from "lucide-react";

interface RecapRow {
  label: string;
  value: string;
}

interface RecapSectionProps {
  icon: LucideIcon;
  title: string;
  onEdit: () => void;
  rows: RecapRow[];
  /** Contenu libre affiché au-dessus des lignes (ex: miniature photo) */
  preview?: React.ReactNode;
  warning?: string;
}

export function RecapSection({ icon: Icon, title, onEdit, rows, preview, warning }: RecapSectionProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden">
      <div className="flex items-center gap-2.5 px-4 py-3 bg-gray-50/80 border-b border-gray-100">
        <div className="w-7 h-7 rounded-full bg-coral-50 text-coral-500 flex items-center justify-center shrink-0">
          <Icon size={14} strokeWidth={2.25} />
        </div>
        <h3 className="text-sm font-bold text-gray-900 flex-1">{title}</h3>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 text-xs font-semibold text-coral-600 hover:text-coral-700 shrink-0"
        >
          <Pencil size={12} />
          Modifier
        </button>
      </div>

      <div className="p-4 flex flex-col gap-3">
        {preview}

        {warning && (
          <button
            type="button"
            onClick={onEdit}
            className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2 text-left hover:bg-amber-100 transition-colors"
          >
            {warning}
          </button>
        )}

        {rows.length > 0 && (
          <div className="flex flex-col gap-2 text-sm">
            {rows.map((row) => (
              <div key={row.label} className="flex justify-between gap-4">
                <span className="text-gray-500 shrink-0">{row.label}</span>
                <span className="font-medium text-gray-900 text-right">{row.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
