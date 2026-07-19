"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

interface ReglageNotif {
  id: string;
  label: string;
  description: string;
}

// Deux catégories distinctes pour que l'utilisateur puisse couper le
// commercial sans risquer de rater une alerte de livraison/litige — voir
// dashboard-client.md, section 9.
const IMPORTANTES: ReglageNotif[] = [
  { id: "commande", label: "Commande", description: "Confirmation, préparation, expédition" },
  { id: "livraison", label: "Livraison", description: "Livreur assigné, en route, confirmation" },
  { id: "paiement", label: "Paiement", description: "Débit, remboursement" },
  { id: "litige", label: "Litige", description: "Vérification en cours, résolution" },
];

const COMMERCIALES: ReglageNotif[] = [
  { id: "promotions", label: "Promotions", description: "Réductions et offres du moment" },
  { id: "nouveaux_produits", label: "Nouveaux produits", description: "Nouveautés des boutiques suivies" },
  { id: "campagnes", label: "Campagnes marketing", description: "Actualités Ayiba" },
];

function Toggle({ actif, onChange }: { actif: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors relative shrink-0 ${actif ? "bg-teal-500" : "bg-gray-200"}`}
      aria-pressed={actif}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
          actif ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

export default function NotificationsPage() {
  const router = useRouter();

  // Les notifications "importantes" sont activées par défaut et non
  // désactivables individuellement dans cette V1 (litige/paiement doivent
  // toujours atteindre le client) — seules les commerciales sont réglables.
  // À revoir si un besoin de granularité plus fine émerge.
  const [commerciales, setCommerciales] = useState<Record<string, boolean>>(
    Object.fromEntries(COMMERCIALES.map((c) => [c.id, true]))
  );

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Notifications</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Notifications importantes
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {IMPORTANTES.map((n) => (
              <div key={n.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.description}</p>
                </div>
                <Toggle actif onChange={() => {}} />
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 mt-2 px-1">
            Toujours activées — commandes, livraisons et litiges ne peuvent pas être coupés.
          </p>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Notifications commerciales
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {COMMERCIALES.map((n) => (
              <div key={n.id} className="flex items-center gap-3 px-4 py-3.5">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{n.label}</p>
                  <p className="text-xs text-gray-400">{n.description}</p>
                </div>
                <Toggle
                  actif={commerciales[n.id]}
                  onChange={() => setCommerciales((prev) => ({ ...prev, [n.id]: !prev[n.id] }))}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
