"use client";

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
  selected: "mtn" | "moov" | "celtiis" | null;
  onSelect: (network: "mtn" | "moov" | "celtiis") => void;
  phoneNumber: string;
  onPhoneChange: (value: string) => void;
}

export function MobileMoneySelector({
  selected,
  onSelect,
  phoneNumber,
  onPhoneChange,
}: MobileMoneySelectorProps) {
  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-3">
        Réseau Mobile Money
      </label>

      <div className="grid grid-cols-3 gap-3 mb-5">
        {MOBILE_MONEY_OPTIONS.map((option) => {
          const isSelected = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => onSelect(option.id)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all"
            >
              <div
                className={`w-12 h-12 rounded-lg flex items-center justify-center overflow-hidden transition-all ${option.fallbackColor} ${
                  isSelected ? "ring-2 ring-gray-900 ring-offset-2" : ""
                }`}
              >
                <img
                  src={option.logoSrc}
                  alt={option.label}
                  className="w-full h-full object-contain p-1.5"
                  onError={(e) => {
                    // Fallback si le logo n'existe pas encore dans /public/logos
                    (e.target as HTMLImageElement).style.display = "none";
                    const parent = (e.target as HTMLImageElement).parentElement;
                    if (parent) {
                      const initials = option.label.slice(0, 2).toUpperCase();
                      parent.innerHTML = `<span class="text-xs font-bold ${option.fallbackTextColor}">${initials}</span>`;
                    }
                  }}
                />
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
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Numéro {MOBILE_MONEY_OPTIONS.find((o) => o.id === selected)?.label}
          </label>
          <div className="flex rounded-lg overflow-hidden border border-gray-200 focus-within:border-gray-400 transition-colors">
            <span className="inline-flex items-center gap-2 px-3 bg-gray-50 border-r border-gray-200 text-sm text-gray-500 font-medium">
              <span className="text-lg">🇧🇯</span>
              +229
            </span>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => onPhoneChange(e.target.value.replace(/\D/g, "").slice(0, 8))}
              placeholder="97 00 00 00"
              className="flex-1 h-11 px-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
