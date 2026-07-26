"use client";

import type { LucideIcon } from "lucide-react";
import { Check } from "lucide-react";

export interface WizardStep {
  label: string;
  icon: LucideIcon;
}

interface StepIndicatorProps {
  currentStep: number; // commence à 1
  steps: WizardStep[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="w-full flex items-start justify-between">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isCompleted = stepNumber < currentStep;
        const isActive = stepNumber === currentStep;
        const Icon = step.icon;

        return (
          <div key={step.label} className="flex-1 flex flex-col items-center relative">
            {/* Ligne de connexion */}
            {index > 0 && (
              <div
                className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 transition-colors duration-300 ${
                  isCompleted || isActive ? "bg-coral-500" : "bg-gray-200"
                }`}
              />
            )}

            {/* Cercle avec icône */}
            <div
              className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center border-2 transition-colors duration-300 ${
                isCompleted
                  ? "bg-coral-500 border-coral-500 text-white"
                  : isActive
                  ? "bg-white border-coral-500 text-coral-500 ring-4 ring-coral-50"
                  : "bg-white border-gray-200 text-gray-300"
              }`}
            >
              {isCompleted ? <Check size={15} strokeWidth={3} /> : <Icon size={15} strokeWidth={2.25} />}
            </div>

            {/* Label — masqué sur mobile sauf l'étape active, affiché partout sur desktop */}
            <span
              className={`text-[11px] font-semibold mt-1.5 text-center leading-tight px-0.5 ${
                isActive ? "text-coral-600" : isCompleted ? "text-gray-600" : "text-gray-300"
              } ${isActive ? "block" : "hidden md:block"}`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
