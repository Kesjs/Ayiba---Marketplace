"use client";

import { motion } from "framer-motion";
import {
  History,
  CheckCircle2,
  XCircle,
  Wallet,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useLivreurHistorique, type HistoriqueMission } from "@/app/hooks/useLivreurHistorique";

const STATUT_STYLE: Record<string, string> = {
  livree: "bg-teal-50 text-teal-700 border-teal-100",
  annulee: "bg-red-50 text-red-700 border-red-100",
  remboursee: "bg-gray-100 text-gray-600 border-gray-200",
};

const STATUT_LABEL: Record<string, string> = {
  livree: "Livrée",
  annulee: "Annulée",
  remboursee: "Remboursée",
};

function MissionRow({ mission }: { mission: HistoriqueMission }) {
  const isLivree = mission.statut === "livree";
  const lieu = mission.adresse_livraison || mission.commune || "Adresse non renseignée";

  return (
    <div className="p-5 sm:p-6 flex items-start gap-4">
      <div
        className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
          isLivree ? "bg-teal-50 text-teal-600" : "bg-red-50 text-red-500"
        }`}
      >
        {isLivree ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3 mb-1">
          <p className="text-sm font-bold text-gray-900 truncate">Commande {mission.numero}</p>
          <span className={`shrink-0 text-[10px] font-bold px-2 py-1 rounded-full border ${STATUT_STYLE[mission.statut] || "bg-gray-100 text-gray-600 border-gray-200"}`}>
            {STATUT_LABEL[mission.statut] || mission.statut}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium mb-2">
          <MapPin size={12} />
          <span className="truncate">{lieu}</span>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-[11px] text-gray-400 font-medium">
            {new Date(mission.updated_at).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
            {" · "}
            {mission.nb_articles} article{mission.nb_articles > 1 ? "s" : ""}
          </p>
          {isLivree && (
            <p className="text-sm font-bold text-coral-500">
              +{(mission.frais_livraison ?? 0).toLocaleString("fr-FR")} F
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LivreurHistoriquePage() {
  const { loading, loadingMore, error, missions, hasMore, loadMore, stats, refresh } =
    useLivreurHistorique();

  const statCards = [
    {
      label: "Livraisons réussies",
      value: String(stats.totalLivrees),
      icon: CheckCircle2,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Annulées",
      value: String(stats.totalAnnulees),
      icon: XCircle,
      color: "text-red-500",
      bg: "bg-red-50",
    },
    {
      label: "Gains cumulés",
      value: `${stats.gainsTotal.toLocaleString("fr-FR")} F`,
      icon: Wallet,
      color: "text-coral-500",
      bg: "bg-coral-50",
    },
  ];

  return (
    <DashboardLayout role="livreur" title="Historique" backHref="/livreur/profil" backLabel="Profil">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-red-600 mb-4">{error}</p>
          <button
            onClick={() => refresh()}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="max-w-2xl">
          <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-8">
            {statCards.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.06 }}
                className="bg-white p-4 sm:p-5 rounded-3xl border border-gray-100 shadow-sm"
              >
                <div className={`w-9 h-9 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                  <stat.icon size={16} />
                </div>
                <p className="text-base sm:text-lg font-bold text-gray-900 truncate">{stat.value}</p>
                <p className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-wide mt-0.5">
                  {stat.label}
                </p>
              </motion.div>
            ))}
          </div>

          {missions.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 px-4">
              <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
                <History size={26} />
              </div>
              <p className="font-bold text-gray-700 mb-1">Aucune mission terminée</p>
              <p className="text-sm text-gray-400 max-w-xs mx-auto">
                Tes livraisons livrées ou annulées apparaîtront ici.
              </p>
            </div>
          ) : (
            <>
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm divide-y divide-gray-50 overflow-hidden">
                {missions.map((mission) => (
                  <MissionRow key={mission.id} mission={mission} />
                ))}
              </div>

              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3.5 flex items-center justify-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-900 disabled:opacity-50 transition-colors"
                >
                  {loadingMore ? "Chargement…" : "Voir plus"}
                  {!loadingMore && <ChevronDown size={16} />}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
