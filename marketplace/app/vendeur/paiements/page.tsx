"use client";

import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVendeurPaiements } from "../../hooks/useVendeurPaiements";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { VentesChart } from "@/components/dashboard/VentesChart";
import { LABELS_STATUT_PAIEMENT, STATUT_PAIEMENT_BADGE_VARIANT, getLivraisonBadge, type StatutPaiement } from "@/lib/constants/paiements";
import Link from "next/link";
import {
  Wallet, Clock, X, ArrowDownToLine, ArrowUpFromLine, Smartphone, Pencil, PiggyBank,
} from "lucide-react";

interface PaiementRow {
  id: string;
  montant_net: number | null;
  montant: number;
  commission: number;
  statut: string | null;
  created_at: string;
  methode?: string | null;
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
    loading, error, vendeur, paiements, retraits,
    soldeDisponible, soldeEnAttenteLivraison,
    requesting, demanderRetrait, refresh,
  } = useVendeurPaiements();

  const [modalOpen, setModalOpen] = useState(false);
  const [montant, setMontant] = useState("");
  const [feedback, setFeedback] = useState<{ success: boolean; message: string } | null>(null);
  const [mobileTab, setMobileTab] = useState<"recus" | "retraits">("recus");

  // Répartition des paiements reçus par méthode — sur les paiements payés uniquement.
  const repartitionMethodes = useMemo(() => {
    const payes = (paiements as PaiementRow[]).filter((p) => p.statut === "paye");
    const totaux = new Map<string, number>();
    for (const p of payes) {
      const cle = p.methode?.trim() || "Mobile Money";
      totaux.set(cle, (totaux.get(cle) ?? 0) + Number(p.montant_net ?? p.montant ?? 0));
    }
    const totalGeneral = Array.from(totaux.values()).reduce((a, b) => a + b, 0);
    return Array.from(totaux.entries())
      .map(([methode, montant]) => ({
        methode,
        montant,
        pct: totalGeneral > 0 ? Math.round((montant / totalGeneral) * 100) : 0,
      }))
      .sort((a, b) => b.montant - a.montant);
  }, [paiements]);

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
          {/* --- Stats — 4 blocs sur une même ligne, solde mis en avant --- */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {[
              {
                label: "Solde disponible",
                value: `${soldeDisponible.toLocaleString("fr-FR")} F`,
                icon: Wallet,
                color: "text-coral-600",
                bg: "bg-coral-50",
                isHero: true,
              },
              {
                label: "Paiements reçus",
                value: paiements.length,
                icon: ArrowDownToLine,
                color: "text-teal-600",
                bg: "bg-teal-50",
              },
              {
                label: "Retraits",
                value: retraits.length,
                icon: ArrowUpFromLine,
                color: "text-blue-600",
                bg: "bg-blue-50",
              },
              {
                label: "En attente",
                value: `${soldeEnAttenteLivraison.toLocaleString("fr-FR")} F`,
                icon: Clock,
                color: "text-amber-600",
                bg: "bg-amber-50",
              },
            ].map((tile, i) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className={`relative overflow-hidden p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ${
                  tile.isHero
                    ? "bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 shadow-coral-500/20"
                    : "bg-white border border-gray-100"
                }`}
              >
                {tile.isHero && (
                  <div className="absolute -top-8 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                )}

                <div className="relative flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      tile.isHero ? "bg-white/20 text-white" : `${tile.bg} ${tile.color}`
                    }`}
                  >
                    <tile.icon size={18} />
                  </div>
                  {tile.isHero && (
                    <button
                      onClick={() => { setFeedback(null); setModalOpen(true); }}
                      disabled={soldeDisponible <= 0}
                      className="px-2.5 py-1 bg-white text-coral-600 text-[10px] font-bold rounded-md transition-all disabled:opacity-40 disabled:text-gray-400 whitespace-nowrap"
                    >
                      Retirer
                    </button>
                  )}
                </div>

                <p className={`relative text-[11px] font-medium mb-0.5 line-clamp-1 ${tile.isHero ? "text-white/80" : "text-gray-500"}`}>
                  {tile.label}
                </p>
                <p className={`relative text-xl sm:text-2xl font-bold tracking-tight truncate ${tile.isHero ? "text-white" : "text-gray-900"}`}>
                  {tile.value}
                </p>
              </motion.div>
            ))}
          </div>
          {soldeDisponible <= 0 && (
            <p className="text-[11px] text-gray-400 -mt-2">
              Rien à retirer pour l'instant — reviens après tes prochaines livraisons confirmées.
            </p>
          )}

          {/* --- Évolution des paiements --- */}
          <VentesChart paiements={paiements} titre="Évolution des paiements" objectifMensuel={500000} />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* --- Répartition par méthode de paiement --- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <PiggyBank size={16} className="text-teal-600" />
                Répartition par méthode
              </h3>

              {repartitionMethodes.length === 0 ? (
                <p className="text-gray-400 text-center py-8 text-xs">Aucun paiement reçu pour le moment</p>
              ) : (
                <div className="space-y-4">
                  {repartitionMethodes.map((m, i) => (
                    <div key={m.methode}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-gray-700">{m.methode}</span>
                        <span className="text-xs text-gray-500">
                          {m.montant.toLocaleString("fr-FR")} F · {m.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${m.pct}%` }}
                          transition={{ delay: 0.1 * i, duration: 0.5, ease: "easeOut" }}
                          className={`h-full rounded-full ${
                            i === 0 ? "bg-coral-500" : i === 1 ? "bg-teal-500" : "bg-amber-500"
                          }`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* --- Moyen de retrait enregistré --- */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 md:p-6">
              <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Smartphone size={16} className="text-coral-500" />
                Moyen de retrait
              </h3>

              {vendeur?.mobile_money_number ? (
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center flex-shrink-0">
                      <Smartphone size={20} />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{vendeur.mobile_money_number}</p>
                      <p className="text-xs text-gray-500 uppercase tracking-wide">
                        {vendeur.mobile_money_network || "Mobile Money"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/vendeur/boutique"
                    className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    <Pencil size={13} />
                    Modifier
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col items-center text-center gap-3 py-4">
                  <p className="text-sm text-gray-500">
                    Aucun numéro Mobile Money enregistré — indispensable pour recevoir tes retraits.
                  </p>
                  <Link
                    href="/vendeur/boutique"
                    className="inline-flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 whitespace-nowrap"
                  >
                    <Smartphone size={15} />
                    Ajouter un numéro
                  </Link>
                </div>
              )}
            </div>
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
