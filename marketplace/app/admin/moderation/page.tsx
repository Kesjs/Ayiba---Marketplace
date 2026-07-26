"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { RejectReasonModal } from "@/components/dashboard/RejectReasonModal";
import { useAdminArticles, ArticleModeration } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { CheckCircle2, XCircle, X } from "lucide-react";

const TABS = [
  { key: "en_attente", label: "En attente" },
  { key: "publie", label: "Publiés" },
  { key: "refuse", label: "Refusés" },
] as const;

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminModerationPage() {
  const { articles, loading, publier, refuser, publierMultiple, refuserMultiple } = useAdminArticles();
  const [tab, setTab] = useState<(typeof TABS)[number]["key"]>("en_attente");
  const [rejectTarget, setRejectTarget] = useState<ArticleModeration | null>(null);
  const [rejectSelectionMode, setRejectSelectionMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const filtered = articles.filter((a) => a.statut === tab);

  // La sélection ne doit survivre ni à un changement d'onglet, ni au fait
  // qu'un article sélectionné disparaisse de la liste après une action.
  useEffect(() => {
    setSelected(new Set());
  }, [tab]);

  const allSelected = filtered.length > 0 && filtered.every((a) => selected.has(a.id));
  const someSelected = selected.size > 0;

  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) => {
      if (allSelected) return new Set();
      return new Set(filtered.map((a) => a.id));
    });
  };

  const selectedIds = useMemo(() => Array.from(selected), [selected]);

  const handleBulkPublish = async () => {
    setBulkLoading(true);
    try {
      await publierMultiple(selectedIds);
      setSelected(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  const handleBulkReject = async (raison: string) => {
    setBulkLoading(true);
    try {
      await refuserMultiple(selectedIds, raison);
      setSelected(new Set());
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Modération des articles">
      <div className="flex items-center justify-between gap-4 mb-8 flex-wrap">
        <div className="flex gap-2">
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

        {tab === "en_attente" && filtered.length > 0 && (
          <button
            onClick={toggleAll}
            className="text-sm font-bold text-gray-500 hover:text-gray-900 transition-colors"
          >
            {allSelected ? "Tout désélectionner" : "Tout sélectionner"}
          </button>
        )}
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
              {tab === "en_attente" && (
                <input
                  type="checkbox"
                  checked={selected.has(a.id)}
                  onChange={() => toggleOne(a.id)}
                  className="w-5 h-5 rounded-md border-gray-300 text-teal-600 focus:ring-teal-500/30 shrink-0 cursor-pointer"
                />
              )}
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

      {/* Barre d'actions groupées : apparaît uniquement quand au moins un
          article "en attente" est sélectionné. Reste fixée en bas pour rester
          accessible même après avoir scrollé la liste. */}
      {tab === "en_attente" && someSelected && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30 bg-gray-900 text-white rounded-2xl shadow-2xl px-5 py-3 flex items-center gap-4">
          <span className="text-sm font-bold whitespace-nowrap">
            {selected.size} sélectionné{selected.size > 1 ? "s" : ""}
          </span>
          <div className="flex gap-2">
            <Button
              onClick={handleBulkPublish}
              disabled={bulkLoading}
              className="h-10 px-4 text-sm rounded-xl bg-teal-500 hover:bg-teal-600 shadow-none"
            >
              <CheckCircle2 size={16} />
              Publier
            </Button>
            <Button
              variant="destructive"
              onClick={() => setRejectSelectionMode(true)}
              disabled={bulkLoading}
              className="h-10 px-4 text-sm rounded-xl bg-red-500/90 text-white border-0 hover:bg-red-500"
            >
              <XCircle size={16} />
              Refuser
            </Button>
          </div>
          <button
            onClick={() => setSelected(new Set())}
            className="text-gray-400 hover:text-white transition-colors"
            title="Annuler la sélection"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <RejectReasonModal
        isOpen={!!rejectTarget}
        onClose={() => setRejectTarget(null)}
        onConfirm={async (raison) => { if (rejectTarget) await refuser(rejectTarget.id, raison); }}
        title={`Refuser "${rejectTarget?.nom || ""}"`}
      />

      <RejectReasonModal
        isOpen={rejectSelectionMode}
        onClose={() => setRejectSelectionMode(false)}
        onConfirm={handleBulkReject}
        title={`Refuser ${selected.size} article${selected.size > 1 ? "s" : ""}`}
      />
    </DashboardLayout>
  );
}
