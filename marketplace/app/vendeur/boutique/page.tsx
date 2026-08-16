"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVendeurBoutique, type Boutique, type Horaires, type Jour } from "../../hooks/useVendeurBoutique";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { MobileMoneySelector } from "@/components/boutique/MobileMoneySelector";
import { AdresseForm } from "@/components/adresse/AdresseForm";
import { useToast } from "@/context/ToastContext";
import { Check, Camera, ImagePlus, MapPin, Clock, Store, Link2, Copy, Share2 } from "lucide-react";

// Préfixes (2 chiffres après le 01) par opérateur — Bénin, plan à 10 chiffres depuis nov. 2024
const PREFIXES_RESEAU: Record<string, string[]> = {
  mtn: ["46", "50", "51", "52", "53", "54", "56", "57", "59", "61", "62", "66", "67", "69", "90", "91", "96", "97"],
  moov: ["55", "58", "60", "63", "64", "65", "68", "94", "95", "98", "99"],
};

const JOURS: { value: Jour; label: string }[] = [
  { value: "lundi", label: "Lundi" },
  { value: "mardi", label: "Mardi" },
  { value: "mercredi", label: "Mercredi" },
  { value: "jeudi", label: "Jeudi" },
  { value: "vendredi", label: "Vendredi" },
  { value: "samedi", label: "Samedi" },
  { value: "dimanche", label: "Dimanche" },
];

const HORAIRES_DEFAUT: Horaires = JOURS.reduce((acc, { value }) => {
  acc[value] = { ouvert: value !== "dimanche", debut: "08:00", fin: "18:00" };
  return acc;
}, {} as Horaires);

const DESCRIPTION_MAX = 300;

function normaliserNumero(numero: string) {
  return numero.replace(/\D/g, "");
}

function formaterNumero(numero: string) {
  const chiffres = normaliserNumero(numero).slice(0, 10);
  return chiffres.match(/.{1,2}/g)?.join(" ") || chiffres;
}

function validerNumero(numero: string, reseau: string): string | null {
  const chiffres = normaliserNumero(numero);
  if (!chiffres) return null;
  if (chiffres.length !== 10) return "Le numéro doit contenir 10 chiffres (préfixe 01 inclus).";
  if (!chiffres.startsWith("01")) return "Le numéro doit commencer par 01 (nouveau format béninois).";
  if (!reseau) return "Choisis un opérateur d'abord.";
  const prefixe = chiffres.slice(2, 4);
  if (!PREFIXES_RESEAU[reseau]?.includes(prefixe)) {
    const labels: Record<string, string> = { mtn: "MTN", moov: "MOOV" };
    return `Ce préfixe (${prefixe}) ne correspond pas à un numéro ${labels[reseau]}.`;
  }
  return null;
}

