"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { StepIndicator } from "./StepIndicator";
import { PhotoUpload } from "./PhotoUpload";
import { MobileMoneySelector } from "./MobileMoneySelector";
import { ChevronLeft, ChevronRight, CheckCircle2, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const STEP_LABELS = ["Identité", "Boutique", "Localisation", "Paiement"];
const STORAGE_KEY = "ayiba-vendeur-kyc-draft";

interface VendeurFormData {
  nomComplet: string;
  photoProfil: File | null;
  photoCni: File | null;
  nomBoutique: string;
  description: string;
  quartier: string;
  commune: string;
  mobileMoneyNetwork: "mtn" | "moov" | "celtiis" | null;
  mobileMoneyNumber: string;
}

// Les fichiers (File) ne sont pas sérialisables en JSON — on ne persiste que les champs texte
type PersistedFields = Omit<VendeurFormData, "photoProfil" | "photoCni">;

const INITIAL_DATA: VendeurFormData = {
  nomComplet: "",
  photoProfil: null,
  photoCni: null,
  nomBoutique: "",
  description: "",
  quartier: "",
  commune: "",
  mobileMoneyNetwork: null,
  mobileMoneyNumber: "",
};

export function VendeurKycWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<VendeurFormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const totalSteps = 4;

  // Restaure le brouillon au montage (étape + champs texte, pas les photos)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as { step: number; fields: PersistedFields };
        setData((prev) => ({ ...prev, ...parsed.fields }));
        setStep(parsed.step || 1);
      }
    } catch {
      // brouillon corrompu, on l'ignore silencieusement
    } finally {
      setHydrated(true);
    }
  }, []);

  // Sauvegarde à chaque changement (étape ou champs texte), une fois l'hydratation initiale faite
  useEffect(() => {
    if (!hydrated || typeof window === "undefined") return;
    const { photoProfil, photoCni, ...fields } = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ step, fields }));
  }, [data, step, hydrated]);

  const update = <K extends keyof VendeurFormData>(key: K, value: VendeurFormData[K]) => {
    setData((prev) => ({ ...prev, [key]: value }));
  };

  const clearDraft = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  const hasProgress = () => {
    return (
      data.nomComplet.trim().length > 0 ||
      data.photoProfil !== null ||
      data.photoCni !== null ||
      data.nomBoutique.trim().length > 0 ||
      data.description.trim().length > 0 ||
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
    clearDraft();
    router.push("/");
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return data.nomComplet.trim().length > 2 && data.photoProfil !== null;
      case 2:
        return data.nomBoutique.trim().length > 2 && data.description.trim().length > 5;
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
    setError(null);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setError("Ta session a expiré, reconnecte-toi.");
      setSubmitting(false);
      return;
    }

    try {
      let photoProfilUrl: string | null = null;
      let photoCniPath: string | null = null;

      if (data.photoProfil) {
        const path = `${user.id}/profil-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("avatars")
          .upload(path, data.photoProfil, { upsert: true });
        if (upErr) throw upErr;
        photoProfilUrl = supabase.storage.from("avatars").getPublicUrl(path).data.publicUrl;
      }

      if (data.photoCni) {
        const path = `${user.id}/cni-${Date.now()}.jpg`;
        const { error: upErr } = await supabase.storage
          .from("kyc-documents")
          .upload(path, data.photoCni, { upsert: true });
        if (upErr) throw upErr;
        photoCniPath = path;
      }

      const { error: insertError } = await supabase.from("vendeurs").upsert({
        id: user.id,
        nom_complet: data.nomComplet,
        photo_profil_url: photoProfilUrl,
        photo_cni_path: photoCniPath,
        nom_boutique: data.nomBoutique,
        description: data.description,
        quartier: data.quartier,
        commune: data.commune,
        mobile_money_network: data.mobileMoneyNetwork,
        mobile_money_number: data.mobileMoneyNumber,
      });
      if (insertError) throw insertError;

      clearDraft();
      router.push("/vendeur/dashboard");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const isRecap = step === totalSteps + 1;

  // Évite un flash de l'étape 1 pendant la lecture du localStorage
  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
                  On a besoin de vérifier ton identité pour protéger la communauté Ayiba.
                </p>
              </div>

              {data.photoProfil === null && step === 1 && (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                  Après un rechargement de page, tes textes sont conservés mais tu devras réajouter tes photos.
                </p>
              )}

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
                label="Photo de la CNI (optionnel pour l'instant)"
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
                <h2 className="text-lg font-bold text-gray-900 mb-1">Ta boutique</h2>
                <p className="text-sm text-gray-500">
                  Tu ajouteras tes articles après validation, dans ton dashboard.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de la boutique
                </label>
                <input
                  type="text"
                  value={data.nomBoutique}
                  onChange={(e) => update("nomBoutique", e.target.value)}
                  placeholder="Ex: Chez Ken Fashion"
                  className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description courte
                </label>
                <textarea
                  value={data.description}
                  onChange={(e) => update("description", e.target.value)}
                  placeholder="En 2-3 lignes, décris ce que tu vends"
                  rows={4}
                  className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 resize-none"
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-5">
              <div>
                <h2 className="text-lg font-bold text-gray-900 mb-1">Où es-tu situé ?</h2>
                <p className="text-sm text-gray-500">
                  Ça aide les clients proches de toi à te trouver plus facilement.
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
                  Tes gains seront versés sur ce numéro après chaque vente validée.
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

              {!data.photoProfil && (
                <button
                  onClick={() => setStep(1)}
                  className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 text-center hover:bg-amber-100 transition-colors"
                >
                  Ta photo de profil a été perdue lors d'un rechargement. Touche ici pour la réajouter.
                </button>
              )}

              <div className="bg-gray-50 rounded-xl p-4 flex flex-col gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Nom</span>
                  <span className="font-medium text-gray-900">{data.nomComplet}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Boutique</span>
                  <span className="font-medium text-gray-900">{data.nomBoutique}</span>
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

              {error && <p className="text-sm text-red-500 text-center">{error}</p>}

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setStep(totalSteps)}
                  className="flex items-center gap-1 h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                >
                  <ChevronLeft size={16} />
                  Modifier
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !data.photoProfil}
                  className="flex-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Envoi en cours..." : "Soumettre pour vérification"}
                </button>
              </div>
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
