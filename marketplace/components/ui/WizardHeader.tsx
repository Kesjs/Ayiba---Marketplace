"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { StepIndicator, type WizardStep } from "@/components/kyc/StepIndicator";

interface WizardHeaderProps {
  /** Ex: "Premier pas avec Ayiba" — accroche courte, cohérente sur tout le flow */
  eyebrow: string;
  /** Ex: "Devenir vendeur vérifié" — reste affiché sur toutes les étapes */
  title: string;
  steps: WizardStep[];
  currentStep: number;
  onCancel: () => void;
  cancelLabel?: string;
  /** Contenu affiché à droite du header (badge de statut, etc.) */
  trailing?: ReactNode;
  /** Écran récapitulatif : masque le stepper au profit d'une étiquette dédiée */
  isRecap?: boolean;
  recapLabel?: string;
}

export function WizardHeader({
  eyebrow,
  title,
  steps,
  currentStep,
  onCancel,
  cancelLabel = "Annuler",
  trailing,
  isRecap = false,
  recapLabel = "Récapitulatif",
}: WizardHeaderProps) {
  return (
    <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100">
      <div className="max-w-2xl mx-auto px-4 py-4 md:px-8">
        <div className="flex items-center gap-3 mb-4">
          <LogoAyiba className="h-6 w-auto shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-bold text-coral-500 uppercase tracking-wide truncate">
              {eyebrow}
            </p>
            <h1 className="text-sm font-bold text-gray-900 truncate">{title}</h1>
          </div>
          {trailing}
          <button
            onClick={onCancel}
            aria-label={cancelLabel}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-50 hover:text-gray-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {isRecap ? (
          <div className="text-center py-1">
            <span className="text-xs font-bold text-coral-500 uppercase tracking-wide">
              {recapLabel}
            </span>
          </div>
        ) : (
          <StepIndicator currentStep={currentStep} steps={steps} />
        )}
      </div>
    </div>
  );
}
