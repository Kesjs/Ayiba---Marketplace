"use client";

import { useClientDashboard } from "@/app/hooks/useClientDashboard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  ShoppingBag,
  Heart,
  Package,
  TrendingUp,
  Plus,
  MessageSquare,
  ChevronRight,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUT_BADGE_VARIANT, type StatutCommande } from "@/lib/constants/commandes";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

function StatutBadge({ statutBrut, statut }: { statutBrut: string; statut: string }) {
  const variant = STATUT_BADGE_VARIANT[statutBrut as StatutCommande] ?? "neutral";
  return <StatusBadge variant={variant}>{statut}</StatusBadge>;
}

// Composant Action Rapide réutilisable
function ActionRapide({ 
  icon: Icon, 
  label, 
  href, 
  color 
}: { 
  icon: React.ElementType; 
  label: string; 
  href: string; 
  color: string;
}) {
  const colorMap: Record<string, string> = {
    coral: "text-coral-600 border-coral-100 from-coral-50",
    teal:  "text-teal-600 border-teal-100 from-teal-50",
    amber: "text-amber-600 border-amber-100 from-amber-50",
    blue:  "text-blue-600 border-blue-100 from-blue-50",
  };

  return (
    <Link href={href} className="group">
      <div className={`flex flex-col items-center gap-2.5 p-4 rounded-3xl bg-gradient-to-br ${colorMap[color]} to-white border hover:shadow-md transition-all active:scale-[0.97]`}>
        <div className="w-12 h-12 rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
          <Icon className="w-6 h-6" />
        </div>
        <p className="font-semibold text-gray-900 text-center text-[13px] leading-tight">{label}</p>
      </div>
    </Link>
  );
}

export default function ClientDashboardPage() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const {
    loading,
    error,
    stats,
    commandes,
    favoris,
    refresh,
  } = useClientDashboard();

  const clientStats = [
    {
      label: "Commandes",
      value: stats?.total_commandes ?? 0,
      icon: ShoppingBag,
      color: "text-coral-600",
      bg: "bg-coral-50",
    },
    {
      label: "Dépenses totales",
      value: formatFCFA(stats?.total_depenses ?? 0),
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "En cours",
      value: stats?.commandes_en_cours ?? 0,
      icon: Clock,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Favoris",
      value: favoris.length,
      icon: Heart,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  return (
    <DashboardLayout
      role="client"
      title="Tableau de bord Client"
      personalized
    >
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
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="space-y-8"
        >
          {/* Stats — 4 blocs sur une même ligne */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {clientStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="relative overflow-hidden p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 bg-white border border-gray-100"
              >
                <div className="relative flex items-center justify-between gap-2 mb-2">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${stat.bg} ${stat.color}`}
                  >
                    <stat.icon size={18} />
                  </div>
                </div>

                <p className="relative text-[11px] font-medium mb-0.5 line-clamp-1 text-gray-500">
                  {stat.label}
                </p>
                <p className="relative text-xl sm:text-2xl font-bold tracking-tight truncate text-gray-900">
                  {stat.value}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
            {/* Actions rapides */}
            <div className="lg:col-span-8 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Actions rapides</h3>
                <button
                  onClick={() => setShowMore(!showMore)}
                  className="text-coral-600 text-xs font-bold flex items-center gap-1 hover:underline active:text-coral-700 transition-colors"
                >
                  {showMore ? "Voir moins" : "Tout voir"}
                  <ChevronRight 
                    size={14} 
                    className={`transition-transform ${showMore ? "rotate-90" : ""}`} 
                  />
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <ActionRapide icon={Package} label="Catalogue" href="/catalogue" color="coral" />
                <ActionRapide icon={Heart} label="Favoris" href="/favoris" color="teal" />
                <ActionRapide icon={ShoppingBag} label="Commandes" href="/commandes" color="amber" />
                <ActionRapide icon={MapPin} label="Adresses" href="/profil" color="blue" />
              </div>

              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100"
                >
                  <ActionRapide icon={MessageSquare} label="Messages" href="/messages" color="amber" />
                </motion.div>
              )}
            </div>

            {/* Favoris récents */}
            <div className="lg:col-span-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <h3 className="font-bold text-gray-900 mb-4">Favoris récents</h3>

              <div className="space-y-4">
                {favoris.length === 0 ? (
                  <p className="text-gray-400 py-6 text-center text-xs">Aucun favori pour le moment</p>
                ) : (
                  favoris.slice(0, 3).map((fav: any) => (
                    <Link
                      key={fav.id}
                      href={`/produits/${fav.articles?.id}`}
                      className="flex gap-3 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
                    >
                      <div className="relative w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                        {fav.articles?.images?.[0] ? (
                          <img 
                            src={fav.articles.images[0]} 
                            alt={fav.articles.nom} 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <Package size={16} />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 line-clamp-1 group-hover:text-coral-600 transition-colors">
                          {fav.articles?.nom || "Produit"}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {fav.articles?.vendeurs?.nom_boutique || "Boutique"}
                        </p>
                        <p className="text-xs font-bold text-coral-600 mt-1">
                          {formatFCFA(fav.articles?.prix || 0)}
                        </p>
                      </div>
                    </Link>
                  ))
                )}
              </div>

              <Link
                href="/favoris"
                className="block w-full text-center mt-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
              >
                Voir tous les favoris
              </Link>
            </div>

            {/* Dernières commandes — pleine largeur */}
            <div className="lg:col-span-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Dernières commandes</h3>
                <Link href="/commandes" className="text-xs font-bold text-coral-600 hover:underline">
                  Voir tout →
                </Link>
              </div>

              {commandes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-coral-50 flex items-center justify-center text-3xl">
                    🛒
                  </div>
                  <p className="font-semibold text-gray-700">Aucune commande pour le moment</p>
                  <p className="text-sm text-gray-400">Découvre notre catalogue pour commencer tes achats.</p>
                  <Link
                    href="/catalogue"
                    className="mt-2 inline-flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  >
                    <Package size={18} />
                    Explorer le catalogue
                  </Link>
                </div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-gray-100">
                    {commandes.map((order: any) => (
                      <button
                        key={order.id}
                        onClick={() => router.push(`/commandes/${order.id}`)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-4 active:bg-gray-50 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{order.numero}</p>
                          <p className="text-xs text-gray-500 mb-2">
                            {new Date(order.created_at).toLocaleDateString("fr-FR")}
                          </p>
                          <StatutBadge statutBrut={order.statut_brut} statut={order.statut} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{formatFCFA(order.montant_total)}</p>
                          </div>
                          <ChevronRight size={18} className="text-gray-300" />
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Commande</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-8 py-5 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {commandes.map((order: any) => (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/commandes/${order.id}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <p className="font-semibold text-gray-900">#{order.numero}</p>
                            </td>
                            <td className="px-8 py-6">
                              <StatutBadge statutBrut={order.statut_brut} statut={order.statut} />
                            </td>
                            <td className="px-8 py-6 font-semibold text-gray-900">
                              {formatFCFA(order.montant_total)}
                            </td>
                            <td className="px-8 py-6 text-sm text-gray-500">
                              {new Date(order.created_at).toLocaleDateString("fr-FR")}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 transition-colors inline-block" />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
