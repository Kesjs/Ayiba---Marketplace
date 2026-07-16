"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown,
  Phone,
  MapPin,
  MessageCircle,
  Package,
  AlertCircle,
  RefreshCw,
  Loader2,
  X,
  Search,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  STATUTS_COMMANDE,
  LABELS_STATUT_COMMANDE,
  STATUT_STYLE,
  STATUT_SPINE_COLOR,
  PROCHAINS_STATUTS,
  type StatutCommande,
} from "@/lib/constants/commandes";

interface Commande {
  id: string;
  numero: string;
  client_id: string;
  nom_client: string | null;
  telephone_client: string | null;
  adresse_livraison: string | null;
  commune: string | null;
  note_client: string | null;
  montant_total: number;
  statut: StatutCommande;
  created_at: string;
}

type FiltreStatut = StatutCommande | "tous";

const FILTRES: { value: FiltreStatut; label: string }[] = [
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

function CommandeRowSkeleton() {
  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm px-4 sm:px-6 py-4 flex items-center gap-2.5">
      <div className="w-10 h-10 rounded-full bg-gray-100 animate-pulse shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 w-1/3 rounded bg-gray-100 animate-pulse" />
        <div className="h-2.5 w-1/5 rounded bg-gray-100 animate-pulse" />
      </div>
      <div className="h-6 w-16 rounded-full bg-gray-100 animate-pulse" />
    </div>
  );
}

