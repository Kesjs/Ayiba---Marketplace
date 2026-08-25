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
    <button
      type="button"
      onClick={handleBack}
      className={`group relative inline-flex items-center gap-2.5 py-1.5 px-2.5 -ml-2.5 rounded-xl transition-all duration-200 hover:bg-gray-100/80 active:scale-[0.98] cursor-pointer text-left ${className}`}
      title="Retour à la page précédente"
      aria-label="Retour"
    >
      {/* Back Arrow with smooth slide-in hover effect */}
      <div className="w-8 h-8 rounded-lg bg-gray-100 group-hover:bg-coral-500 flex items-center justify-center text-gray-500 group-hover:text-white transition-all duration-200 shadow-2xs shrink-0">
        <ArrowLeft size={16} className="transition-transform duration-200 group-hover:-translate-x-0.5" />
      </div>

      {/* Logo and optional subtle 'Retour' hint */}
      <div className="flex flex-col">
        <LogoAyiba className="h-7 md:h-8 w-auto transition-opacity duration-200" />
        <span className="text-[10px] font-semibold text-gray-400 group-hover:text-coral-600 transition-colors -mt-0.5 tracking-tight flex items-center gap-1">
          Retour
        </span>
      </div>
    </button>
  );
}

export default AuthHeaderBack;
