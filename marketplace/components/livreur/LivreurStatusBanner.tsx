"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Clock, ShieldCheck, ChevronRight } from "lucide-react";

interface LivreurStatusBannerProps {
  statut: string;
  raisonRejet: string | null;
}

export function LivreurStatusBanner({ statut, raisonRejet }: LivreurStatusBannerProps) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (statut === "valide" || dismissed) return null;

  if (statut === "en_attente") {
    return (
      <div className="bg-amber-50 border-b border-amber-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <p className="text-sm text-amber-800 flex-1">
            Ton compte est en cours de vérification. Certaines missions restent limitées en
            attendant la validation (sous 24-48h).
          </p>
        </div>
      </div>
    );
  }

  if (statut === "refuse") {
    return (
      <div className="bg-red-50 border-b border-red-100 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <AlertTriangle size={18} className="text-red-600 shrink-0" />
          <p className="text-sm text-red-800 flex-1">
            Vérification refusée{raisonRejet ? ` : ${raisonRejet}` : "."}
          </p>
          <button
            onClick={() => router.push("/livreur/kyc")}
            className="flex items-center gap-1 text-sm font-semibold text-red-700 hover:text-red-800 shrink-0"
          >
            Corriger
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
