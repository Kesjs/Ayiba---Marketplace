"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVendeurBoutique, type Horaires, type Jour } from "../../hooks/useVendeurBoutique";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { MobileMoneySelector } from "@/components/boutique/MobileMoneySelector";
import { AdresseForm } from "@/components/adresse/AdresseForm";
import { Check, Camera, ImagePlus, MapPin, Clock, Store, Star, CheckCircle2, MessageCircle, Copy, ExternalLink, Share2, Globe } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { fetchVendeurStats, type VendeurStats } from "@/lib/catalogue";

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
  const [copied, setCopied] = useState(false);

  const publicBoutiqueUrl = boutique?.id
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/boutiques/${boutique.id}`
    : "";

  const handleCopyLink = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!publicBoutiqueUrl) return;
    navigator.clipboard.writeText(publicBoutiqueUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Stats réelles (note moyenne, avis) pour que l'aperçu montre vraiment ce
  // que les clients voient sur /boutiques/[id] — avant, l'aperçu ne montrait
  // ni note ni bouton "Contacter", deux éléments bien présents sur la vraie
  // page publique : le vendeur ne voyait donc jamais un aperçu fidèle.
  const [stats, setStats] = useState<VendeurStats | null>(null);
  useEffect(() => {
    if (!boutique?.id) return;
    let cancelled = false;
    const supabase = createClient();
    fetchVendeurStats(supabase, boutique.id).then((s) => {
      if (!cancelled) setStats(s);
    });
    return () => {
      cancelled = true;
    };
  }, [boutique?.id]);

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
    <DashboardLayout role="vendeur" title="Ma boutique" backHref="/vendeur/dashboard" backLabel="Dashboard">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-8">
            {/* CARTE LIEN PUBLIC BOUTIQUE & PARTAGE */}
            {boutique?.id && (
              <div className="bg-gradient-to-br from-coral-50/90 via-amber-50/40 to-teal-50/40 rounded-3xl border border-coral-200/80 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-2xl bg-coral-500 text-white flex items-center justify-center shadow-xs">
                      <Share2 size={18} />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 leading-tight">Lien public de ta boutique</h3>
                      <p className="text-xs text-gray-500 font-medium">Partage ce lien avec tes clients sur WhatsApp, Facebook ou Instagram</p>
                    </div>
                  </div>
                  <span className="bg-teal-100 text-teal-700 text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <Globe size={12} /> Accessible sans connexion
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2 pt-1">
                  <div className="relative w-full flex-1">
                    <input
                      type="text"
                      readOnly
                      value={publicBoutiqueUrl}
                      className="w-full bg-white border border-gray-200 rounded-2xl py-3 pl-4 pr-4 text-xs md:text-sm font-semibold text-gray-800 outline-none select-all shadow-xs"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                    <motion.button
                      type="button"
                      whileTap={{ scale: 0.95 }}
                      onClick={handleCopyLink}
                      className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs md:text-sm font-bold transition-all shadow-xs cursor-pointer ${
                        copied
                          ? "bg-teal-500 text-white shadow-teal-500/20"
                          : "bg-coral-500 hover:bg-coral-600 text-white shadow-coral-500/20"
                      }`}
                    >
                      <AnimatePresence mode="wait" initial={false}>
                        {copied ? (
                          <motion.span
                            key="copied"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex items-center gap-1.5"
                          >
                            <CheckCircle2 size={16} /> Lien copié !
                          </motion.span>
                        ) : (
                          <motion.span
                            key="copy"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            className="flex items-center gap-1.5"
                          >
                            <Copy size={16} /> Copier le lien
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </motion.button>

                    <a
                      href={`/boutiques/${boutique.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center p-3 rounded-2xl bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition-colors shadow-xs cursor-pointer"
                      title="Ouvrir ma boutique publique"
                    >
                      <ExternalLink size={18} />
                    </a>
                  </div>
                </div>
              </div>
            )}

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
                    // Enregistrement immédiat (comme le bouton "Enregistrer"
                    // plus bas) — avant, la validation ne mettait à jour que
                    // le state local `form`, ce qui donnait l'impression
                    // d'être enregistré alors que ça disparaissait au
                    // rechargement de la page tant qu'on n'avait pas cliqué
                    // sur "Enregistrer" séparément.
                    const next = {
                      ...form,
                      quartier: adresse.quartier,
                      commune: adresse.commune,
                      latitude: adresse.latitude,
                      longitude: adresse.longitude,
                    };
                    setForm(next);
                    setInitialForm(next);
                    updateBoutique(next);
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
                <div className="relative -mt-8 mb-3 w-16 h-16 rounded-2xl bg-white border-4 border-white shadow-md overflow-hidden">
                  {boutique?.photo_profil_url ? (
                    <img src={boutique.photo_profil_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-300">
                      <Store size={22} />
                    </div>
                  )}
                  {boutique?.statut === "valide" && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 size={16} className="text-teal-500 fill-teal-50" />
                    </div>
                  )}
                </div>
                <h4 className="font-bold text-gray-900 truncate">
                  {form.nom_boutique || "Nom de ta boutique"}
                </h4>

                <div className="flex flex-wrap items-center gap-2 mt-1.5">
                  {stats && stats.reviewCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{stats.rating}</span>
                      <span className="text-[11px] text-gray-400">({stats.reviewCount})</span>
                    </div>
                  )}
                  {(form.quartier || form.commune) && (
                    <p className="flex items-center gap-1 text-xs text-gray-500">
                      <MapPin size={12} />
                      {[form.quartier, form.commune].filter(Boolean).join(", ")}
                    </p>
                  )}
                </div>

                {/* Description complète, non tronquée : contrairement à la
                    carte affichée dans les listes (qui coupe à 2 lignes avec
                    "Voir plus"), c'est ici, en train de la rédiger, que le
                    vendeur doit pouvoir relire l'intégralité de son texte. */}
                {form.description && (
                  <p className="text-sm text-gray-600 mt-3 whitespace-pre-wrap">{form.description}</p>
                )}

                <button
                  type="button"
                  disabled
                  className="mt-4 w-full inline-flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 px-3 py-2 rounded-lg border border-gray-200 bg-gray-50 cursor-default"
                >
                  <MessageCircle size={13} />
                  Contacter
                </button>

                <p className="text-xs text-gray-400 mt-4">
                  Aperçu de ce que verront les clients (sur ta page boutique et dans les
                  listes de boutiques) — s'actualise pendant que tu remplis le formulaire.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
