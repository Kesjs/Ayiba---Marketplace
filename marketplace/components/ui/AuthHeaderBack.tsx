"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import LogoAyiba from "@/components/ui/LogoAyiba";

interface AuthHeaderBackProps {
  className?: string;
  fallbackUrl?: string;
}

export function AuthHeaderBack({ className = "", fallbackUrl = "/" }: AuthHeaderBackProps) {
  const router = useRouter();

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push(fallbackUrl);
    }
  };

  return (
    <div className={`flex items-center gap-3.5 ${className}`}>
      {/* Bouton Flèche Retour style Stripe Checkout */}
      <button
        type="button"
        onClick={handleBack}
        className="group flex items-center gap-2 py-1.5 px-2.5 -ml-2.5 rounded-full hover:bg-gray-100 active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Retour à la page précédente"
        title="Retour à la page précédente"
      >
        <div className="w-8 h-8 rounded-full border border-gray-200 bg-white group-hover:border-coral-400 group-hover:bg-coral-50 flex items-center justify-center text-gray-500 group-hover:text-coral-600 transition-all duration-200 shadow-2xs">
          <ArrowLeft size={15} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
        </div>
        <span className="text-xs font-bold text-gray-500 group-hover:text-gray-900 transition-colors">
          Retour
        </span>
      </button>

      {/* Séparateur discret */}
      <div className="h-5 w-[1px] bg-gray-200/80 shrink-0" />

      {/* Logo Ayiba Officiel sur la même ligne */}
      <button
        type="button"
        onClick={handleBack}
        className="hover:opacity-85 active:scale-98 transition-all cursor-pointer flex items-center"
        title="Retour"
      >
        <LogoAyiba className="h-8 md:h-9 w-auto" />
      </button>
    </div>
  );
}

export default AuthHeaderBack;
