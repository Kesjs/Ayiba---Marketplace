"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AnimatePresence, motion } from "framer-motion";
import { Search, Loader2, MapPin, LocateFixed, Pencil, Check } from "lucide-react";
import { useAdresseAutocomplete, type SuggestionAdresse } from "@/lib/hooks/useAdresseAutocomplete";
import { useGeolocationAdresse } from "@/lib/hooks/useGeolocationAdresse";
import { Button } from "@/components/ui/Button";

// Leaflet touche `window` au chargement du module — doit être importé en
// dynamique sans SSR, comme partout ailleurs où AdresseCarte est utilisée.
const AdresseCarte = dynamic(() => import("@/components/adresses/AdresseCarte").then((m) => m.AdresseCarte), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 animate-pulse" />,
});

export interface AdresseFormValue {
  adresse_complete: string;
  quartier: string;
  commune: string;
  latitude: number;
  longitude: number;
}

interface AdresseFormProps {
  /** Adresse déjà enregistrée, le cas échéant — affiche un résumé plutôt que de repartir de la recherche. */
  valeurInitiale?: Partial<AdresseFormValue> | null;
  /** Appelé dès que la position est validée (recherche+carte OU géolocalisation+carte). */
  onValider: (adresse: AdresseFormValue) => void;
  labelBouton?: string;
  className?: string;
}

type Etape = "resume" | "recherche" | "position";

/**
 * Composant d'adresse partagé (recherche géocodée + carte + ajustement du
 * pin) — extrait de app/(client)/adresses/nouvelle/page.tsx pour être
 * réutilisé partout où une position GPS est nécessaire (boutique vendeur,
 * KYC vendeur, KYC livreur), au lieu de la recherche+select commune sans
 * carte qui existait à ces endroits. Contrairement à la version client
 * (route plein écran, écrit directement dans la table `addresses`, gère
 * label/repère/adresse par défaut), celui-ci est un composant inline,
 * agnostique de la table de destination : il ne fait que remonter
 * {adresse_complete, quartier, commune, latitude, longitude} via onValider,
 * au formulaire parent de les enregistrer où il veut.
 */
export function AdresseForm({ valeurInitiale, onValider, labelBouton = "Valider cette position", className }: AdresseFormProps) {
  const aUnePositionInitiale = valeurInitiale?.latitude != null && valeurInitiale?.longitude != null;

  const [etape, setEtape] = useState<Etape>(aUnePositionInitiale ? "resume" : "recherche");
  const [requete, setRequete] = useState("");
  const { suggestions, loading: rechercheEnCours } = useAdresseAutocomplete(requete);
  const { localiser, loading: localisationEnCours } = useGeolocationAdresse();

  const [texteAdresse, setTexteAdresse] = useState(valeurInitiale?.adresse_complete ?? "");
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(
    aUnePositionInitiale ? { lat: valeurInitiale!.latitude as number, lng: valeurInitiale!.longitude as number } : null
  );
  const [commune, setCommune] = useState(valeurInitiale?.commune ?? "");
  const [quartier, setQuartier] = useState(valeurInitiale?.quartier ?? "");

  const choisirSuggestion = (s: SuggestionAdresse) => {
    setTexteAdresse(s.texte);
    setPosition({ lat: s.latitude, lng: s.longitude });
    setCommune(s.commune || commune);
    setQuartier(s.quartier || quartier);
    setEtape("position");
  };

  const utiliserMaPosition = async () => {
    try {
      const resultat = await localiser();
      setPosition({ lat: resultat.latitude, lng: resultat.longitude });
      if (resultat.communeDetectee) setCommune(resultat.communeDetectee);
      if (resultat.quartierDetecte) setQuartier(resultat.quartierDetecte);
      setTexteAdresse((prev) => prev || [resultat.quartierDetecte, resultat.communeDetectee].filter(Boolean).join(", ") || "Position actuelle");
      setEtape("position");
    } catch {
      // erreur déjà exposée par le hook (localisation refusée/indisponible)
    }
  };

  const valider = () => {
    if (!position) return;
    onValider({
      adresse_complete: texteAdresse || [quartier, commune].filter(Boolean).join(", "),
      quartier,
      commune,
      latitude: position.lat,
      longitude: position.lng,
    });
    setEtape("resume");
  };

  return (
    <div className={className}>
      <AnimatePresence mode="wait">
        {etape === "resume" && position && (
          <motion.div
            key="resume"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-gray-100 bg-teal-50/40"
          >
            <div className="flex items-start gap-2 min-w-0">
              <MapPin size={16} className="text-teal-600 shrink-0 mt-0.5" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">{texteAdresse || [quartier, commune].filter(Boolean).join(", ")}</p>
                <p className="text-xs text-gray-400">Lat : {position.lat.toFixed(5)} · Lng : {position.lng.toFixed(5)}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setEtape("recherche")}
              className="shrink-0 flex items-center gap-1.5 h-9 px-3 rounded-xl bg-white border border-gray-200 text-xs font-bold text-gray-700 hover:border-coral-300 transition-colors"
            >
              <Pencil size={12} /> Modifier
            </button>
          </motion.div>
        )}

        {etape === "recherche" && (
          <motion.div key="recherche" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="flex items-center border border-gray-200 rounded-xl px-3 focus-within:border-coral-400 transition-colors">
              {rechercheEnCours ? (
                <Loader2 size={16} className="text-gray-400 shrink-0 animate-spin" />
              ) : (
                <Search size={16} className="text-gray-400 shrink-0" />
              )}
              <input
                type="text"
                value={requete}
                onChange={(e) => setRequete(e.target.value)}
                placeholder="Rechercher une adresse (rue, quartier, ville)..."
                className="flex-1 h-11 text-sm px-2 focus:outline-none"
              />
            </div>

            {requete.trim().length >= 3 && (
              <div className="rounded-xl border border-gray-100 max-h-56 overflow-y-auto divide-y divide-gray-50">
                {suggestions.length === 0 && !rechercheEnCours && (
                  <p className="px-3 py-3 text-sm text-gray-400">Aucune adresse trouvée.</p>
                )}
                {suggestions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => choisirSuggestion(s)}
                    className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-coral-50 transition-colors"
                  >
                    <MapPin size={14} className="text-coral-400 shrink-0 mt-0.5" />
                    <span className="text-gray-700 leading-snug">{s.texte}</span>
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={utiliserMaPosition}
              disabled={localisationEnCours}
              className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-coral-50 text-coral-700 font-semibold text-sm hover:bg-coral-100 transition-colors disabled:opacity-60"
            >
              {localisationEnCours ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              {localisationEnCours ? "Localisation..." : "Utiliser ma position actuelle"}
            </button>
          </motion.div>
        )}

        {etape === "position" && position && (
          <motion.div key="position" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <p className="text-xs text-gray-500">Fais glisser la carte pour ajuster précisément le repère si nécessaire.</p>
            <div className="h-56 rounded-2xl overflow-hidden border border-gray-100">
              <AdresseCarte
                latitude={position.lat}
                longitude={position.lng}
                draggable
                onPositionChange={(lat, lng) => setPosition({ lat, lng })}
              />
            </div>
            <p className="text-sm font-medium text-gray-900 truncate">{texteAdresse}</p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEtape("recherche")}
                className="shrink-0 h-11 px-4 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:border-coral-300 transition-colors"
              >
                Retour
              </button>
              <Button type="button" onClick={valider} className="flex-1 flex items-center justify-center gap-2">
                <Check size={16} /> {labelBouton}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
