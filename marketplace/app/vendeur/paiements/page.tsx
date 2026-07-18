"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useVendeurPaiements } from "../../hooks/useVendeurPaiements";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  Wallet, Clock, X, ArrowDownToLine, ArrowUpFromLine, ChevronRight,
} from "lucide-react";

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

function statutLivraisonLabel(commandeStatut?: string): { label: string; style: string } {
  if (commandeStatut === "livree") {
    return { label: "Livrée · disponible", style: "bg-teal-50 text-teal-700 border-teal-100" };
  }
  if (commandeStatut === "annulee" || commandeStatut === "remboursee") {
    return { label: "Annulée", style: "bg-gray-100 text-gray-600 border-gray-200" };
  }
  return { label: "En cours de livraison", style: "bg-amber-50 text-amber-700 border-amber-100" };
}

function PaiementCard({ p }: { p: any }) {
  const livraison = statutLivraisonLabel(p.commande?.statut);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-1">
        <p className="font-semibold text-gray-900 text-sm">
          {Number(p.montant_net ?? p.montant).toLocaleString("fr-FR")} F
        </p>
        <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUT_STYLE[p.statut] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
          {STATUT_LABEL[p.statut] || p.statut}
        </span>
      </div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">
          {p.commande?.numero ? `Commande ${p.commande.numero}` : "—"} · {new Date(p.created_at).toLocaleDateString("fr-FR")}
        </p>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${livraison.style}`}>
          {livraison.label}
        </span>
      </div>
      {p.commission > 0 && (
        <p className="text-[11px] text-gray-400 mt-1">
          Vente {Number(p.montant).toLocaleString("fr-FR")} F − Commission {Number(p.commission).toLocaleString("fr-FR")} F
        </p>
      )}
    </div>
  );
}

function RetraitCard({ r }: { r: any }) {
  return (
    <div className="flex items-center justify-between p-4">
      <div>
        <p className="font-semibold text-gray-900 text-sm">{Number(r.montant).toLocaleString("fr-FR")} F</p>
        <p className="text-xs text-gray-400">
          {new Date(r.created_at).toLocaleDateString("fr-FR")} · {r.reseau?.toUpperCase()}
        </p>
      </div>
      <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUT_STYLE[r.statut] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
        {STATUT_LABEL[r.statut] || r.statut}
      </span>
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
          {/* --- Bande hero : solde + attente + retirer --- */}
          <div className="relative overflow-hidden bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-coral-500/20">
            <div className="absolute -top-20 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-10 w-48 h-48 bg-black/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <Wallet size={16} className="text-white/80" />
                <span className="text-white/80 text-sm">Solde disponible</span>
              </div>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-5">
                {soldeDisponible.toLocaleString("fr-FR")} F
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-5">
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

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => { setFeedback(null); setModalOpen(true); }}
                disabled={soldeDisponible <= 0}
                className="w-full sm:w-auto px-6 py-3.5 bg-white text-coral-600 text-sm font-bold rounded-2xl transition-all disabled:opacity-40 disabled:text-gray-400"
              >
                Retirer maintenant
              </motion.button>
              {soldeDisponible <= 0 && (
                <p className="text-xs text-white/70 mt-3">
                  Rien à retirer pour l'instant — reviens une fois tes livraisons confirmées.
                </p>
              )}
            </div>
          </div>

          {/* --- Grille de tuiles carrées (raccourcis + KPIs) --- */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            {[
              { icon: ArrowDownToLine, label: "Paiements reçus", value: paiements.length, color: "text-teal-600", bg: "bg-teal-50" },
              { icon: ArrowUpFromLine, label: "Retraits", value: retraits.length, color: "text-coral-500", bg: "bg-coral-50" },
              { icon: Clock, label: "En attente", value: `${soldeEnAttenteLivraison.toLocaleString("fr-FR")} F`, color: "text-amber-600", bg: "bg-amber-50" },
              { icon: Wallet, label: "Disponible", value: `${soldeDisponible.toLocaleString("fr-FR")} F`, color: "text-gray-900", bg: "bg-gray-100" },
            ].map((tile, i) => (
              <motion.div
                key={tile.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-gray-100 shadow-sm active:scale-[0.97] transition-transform"
              >
                <div className={`w-10 h-10 rounded-2xl ${tile.bg} ${tile.color} flex items-center justify-center mb-3`}>
                  <tile.icon size={18} />
                </div>
                <p className="text-lg sm:text-xl font-bold text-gray-900 truncate">{tile.value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tile.label}</p>
              </motion.div>
            ))}
          </div>

          {/* --- Listes : tabs sur mobile, côte à côte sur desktop --- */}
          <div className="lg:hidden bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex p-2 gap-2 border-b border-gray-100">
              {(["recus", "retraits"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`relative flex-1 py-2.5 rounded-2xl text-sm font-bold transition-colors ${
                    mobileTab === tab ? "text-white" : "text-gray-500"
                  }`}
                >
                  {mobileTab === tab && (
                    <motion.div
                      layoutId="paiementsTabIndicator"
                      className="absolute inset-0 bg-coral-500 rounded-2xl -z-10"
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
                className="divide-y divide-gray-100 max-h-[420px] overflow-y-auto"
              >
                {mobileTab === "recus" ? (
                  paiements.length === 0 ? (
                    <p className="text-gray-400 text-center py-12 text-sm">Aucun paiement pour l'instant</p>
                  ) : (
                    paiements.map((p) => <PaiementCard key={p.id} p={p} />)
                  )
                ) : retraits.length === 0 ? (
                  <p className="text-gray-400 text-center py-12 text-sm">Aucun retrait pour l'instant</p>
                ) : (
                  retraits.map((r) => <RetraitCard key={r.id} r={r} />)
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="hidden lg:grid lg:grid-cols-2 gap-8">
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
                  paiements.map((p) => <PaiementCard key={p.id} p={p} />)
                )}
              </div>
            </div>

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
              className="fixed bottom-0 left-0 right-0 z-[80] bg-white rounded-t-[32px] p-6 shadow-2xl sm:max-w-sm sm:mx-auto sm:rounded-[32px] sm:bottom-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold">Demander un retrait</h3>
                <button onClick={() => setModalOpen(false)} aria-label="Fermer" className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-gray-50">
                  <X size={20} className="text-gray-400" />
                </button>
              </div>

              <p className="text-sm text-gray-500 mb-4">
                Solde disponible : <span className="font-bold text-gray-900">{soldeDisponible.toLocaleString("fr-FR")} F</span>
              </p>

              <div className="relative mb-3">
                <input
                  type="number"
                  value={montant}
                  onChange={(e) => setMontant(e.target.value)}
                  placeholder="Montant à retirer"
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-coral-200"
                />
              </div>

              <button
                onClick={() => setMontant(String(soldeDisponible))}
                className="text-xs font-bold text-coral-600 mb-4"
              >
                Tout retirer ({soldeDisponible.toLocaleString("fr-FR")} F)
              </button>

              {feedback && (
                <p className={`text-sm font-medium mb-4 ${feedback.success ? "text-teal-600" : "text-red-600"}`}>
                  {feedback.message}
                </p>
              )}

              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleDemande}
                disabled={requesting || !montant}
                className="w-full py-3.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50"
              >
                {requesting ? "Envoi..." : "Confirmer la demande"}
              </motion.button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
