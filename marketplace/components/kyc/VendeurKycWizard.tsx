"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "./StepIndicator";
import { PhotoUpload } from "./PhotoUpload";
import { DocumentUpload } from "./DocumentUpload";
import { MobileMoneySelector } from "./MobileMoneySelector";
import { ChevronLeft, ChevronRight, ShieldCheck, Clock, AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";

const STEP_LABELS = ["Identité", "Document", "Boutique", "Localisation", "Paiement"];
const STORAGE_KEY = "ayiba-vendeur-kyc-draft";

const STATUT_CONFIG: Record<string, { dot: string; label: string }> = {
  en_attente: { dot: "bg-amber-500", label: "En attente" },
  valide: { dot: "bg-teal-500", label: "Vérifié" },
  refuse: { dot: "bg-red-500", label: "Refusé" },
};

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

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir > 0 ? 24 : -24, scale: 0.99 }),
  center: { opacity: 1, x: 0, scale: 1 },
  exit: (dir: number) => ({ opacity: 0, x: dir > 0 ? -24 : 24, scale: 0.99 }),
};

function StatutIndicator({ statut }: { statut: string }) {
  const config = STATUT_CONFIG[statut];
  if (!config) return null;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 shrink-0">
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span className="hidden xs:inline">{config.label}</span>
    </span>
  );
}

