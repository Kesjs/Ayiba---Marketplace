"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RejectReasonModal } from "@/components/dashboard/RejectReasonModal";
import { useAdminVendeursKyc, VendeurKyc } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle, MapPin, Wallet, IdCard } from "lucide-react";

const TABS = [
  { key: "en_attente", label: "En attente" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
] as const;

export default function AdminVendeursPage() {
  const { vendeurs, loading, valider, rejeter } = useAdminVendeursKyc();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("en_attente");
  const [rejectTarget, setRejectTarget] = useState<VendeurKyc | null>(null);

  const filtered = vendeurs.filter((v) => v.statut === tab);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Validation vendeurs (KYC)">
      <div className="flex gap-2 mb-8">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              tab === t.key ? "bg-gray-900 text-white" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
            }`}
          >
            {t.label} {t.key === "en_attente" && filtered.length > 0 && tab === t.key ? `(${filtered.length})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-[32px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucun vendeur dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((v) => (
            <div key={v.id} className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-bold text-gray-900">{v.nom_boutique || "Sans nom de boutique"}</h3>
                  <p className="text-sm text-gray-500">{v.nom_complet}</p>
                </div>
                <StatusBadge variant={v.statut === "valide" ? "success" : v.statut === "refuse" ? "error" : "pending"}>
                  {v.statut === "valide" ? "Validé" : v.statut === "refuse" ? "Refusé" : "En attente"}
                </StatusBadge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {v.quartier || "—"}, {v.commune || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-gray-400" />
                  {v.mobile_money_network ? `${v.mobile_money_network.toUpperCase()} — ${v.mobile_money_number}` : "Non renseigné"}
                </div>
                <div className="flex items-center gap-2">
                  <IdCard size={14} className="text-gray-400" />
                  {v.photo_cni_path ? (
                    <span className="text-teal-600 font-semibold">Pièce d'identité fournie</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Pièce d'identité manquante</span>
                  )}
                </div>
              </div>

              {v.raison_rejet && (
                <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl mb-4">
                  Motif du refus : {v.raison_rejet}
                </div>
              )}

              {v.statut === "en_attente" && (
                <div className="flex gap-3">
                  <Button variant="primary" className="flex-1" onClick={() => valider(v.id)}>
                    <CheckCircle2 size={16} /> Valider
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setRejectTarget(v)}>
                    <XCircle size={16} /> Refuser
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (raison) => { if (rejectTarget) await rejeter(rejectTarget.id, raison); }}
        title={`Refuser ${rejectTarget?.nom_boutique || "ce vendeur"}`}
      />
    </DashboardLayout>
  );
}
