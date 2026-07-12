"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./StepIndicator";
import { PhotoUpload } from "./PhotoUpload";
import { MobileMoneySelector } from "./MobileMoneySelector";
import { ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";

const STEP_LABELS = ["Identité", "Véhicule", "Localisation", "Paiement"];

type TypeVehicule = "motocyclette" | "velo" | "tricycle" | "a_pied";

const VEHICULE_OPTIONS: { id: TypeVehicule; label: string }[] = [
  { id: "motocyclette", label: "Motocyclette" },
  { id: "velo", label: "Vélo" },
  { id: "tricycle", label: "Tricycle" },
  { id: "a_pied", label: "À pied" },
];

interface LivreurFormData {
  nomComplet: string;
  photoProfil: File | null;
  photoCni: File | null;
  typeVehicule: TypeVehicule | null;
  photoVehicule: File | null;
  plaqueImmatriculation: string;
  quartier: string;
  commune: string;
  mobileMoneyNetwork: "mtn" | "moov" | "celtiis" | null;
  mobileMoneyNumber: string;
}

const INITIAL_DATA: LivreurFormData = {
  nomComplet: "",
  photoProfil: null,
  photoCni: null,
  typeVehicule: null,
  photoVehicule: null,
  plaqueImmatriculation: "",
  quartier: "",
  commune: "",
  mobileMoneyNetwork: null,
  mobileMoneyNumber: "",
};

export function LivreurKycWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<LivreurFormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const totalSteps = 4;

  const update = <K extends keyof LivreurFormData>(key: K, value: LivreurFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const needsPlaque = data.typeVehicule === "motocyclette" || data.typeVehicule === "tricycle";

  const hasProgress = () => {
    return (
      data.nomComplet.trim().length > 0 ||
      data.photoProfil !== null ||
      data.photoCni !== null ||
      data.typeVehicule !== null ||
      data.photoVehicule !== null ||
      data.plaqueImmatriculation.trim().length > 0 ||
      data.quartier.trim().length > 0 ||
      data.commune.trim().length > 0 ||
      data.mobileMoneyNumber.length > 0
    );
  };

  const handleCancel = () => {
    if (hasProgress()) {
      const confirmed = window.confirm(
        "Tu as des informations non enregistrées. Veux-tu vraiment quitter ?"
      );
      if (!confirmed) return;
    }
    router.push("/");
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.nomComplet.trim().length > 2 && data.photoProfil !== null && data.photoCni !== null;
      case 2:
        if (!data.typeVehicule) return false;
        if (data.typeVehicule === "a_pied") return true;
        const plaqueOk = needsPlaque ? data.plaqueImmatriculation.trim().length > 2 : true;
        return data.photoVehicule !== null && plaqueOk;
      case 3:
        return data.quartier.trim().length > 1 && data.commune.trim().length > 1;
      case 4:
        return data.mobileMoneyNetwork !== null && data.mobileMoneyNumber.length === 8;
      default:
        return true;
    }
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      setStep(totalSteps + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);

    // SIMULATION — à remplacer par un vrai insert Supabase (table `livreurs`)
    // + upload des fichiers vers Supabase Storage
    console.log("Soumission livreur (simulation) :", data);

    setTimeout(() => {
      setSubmitting(false);
      router.push("/livreur/missions");
    }, 1200);
  };

  const isRecap = step === totalSteps + 1;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-4">
          <button
            onClick={handleCancel}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Annuler l'inscription"
          >
            <X size={20} />
          </button>
          <div className="flex-1">
            {!isRecap && (
              <StepIndicator currentStep={step} totalSteps={totalSteps} stepLabels={STEP_LABELS} />
            )}
            {isRecap && (
              <div className="text-center">
                <span className="text-xs font-bold text-coral-500 uppercase tracking-wide">
                  Récapitulatif
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl bg-white rounded-2xl border border-gray-100 p-6 md:p-8 shadow-sm">
          {step === 1 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Qui es-tu ?</h2>
                <p className="text-sm text-gray-500">
                  Ton identité est vérifiée pour garantir la sécurité des livraisons.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom complet
                </label>
                <input
                  type="text"
                  value={data.nomComplet}
                  onChange={(e) => update("nomComplet", e.target.value)}
                  placeholder="Ex: Ken Erlich Babatounde"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400"
                />
              </div>

              <PhotoUpload
                label="Photo de profil"
                helperText="Une photo claire de ton visage"
                value={data.photoProfil}
                onChange={(file) => update("photoProfil", file)}
                aspect="square"
              />

              <PhotoUpload
                label="Photo de la CNI"
                helperText="Recto uniquement, bien lisible"
                value={data.photoCni}
                onChange={(file) => update("photoCni", file)}
                aspect="square"
              />
            </div>
          )}

          {step === 2 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Ton véhicule</h2>
                <p className="text-sm text-gray-500">
                  Choisis comment tu comptes effectuer tes livraisons.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Type de véhicule
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {VEHICULE_OPTIONS.map((option) => {
                    const isSelected = data.typeVehicule === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => update("typeVehicule", option.id)}
                        className={`h-11 rounded-lg border-2 text-sm font-medium transition-colors ${
                          isSelected
                            ? "border-coral-500 bg-coral-50 text-coral-600"
                            : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {data.typeVehicule && data.typeVehicule !== "a_pied" && (
                <>
                  <PhotoUpload
                    label="Photo du véhicule"
                    value={data.photoVehicule}
                    onChange={(file) => update("photoVehicule", file)}
                    aspect="wide"
                  />

                  {needsPlaque && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Plaque d'immatriculation
                      </label>
                      <input
                        type="text"
                        value={data.plaqueImmatriculation}
                        onChange={(e) => update("plaqueImmatriculation", e.target.value.toUpperCase())}
                        placeholder="Ex: AB 1234 RB"
                        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400"
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Où habites-tu ?</h2>
                <p className="text-sm text-gray-500">
                  On te propose en priorité les missions proches de chez toi.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Commune</label>
                <input
                  type="text"
                  value={data.commune}
                  onChange={(e) => update("commune", e.target.value)}
                  placeholder="Ex: Calavi"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Quartier</label>
                <input
                  type="text"
                  value={data.quartier}
                  onChange={(e) => update("quartier", e.target.value)}
                  placeholder="Ex: Godomey"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400"
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Comment être payé ?</h2>
                <p className="text-sm text-gray-500">
                  Tes gains sont crédités instantanément après chaque livraison validée.
                </p>
              </div>

              <MobileMoneySelector
                selected={data.mobileMoneyNetwork}
                onSelect={(network) => update("mobileMoneyNetwork", network)}
                phoneNumber={data.mobileMoneyNumber}
                onPhoneChange={(value) => update("mobileMoneyNumber", value)}
              />
            </div>
          )}

          {isRecap && (
            <div className="flex flex-col gap-5">
              <div className="text-center mb-2">
                <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-teal-50 flex items-center justify-center">
                  <CheckCircle2 size={28} className="text-teal-500" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Vérifie tes informations</h2>
                <p className="text-sm text-gray-500">
                  Ton compte sera validé sous 24h après soumission.
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium text-gray-900">{data.nomComplet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Véhicule</span>
                  <span className="font-medium text-gray-900">
                    {VEHICULE_OPTIONS.find((v) => v.id === data.typeVehicule)?.label}
                    {needsPlaque && data.plaqueImmatriculation ? ` • ${data.plaqueImmatriculation}` : ""}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Localisation</span>
                  <span className="font-medium text-gray-900">{data.quartier}, {data.commune}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Paiement</span>
                  <span className="font-medium text-gray-900">
                    {data.mobileMoneyNetwork?.toUpperCase()} • {data.mobileMoneyNumber}
                  </span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="w-full h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
              >
                {submitting ? "Envoi en cours..." : "Soumettre pour vérification"}
              </button>
            </div>
          )}

          {!isRecap && (
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step === 1 ? (
                <button
                  onClick={handleCancel}
                  className="text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  Annuler
                </button>
              ) : (
                <button
                  onClick={handleBack}
                  className="flex items-center gap-1 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
                >
                  <ChevronLeft size={16} />
                  Précédent
                </button>
              )}
              <button
                onClick={handleNext}
                disabled={!isStepValid()}
                className="flex items-center gap-1 h-11 px-6 rounded-lg bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {step === totalSteps ? "Voir le récap" : "Suivant"}
                <ChevronRight size={16} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
