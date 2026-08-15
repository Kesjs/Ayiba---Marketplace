"use client";

import { useVendeurDashboard } from "@/lib/hooks/useVendeurDashboard";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VentesChart } from "@/components/dashboard/VentesChart";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Star,
  Plus,
  MessageSquare,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUT_BADGE_VARIANT, type StatutCommande } from "@/lib/constants/commandes";

function calculerVariation(actuel: number, precedent: number): string | null {
  if (precedent === 0) {
    return actuel > 0 ? "Nouveau" : null;
  }
  const pct = ((actuel - precedent) / precedent) * 100;
  const signe = pct >= 0 ? "+" : "";
  return `${signe}${Math.round(pct)}%`;
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

export default function VendeurDashboardPage() {
  const router = useRouter();
  const [showMore, setShowMore] = useState(false);

  const {
    loading,
    error,
    vendeur,
    stats,
    chiffreAffaires,
    evolution,
    commandes,
    messages,
    paiements,
    refresh,
  } = useVendeurDashboard();

  const caChange = evolution
    ? calculerVariation(Number(evolution.ca_periode_actuelle), Number(evolution.ca_periode_precedente))
    : null;

  const commandesChange = evolution
    ? calculerVariation(Number(evolution.commandes_periode_actuelle), Number(evolution.commandes_periode_precedente))
    : null;

  const articlesChange = evolution
    ? calculerVariation(Number(evolution.articles_actifs_actuel), Number(evolution.articles_actifs_precedent))
    : null;

  const articlesVendusChange = evolution
    ? calculerVariation(
        Number(evolution.articles_vendus_periode_actuelle),
        Number(evolution.articles_vendus_periode_precedente)
      )
    : null;

  const secondaryStats = [
    {
      label: "Chiffre d'affaires",
      value: `${chiffreAffaires?.montant_total ?? 0} F`,
      change: caChange,
      icon: TrendingUp,
      color: "text-coral-600",
      bg: "bg-coral-50",
    },
    {
      label: "Commandes",
      value: stats?.nombre_commandes ?? 0,
      change: commandesChange,
      icon: ShoppingBag,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Articles actifs",
      value: stats?.nombre_articles ?? 0,
      change: articlesChange,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50",
    },
    {
      label: "Articles vendus",
      value: stats?.articles_vendus ?? 0,
      change: articlesVendusChange,
      icon: Star,
      color: "text-blue-600",
      bg: "bg-blue-50",
    },
  ];

  // Centre d'attention
  const attentionItems: { label: string; href: string; couleur: string }[] = [];

  if (stats && stats.commandes_en_attente > 0) {
    attentionItems.push({
      label: `${stats.commandes_en_attente} commande${stats.commandes_en_attente > 1 ? "s" : ""} à confirmer`,
      href: "/vendeur/commandes",
      couleur: "bg-red-500",
    });
  }

  if (stats && stats.messages_non_lus > 0) {
    attentionItems.push({
      label: `${stats.messages_non_lus} message${stats.messages_non_lus > 1 ? "s" : ""} sans réponse`,
      href: "/vendeur/messages",
      couleur: "bg-amber-500",
    });
  }

  if (vendeur && vendeur.statut !== "valide") {
    attentionItems.push({
      label: vendeur.statut ? "Vérification KYC à terminer" : "Complète ton dossier KYC pour être visible",
      href: "/vendeur/kyc",
      couleur: "bg-orange-500",
    });
  }

  return (
    <DashboardLayout
      role="vendeur"
      title="Tableau de bord Vendeur"
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
          {/* Centre d'attention */}
          {attentionItems.length > 0 && (
            <div className="bg-white rounded-3xl border border-gray-100 border-l-4 border-l-coral-500 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-sm font-bold text-gray-900">À faire aujourd'hui</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {attentionItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-center justify-between gap-3 px-6 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${item.couleur}`} />
                      <span className="text-sm font-semibold text-gray-800 truncate">{item.label}</span>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Stats — 4 blocs sur une même ligne (CA mis en avant, puis Commandes, Articles actifs, Articles vendus) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            {secondaryStats.map((stat, i) => {
              const isCA = i === 0;
              return (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * i, duration: 0.3 }}
                  className={`relative overflow-hidden p-3 sm:p-4 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300 ${
                    isCA
                      ? "bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 shadow-coral-500/20"
                      : "bg-white border border-gray-100"
                  }`}
                >
                  {isCA && (
                    <div className="absolute -top-8 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
                  )}

                  <div className="relative flex items-center justify-between gap-2 mb-2">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isCA ? "bg-white/20 text-white" : `${stat.bg} ${stat.color}`
                      }`}
                    >
                      <stat.icon size={18} />
                    </div>
                    {stat.change && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                          isCA
                            ? "bg-white/20 text-white"
                            : stat.change.startsWith("+") || stat.change === "Nouveau"
                            ? "bg-teal-50 text-teal-600"
                            : "bg-red-50 text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                    )}
                  </div>

                  <p className={`relative text-[11px] font-medium mb-0.5 line-clamp-1 ${isCA ? "text-white/80" : "text-gray-500"}`}>
                    {stat.label}
                  </p>
                  <p className={`relative text-xl sm:text-2xl font-bold tracking-tight truncate ${isCA ? "text-white" : "text-gray-900"}`}>
                    {stat.value}
                  </p>
                </motion.div>
              );
            })}
          </div>

          {/* Graphique CA */}
          <VentesChart paiements={paiements} objectifMensuel={500000} />

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
                <ActionRapide icon={Plus} label="Nouvel article" href="/vendeur/articles/nouveau" color="coral" />
                <ActionRapide icon={ShoppingBag} label="Commandes" href="/vendeur/commandes" color="teal" />
                <ActionRapide icon={MessageSquare} label="Messages" href="/vendeur/messages" color="amber" />
                <ActionRapide icon={TrendingUp} label="Paiements" href="/vendeur/paiements" color="blue" />
              </div>

              {showMore && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  transition={{ duration: 0.3 }}
                  className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-4 pt-4 border-t border-gray-100"
                >
                  <ActionRapide icon={Package} label="Mes articles" href="/vendeur/articles" color="amber" />
                  <ActionRapide icon={Star} label="Avis clients" href="/vendeur/avis" color="blue" />
                </motion.div>
              )}
            </div>

            {/* Messages récents */}
            <div className="lg:col-span-4 bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm h-fit">
              <h3 className="font-bold text-gray-900 mb-4">Messages récents</h3>

              <div className="space-y-4">
                {messages.length === 0 ? (
                  <p className="text-gray-400 py-6 text-center text-xs">Aucun message récent</p>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className="flex gap-3 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-xl transition-colors"
                    >
                      <div className="relative w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                        <MessageSquare size={16} className="text-teal-600" />
                        {msg.lu === false && (
                          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-coral-500 rounded-full border border-white" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-700 line-clamp-2 group-hover:text-gray-900 transition-colors">
                          {msg.contenu}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-0.5">
                          {new Date(msg.created_at).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <Link
                href="/vendeur/messages"
                className="block w-full text-center mt-6 py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold rounded-lg transition-colors"
              >
                Voir tous les messages
              </Link>
            </div>

            {/* Dernières commandes — pleine largeur */}
            <div className="lg:col-span-12 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 md:p-6 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900">Dernières commandes</h3>
                <Link href="/vendeur/commandes" className="text-xs font-bold text-coral-600 hover:underline">
                  Voir tout →
                </Link>
              </div>

              {commandes.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-coral-50 flex items-center justify-center text-3xl">
                    📦
                  </div>
                  <p className="font-semibold text-gray-700">Aucune commande pour le moment</p>
                  <p className="text-sm text-gray-400">Ajoutez un nouvel article pour commencer à vendre.</p>
                  <Link
                    href="/vendeur/articles/nouveau"
                    className="mt-2 inline-flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  >
                    <Plus size={18} />
                    Nouvel article
                  </Link>
                </div>
              ) : (
                <>
                  <div className="md:hidden divide-y divide-gray-100">
                    {commandes.map((order) => (
                      <button
                        key={order.id}
                        onClick={() => router.push(`/vendeur/commandes/${order.id}`)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-4 active:bg-gray-50 transition-colors text-left"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-gray-900 truncate">{order.nom_client}</p>
                          <p className="text-xs text-gray-500 mb-2">{order.numero}</p>
                          <StatutBadge statutBrut={order.statut_brut} statut={order.statut} />
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="text-right">
                            <p className="font-bold text-gray-900">{order.montant_total} F</p>
                            <p className="text-xs text-gray-400">
                              {new Date(order.created_at).toLocaleDateString("fr-FR")}
                            </p>
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
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                          <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-8 py-5 w-12"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {commandes.map((order) => (
                          <tr
                            key={order.id}
                            onClick={() => router.push(`/vendeur/commandes/${order.id}`)}
                            className="hover:bg-gray-50 cursor-pointer transition-colors group"
                          >
                            <td className="px-8 py-6">
                              <p className="font-semibold text-gray-900">{order.nom_client}</p>
                              <p className="text-sm text-gray-500">{order.numero}</p>
                            </td>
                            <td className="px-8 py-6">
                              <StatutBadge statutBrut={order.statut_brut} statut={order.statut} />
                            </td>
                            <td className="px-8 py-6 font-semibold text-gray-900">
                              {order.montant_total} F
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
