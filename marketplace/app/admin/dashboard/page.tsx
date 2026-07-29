"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminOverview } from "@/lib/hooks/useAdmin";
import {
  Users,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  ShieldCheck,
  Store,
  Truck,
  Package,
  Wallet,
  UserX,
  ArrowUpRight,
  PiggyBank,
  RotateCcw,
  Landmark,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { Skeleton } from "@/components/ui/Skeleton";

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminDashboardPage() {
  const { stats, recentCommandes, recentDisputes, loading, error } = useAdminOverview();

  const kpis = stats
    ? [
        { label: "Utilisateurs actifs", value: stats.utilisateurs_actifs, icon: Users, color: "text-blue-600", bg: "bg-blue-50", href: "/admin/utilisateurs?statut=actif" },
        { label: "Commandes (24h)", value: stats.commandes_24h, icon: ShoppingBag, color: "text-teal-600", bg: "bg-teal-50", href: "/admin/commandes" },
        { label: "Litiges ouverts", value: stats.litiges_ouverts, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50", href: "/admin/litiges" },
        { label: "Volume d'affaires (mois)", value: formatFCFA(stats.volume_affaires_mois), icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50", href: null },
      ]
    : [];

  // Évolution du volume d'affaires vs le mois civil précédent (pas de % si le mois précédent est à 0).
  const evolutionVolume =
    stats && stats.volume_affaires_mois_precedent > 0
      ? ((stats.volume_affaires_mois - stats.volume_affaires_mois_precedent) / stats.volume_affaires_mois_precedent) * 100
      : null;

  const kpisFinanciers = stats
    ? [
        {
          label: "Revenu net Ayiba (mois)",
          value: formatFCFA(stats.revenu_net_mois),
          sub: "Commission perçue sur les commandes réelles",
          icon: PiggyBank,
          color: "text-emerald-600",
          bg: "bg-emerald-50",
        },
        {
          label: "Taux d'annulation (mois)",
          value: `${stats.taux_annulation_mois}%`,
          sub: "Commandes annulées + remboursées / total",
          icon: RotateCcw,
          color: stats.taux_annulation_mois > 15 ? "text-red-600" : "text-gray-600",
          bg: stats.taux_annulation_mois > 15 ? "bg-red-50" : "bg-gray-50",
        },
        {
          label: "Retraits versés (total)",
          value: formatFCFA(stats.retraits_verses_total),
          sub: "Somme déjà décaissée aux vendeurs/livreurs",
          icon: Landmark,
          color: "text-indigo-600",
          bg: "bg-indigo-50",
        },
      ]
    : [];

  const actionsRequises = stats
    ? [
        { label: "Vendeurs KYC en attente", count: stats.vendeurs_kyc_attente, href: "/admin/vendeurs", icon: Store },
        { label: "Livreurs KYC en attente", count: stats.livreurs_kyc_attente, href: "/admin/livreurs", icon: Truck },
        { label: "Articles à modérer", count: stats.articles_a_moderer, href: "/admin/moderation", icon: Package },
        { label: "Retraits à valider", count: stats.retraits_a_valider, href: "/admin/paiements", icon: Wallet },
        { label: "Demandes de suppression", count: stats.demandes_suppression_attente, href: "/admin/demandes", icon: UserX },
      ]
    : [];

  return (
    <DashboardLayout role="admin" title="Administration Système">
      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm font-medium">
          Erreur de chargement : {error}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[32px]" />)
          : kpis.map((stat, i) => {
              const isVolumeCard = stat.label === "Volume d'affaires (mois)";
              const CardInner = (
                <>
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    {isVolumeCard && evolutionVolume !== null && (
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          evolutionVolume >= 0 ? "bg-teal-50 text-teal-700" : "bg-red-50 text-red-600"
                        }`}
                      >
                        {evolutionVolume >= 0 ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                        {Math.abs(Math.round(evolutionVolume))}%
                      </span>
                    )}
                  </div>
                  {isVolumeCard && (
                    <p className="text-[11px] text-gray-400 font-medium mt-1">
                      {evolutionVolume === null ? "Pas de comparaison (mois précédent à 0)" : "vs mois précédent"}
                    </p>
                  )}
                </>
              );
              const cardClass =
                "bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-300 group";
              return stat.href ? (
                <Link key={i} href={stat.href} className={`${cardClass} block relative`}>
                  {CardInner}
                  <ArrowUpRight size={16} className="absolute top-6 right-6 text-gray-200 group-hover:text-coral-400 transition-colors" />
                </Link>
              ) : (
                <div key={i} className={cardClass}>
                  {CardInner}
                </div>
              );
            })}
      </div>

      {/* Suivi financier */}
      <div className="mb-12">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4">Comment évolue l'argent d'Ayiba</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {loading
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-32 rounded-[32px]" />)
            : kpisFinanciers.map((stat, i) => (
                <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center mb-4`}>
                    <stat.icon size={24} />
                  </div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-[11px] text-gray-400 font-medium">{stat.sub}</p>
                </div>
              ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Actions requises */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50">
              <h3 className="text-lg font-bold">Actions requises</h3>
              <p className="text-sm text-gray-400 font-medium mt-1">Ce qui attend une décision de votre part</p>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 rounded-xl" />
                  ))}
                </div>
              ) : (
                actionsRequises.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    className="p-6 hover:bg-gray-50/30 transition-all flex items-center gap-4 group"
                  >
                    <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-coral-50 text-coral-500">
                      <item.icon size={18} />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-coral-500 transition-colors">{item.label}</p>
                    </div>
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        item.count > 0 ? "bg-amber-50 text-amber-700" : "bg-gray-50 text-gray-400"
                      }`}
                    >
                      {item.count}
                    </span>
                    <ArrowUpRight size={16} className="text-gray-300 group-hover:text-coral-400" />
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Commandes récentes */}
          <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold">Commandes récentes</h3>
              <Link href="/admin/commandes" className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                Voir tout
              </Link>
            </div>
            <div className="divide-y divide-gray-50">
              {loading ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 rounded-xl" />
                  ))}
                </div>
              ) : recentCommandes.length === 0 ? (
                <p className="p-8 text-sm text-gray-400">Aucune commande pour le moment.</p>
              ) : (
                recentCommandes.map((c) => (
                  <div key={c.id} className="p-6 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">#{c.numero}</p>
                      <p className="text-xs text-gray-400 font-medium">{c.nom_client || "Client"}</p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatFCFA(c.montant_total)}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Sidebar litiges */}
        <div className="space-y-8">
          <div className="bg-gray-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <ShieldCheck size={24} className="text-coral-400" />
              </div>
              <h4 className="font-bold text-xl mb-3">Séquestre en cours</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-medium mb-2">
                <span className="text-white font-bold">{loading ? "..." : formatFCFA(stats?.montant_en_sequestre || 0)}</span> retenus en escrow, en attente de livraison confirmée.
              </p>
            </div>
          </div>

          <div className="bg-red-50 p-8 rounded-[40px] border border-red-100">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={20} />
              <h4 className="font-bold text-red-700">Litiges Actifs</h4>
            </div>
            <div className="space-y-4">
              {loading ? (
                <Skeleton className="h-16 rounded-2xl" />
              ) : recentDisputes.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun litige ouvert.</p>
              ) : (
                recentDisputes.map((d) => (
                  <Link
                    key={d.id}
                    href="/admin/litiges"
                    className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-xs font-bold text-gray-900">#{d.id.slice(0, 8)}</p>
                      <p className="text-[10px] text-gray-400 font-medium">{d.motif}</p>
                    </div>
                    <ArrowUpRight size={16} className="text-red-400" />
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
