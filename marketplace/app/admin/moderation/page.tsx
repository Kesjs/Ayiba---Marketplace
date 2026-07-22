"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RejectReasonModal } from "@/components/dashboard/RejectReasonModal";
import { useAdminArticles, ArticleModeration } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle } from "lucide-react";

const TABS = [
  { key: "en_attente", label: "En attente" },
  { key: "publie", label: "Publiés" },
  { key: "refuse", label: "Refusés" },
] as const;

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminModerationPage() {
  const { articles, loading, publier, refuser } = useAdminArticles();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("en_attente");
  const [rejectTarget, setRejectTarget] = useState<ArticleModeration | null>(null);

  const filtered = articles.filter((a) => a.statut === tab);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Modération des articles">
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
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-50 p-16 text-center">
          <p className="text-gray-400 font-medium">Aucun article dans cette catégorie.</p>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map((a) => (
            <div key={a.id} className="p-6 flex items-center gap-4">
              <div className="flex-1 min-w-0">
                <p className="font-bold text-gray-900 truncate">{a.nom}</p>
                <p className="text-sm text-gray-500 truncate">{a.description || "Pas de description"}</p>
                {a.raison_rejet && (
                  <p className="text-xs text-red-600 font-medium mt-1">Motif : {a.raison_rejet}</p>
                )}
              </div>
              <p className="text-sm font-bold text-gray-700 shrink-0">{formatFCFA(a.prix)}</p>
              <StatusBadge variant={a.statut === "publie" ? "success" : a.statut === "refuse" ? "error" : "pending"}>
                {a.statut === "publie" ? "Publié" : a.statut === "refuse" ? "Refusé" : "En attente"}
              </StatusBadge>
              {a.statut === "en_attente" && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => publier(a.id)}
                    className="p-2 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors"
                    title="Publier"
                  >
                    <CheckCircle2 size={18} />
                  </button>
                  <button
                    onClick={() => setRejectTarget(a)}
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    title="Refuser"
                  >
                    <XCircle size={18} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (raison) => { if (rejectTarget) await refuser(rejectTarget.id, raison); }}
        title={`Refuser "${rejectTarget?.nom || ""}"`}
      />
    </DashboardLayout>
  );
}
