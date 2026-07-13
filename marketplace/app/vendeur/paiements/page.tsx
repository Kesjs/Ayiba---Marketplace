"use client";

import { useState } from "react";
import { useVendeurPaiements } from "@/hooks/useVendeurPaiements";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Wallet, X, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";

const STATUT_STYLE: Record<string, string> = {
  en_attente: "bg-amber-50 text-amber-700 border-amber-100",
  paye: "bg-teal-50 text-teal-700 border-teal-100",
  valide: "bg-blue-50 text-blue-700 border-blue-100",
  echoue: "bg-red-50 text-red-700 border-red-100",
  refuse: "bg-red-50 text-red-700 border-red-100",
  rembourse: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUT_LABEL: Record<string, string> = {
  en_attente: "En attente",
  paye: "Payé",
  valide: "Validé",
  echoue: "Échoué",
  refuse: "Refusé",
  rembourse: "Remboursé",
};

export default function VendeurPaiementsPage() {
  const {
    loading,
    error,
    paiements,
    retraits,
    soldeDisponible,
    requesting,
    demanderRetrait,
    refresh,
  } = useVendeurPaiements();

  const [modalOpen, setModalOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);

  const handleDemande = async () => {
    setFeedback(null);
    const result = await demanderRetrait(Number(montant));
    setFeedback(result);
    if (result.success) {
      setMontant("");
      setTimeout(() => setModalOpen(false), 1500);
    }
  };

  return (
    <DashboardLayout role="vendeur" title="Paiements">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="space-y-8">
          {/* Solde */}
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 p-8 rounded-3xl text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                  <Wallet size={16} />
                  Solde disponible
                </div>
                <p className="text-4xl font-bold tracking-tight">{soldeDisponible.toLocaleString("fr-FR")} F</p>
              </div>
              <button
                onClick={() => {
                  setFeedback(null);
                  setModalOpen(true);
                }}
                disabled={soldeDisponible <= 0}
                className="px-5 py-3 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-40 flex-shrink-0"
              >
                Retirer
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Paiements reçus */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ArrowDownToLine size={18} className="text-teal-600" />
                  Paiements reçus
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {paiements.length === 0 ? (
                  <p className="text-gray-400 text-center py-12 text-sm">Aucun paiement pour l'instant</p>
                ) : (
                  paiements.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {Number(p.montant_net ?? p.montant).toLocaleString("fr-FR")} F
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(p.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          STATUT_STYLE[p.statut] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUT_LABEL[p.statut] || p.statut}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Retraits */}
            <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <ArrowUpFromLine size={18} className="text-coral-500" />
                  Historique des retraits
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {retraits.length === 0 ? (
                  <p className="text-gray-400 text-center py-12 text-sm">Aucun retrait pour l'instant</p>
                ) : (
                  retraits.map((r) => (
                    <div key={r.id} className="flex items-center justify-between p-4">
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">
                          {Number(r.montant).toLocaleString("fr-FR")} F
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString("fr-FR")} · {r.reseau?.toUpperCase()}
                        </p>
                      </div>
                      <span
                        className={`text-xs font-bold px-3 py-1 rounded-full border ${
                          STATUT_STYLE[r.statut] || "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {STATUT_LABEL[r.statut] || r.statut}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de demande de retrait */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Demander un retrait</h3>
              <button onClick={() => setModalOpen(false)}>
                <X size={20} className="text-gray-400" />
              </button>
            </div>

            <p className="text-sm text-gray-500 mb-4">
              Solde disponible : <span className="font-bold text-gray-900">{soldeDisponible.toLocaleString("fr-FR")} F</span>
            </p>

            <input
              type="number"
              value={montant}
              onChange={(e) => setMontant(e.target.value)}
              placeholder="Montant à retirer"
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200 mb-4"
            />

            {feedback && (
              <p className={`text-sm font-medium mb-4 ${feedback.success ? "text-teal-600" : "text-red-600"}`}>
                {feedback.message}
              </p>
            )}

            <button
              onClick={handleDemande}
              disabled={requesting || !montant}
              className="w-full py-3.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50"
            >
              {requesting ? "Envoi..." : "Confirmer la demande"}
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
