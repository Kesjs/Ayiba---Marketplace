"use client";

import { useState } from "react";
import { Search, Loader2, MapPin } from "lucide-react";
import { useAdresseAutocomplete, type SuggestionAdresse } from "@/lib/hooks/useAdresseAutocomplete";

interface AdresseAutocompleteProps {
  placeholder?: string;
  onSelect: (suggestion: SuggestionAdresse) => void;
}

/**
 * Champ de recherche d'adresse avec suggestions en temps réel (Nominatim,
 * restreint au Bénin). Sélectionner une suggestion renvoie les coordonnées
 * GPS + commune/quartier détectés, à utiliser pour préremplir le reste du
 * formulaire d'adresse — qui reste éditable ensuite, la détection n'étant
 * qu'une aide de saisie, pas une source de vérité absolue.
 */
export function AdresseAutocomplete({ placeholder = "Rechercher une adresse...", onSelect }: AdresseAutocompleteProps) {
  const [requete, setRequete] = useState("");
  const [ouvert, setOuvert] = useState(false);
  const { suggestions, loading } = useAdresseAutocomplete(requete);

  const choisir = (s: SuggestionAdresse) => {
    onSelect(s);
    setRequete(s.texte);
    setOuvert(false);
  };

  return (
    <div className="relative">
      <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors">
        {loading ? (
          <Loader2 size={16} className="text-gray-400 shrink-0 animate-spin" />
        ) : (
          <Search size={16} className="text-gray-400 shrink-0" />
        )}
        <input
          type="text"
          value={requete}
          onChange={(e) => {
            setRequete(e.target.value);
            setOuvert(true);
          }}
          onFocus={() => setOuvert(true)}
          onBlur={() => setTimeout(() => setOuvert(false), 150)}
          placeholder={placeholder}
          className="flex-1 h-11 text-sm px-2 focus:outline-none"
        />
      </div>

      {ouvert && requete.trim().length >= 3 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-lg border border-gray-200 shadow-lg max-h-64 overflow-y-auto">
          {suggestions.length === 0 && !loading && (
            <p className="px-3 py-3 text-sm text-gray-400">Aucune adresse trouvée — complète les champs ci-dessous manuellement.</p>
          )}
          {suggestions.map((s) => (
            <button
              key={s.id}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => choisir(s)}
              className="w-full flex items-start gap-2 px-3 py-2.5 text-left text-sm hover:bg-coral-50 transition-colors border-b border-gray-50 last:border-0"
            >
              <MapPin size={14} className="text-coral-400 shrink-0 mt-0.5" />
              <span className="text-gray-700 leading-snug">{s.texte}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
