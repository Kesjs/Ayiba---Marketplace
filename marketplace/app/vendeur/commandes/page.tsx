"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useVendeurCommandes, StatutCommande } from "@/lib/hooks/useVendeurCommandes";
import {
  STATUTS_COMMANDE,
  LABELS_STATUT_COMMANDE,
  STATUT_STYLE,
  STATUT_SPINE_COLOR,
  PROCHAINS_STATUTS,
} from "@/lib/constants/commandes";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { ChevronDown, Phone, MapPin, MessageCircle, Package } from "lucide-react";

const FILTRES: { value: StatutCommande | "tous"; label: string }[] = [
  { value: "tous", label: "Toutes" },
  ...Object.values(STATUTS_COMMANDE).map((value) => ({
    value,
    label: LABELS_STATUT_COMMANDE[value],
  })),
];

function formatMontant(v: number) {
  return new Intl.NumberFormat("fr-FR").format(v) + " F";
}

function initiales(nom: string | null) {
  if (!nom) return "?";
  return nom
    .split(" ")
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function VendeurCommandesPage() {
  const { loading, error, commandes, updatingId, updateStatut, refresh } = useVendeurCommandes();
  const [filtre, setFiltre] = useState<string>("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [confirmingCancelId, setConfirmingCancelId] = useState<string | null>(null);
  const router = useRouter();

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: commandes.length };
    Object.values(STATUTS_COMMANDE).forEach((s) => {
      c[s] = commandes.filter((cmd) => cmd.statut === s).length;
    });
    return c;
  }, [commandes]);

  const commandesFiltrees = useMemo(() => {
    if (filtre === "tous") return commandes;
    return commandes.filter((c) => c.statut === filtre);
  }, [commandes, filtre]);

  const openMessagerie = (clientId: string, commandeId: string) => {
    router.push(`/vendeur/messages?client=${clientId}&commande=${commandeId}`);
  };

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
        <div className="space-y-6 overflow-x-hidden">
          {/* Filtres avec compteurs + fondu de scroll sur mobile */}
          <div className="relative">
            <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {FILTRES.map((s) => {
                const active = filtre === s.value;
                const count = counts[s.value] || 0;
                return (
                  <button
                    key={s.value}
                    onClick={() => setFiltre(s.value)}
                    className={`whitespace-nowrap flex items-center gap-1.5 px-4 py-2 rounded-2xl text-sm font-bold transition-colors flex-shrink-0 ${
                      active ? "bg-gray-900 text-white" : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
                    }`}
                  >
                    {s.label}
                    {count > 0 && (
                      <span
                        className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full ${
                          active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="pointer-events-none absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-white to-transparent sm:hidden" />
          </div>

          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            {commandesFiltrees.length === 0 ? (
              <div className="px-8 py-16 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                  <Package size={22} className="text-gray-300" />
                </div>
                <p className="text-gray-500 font-medium">Aucune commande dans cette catégorie</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {commandesFiltrees.map((order) => {
                  const isExpanded = expandedId === order.id;
                  const prochains = PROCHAINS_STATUTS[order.statut as StatutCommande] || [];
                  const isConfirmingCancel = confirmingCancelId === order.id;

                  return (
                    <div key={order.id} className="flex">
                      <div
                        className="w-1.5 flex-shrink-0"
                        style={{ backgroundColor: STATUT_SPINE_COLOR[order.statut as StatutCommande] || "#D1D5DB" }}
                      />
                      <div className="flex-1 min-w-0">
                        {/* Ligne principale : avatar / nom / montant+statut / icône message / chevron */}
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setExpandedId(isExpanded ? null : order.id)}
                          onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : order.id)}
                          className="w-full flex items-center gap-2.5 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {initiales(order.nom_client)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-semibold text-gray-900 truncate text-sm">{order.nom_client}</p>
                            <p className="text-xs text-gray-500 truncate">{order.numero}</p>
                          </div>

                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                              {formatMontant(order.montant_total)}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                                STATUT_STYLE[order.statut as StatutCommande] || "bg-gray-100 text-gray-600 border-gray-200"
                              }`}
                            >
                              {LABELS_STATUT_COMMANDE[order.statut as StatutCommande] || order.statut}
                            </span>
                          </div>

                          {/* Icône unique : ouvre directement la conversation dans Messages */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              openMessagerie(order.client_id, order.id);
                            }}
                            className="w-8 h-8 rounded-full bg-coral-50 flex items-center justify-center text-coral-600 hover:bg-coral-100 flex-shrink-0"
                            aria-label="Ouvrir la conversation"
                          >
                            <MessageCircle size={14} />
                          </button>

                          <ChevronDown
                            size={18}
                            className={`text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>

                        {isExpanded && (
                          <div className="px-4 sm:px-6 pb-5 bg-gray-50/50">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3 pt-1">
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Phone size={16} className="text-gray-400 flex-shrink-0" />
                                <span className="truncate">{order.telephone_client || "Non renseigné"}</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm text-gray-600">
                                <MapPin size={16} className="text-gray-400 flex-shrink-0 mt-0.5" />
                                <span>{order.adresse_livraison || order.commune || "Non renseignée"}</span>
                              </div>
                            </div>

                            {order.note_client && (
                              <p className="text-sm text-gray-600 bg-white p-3.5 rounded-2xl border border-gray-100 mb-4">
                                « {order.note_client} »
                              </p>
                            )}

                            <div className="flex flex-col gap-3">
                              <p className="text-sm text-gray-500">
                                Montant : <span className="font-bold text-gray-900">{formatMontant(order.montant_total)}</span>
                              </p>

                              {prochains.length > 0 && !isConfirmingCancel && (
                                <div className="flex flex-col sm:flex-row gap-2 w-full">
                                  {prochains.map((next) => {
                                    const isCancel = next === STATUTS_COMMANDE.ANNULEE;
                                    return (
                                      <button
                                        key={next}
                                        disabled={updatingId === order.id}
                                        onClick={() =>
                                          isCancel ? setConfirmingCancelId(order.id) : updateStatut(order.id, next)
                                        }
                                        className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 ${
                                          isCancel
                                            ? "bg-red-50 text-red-600 hover:bg-red-100"
                                            : "bg-coral-500 text-white hover:bg-coral-600"
                                        }`}
                                      >
                                        {updatingId === order.id ? "..." : `Marquer ${LABELS_STATUT_COMMANDE[next]}`}
                                      </button>
                                    );
                                  })}
                                </div>
                              )}

                              {isConfirmingCancel && (
                                <div className="w-full bg-red-50 rounded-2xl p-4 border border-red-100">
                                  <p className="text-sm font-semibold text-red-700 mb-3">
                                    Annuler la commande {order.numero} ? Cette action est définitive.
                                  </p>
                                  <div className="flex flex-col sm:flex-row gap-2">
                                    <button
                                      onClick={() => {
                                        updateStatut(order.id, STATUTS_COMMANDE.ANNULEE);
                                        setConfirmingCancelId(null);
                                      }}
                                      disabled={updatingId === order.id}
                                      className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                                    >
                                      Oui, annuler
                                    </button>
                                    <button
                                      onClick={() => setConfirmingCancelId(null)}
                                      className="w-full px-4 py-2.5 rounded-xl text-xs font-bold bg-white text-gray-600 border border-gray-200 hover:bg-gray-50"
                                    >
                                      Ne pas annuler
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
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