function LienBoutiqueCard({
  boutique,
  nomBoutique,
}: {
  boutique: Boutique | null;
  nomBoutique: string;
}) {
  const { showToast } = useToast();
  const [origin, setOrigin] = useState("");
  const [canShare, setCanShare] = useState(false);

  useEffect(() => {
    setOrigin(window.location.origin);
    setCanShare(typeof navigator !== "undefined" && !!navigator.share);
  }, []);

  const estValidee = boutique?.statut === "valide";
  const lien = boutique && origin ? `${origin}/boutiques/${boutique.id}` : "";

  const handleCopier = async () => {
    if (!lien) return;
    try {
      await navigator.clipboard.writeText(lien);
      showToast("Lien copié", "success");
    } catch {
      showToast("Impossible de copier le lien", "error");
    }
  };

  const handlePartager = async () => {
    if (!lien) return;
    try {
      await navigator.share({
        title: nomBoutique || "Ma boutique sur Ayiba",
        text: `Découvre et achète directement sur ma boutique Ayiba : ${nomBoutique || ""}`.trim(),
        url: lien,
      });
    } catch {
      // Partage annulé par le vendeur — rien à faire.
    }
  };

  return (
    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <Link2 size={18} className="text-gray-400" />
        <h3 className="text-lg font-bold">Lien de ta boutique</h3>
      </div>
      <p className="text-sm text-gray-500">
        Partage ce lien n'importe où — TikTok live, WhatsApp, Instagram... Toute personne qui
        clique tombe directement sur ta boutique et peut acheter tes produits, même sans compte
        Ayiba.
      </p>

      {estValidee ? (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            readOnly
            value={lien}
            onFocus={(e) => e.target.select()}
            className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm text-gray-600 truncate focus:outline-none"
          />
          <div className="flex gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopier}
              disabled={!lien}
              className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Copy size={16} /> Copier
            </button>
            {canShare && (
              <button
                type="button"
                onClick={handlePartager}
                disabled={!lien}
                className="px-4 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-100 text-gray-700 text-sm font-bold flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">Partager</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <p className="text-xs text-amber-600 font-medium">
          Ton lien sera actif dès que ta boutique aura été validée par notre équipe.
        </p>
      )}
    </div>
  );
}

export default function VendeurBoutiquePage() {
  const { loading, saving, saved, error, boutique, updateBoutique, uploadImage } =
    useVendeurBoutique();

  const [form, setForm] = useState({
    nom_boutique: "",
    description: "",
    quartier: "",
    commune: "",
    latitude: null as number | null,
    longitude: null as number | null,
    mobile_money_network: "" as "mtn" | "moov" | "",
    mobile_money_number: "",
    horaires: HORAIRES_DEFAUT,
  });
  const [initialForm, setInitialForm] = useState(form);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<"logo" | "cover" | null>(null);

  const logoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (boutique) {
      const next = {
        nom_boutique: boutique.nom_boutique || "",
        description: boutique.description || "",
        quartier: boutique.quartier || "",
        commune: boutique.commune || "",
        latitude: boutique.latitude ?? null,
        longitude: boutique.longitude ?? null,
        mobile_money_network: (boutique.mobile_money_network || "") as "mtn" | "moov" | "",
        mobile_money_number: boutique.mobile_money_number || "",
        horaires: boutique.horaires || HORAIRES_DEFAUT,
      };
      setForm(next);
      setInitialForm(next);
      // Un numéro déjà enregistré avant la mise à jour du format (ex: ancien
      // format à 8 chiffres) peut être invalide sans que le vendeur y ait
      // touché. Sans ça, l'erreur bloque le bouton "Enregistrer" en silence,
      // sans jamais s'afficher (l'affichage dépend normalement de `touched`,
      // qui n'est mis à jour qu'à la soumission — impossible si le bouton
      // est déjà désactivé).
      if (next.mobile_money_number && validerNumero(next.mobile_money_number, next.mobile_money_network)) {
        setTouched((prev) => ({ ...prev, mobile_money_number: true }));
      }
    }
  }, [boutique]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleHoraireChange = (jour: Jour, patch: Partial<Horaires[Jour]>) => {
    setForm((prev) => ({
      ...prev,
      horaires: { ...prev.horaires, [jour]: { ...prev.horaires[jour], ...patch } },
    }));
  };

  const errors = useMemo(() => {
    const e: Record<string, string> = {};
    if (!form.nom_boutique.trim()) e.nom_boutique = "Le nom de la boutique est obligatoire.";
    const erreurNumero = validerNumero(form.mobile_money_number, form.mobile_money_network);
    if (erreurNumero) e.mobile_money_number = erreurNumero;
    if (form.latitude === null || form.longitude === null) {
      e.position = "La position de la boutique est obligatoire — sans elle, les frais de livraison facturés à tes clients sont moins fiables.";
    }
    return e;
  }, [form]);

  const isDirty = JSON.stringify(form) !== JSON.stringify(initialForm);
  const canSubmit = isDirty && Object.keys(errors).length === 0 && !saving;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ nom_boutique: true, mobile_money_number: true });
    if (Object.keys(errors).length > 0) return;
    updateBoutique(form);
    setInitialForm(form);
  };

  const handleImageSelect = async (file: File | undefined, kind: "logo" | "cover") => {
    if (!file) return;
    setUploading(kind);
    await uploadImage(file, kind);
    setUploading(null);
  };

  return (
    <DashboardLayout role="vendeur" title="Boutique" backHref="/vendeur/dashboard" backLabel="Dashboard">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          <LienBoutiqueCard boutique={boutique} nomBoutique={form.nom_boutique} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            {boutique?.statut !== "valide" && (
              <div
                className={`p-4 rounded-2xl border text-sm font-medium ${
                  boutique?.statut === "refuse"
                    ? "bg-red-50 border-red-100 text-red-600"
                    : "bg-amber-50 border-amber-100 text-amber-700"
                }`}
              >
                {boutique?.statut === "refuse"
                  ? "Ta boutique a été refusée. Vérifie tes informations et contacte le support."
                  : "Ta boutique est en attente de validation par notre équipe."}
              </div>
            )}

            {/* Logo + couverture */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="relative h-40 bg-gray-100">
                {boutique?.photo_couverture_url ? (
                  <img
                    src={boutique.photo_couverture_url}
                    alt="Couverture de la boutique"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-coral-100 to-amber-50" />
                )}
                <input
                  ref={coverInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleImageSelect(e.target.files?.[0], "cover")}
                />
                <button
                  type="button"
                  onClick={() => coverInputRef.current?.click()}
                  disabled={uploading === "cover"}
                  className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-2 bg-white/90 backdrop-blur rounded-xl text-xs font-bold text-gray-700 hover:bg-white transition-colors disabled:opacity-50"
                >
                  <ImagePlus size={14} />
                  {uploading === "cover" ? "Envoi..." : "Photo de couverture"}
                </button>

                <div className="absolute -bottom-8 left-6">
                  <div className="relative w-20 h-20 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden">
                    {boutique?.photo_profil_url ? (
                      <img
                        src={boutique.photo_profil_url}
                        alt="Logo de la boutique"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                        <Store size={28} />
                      </div>
                    )}
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleImageSelect(e.target.files?.[0], "logo")}
                    />
                    <button
                      type="button"
                      onClick={() => logoInputRef.current?.click()}
                      disabled={uploading === "logo"}
                      className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center text-white"
                    >
                      <Camera size={18} />
                    </button>
                  </div>
                </div>
              </div>
              <div className="h-10" />
            </div>

            {/* Infos boutique */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold">Informations de la boutique</h3>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Nom de la boutique
                </label>
                <input
                  value={form.nom_boutique}
                  onChange={(e) => handleChange("nom_boutique", e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, nom_boutique: true }))}
                  className={`w-full px-4 py-3 rounded-2xl bg-gray-50 border text-sm focus:outline-none focus:ring-2 ${
                    touched.nom_boutique && errors.nom_boutique
                      ? "border-red-200 focus:ring-red-200"
                      : "border-gray-100 focus:ring-coral-200"
                  }`}
                  placeholder="Nom de ta boutique"
                />
                {touched.nom_boutique && errors.nom_boutique && (
                  <p className="mt-1.5 text-xs text-red-600">{errors.nom_boutique}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold uppercase text-gray-500">
                    Description
                  </label>
                  <span
                    className={`text-xs ${
                      form.description.length > DESCRIPTION_MAX ? "text-red-500" : "text-gray-400"
                    }`}
                  >
                    {form.description.length}/{DESCRIPTION_MAX}
                  </span>
                </div>
                <textarea
                  value={form.description}
                  onChange={(e) => handleChange("description", e.target.value.slice(0, DESCRIPTION_MAX))}
                  rows={4}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200 resize-none"
                  placeholder="Présente ta boutique en quelques mots"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                  Adresse de la boutique
                </label>
                {/* Position GPS de la boutique — utilisée directement par
                    calculer_frais_livraison pour facturer une distance de
                    livraison réelle au client ; obligatoire depuis la correction
                    du bug de sous-facturation sur les livraisons longue distance. */}
                <AdresseForm
                  valeurInitiale={{
                    adresse_complete: [form.quartier, form.commune].filter(Boolean).join(", "),
                    quartier: form.quartier,
                    commune: form.commune,
                    latitude: form.latitude ?? undefined,
                    longitude: form.longitude ?? undefined,
                  }}
                  onValider={(adresse) => {
                    setForm((prev) => ({
                      ...prev,
                      quartier: adresse.quartier,
                      commune: adresse.commune,
                      latitude: adresse.latitude,
                      longitude: adresse.longitude,
                    }));
                  }}
                  labelBouton="Valider cette adresse"
                />
              </div>
              {!form.latitude && (
                <p className="text-xs text-red-600 -mt-2">
                  Utilise la recherche d&apos;adresse ci-dessus — tant que la position n&apos;est
                  pas enregistrée, tu ne peux pas enregistrer les autres modifications de ta
                  boutique, et les frais de livraison facturés à tes clients restent une estimation
                  par commune plutôt qu&apos;un calcul réel.
                </p>
              )}
            </div>

            {/* Horaires */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-5">
              <div className="flex items-center gap-2">
                <Clock size={18} className="text-gray-400" />
                <h3 className="text-lg font-bold">Horaires d'ouverture</h3>
              </div>
              <div className="space-y-2">
                {JOURS.map(({ value, label }) => {
                  const jour = form.horaires[value];
                  return (
                    <div
                      key={value}
                      className="flex flex-wrap items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                    >
                      <button
                        type="button"
                        onClick={() => handleHoraireChange(value, { ouvert: !jour.ouvert })}
                        className={`w-24 shrink-0 text-left text-sm font-bold ${
                          jour.ouvert ? "text-gray-900" : "text-gray-300"
                        }`}
                      >
                        {label}
                      </button>
                      {jour.ouvert ? (
                        <div className="flex items-center gap-2 text-sm">
                          <input
                            type="time"
                            value={jour.debut}
                            onChange={(e) => handleHoraireChange(value, { debut: e.target.value })}
                            className="px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-coral-200"
                          />
                          <span className="text-gray-300">—</span>
                          <input
                            type="time"
                            value={jour.fin}
                            onChange={(e) => handleHoraireChange(value, { fin: e.target.value })}
                            className="px-2 py-1.5 rounded-xl bg-gray-50 border border-gray-100 text-xs focus:outline-none focus:ring-2 focus:ring-coral-200"
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300 italic">Fermé</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Money */}
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold">Mobile Money</h3>
              <div className="-mt-4 space-y-1">
                <p className="text-sm text-gray-500">
                  Utilisé pour te reverser tes gains après chaque vente.
                </p>
                <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
                  Vérifie bien ton numéro : les paiements sont automatiques.
                </p>
              </div>

              <MobileMoneySelector
                selected={form.mobile_money_network}
                onSelect={(network) => handleChange("mobile_money_network", network)}
                phoneNumber={form.mobile_money_number}
                onPhoneChange={(value) => {
                  handleChange("mobile_money_number", formaterNumero(value));
                  setTouched((prev) => ({ ...prev, mobile_money_number: true }));
                }}
                error={errors.mobile_money_number}
                touched={touched.mobile_money_number}
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={!canSubmit}
                className="px-6 py-3.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50"
              >
                {saving ? "Enregistrement..." : "Enregistrer"}
              </button>
              {saved && (
                <span className="flex items-center gap-1.5 text-sm font-medium text-teal-600">
                  <Check size={16} /> Modifications enregistrées
                </span>
              )}
            </div>
          </form>

          {/* Aperçu boutique */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="h-28 bg-gray-100">
                {boutique?.photo_couverture_url ? (
                  <img
                    src={boutique.photo_couverture_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-coral-100 to-amber-50" />
                )}
              </div>
              <div className="px-6 pb-6">
                <div className="-mt-8 mb-3 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden">
                  {boutique?.photo_profil_url ? (
                    <img src={boutique.photo_profil_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <Store size={22} />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 truncate">
                  {form.nom_boutique || "Nom de ta boutique"}
                </h4>
                {(form.quartier || form.commune) && (
                  <p className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                    <MapPin size={12} />
                    {[form.quartier, form.commune].filter(Boolean).join(", ")}
                  </p>
                )}
                {form.description && (
                  <p className="text-sm text-gray-600 mt-3 line-clamp-4">{form.description}</p>
                )}
                <p className="text-xs text-gray-400 mt-4">
                  Aperçu de ce que verront les clients — s'actualise pendant que tu remplis le formulaire.
                </p>
              </div>
            </div>
          </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
