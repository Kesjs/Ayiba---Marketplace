"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RejectReasonModal } from "@/components/dashboard/RejectReasonModal";
import { useAdminLivreursKyc, LivreurKyc } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle, MapPin, Wallet, IdCard, Bike } from "lucide-react";

const TABS = [
  { key: "en_attente", label: "En attente" },
  { key: "valide", label: "Validés" },
  { key: "refuse", label: "Refusés" },
] as const;

export default function AdminLivreursPage() {
  const { livreurs, loading, valider, rejeter } = useAdminLivreursKyc();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("en_attente");
  const [rejectTarget, setRejectTarget] = useState<LivreurKyc | null>(null);

  const filtered = livreurs.filter((l) => l.statut_verification === tab);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Validation livreurs (KYC)">
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
            <Skeleton key={i} className="h-40 rounded-[32px]" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucun livreur dans cette catégorie.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filtered.map((l) => (
            <div key={l.id} className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <h3 className="font-bold text-gray-900">{l.nom_complet}</h3>
                <StatusBadge variant={l.statut_verification === "valide" ? "success" : l.statut_verification === "refuse" ? "error" : "pending"}>
                  {l.statut_verification === "valide" ? "Validé" : l.statut_verification === "refuse" ? "Refusé" : "En attente"}
                </StatusBadge>
              </div>

              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <MapPin size={14} className="text-gray-400" />
                  {l.quartier || "—"}, {l.commune || "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Bike size={14} className="text-gray-400" />
                  {l.type_vehicule || "—"} {l.plaque_immatriculation ? `— ${l.plaque_immatriculation}` : ""}
                </div>
                <div className="flex items-center gap-2">
                  <Wallet size={14} className="text-gray-400" />
                  {l.mobile_money_network ? `${l.mobile_money_network.toUpperCase()} — ${l.mobile_money_number}` : "Non renseigné"}
                </div>
                <div className="flex items-center gap-2">
                  <IdCard size={14} className="text-gray-400" />
                  {l.photo_cni_path ? (
                    <span className="text-teal-600 font-semibold">Pièce d'identité fournie</span>
                  ) : (
                    <span className="text-red-500 font-semibold">Pièce d'identité manquante</span>
                  )}
                </div>
              </div>

              {l.raison_rejet && (
                <div className="bg-red-50 text-red-700 text-xs font-medium p-3 rounded-xl mb-4">
                  Motif du refus : {l.raison_rejet}
                </div>
              )}

              {l.statut_verification === "en_attente" && (
                <div className="flex gap-3">
                  <Button variant="primary" className="flex-1" onClick={() => valider(l.id)}>
                    <CheckCircle2 size={16} /> Valider
                  </Button>
                  <Button variant="destructive" className="flex-1" onClick={() => setRejectTarget(l)}>
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
        title={`Refuser ${rejectTarget?.nom_complet || "ce livreur"}`}
      />
    </DashboardLayout>
  );
}
