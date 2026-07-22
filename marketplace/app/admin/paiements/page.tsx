"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RejectReasonModal } from "@/components/dashboard/RejectReasonModal";
import { useAdminRetraits, RetraitRow } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle, Send } from "lucide-react";

const TABS = [
  { key: "en_attente", label: "À valider" },
  { key: "valide", label: "Validés" },
  { key: "paye", label: "Payés" },
  { key: "refuse", label: "Refusés" },
] as const;

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminPaiementsPage() {
  const { retraits, loading, valider, marquerPaye, rejeter } = useAdminRetraits();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("en_attente");
  const [rejectTarget, setRejectTarget] = useState<RetraitRow | null>(null);

  const filtered = retraits.filter((r) => r.statut === tab);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Paiements & retraits Mobile Money">
      <div className="flex gap-2 mb-8 flex-wrap">
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
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucune demande dans cette catégorie.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map((r) => (
            <div key={r.id} className="p-6 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <p className="font-bold text-gray-900">{r.vendeur_id ? "Vendeur" : "Livreur"}</p>
                <p className="text-xs text-gray-400">
                  {r.reseau?.toUpperCase() || "—"} — {r.numero_mobile_money || "N/A"}
                </p>
              </div>
              <p className="text-lg font-bold text-gray-700">{formatFCFA(r.montant)}</p>
              <StatusBadge
                variant={
                  r.statut === "paye" ? "success" : r.statut === "valide" ? "info" : r.statut === "refuse" ? "error" : "pending"
                }
              >
                {r.statut === "paye" ? "Payé" : r.statut === "valide" ? "Validé" : r.statut === "refuse" ? "Refusé" : "En attente"}
              </StatusBadge>
              <div className="flex gap-2">
                {r.statut === "en_attente" && (
                  <>
                    <button onClick={() => valider(r.id)} className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100" title="Valider">
                      <CheckCircle2 size={18} />
                    </button>
                    <button onClick={() => setRejectTarget(r)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100" title="Refuser">
                      <XCircle size={18} />
                    </button>
                  </>
                )}
                {r.statut === "valide" && (
                  <Button variant="primary" onClick={() => marquerPaye(r.id)}>
                    <Send size={14} /> Marquer payé
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (raison) => { if (rejectTarget) await rejeter(rejectTarget.id, raison); }}
        title="Refuser cette demande de retrait"
      />
    </DashboardLayout>
  );
}
