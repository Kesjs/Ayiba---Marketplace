"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ShieldCheck } from "lucide-react";

interface MobileMoneyOption {
  id: "mtn" | "moov" | "celtiis";
  label: string;
  logoSrc: string;
  fallbackColor: string;
  fallbackTextColor: string;
  /** Préfixes (2 chiffres après le "01" national) utilisés pour l'auto-détection — à ajuster si besoin. */
  prefixes: string[];
}

const MOBILE_MONEY_OPTIONS: MobileMoneyOption[] = [
  {
    id: "mtn",
    label: "MTN MoMo",
    logoSrc: "/logos/mtn.png",
    fallbackColor: "bg-yellow-400",
    fallbackTextColor: "text-black",
    prefixes: ["61", "62", "66", "67", "69", "90", "91", "92", "93", "94", "95", "96", "97"],
  },
  {
    id: "moov",
    label: "Moov Money",
    logoSrc: "/logos/moov.jpg",
    fallbackColor: "bg-blue-600",
    fallbackTextColor: "text-white",
    prefixes: ["60", "63", "64", "65", "68", "98", "99"],
  },
  {
    id: "celtiis",
    label: "Celtiis Cash",
    logoSrc: "/logos/celtiis.jpg",
    fallbackColor: "bg-orange-500",
    fallbackTextColor: "text-white",
    prefixes: ["55", "56"],
  },
];

/** Détecte le réseau à partir des 2 premiers chiffres significatifs du numéro. Retourne null si indéterminé. */
function detecterReseau(numero: string): "mtn" | "moov" | "celtiis" | null {
  let chiffres = numero.replace(/\D/g, "");
  // Au cas où l'indicatif pays serait déjà collé au numéro (ex: valeur
  // reprise telle quelle depuis le profil), on le retire avant détection.
  if (chiffres.startsWith("229")) chiffres = chiffres.slice(3);
  const sansIndicatifNational = chiffres.startsWith("01") ? chiffres.slice(2) : chiffres;
  const deuxChiffres = sansIndicatifNational.slice(0, 2);
  if (deuxChiffres.length < 2) return null;
  return MOBILE_MONEY_OPTIONS.find((o) => o.prefixes.includes(deuxChiffres))?.id ?? null;
}

/** Numéro tel qu'il doit s'afficher à côté du badge "+229" — jamais l'indicatif en double. */
function numeroPourAffichage(numero: string): string {
  const chiffres = numero.replace(/\D/g, "");
  return chiffres.startsWith("229") ? chiffres.slice(3) : numero;
}

interface MobileMoneySelectorProps {
  selected: "mtn" | "moov" | "celtiis" | "" | null;
  onSelect: (network: "mtn" | "moov" | "celtiis") => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  /** Montant total à payer, affiché dans le récap final. */
  montant?: number;
  error?: string | null;
  touched?: boolean;
}

export function MobileMoneySelector({
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
  montant,
  error,
  touched,
}: MobileMoneySelectorProps) {
  const [logoFailed, setLogoFailed] = useState<Record<string, boolean>>({});
  // Tant que l'utilisateur n'a pas choisi lui-même une carte, on laisse l'auto-détection piloter la sélection.
  const [choisiManuellement, setChoisiManuellement] = useState(false);

  const detecte = useMemo(() => detecterReseau(phoneNumber), [phoneNumber]);

  useEffect(() => {
    if (choisiManuellement) return;
    if (detecte && detecte !== selected) onSelect(detecte);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detecte, choisiManuellement]);

  const estAutoDetecte = !choisiManuellement && !!selected && detecte === selected;

  const handleSelect = (id: "mtn" | "moov" | "celtiis") => {
    setChoisiManuellement(true);
    onSelect(id);
  };

  return (
    <div className="w-full">
      <label className="block text-xs font-bold uppercase text-gray-500 mb-3">
        Réseau Mobile Money
      </label>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {MOBILE_MONEY_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          const failed = logoFailed[option.id];
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => handleSelect(option.id)}
              aria-pressed={isSelected}
              className={`relative flex flex-col items-center gap-2 p-3 pt-4 rounded-2xl border-2 transition-all ${
                isSelected
                  ? "border-coral-500 bg-coral-50/60 shadow-sm shadow-coral-500/10"
                  : "border-gray-100 bg-white hover:border-gray-200"
              }`}
            >
              {isSelected && (
                <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-coral-500 text-white flex items-center justify-center">
                  <Check size={10} strokeWidth={3.5} />
                </span>
              )}
              {isSelected && estAutoDetecte && (
                <span className="absolute top-2 left-2 text-[9px] font-bold text-teal-600 bg-teal-50 rounded-full px-1.5 py-0.5">
                  détecté
                </span>
              )}
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden ${
                  failed ? option.fallbackColor : "bg-white"
                }`}
              >
                {failed ? (
                  <span className={`text-xs font-bold ${option.fallbackTextColor}`}>
                    {option.label.slice(0, 2).toUpperCase()}
                  </span>
                ) : (
                  <img
                    src={option.logoSrc}
                    alt={option.label}
                    className="w-full h-full object-contain p-1"
                    onError={() => setLogoFailed((prev) => ({ ...prev, [option.id]: true }))}
                  />
                )}
              </div>
              <span
                className={`text-[11px] text-center leading-tight ${
                  isSelected ? "font-bold text-coral-700" : "font-medium text-gray-600"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toujours visible — jamais d'écran "à moitié vide" en attendant un choix de réseau */}
      <div className="mb-5">
        <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
          {selected ? `Numéro ${MOBILE_MONEY_OPTIONS.find((o) => o.id === selected)?.label}` : "Ton numéro Mobile Money"}
        </label>
        <div
          className={`flex rounded-2xl overflow-hidden border bg-gray-50 focus-within:ring-2 ${
            touched && error
              ? "border-red-200 focus-within:ring-red-200"
              : "border-gray-100 focus-within:ring-coral-200"
          }`}
        >
          <span className="inline-flex items-center gap-2 px-3 bg-gray-100 border-r border-gray-200 text-sm text-gray-500 font-medium">
            <span className="text-lg">🇧🇯</span>
            +229
          </span>
          <input
            type="tel"
            inputMode="numeric"
            value={numeroPourAffichage(phoneNumber)}
            onChange={(e) => onPhoneChange(e.target.value)}
            placeholder="01 97 00 00 00"
            className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
          />
        </div>
        {touched && error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
      </div>

      {/* Récap — comble le vide vertical utilement plutôt que de le laisser vide */}
      {selected && phoneNumber.trim() && (
        <div className="flex items-center gap-2.5 p-3.5 rounded-xl bg-teal-50/60">
          <ShieldCheck size={16} className="text-teal-500 shrink-0" />
          <p className="text-xs text-gray-600">
            {typeof montant === "number" ? (
              <>
                Tu payes <span className="font-bold text-gray-800">{montant.toLocaleString("fr-FR")} F</span> depuis{" "}
                <span className="font-bold text-gray-800">+229 {numeroPourAffichage(phoneNumber)}</span>
              </>
            ) : (
              <>
                Paiement depuis <span className="font-bold text-gray-800">+229 {numeroPourAffichage(phoneNumber)}</span>
              </>
            )}
          </p>
        </div>
      )}
    </div>
  );
}
