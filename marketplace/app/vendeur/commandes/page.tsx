"use client";

import { useMemo, useState } from "react";
import { useVendeurCommandes, StatutCommande } from "@/hooks/useVendeurCommandes";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ChevronDown, Phone, MapPin } from "lucide-react";

const STATUTS: { value: StatutCommande | "tous"; label: string }[] = [
  { value: "tous", label: "Toutes" },
  { value: "en_attente", label: "En attente" },
  { value: "confirmee", label: "Confirmée" },
  { value: "preparee", label: "Préparée" },
  { value: "expediee", label: "Expédiée" },
  { value: "livree", label: "Livrée" },
  { value: "annulee", label: "Annulée" },
  { value: "remboursee", label: "Remboursée" },
];

const STATUT_STYLE: Record<string, string> = {
  en_attente: "bg-amber-50 text-amber-700 border-amber-100",
  confirmee: "bg-teal-50 text-teal-700 border-teal-100",
  preparee: "bg-blue-50 text-blue-700 border-blue-100",
  expediee: "bg-indigo-50 text-indigo-700 border-indigo-100",
  livree: "bg-green-50 text-green-700 border-green-100",
  annulee: "bg-red-50 text-red-700 border-red-100",
  remboursee: "bg-gray-100 text-gray-600 border-gray-200",
};

const PROCHAINS_STATUTS: Record<string, StatutCommande[]> = {
  en_attente: ["confirmee", "annulee"],
  confirmee: ["preparee", "annulee"],
  preparee: ["expediee", "annulee"],
  expediee: ["livree"],
  livree: [],
  annulee: [],
  remboursee: [],
};

export default function VendeurCommandesPage() {
  const { loading, error, commandes, updatingId, updateStatut, refresh } = useVendeurCommandes();
  const [filtre, setFiltre] = useState<string>("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const commandesFiltrees = useMemo(() => {
    if (filtre === "tous") return commandes;
    return commandes.filter((c) => c.statut === filtre);
  }, [commandes, filtre]);

  return (
    <DashboardLayout role="vendeur" title="Commandes">
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
        <div className="space-y-6">
          {/* Filtres */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {STATUTS.map((s) => (
              <button
                key={s.value}
                onClick={() => setFiltre(s.value)}
                className={`whitespace-nowrap px-4 py-2 rounded-2xl text-sm font-bold transition-colors ${
                  filtre === s.value
                    ? "bg-gray-900 text-white"
                    : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Liste */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {commandesFiltrees.length === 0 ? (
              <div className="px-8 py-16 text-center text-gray-400">Aucune commande dans cette catégorie</div>
            ) : (
              <div className="divide-y divide-gray-100">
                {commandesFiltrees.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const prochains = PROCHAINS_STATUTS[order.statut] || [];

                  return (
                    <div key={order.id}>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : order.id)}
                        className="w-full flex items-center justify-between gap-4 px-6 sm:px-8 py-6 hover:bg-gray-50 transition-colors text-left"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{order.nom_client}</p>
                          <p className="text-sm text-gray-500">{order.numero}</p>
                        </div>

                        <div className="flex items-center gap-4 flex-shrink-0">
                          <span className="font-semibold text-gray-900 hidden sm:block">
                            {order.montant_total} F
                          </span>
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                              STATUT_STYLE[order.statut] || "bg-gray-100 text-gray-600 border-gray-200"
                            }`}
                          >
                            {STATUTS.find((s) => s.value === order.statut)?.label || order.statut}
                          </span>
                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="px-6 sm:px-8 pb-6 bg-gray-50/50">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4 pt-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Phone size={16} className="text-gray-400" />
                              {order.telephone_client || "Non renseigné"}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin size={16} className="text-gray-400" />
                              {order.adresse_livraison || order.commune || "Non renseignée"}
                            </div>
                          </div>

                          {order.note_client && (
                            <p className="text-sm text-gray-600 bg-white p-4 rounded-2xl border border-gray-100 mb-4">
                              « {order.note_client} »
                            </p>
                          )}

                          <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                              Montant :{" "}
                              <span className="font-bold text-gray-900">{order.montant_total} F</span>
                            </p>

                            {prochains.length > 0 && (
                              <div className="flex gap-2">
                                {prochains.map((next) => (
                                  <button
                                    key={next}
                                    disabled={updatingId === order.id}
                                    onClick={() => updateStatut(order.id, next)}
                                    className={`px-4 py-2 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                                      next === "annulee"
                                        ? "bg-red-50 text-red-600 hover:bg-red-100"
                                        : "bg-coral-500 text-white hover:bg-coral-600"
                                    }`}
                                  >
                                    {updatingId === order.id
                                      ? "..."
                                      : `Marquer ${STATUTS.find((s) => s.value === next)?.label}`}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
