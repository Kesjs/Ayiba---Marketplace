"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminLitiges } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";

const TABS = [
  { key: "ouvert", label: "Ouverts" },
  { key: "en_cours", label: "En cours" },
  { key: "résolu", label: "Résolus" },
] as const;

const TYPE_LABELS: Record<string, string> = {
  client_indisponible: "Client indisponible",
  refus_livraison: "Refus de livraison",
  produit_endommage: "Colis endommagé",
  code_incorrect: "Code incorrect (3x)",
  autre: "Autre",
};

export default function AdminLitigesPage() {
  const { disputes, loading, changerStatut } = useAdminLitiges();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("ouvert");

  const filtered = disputes.filter((d) => d.statut === tab);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Résolution des litiges">
      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucun litige dans cette catégorie.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((d) => (
            <div key={d.id} className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-bold text-gray-900">Litige #{d.id.slice(0, 8)}</p>
                  <p className="text-xs text-gray-400">Commande #{d.commande_id.slice(0, 8)}</p>
                </div>
                <StatusBadge variant={d.statut === "résolu" ? "success" : d.statut === "en_cours" ? "info" : "error"}>
                  {d.statut === "résolu" ? "Résolu" : d.statut === "en_cours" ? "En cours" : "Ouvert"}
                </StatusBadge>
              </div>
              <span className="inline-block text-[11px] font-bold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md mb-3">
                {TYPE_LABELS[d.type] ?? d.type}
              </span>
              <p className="text-sm text-gray-600 mb-4">{d.motif}</p>
              {d.photo_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={d.photo_url}
                  alt="Photo justificative du litige"
                  className="w-32 h-32 object-cover rounded-xl border border-gray-100 mb-4"
                />
              )}
              {d.statut !== "résolu" && (
                <div className="flex gap-3">
                  {d.statut === "ouvert" && (
                    <Button variant="secondary" onClick={() => changerStatut(d.id, "en_cours")}>
                      Prendre en charge
                    </Button>
                  )}
                  <Button variant="primary" onClick={() => changerStatut(d.id, "résolu")}>
                    Marquer résolu
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
