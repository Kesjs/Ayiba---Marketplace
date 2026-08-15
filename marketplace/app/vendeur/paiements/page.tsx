"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVendeurPaiements } from "../../hooks/useVendeurPaiements";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LABELS_STATUT_PAIEMENT, STATUT_PAIEMENT_BADGE_VARIANT, getLivraisonBadge, type StatutPaiement } from "@/lib/constants/paiements";
import {
  Wallet, Clock, X, ArrowDownToLine, ArrowUpFromLine,
} from "lucide-react";

interface PaiementRow {
  id: string;
  montant_net: number | null;
  montant: number;
  commission: number;
  statut: string | null;
  created_at: string;
  commande?: { numero: string; statut: string } | null;
}

interface RetraitRow {
  id: string;
  montant: number;
  statut: string | null;
  created_at: string;
  reseau?: string | null;
}

function PaiementCard({ p }: { p: PaiementRow }) {
  const livraison = getLivraisonBadge(p.commande?.statut);
  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-gray-900 text-xs">
          {Number(p.montant_net ?? p.montant).toLocaleString("fr-FR")} F
        </p>
        <StatusBadge variant={STATUT_PAIEMENT_BADGE_VARIANT[p.statut as StatutPaiement] ?? "neutral"}>
          {LABELS_STATUT_PAIEMENT[p.statut as StatutPaiement] || p.statut}
        </StatusBadge>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-[10px] text-gray-400">
          {p.commande?.numero ? `Cmd ${p.commande.numero}` : "—"} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
        </p>
        <StatusBadge variant={livraison.variant}>{livraison.label}</StatusBadge>
      </div>
      {p.commission > 0 && (
        <p className="text-[10px] text-gray-400 mt-0.5">
          {Number(p.montant).toLocaleString("fr-FR")} F − {Number(p.commission).toLocaleString("fr-FR")} F
        </p>
      )}
    </div>
  );
}

function RetraitCard({ r }: { r: RetraitRow }) {
  return (
    <div className="flex items-center justify-between p-3">
      <div>
        <p className="font-semibold text-gray-900 text-xs">{Number(r.montant).toLocaleString("fr-FR")} F</p>
        <p className="text-[10px] text-gray-400">
          {new Date(r.created_at).toLocaleDateString("fr-FR")} · {r.reseau?.toUpperCase()}
        </p>
      </div>
      <StatusBadge variant={STATUT_PAIEMENT_BADGE_VARIANT[r.statut as StatutPaiement] ?? "neutral"}>
        {LABELS_STATUT_PAIEMENT[r.statut as StatutPaiement] || r.statut}
      </StatusBadge>
    </div>
  );
}

