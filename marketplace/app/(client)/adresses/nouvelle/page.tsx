"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Search, MapPin, Loader2, Home, Briefcase, MoreHorizontal, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { ChipSelect } from "@/components/ui/ChipSelect";
import { useAdresseAutocomplete, type SuggestionAdresse } from "@/lib/hooks/useAdresseAutocomplete";

// Leaflet touche `window` au chargement du module — comme DeliveryMap,
// doit être importé en dynamique sans SSR pour ne pas casser `next build`.
const AdresseCarte = dynamic(() => import("@/components/adresses/AdresseCarte").then((m) => m.AdresseCarte), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse" />,
});

const OPTIONS_LABEL = [
  { value: "domicile", label: "Maison", icon: Home },
  { value: "bureau", label: "Bureau", icon: Briefcase },
  { value: "autre", label: "Autre", icon: MoreHorizontal },
];

const TITRES_ETAPE = [
  "Rechercher une adresse",
  "Confirmer l'adresse",
  "Ajuster la position",
  "Compléter l'adresse",
  "",
];

function NouvelleAdressePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const retour = searchParams.get("retour") || "/profil";
  const supabase = createClient();
  const { showToast } = useToast();
  const { profile } = useUser();

  const [etape, setEtape] = useState(1);
  const [requete, setRequete] = useState("");
  const { suggestions, loading: rechercheEnCours } = useAdresseAutocomplete(requete);

  const [suggestion, setSuggestion] = useState<SuggestionAdresse | null>(null);
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [label, setLabel] = useState("domicile");
  const [repere, setRepere] = useState("");
  const [estDefaut, setEstDefaut] = useState(false);
  const [saving, setSaving] = useState(false);

  const choisirSuggestion = (s: SuggestionAdresse) => {
    setSuggestion(s);
    setPosition({ lat: s.latitude, lng: s.longitude });
    setEtape(2);
  };

  const enregistrer = async () => {
    if (!profile?.id || !suggestion || !position) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("addresses").insert({
        user_id: profile.id,
        label,
        adresse_complete: suggestion.texte,
        quartier: suggestion.quartier ?? "",
        commune: suggestion.commune ?? "",
        latitude: position.lat,
        longitude: position.lng,
        repere: repere.trim() || null,
        est_defaut: estDefaut,
      });
      if (error) throw error;
      setEtape(5);
    } catch (err) {
      console.error("[NouvelleAdresse] erreur d'enregistrement:", err);
      showToast("Erreur lors de l'enregistrement de l'adresse", "error");
    } finally {
      setSaving(false);
    }
  };

  const retourner = () => {
    if (etape === 1) router.push(retour);
    else setEtape(etape - 1);
  };

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* En-tête */}
      {etape < 5 && (
        <div className="flex items-center gap-3 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pb-3 border-b border-gray-50 shrink-0">
          <button onClick={retourner} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50 shrink-0">
            <ArrowLeft size={20} className="text-gray-700" />
          </button>
          <div>
            <p className="text-[11px] font-semibold text-coral-400 uppercase tracking-wide">Étape {etape} sur 4</p>
            <h1 className="text-base font-bold text-gray-900">{TITRES_ETAPE[etape - 1]}</h1>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* Étape 1 — Recherche */}
        {etape === 1 && (
          <motion.div key="1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <div className="p-4 shrink-0">
              <div className="flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-coral-400 transition-colors">
                {rechercheEnCours ? (
                  <Loader2 size={18} className="text-gray-400 shrink-0 animate-spin" />
                ) : (
                  <Search size={18} className="text-gray-400 shrink-0" />
                )}
                <input
                  autoFocus
                  type="text"
                  value={requete}
                  onChange={(e) => setRequete(e.target.value)}
                  placeholder="Rechercher une adresse"
                  className="flex-1 h-12 text-sm px-2 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4 pb-6">
              {requete.trim().length < 3 && (
                <p className="text-sm text-gray-400 text-center py-8">Tape au moins 3 lettres pour voir des suggestions.</p>
              )}
              {requete.trim().length >= 3 && suggestions.length === 0 && !rechercheEnCours && (
                <p className="text-sm text-gray-400 text-center py-8">Aucune adresse trouvée.</p>
              )}
              <div className="space-y-1">
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => choisirSuggestion(s)}
                    className="w-full flex items-start gap-3 px-3 py-3 text-left rounded-xl hover:bg-coral-50 transition-colors"
                  >
                    <MapPin size={16} className="text-coral-400 shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 leading-snug">{s.texte}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Étape 2 — Confirmation */}
        {etape === 2 && suggestion && position && (
          <motion.div key="2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 min-h-0">
              <AdresseCarte latitude={position.lat} longitude={position.lng} />
            </div>
            <div className="p-4 shrink-0 space-y-4">
              <div className="border border-gray-100 rounded-xl p-3">
                <p className="text-sm font-semibold text-gray-900">{suggestion.texte}</p>
                <p className="text-xs text-gray-400 mt-1">
                  Lat : {position.lat.toFixed(6)} · Lng : {position.lng.toFixed(6)}
                </p>
              </div>
              <Button onClick={() => setEtape(3)} className="w-full">
                Utiliser cette adresse
              </Button>
            </div>
          </motion.div>
        )}

        {/* Étape 3 — Ajustement du pin */}
        {etape === 3 && position && (
          <motion.div key="3" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
            <p className="text-xs text-gray-500 text-center px-4 py-2 shrink-0">Déplace la carte pour ajuster précisément le repère si nécessaire.</p>
            <div className="flex-1 min-h-0">
              <AdresseCarte
                latitude={position.lat}
                longitude={position.lng}
                draggable
                onPositionChange={(lat, lng) => setPosition({ lat, lng })}
              />
            </div>
            <div className="p-4 shrink-0">
              <Button onClick={() => setEtape(4)} className="w-full">
                Enregistrer cette position
              </Button>
            </div>
          </motion.div>
        )}

        {/* Étape 4 — Complément */}
        {etape === 4 && (
          <motion.div key="4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Nom de l&rsquo;adresse</p>
              <ChipSelect layoutId="label-nouvelle-adresse" options={OPTIONS_LABEL} value={label} onChange={setLabel} />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Complément (facultatif)</p>
              <textarea
                value={repere}
                onChange={(e) => setRepere(e.target.value)}
                placeholder="Ex : Maison jaune, portail noir, 2ème étage, en face de..."
                rows={3}
                maxLength={100}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-coral-400 transition-colors resize-none"
              />
              <p className="text-[11px] text-gray-400 text-right mt-1">{repere.length}/100</p>
            </div>
            <label className="flex items-center justify-between border border-gray-100 rounded-xl px-4 py-3 cursor-pointer">
              <span className="text-sm text-gray-900">Définir comme adresse principale</span>
              <input type="checkbox" checked={estDefaut} onChange={(e) => setEstDefaut(e.target.checked)} className="w-5 h-5 accent-coral-400" />
            </label>
            <Button onClick={enregistrer} disabled={saving} className="w-full">
              {saving ? <Loader2 size={16} className="animate-spin" /> : "Enregistrer"}
            </Button>
          </motion.div>
        )}

        {/* Étape 5 — Confirmation finale */}
        {etape === 5 && (
          <motion.div
            key="5"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-6"
          >
            <div className="w-20 h-20 rounded-full bg-teal-50 flex items-center justify-center">
              <CheckCircle2 size={40} className="text-teal-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Adresse enregistrée !</h2>
              <p className="text-sm text-gray-500 mt-1">Ton adresse a été enregistrée avec succès.</p>
            </div>
            <div className="w-full space-y-2 max-w-xs">
              <Button onClick={() => router.push(retour)} className="w-full">
                Voir mes adresses
              </Button>
              <Button variant="outline" onClick={() => router.push(retour)} className="w-full">
                Fermer
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function NouvelleAdresseRoute() {
  return (
    <Suspense fallback={<div className="fixed inset-0 z-50 bg-white" />}>
      <NouvelleAdressePage />
    </Suspense>
  );
}