function ConfirmModal({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm px-4 pb-4 sm:pb-4"
          onClick={onCancel}
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.97 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="w-full sm:max-w-sm bg-white rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-base font-bold text-gray-900 mb-1.5">Quitter l'inscription ?</h3>
            <p className="text-sm text-gray-500 mb-6">
              Tes informations non enregistrées seront perdues.
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={onCancel}
                className="flex-1 h-11 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Continuer
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 h-11 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold transition-colors"
              >
                Quitter
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function VendeurKycWizard() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [data, setData] = useState<VendeurFormData>(INITIAL_DATA);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const totalSteps = 5;

  const [existingPhotoProfilUrl, setExistingPhotoProfilUrl] = useState<string | null>(null);
  const [existingPhotoCniPath, setExistingPhotoCniPath] = useState<string | null>(null);
  const [vendeurStatut, setVendeurStatut] = useState<string | null>(null);
  const [raisonRejet, setRaisonRejet] = useState<string | null>(null);
  // Une fois le dossier soumis (en_attente/valide), on affiche un écran de
  // statut plutôt que de renvoyer directement dans le formulaire à chaque
  // visite de /vendeur/kyc — "Modifier mes informations" repasse en édition.
  const [editMode, setEditMode] = useState(false);
  const { showToast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;

    let cancelled = false;

    const hydrate = async () => {
      let draft: { step: number; fields: PersistedFields } | null = null;
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) draft = JSON.parse(saved);
      } catch {
        // brouillon corrompu, on l'ignore silencieusement
      }

      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (user) {
          const { data: vendeur } = await supabase
            .from("vendeurs")
            .select("*")
            .eq("id", user.id)
            .maybeSingle();

          if (vendeur && !cancelled) {
            setData((prev) => ({
              ...prev,
              nomComplet: vendeur.nom_complet ?? prev.nomComplet,
              nomBoutique: vendeur.nom_boutique ?? prev.nomBoutique,
              description: vendeur.description ?? prev.description,
              quartier: vendeur.quartier ?? prev.quartier,
              commune: vendeur.commune ?? prev.commune,
              mobileMoneyNetwork: vendeur.mobile_money_network ?? prev.mobileMoneyNetwork,
              mobileMoneyNumber: vendeur.mobile_money_number ?? prev.mobileMoneyNumber,
            }));
            setExistingPhotoProfilUrl(vendeur.photo_profil_url ?? null);
            setExistingPhotoCniPath(vendeur.photo_cni_path ?? null);
            setVendeurStatut(vendeur.statut ?? null);
            setRaisonRejet(vendeur.raison_rejet ?? null);
            setHydrated(true);
            return;
          }
        }
      } catch {
        // pas de session / erreur réseau → on retombe sur le brouillon local
      }

      if (!cancelled && draft) {
        setData((prev) => ({ ...prev, ...draft!.fields }));
        setStep(draft.step || 1);
      }
      if (!cancelled) setHydrated(true);
    };

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

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
      setShowCancelModal(true);
      return;
    }
    clearDraft();
    if (editMode && vendeurStatut) {
      setEditMode(false);
      return;
    }
    router.push("/");
  };

  const confirmCancel = () => {
    clearDraft();
    setShowCancelModal(false);
    if (editMode && vendeurStatut) {
      setEditMode(false);
      return;
    }
    showToast("Pas de souci, tu pourras reprendre à tout moment.", "info");
    router.push("/");
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return (
          data.nomComplet.trim().length > 2 &&
          (data.photoProfil !== null || existingPhotoProfilUrl !== null)
        );
      case 2:
        return data.photoCni !== null || existingPhotoCniPath !== null;
      case 3:
        return data.nomBoutique.trim().length > 2 && data.description.trim().length > 5;
      case 4:
        return data.quartier.trim().length > 1 && data.commune.trim().length > 1;
      case 5:
        return data.mobileMoneyNetwork !== null && data.mobileMoneyNumber.length === 8;
      default:
        return true;
    }
  };

  const goToStep = (target: number) => {
    setDirection(target > step ? 1 : -1);
    setStep(target);
  };

  const handleNext = () => {
    if (step < totalSteps) {
      goToStep(step + 1);
    } else {
      goToStep(totalSteps + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) goToStep(step - 1);
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
      let photoProfilUrl: string | null = existingPhotoProfilUrl;
      let photoCniPath: string | null = existingPhotoCniPath;

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
        statut: "en_attente",
      });
      if (insertError) throw insertError;

      clearDraft();
      showToast(
        "Dossier envoyé ! Ton dashboard est accessible dès maintenant — ta boutique restera privée jusqu'à validation (24-48h).",
        "success"
      );
      router.push("/vendeur/dashboard");
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue, réessaie.");
    } finally {
      setSubmitting(false);
    }
  };

  const isRecap = step === totalSteps + 1;

  if (!hydrated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const showStatusScreen =
    (vendeurStatut === "en_attente" || vendeurStatut === "valide") && !editMode;

  if (showStatusScreen) {
    const isValide = vendeurStatut === "valide";
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-4 md:px-8">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button
              onClick={() => router.push("/")}
              className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
              aria-label="Fermer"
            >
              <X size={20} />
            </button>
            <div className="flex-1" />
            <StatutIndicator statut={vendeurStatut!} />
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-md bg-white rounded-[32px] border border-gray-100 p-8 shadow-sm text-center flex flex-col items-center gap-4">
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center ${
                isValide ? "bg-teal-50 text-teal-500" : "bg-amber-50 text-amber-500"
              }`}
            >
              {isValide ? <ShieldCheck size={28} /> : <Clock size={28} />}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                {isValide ? "Compte vérifié" : "Dossier en cours de vérification"}
              </h2>
              <p className="text-sm text-gray-500 mt-1.5">
                {isValide
                  ? "Ton identité et ta boutique sont validées. Tout est en ordre."
                  : "Ton dossier a bien été envoyé — activation sous 24-48h. En attendant, ton dashboard est accessible : tu peux configurer ta boutique et ajouter des articles, ils resteront privés jusqu'à validation."}
              </p>
            </div>
            <button
              onClick={() => router.push("/vendeur/dashboard")}
              className="w-full h-12 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors"
            >
              Aller au dashboard
            </button>
            <button
              onClick={() => setEditMode(true)}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700"
            >
              Modifier mes informations
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <ConfirmModal
        open={showCancelModal}
        onConfirm={confirmCancel}
        onCancel={() => setShowCancelModal(false)}
      />

      <div className="sticky top-0 z-30 bg-white/95 backdrop-blur-xl border-b border-gray-100 px-4 py-4 md:px-8">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <button
            onClick={handleCancel}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 text-gray-400 hover:text-gray-700 transition-colors"
            aria-label="Annuler l'inscription"
          >
            <X size={20} />
          </button>
          <div className="flex-1 min-w-0">
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
          {vendeurStatut && <StatutIndicator statut={vendeurStatut} />}
        </div>
      </div>

      <div className="flex-1 flex items-start md:items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl flex flex-col gap-4">
          <AnimatePresence>
            {vendeurStatut === "refuse" && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-3xl p-4"
              >
                <AlertTriangle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-red-700">Vérification refusée</p>
                  <p className="text-sm text-red-600 mt-0.5">
                    {raisonRejet || "Aucune raison précisée."} Corrige les informations ci-dessous puis
                    soumets à nouveau ta demande.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="bg-white rounded-[32px] border border-gray-100 p-6 md:p-8 shadow-sm overflow-hidden">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={isRecap ? "recap" : step}
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              >
                {/* Étape 1 : Identité — allégée, une seule photo, ça respire */}
                {step === 1 && !isRecap && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Qui es-tu ?</h2>
                      <p className="text-sm text-gray-500">
                        On a besoin de vérifier ton identité pour protéger la communauté Ayiba.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="nomComplet" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom complet
                      </label>
                      <input
                        id="nomComplet"
                        type="text"
                        value={data.nomComplet}
                        onChange={(e) => update("nomComplet", e.target.value)}
                        placeholder="Ex: Ken Erlich Babatounde"
                        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                      />
                    </div>

                    <div className="flex justify-center">
                      <PhotoUpload
                        label="Photo de profil"
                        helperText={
                          existingPhotoProfilUrl
                            ? "Une photo est déjà enregistrée — touche pour la remplacer"
                            : "Une photo claire de ton visage"
                        }
                        value={data.photoProfil}
                        onChange={(file) => update("photoProfil", file)}
                        aspect="square"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 2 : Document CNI — sa propre page, upload animé */}
                {step === 2 && !isRecap && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Vérifie ton identité</h2>
                      <p className="text-sm text-gray-500">
                        Une photo recto de ta pièce d'identité, bien lisible.
                      </p>
                    </div>

                    <DocumentUpload
                      label="Ajouter la CNI (recto)"
                      value={data.photoCni}
                      onChange={(file) => update("photoCni", file)}
                      existingFileLabel={existingPhotoCniPath ? "Document déjà enregistré" : null}
                    />

                    <p className="text-xs text-gray-400 text-center px-2">
                      Ce document sert uniquement à vérifier ton identité et protéger les
                      vendeurs et acheteurs Ayiba contre la fraude.
                    </p>
                  </div>
                )}

                {/* Étape 3 : Boutique */}
                {step === 3 && !isRecap && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Ta boutique</h2>
                      <p className="text-sm text-gray-500">
                        Tu ajouteras tes articles après validation, dans ton dashboard.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="nomBoutique" className="block text-sm font-medium text-gray-700 mb-2">
                        Nom de la boutique
                      </label>
                      <input
                        id="nomBoutique"
                        type="text"
                        value={data.nomBoutique}
                        onChange={(e) => update("nomBoutique", e.target.value)}
                        placeholder="Ex: Chez Ken Fashion"
                        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                      />
                    </div>

                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                        Description courte
                      </label>
                      <textarea
                        id="description"
                        value={data.description}
                        onChange={(e) => update("description", e.target.value)}
                        placeholder="En 2-3 lignes, décris ce que tu vends"
                        rows={4}
                        className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 resize-none transition-shadow"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 4 : Localisation */}
                {step === 4 && !isRecap && (
                  <div className="flex flex-col gap-5">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900 mb-1">Où es-tu situé ?</h2>
                      <p className="text-sm text-gray-500">
                        Ça aide les clients proches de toi à te trouver plus facilement.
                      </p>
                    </div>

                    <div>
                      <label htmlFor="commune" className="block text-sm font-medium text-gray-700 mb-2">
                        Commune
                      </label>
                      <input
                        id="commune"
                        type="text"
                        value={data.commune}
                        onChange={(e) => update("commune", e.target.value)}
                        placeholder="Ex: Calavi"
                        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                      />
                    </div>

                    <div>
                      <label htmlFor="quartier" className="block text-sm font-medium text-gray-700 mb-2">
                        Quartier
                      </label>
                      <input
                        id="quartier"
                        type="text"
                        value={data.quartier}
                        onChange={(e) => update("quartier", e.target.value)}
                        placeholder="Ex: Godomey"
                        className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-shadow"
                      />
                    </div>
                  </div>
                )}

                {/* Étape 5 : Paiement */}
                {step === 5 && !isRecap && (
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
                    <div className="relative overflow-hidden bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 rounded-[28px] p-6 text-white shadow-xl shadow-coral-500/20">
                      <div className="absolute -top-16 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="absolute -bottom-16 -left-8 w-32 h-32 bg-black/10 rounded-full blur-3xl pointer-events-none" />
                      <div className="relative">
                        <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
                          <ShieldCheck size={22} />
                        </div>
                        <h2 className="text-lg font-bold mb-1">Vérifie tes informations</h2>
                        <p className="text-sm text-white/80">
                          Ton compte sera validé sous 24-48h après soumission.
                        </p>
                      </div>
                    </div>

                    {!data.photoProfil && !existingPhotoProfilUrl && (
                      <button
                        onClick={() => goToStep(1)}
                        className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 text-center hover:bg-amber-100 transition-colors"
                      >
                        Ta photo de profil a été perdue lors d'un rechargement. Touche ici pour la
                        réajouter.
                      </button>
                    )}

                    {!data.photoCni && !existingPhotoCniPath && (
                      <button
                        onClick={() => goToStep(2)}
                        className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-2xl px-3 py-2 text-center hover:bg-amber-100 transition-colors"
                      >
                        Ton document d'identité a été perdu lors d'un rechargement. Touche ici pour
                        le réajouter.
                      </button>
                    )}

                    <div className="bg-gray-50 rounded-2xl p-4 flex flex-col gap-3 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 shrink-0">Nom</span>
                        <span className="font-medium text-gray-900 text-right">{data.nomComplet}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 shrink-0">Boutique</span>
                        <span className="font-medium text-gray-900 text-right">{data.nomBoutique}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 shrink-0">Localisation</span>
                        <span className="font-medium text-gray-900 text-right">
                          {data.quartier}, {data.commune}
                        </span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-gray-500 shrink-0">Paiement</span>
                        <span className="font-medium text-gray-900 text-right">
                          {data.mobileMoneyNetwork?.toUpperCase()} • {data.mobileMoneyNumber}
                        </span>
                      </div>
                    </div>

                    {error && <p className="text-sm text-red-500 text-center">{error}</p>}
                  </div>
                )}
              </motion.div>
            </AnimatePresence>

            <div className="flex items-center gap-3 mt-8 pt-6 border-t border-gray-100">
              {!isRecap ? (
                <>
                  {step === 1 ? (
                    <button
                      onClick={handleCancel}
                      className="h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      Annuler
                    </button>
                  ) : (
                    <button
                      onClick={handleBack}
                      className="flex items-center gap-1 h-12 px-4 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 transition-colors shrink-0"
                    >
                      <ChevronLeft size={16} />
                      Retour
                    </button>
                  )}
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleNext}
                    disabled={!isStepValid()}
                    className="flex-1 flex items-center justify-center gap-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 active:bg-coral-600 text-white text-sm font-bold disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    {step === totalSteps ? "Voir le récap" : "Suivant"}
                    <ChevronRight size={16} />
                  </motion.button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => goToStep(totalSteps)}
                    className="flex items-center gap-1 h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors shrink-0"
                  >
                    <ChevronLeft size={16} />
                    Modifier
                  </button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleSubmit}
                    disabled={submitting || (!data.photoProfil && !existingPhotoProfilUrl)}
                    className="flex-1 h-12 rounded-xl bg-coral-500 hover:bg-coral-600 active:bg-coral-600 text-white font-bold text-sm disabled:opacity-50 transition-colors"
                  >
                    {submitting ? "Envoi en cours..." : "Soumettre pour vérification"}
                  </motion.button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
