"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminDemandesSuppression } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminDemandesPage() {
  const { demandes, loading, processingId, traiter, annuler } = useAdminDemandesSuppression();
  const [erreur, setErreur] = useState<string | null>(null);

  const handleTraiter = async (id: string, userId: string) => {
    setErreur(null);
    const err = await traiter(id, userId);
    if (err) setErreur(err);
  };

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Demandes de suppression de compte">
      {erreur && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">{erreur}</div>
      )}

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
      ) : demandes.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucune demande en attente.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {demandes.map((d) => (
            <div key={d.id} className="p-6 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[200px]">
                <p className="text-sm text-gray-600">{d.raison || <span className="italic text-gray-300">Aucune raison fournie</span>}</p>
                <p className="text-xs text-gray-400 mt-1">{new Date(d.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <StatusBadge variant={d.statut === "traitee" ? "success" : d.statut === "annulee" ? "neutral" : "pending"}>
                {d.statut === "traitee" ? "Traitée" : d.statut === "annulee" ? "Annulée" : "En attente"}
              </StatusBadge>
              {d.statut === "en_attente" && (
                <div className="flex gap-2">
                  <Button
                    variant="destructive"
                    onClick={() => handleTraiter(d.id, d.user_id)}
                    disabled={processingId === d.id}
                  >
                    {processingId === d.id ? "Suppression..." : "Supprimer le compte"}
                  </Button>
                  <Button variant="outline" onClick={() => annuler(d.id)} disabled={processingId === d.id}>
                    Annuler la demande
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