export default function VendeurCommandesPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filtre, setFiltre] = useState<FiltreStatut>("tous");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<Commande | null>(null);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setLoadError("Ta session a expiré — reconnecte-toi puis réessaie.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("commandes")
      .select(
        "id, numero, client_id, nom_client, telephone_client, adresse_livraison, commune, note_client, montant_total, statut, created_at"
      )
      .eq("vendeur_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError("Impossible de charger tes commandes — vérifie ta connexion et réessaie.");
      setLoading(false);
      return;
    }

    setCommandes((data as Commande[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const searchedCommandes = useMemo(() => {
    if (!search.trim()) return commandes;
    const q = search.toLowerCase();
    return commandes.filter(
      (c) =>
        (c.nom_client ?? "").toLowerCase().includes(q) ||
        c.numero.toLowerCase().includes(q)
    );
  }, [commandes, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { tous: searchedCommandes.length };
    Object.values(STATUTS_COMMANDE).forEach((s) => {
      c[s] = searchedCommandes.filter((cmd) => cmd.statut === s).length;
    });
    return c;
  }, [searchedCommandes]);

  const commandesFiltrees = useMemo(() => {
    if (filtre === "tous") return searchedCommandes;
    return searchedCommandes.filter((c) => c.statut === filtre);
  }, [searchedCommandes, filtre]);

  const openMessagerie = (clientId: string, commandeId: string) => {
    router.push(`/vendeur/messages?client=${clientId}&commande=${commandeId}`);
  };

  const updateStatut = async (commandeId: string, statut: StatutCommande) => {
    setUpdatingId(commandeId);
    const previous = commandes;
    setCommandes((prev) => prev.map((c) => (c.id === commandeId ? { ...c, statut } : c)));

    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut, updated_at: new Date().toISOString() })
      .eq("id", commandeId);

    setUpdatingId(null);

    if (error) {
      setCommandes(previous);
      showToast("Impossible de mettre à jour le statut", "error");
      return;
    }
    showToast(`Commande marquée « ${LABELS_STATUT_COMMANDE[statut]} »`, "success");
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    setCancelError(null);
    setIsCancelling(true);

    const supabase = createClient();
    const { error } = await supabase
      .from("commandes")
      .update({ statut: STATUTS_COMMANDE.ANNULEE, updated_at: new Date().toISOString() })
      .eq("id", cancelTarget.id);

    setIsCancelling(false);

    if (error) {
      setCancelError("Échec de l'annulation. Réessaie.");
      return;
    }

    setCommandes((prev) =>
      prev.map((c) => (c.id === cancelTarget.id ? { ...c, statut: STATUTS_COMMANDE.ANNULEE } : c))
    );
    setCancelTarget(null);
    showToast("Commande annulée", "success");
  };

  return (
    <DashboardLayout role="vendeur" title="Commandes">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un client ou un numéro de commande..."
            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-400 focus:bg-white transition-all text-sm font-medium"
          />
        </div>
      </div>

      {commandes.length > 0 && (
        <p className="text-sm text-gray-500 mb-4 px-1">
          <span className="font-bold text-gray-900">{commandes.length}</span> commande
          {commandes.length > 1 ? "s" : ""} au total
          {counts[STATUTS_COMMANDE.EN_ATTENTE] > 0 && (
            <>
              {" · "}
              <span className="font-bold text-amber-600">
                {counts[STATUTS_COMMANDE.EN_ATTENTE]} en attente
              </span>
            </>
          )}
        </p>
      )}

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 -mx-1 px-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {FILTRES.map((s) => {
          const active = filtre === s.value;
          const count = counts[s.value] || 0;
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => setFiltre(s.value)}
              className={`shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-colors ${
                active
                  ? "bg-coral-500 text-white"
                  : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
              }`}
            >
              {s.label}
              {count > 0 && (
                <span className={`text-[10px] font-bold rounded-full px-1.5 ${active ? "bg-white/25" : "bg-gray-100"}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 leading-relaxed mb-3">{loadError}</p>
            <button
              onClick={fetchCommandes}
              className="inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-800"
            >
              <RefreshCw size={13} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {loading && !loadError && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <CommandeRowSkeleton key={i} />
          ))}
        </div>
      )}

      {!loading && !loadError && (
        <>
          {commandesFiltrees.length === 0 ? (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm px-8 py-16 text-center">
              <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
                <Package size={22} className="text-gray-300" />
              </div>
              <p className="text-gray-700 font-semibold mb-1">
                {search || filtre !== "tous"
                  ? "Aucune commande ne correspond à ces critères"
                  : "Tu n'as pas encore reçu de commande"}
              </p>
              <p className="text-sm text-gray-400">
                {search || filtre !== "tous"
                  ? "Essaie un autre mot-clé ou un autre filtre."
                  : "Les nouvelles commandes de tes clients apparaîtront ici."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {commandesFiltrees.map((order, i) => {
                const isExpanded = expandedId === order.id;
                const prochains = PROCHAINS_STATUTS[order.statut] || [];
                const spineColor = STATUT_SPINE_COLOR[order.statut] || "#D1D5DB";

                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.25 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden"
                    style={{ borderLeft: `4px solid ${spineColor}` }}
                  >
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setExpandedId(isExpanded ? null : order.id)}
                      onKeyDown={(e) => e.key === "Enter" && setExpandedId(isExpanded ? null : order.id)}
                      className="w-full flex items-center gap-2.5 px-4 sm:px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                      <div className="w-10 h-10 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center text-xs font-bold shrink-0">
                        {initiales(order.nom_client)}
                      </div>

                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-gray-900 truncate text-sm">{order.nom_client ?? "Client"}</p>
                        <p className="text-xs text-gray-500 truncate">{order.numero}</p>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="font-bold text-gray-900 text-sm whitespace-nowrap">
                          {formatMontant(order.montant_total)}
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border whitespace-nowrap ${
                            STATUT_STYLE[order.statut] || "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {LABELS_STATUT_COMMANDE[order.statut] || order.statut}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openMessagerie(order.client_id, order.id);
                        }}
                        className="w-9 h-9 rounded-full bg-coral-50 flex items-center justify-center text-coral-600 hover:bg-coral-100 shrink-0"
                        aria-label="Discuter avec le client"
                        title="Discuter avec le client"
                      >
                        <MessageCircle size={15} />
                      </button>

                      <ChevronDown
                        size={18}
                        className={`text-gray-400 transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}
                      />
                    </div>

                    <AnimatePresence initial={false}>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 sm:px-6 pb-5 pt-4 bg-gray-50/60 border-t border-gray-100">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-3">
                              <div className="flex items-center gap-2 text-sm text-gray-600 bg-white px-3 py-2.5 rounded-xl border border-gray-100">
                                <Phone size={15} className="text-gray-400 shrink-0" />
                                <span className="truncate">{order.telephone_client || "Non renseigné"}</span>
                              </div>
                              <div className="flex items-start gap-2 text-sm text-gray-600 bg-white px-3 py-2.5 rounded-xl border border-gray-100">
                                <MapPin size={15} className="text-gray-400 shrink-0 mt-0.5" />
                                <span>{order.adresse_livraison || order.commune || "Non renseignée"}</span>
                              </div>
                            </div>

                            {order.note_client && (
                              <p className="text-sm text-gray-600 bg-white p-3.5 rounded-2xl border border-gray-100 mb-4">
                                « {order.note_client} »
                              </p>
                            )}

                            <div className="flex items-center justify-between text-sm text-gray-500 px-0.5 mb-3">
                              <span>Montant total</span>
                              <span className="font-bold text-gray-900">{formatMontant(order.montant_total)}</span>
                            </div>

                            {prochains.length > 0 && (
                              <div className="flex flex-col sm:flex-row gap-2 w-full">
                                {prochains.map((next) => {
                                  const isCancel = next === STATUTS_COMMANDE.ANNULEE;
                                  return (
                                    <button
                                      key={next}
                                      type="button"
                                      disabled={updatingId === order.id}
                                      onClick={() =>
                                        isCancel
                                          ? (setCancelError(null), setCancelTarget(order))
                                          : updateStatut(order.id, next)
                                      }
                                      className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
                                        isCancel
                                          ? "bg-red-50 text-red-600 hover:bg-red-100"
                                          : "bg-coral-500 text-white hover:bg-coral-600"
                                      }`}
                                    >
                                      {updatingId === order.id ? (
                                        <Loader2 size={14} className="animate-spin" />
                                      ) : (
                                        `Marquer ${LABELS_STATUT_COMMANDE[next]}`
                                      )}
                                    </button>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {cancelTarget && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !isCancelling && setCancelTarget(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Annuler la commande ?</h3>
                  <button
                    onClick={() => !isCancelling && setCancelTarget(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  La commande <strong className="text-gray-900">{cancelTarget.numero}</strong> de{" "}
                  <strong className="text-gray-900">{cancelTarget.nom_client ?? "ce client"}</strong> sera marquée
                  comme annulée. Cette action est définitive.
                </p>

                {cancelError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{cancelError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => !isCancelling && setCancelTarget(null)}
                    disabled={isCancelling}
                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Ne pas annuler
                  </button>
                  <button
                    onClick={handleConfirmCancel}
                    disabled={isCancelling}
                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isCancelling ? <Loader2 size={18} className="animate-spin" /> : "Oui, annuler"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
