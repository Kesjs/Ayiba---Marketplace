"use client";

interface StepIndicatorProps {
  currentStep: number; // commence à 1
  totalSteps: number;
  stepLabels: string[]; // ex: ["Identité", "Boutique", "Localisation", "Paiement"]
}

export function StepIndicator({ currentStep, totalSteps, stepLabels }: StepIndicatorProps) {
  const progressPercent = (currentStep / totalSteps) * 100;

  return (
    <div className="w-full">
      {/* Mobile : compact, juste le texte + barre */}
      <div className="md:hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
            Étape {currentStep}/{totalSteps}
          </span>
          <span className="text-xs font-bold text-coral-500">
            {stepLabels[currentStep - 1]}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-coral-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Desktop : étapes détaillées avec labels et cercles numérotés */}
      <div className="hidden md:flex items-center justify-between relative">
        {stepLabels.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;

          return (
            <div key={label} className="flex-1 flex flex-col items-center relative">
              {/* Ligne de connexion */}
              {index > 0 && (
                <div
                  className={`absolute top-4 right-1/2 w-full h-0.5 -z-10 ${
                    isCompleted || isActive ? "bg-coral-500" : "bg-gray-200"
                  }`}
                />
              )}

              {/* Cercle numéroté */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                  isCompleted
                    ? "bg-coral-500 border-coral-500 text-white"
                    : isActive
                    ? "bg-white border-coral-500 text-coral-500"
                    : "bg-white border-gray-200 text-gray-400"
                }`}
              >
                {isCompleted ? "✓" : stepNumber}
              </div>

              {/* Label */}
              <span
                className={`text-xs font-medium mt-2 text-center ${
                  isActive ? "text-coral-600" : isCompleted ? "text-gray-700" : "text-gray-400"
                }`}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
