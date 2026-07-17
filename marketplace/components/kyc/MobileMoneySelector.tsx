"use client";

import { useState } from "react";

interface MobileMoneyOption {
  id: "mtn" | "moov" | "celtiis";
  label: string;
  logoSrc: string;
  fallbackColor: string;
  fallbackTextColor: string;
}

const MOBILE_MONEY_OPTIONS: MobileMoneyOption[] = [
  {
    id: "mtn",
    label: "MTN MoMo",
    logoSrc: "/logos/mtn.png",
    fallbackColor: "bg-yellow-400",
    fallbackTextColor: "text-black",
  },
  {
    id: "moov",
    label: "Moov Money",
    logoSrc: "/logos/moov.jpg",
    fallbackColor: "bg-blue-600",
    fallbackTextColor: "text-white",
  },
  {
    id: "celtiis",
    label: "Celtiis Cash",
    logoSrc: "/logos/celtiis.jpg",
    fallbackColor: "bg-orange-500",
    fallbackTextColor: "text-white",
  },
];

interface MobileMoneySelectorProps {
  selected: "mtn" | "moov" | "celtiis" | "";
  onSelect: (network: "mtn" | "moov" | "celtiis") => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
  error?: string | null;
  touched?: boolean;
}

export function MobileMoneySelector({
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
  error,
  touched,
}: MobileMoneySelectorProps) {
  const [logoFailed, setLogoFailed] = useState<Record<string, boolean>>({});

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
              onClick={() => onSelect(option.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden transition-all ${
                  failed ? option.fallbackColor : "bg-white"
                } ${isSelected ? "ring-2 ring-coral-500 ring-offset-2" : ""}`}
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
                  isSelected ? "font-semibold text-gray-900" : "font-medium text-gray-600"
                }`}
              >
                {option.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div>
          <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
            Numéro {MOBILE_MONEY_OPTIONS.find((o) => o.id === selected)?.label}
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
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value)}
              placeholder="01 97 00 00 00"
              className="flex-1 px-4 py-3 text-sm bg-transparent focus:outline-none"
            />
          </div>
          {touched && error && <p className="mt-1.5 text-xs text-red-600">{error}</p>}
        </div>
      )}
    </div>
  );
}