export default function VendeurPaiementsPage() {
  const {
    loading, error, paiements, retraits,
    soldeDisponible, soldeEnAttenteLivraison,
    requesting, demanderRetrait, refresh,
  } = useVendeurPaiements();

  const [modalOpen, setModalOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [mobileTab, setMobileTab] = useState<"recus" | "retraits">("recus");

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
    <DashboardLayout role="vendeur" title="Paiements" backHref="/vendeur/dashboard" backLabel="Dashboard">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button onClick={refresh} className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-6"
        >
          {/* --- Bande hero : solde + attente + retirer ---
              Mobile/tablette : bloc plein format avec pills empilées (inchangé).
              Desktop (lg+) : bande compacte fusionnée avec les KPIs (plus de
              doublon avec une grille de tuiles séparée) — solde à gauche,
              3 stats alignées à droite séparées par des liserés verticaux. */}
          <div className="relative overflow-hidden bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 rounded-[24px] p-5 sm:p-6 lg:py-5 lg:px-7 text-white shadow-xl shadow-coral-500/20">
            <div className="absolute -top-16 -right-12 w-40 h-40 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-16 -left-8 w-40 h-40 bg-black/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Wallet size={14} className="text-white/80" />
                  <span className="text-white/80 text-xs font-semibold uppercase tracking-wider">Solde disponible</span>
                </div>
                <p className="text-3xl sm:text-4xl lg:text-3xl font-bold tracking-tight mb-4 lg:mb-3">
                  {soldeDisponible.toLocaleString("fr-FR")} <span className="text-sm font-semibold opacity-90">F</span>
                </p>

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={() => { setFeedback(null); setModalOpen(true); }}
                  disabled={soldeDisponible <= 0}
                  className="px-4 py-2 bg-white text-coral-600 text-xs font-bold rounded-lg transition-all disabled:opacity-40 disabled:text-gray-400"
                >
                  Retirer
                </motion.button>
                {soldeDisponible <= 0 && (
                  <p className="text-[11px] text-white/70 mt-2">
                    Rien à retirer — reviens après livraisons confirmées.
                  </p>
                )}
              </div>

              {/* Pills — mobile/tablette uniquement */}
              <div className="flex flex-wrap items-center gap-2 sm:flex-col sm:items-start lg:hidden">
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <Clock size={12} className="text-white/90" />
                  <span className="text-xs font-semibold">
                    {soldeEnAttenteLivraison.toLocaleString("fr-FR")} F en attente
                  </span>
                </div>
                <div className="flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-xs font-semibold">{retraits.length} retrait{retraits.length > 1 ? "s" : ""}</span>
                </div>
              </div>

              {/* Stats fusionnées — desktop uniquement */}
              <div className="hidden lg:flex lg:items-center lg:gap-7">
                {[
                  { icon: ArrowDownToLine, value: paiements.length, label: "Paiements reçus" },
                  { icon: ArrowUpFromLine, value: retraits.length, label: `Retrait${retraits.length > 1 ? "s" : ""}` },
                  { icon: Clock, value: `${soldeEnAttenteLivraison.toLocaleString("fr-FR")} F`, label: "En attente" },
                ].map((stat, i) => (
                  <div key={stat.label} className={`flex items-center gap-2.5 ${i > 0 ? "pl-7 border-l border-white/20" : ""}`}>
                    <stat.icon size={16} className="text-white/70 shrink-0" />
                    <div>
                      <p className="text-lg font-bold leading-tight">{stat.value}</p>
                      <p className="text-[11px] text-white/70 leading-tight whitespace-nowrap">{stat.label}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* --- Grille de tuiles carrées (raccourcis + KPIs) — mobile/tablette uniquement,
              sur desktop ces stats vivent désormais dans la bande hero ci-dessus --- */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4 lg:hidden">
            {[
              { icon: ArrowDownToLine, label: "Paiements reçus", value: paiements.length, color: "text-teal-600", bg: "bg-teal-50" },
              { icon: ArrowUpFromLine, label: "Retraits", value: retraits.length, color: "text-coral-500", bg: "bg-coral-50" },
              { icon: Clock, label: "En attente", value: `${soldeEnAttenteLivraison.toLocaleString("fr-FR")} F`, color: "text-amber-600", bg: "bg-amber-50" },
            ].map((tile, i) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="bg-white rounded-2xl p-3 sm:p-4 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className={`w-9 h-9 rounded-lg ${tile.bg} ${tile.color} flex items-center justify-center mb-2`}>
                  <tile.icon size={16} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{tile.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5 line-clamp-1">{tile.label}</p>
              </motion.div>
            ))}
          </div>

          {/* --- Listes : tabs sur mobile, côte à côte sur desktop --- */}
          <div className="lg:hidden bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex p-2 gap-2 border-b border-gray-100">
              {(["recus", "retraits"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`relative flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    mobileTab === tab ? "text-white" : "text-gray-500"
                  }`}
                >
                  {mobileTab === tab && (
                    <motion.div
                      layoutId="paiementsTabIndicator"
                      className="absolute inset-0 bg-coral-500 rounded-xl -z-10"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {tab === "recus" ? "Reçus" : "Retraits"}
                </button>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={mobileTab}
                initial={{ opacity: 0, x: mobileTab === "recus" ? -8 : 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="divide-y divide-gray-100 max-h-96 overflow-y-auto"
              >
                {mobileTab === "recus" ? (
                  paiements.length === 0 ? (
                    <p className="text-gray-400 text-center py-8 text-xs">Aucun paiement</p>
                  ) : (
                    paiements.map((p) => <PaiementCard key={p.id} p={p} />)
                  )
                ) : retraits.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-xs">Aucun retrait</p>
                ) : (
                  retraits.map((r) => <RetraitCard key={r.id} r={r} />)
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:grid lg:grid-cols-2 gap-6 lg:gap-8">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ArrowDownToLine size={16} className="text-teal-600" />
                  Paiements reçus
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {paiements.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-xs">Aucun paiement</p>
                ) : (
                  paiements.map((p) => <PaiementCard key={p.id} p={p} />)
                )}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <ArrowUpFromLine size={16} className="text-coral-500" />
                  Historique des retraits
                </h3>
              </div>
              <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                {retraits.length === 0 ? (
                  <p className="text-gray-400 text-center py-8 text-xs">Aucun retrait</p>
                ) : (
                  retraits.map((r) => <RetraitCard key={r.id} r={r} />)
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* --- Bottom sheet retrait (cohérent avec BottomNav) --- */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[70]"
            />
            <motion.div
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-2xl p-5 shadow-2xl sm:max-w-sm sm:mx-auto sm:rounded-2xl sm:bottom-8"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Demander un retrait</h3>
                <button onClick={() => setModalOpen(false)} aria-label="Fermer" className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
                  <X size={18} className="text-gray-400" />
                </button>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Solde : <span className="font-bold text-gray-900">{soldeDisponible.toLocaleString("fr-FR")} F</span>
              </p>

              <div className="relative mb-2">
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Montant à retirer"
                  className="w-full px-3 py-2.5 rounded-lg bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-coral-200"
                />
              </div>

              <button
                onClick={() => setMontant(String(soldeDisponible))}
                className="text-xs font-bold text-coral-600 mb-3"
              >
                Tout retirer ({soldeDisponible.toLocaleString("fr-FR")} F)
              </button>

              {feedback && (
                <p className={`text-xs font-medium mb-3 ${feedback.success ? "text-teal-600" : "text-red-600"}`}>
                  {feedback.message}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDemande}
                disabled={requesting || !montant}
                className="w-full py-2.5 bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
              >
                {requesting ? "Envoi..." : "Confirmer"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
