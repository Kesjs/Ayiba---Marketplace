"use client";

import { useVendeurDashboard } from "@/lib/hooks/useVendeurDashboard";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { VentesChart } from "@/components/dashboard/VentesChart";
import {
  TrendingUp,
  Package,
  ShoppingBag,
  Star,
  Plus,
  MessageSquare,
  MoreVertical,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

function calculerVariation(actuel: number, precedent: number): string | null {
  if (precedent === 0) {
    return actuel > 0 ? "Nouveau" : null;
  }
  const pct = ((actuel - precedent) / precedent) * 100;
  const signe = pct >= 0 ? "+" : "";
  return `${signe}${Math.round(pct)}%`;
}

function StatutBadge({ statut }: { statut: string }) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
        statut === "En attente"
          ? "bg-amber-50 text-amber-700 border-amber-100"
          : statut === "Confirmé"
          ? "bg-teal-50 text-teal-700 border-teal-100"
          : "bg-gray-100 text-gray-600 border-gray-200"
      }`}
    >
      {statut}
    </span>
  );
}

export default function VendeurDashboardPage() {
  const router = useRouter();

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
      label: "Commandes",
      value: stats?.nombre_commandes ?? 0,
      change: commandesChange,
      icon: ShoppingBag,
      color: "text-coral-500",
      bg: "bg-coral-50",
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

  // --- Centre d'attention : actions concrètes qui attendent le vendeur ---
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

  if (vendeur && vendeur.statut && vendeur.statut !== "valide") {
    attentionItems.push({
      label: "Vérification KYC à terminer",
      href: "/vendeur/kyc",
      couleur: "bg-orange-500",
    });
  }

  return (
    <DashboardLayout
      role="vendeur"
      userName={vendeur?.nom_complet || "Vendeur"}
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
          {/* --- Centre d'attention --- */}
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

          {/* --- Hero CA --- */}
          <div className="relative overflow-hidden bg-gradient-to-br from-coral-500 via-coral-500 to-coral-600 rounded-[32px] p-6 sm:p-8 text-white shadow-xl shadow-coral-500/20">
            <div className="absolute -top-20 -right-16 w-56 h-56 bg-white/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-10 w-48 h-48 bg-black/10 rounded-full blur-3xl pointer-events-none" />

            <div className="relative">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={16} className="text-white/80" />
                <span className="text-white/80 text-sm">Chiffre d'affaires</span>
              </div>
              <p className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
                {chiffreAffaires?.montant_total ?? 0} F
              </p>

              {caChange && (
                <div className="inline-flex items-center gap-1.5 bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  <span className="text-xs font-semibold">{caChange} vs période précédente</span>
                </div>
              )}
            </div>
          </div>

          {/* --- Graphique CA --- */}
          <VentesChart paiements={paiements} objectifMensuel={500000} />

          {/* --- Tuiles stats secondaires --- */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-6">
            {secondaryStats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i, duration: 0.3 }}
                className="bg-white p-4 sm:p-6 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  {stat.change && (
                    <span
                      className={`text-xs font-bold px-3 py-1 rounded-full ${
                        stat.change.startsWith("+") || stat.change === "Nouveau"
                          ? "bg-teal-50 text-teal-600"
                          : "bg-red-50 text-red-600"
                      }`}
                    >
                      {stat.change}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-8 space-y-8">
              {/* Actions rapides */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg md:text-xl font-bold">Actions rapides</h3>
                  <Link
                    href="/vendeur/articles/nouveau"
                    className="hidden sm:flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  >
                    <Plus size={18} />
                    Nouvel article
                  </Link>
                </div>

                {/* Grille 2x2 mobile-first : classes de base = mobile, sm: = écrans plus larges.
                    4e action ajoutée pour remplir la grille et éviter le vide en bas à droite.
                    Descriptions masquées sur mobile pour garder des tuiles compactes et alignées. */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                  <Link href="/vendeur/articles/nouveau" className="group">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-coral-50 to-white border border-coral-100 hover:border-coral-200 hover:shadow-md active:scale-[0.98] transition-all h-full">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus className="w-5 h-5 sm:w-7 sm:h-7 text-coral-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                          Nouvel Article
                        </p>
                        <p className="hidden sm:block text-xs text-gray-500 mt-1">
                          Ajoutez rapidement un produit
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/vendeur/commandes" className="group">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 hover:border-teal-200 hover:shadow-md active:scale-[0.98] transition-all h-full">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag className="w-5 h-5 sm:w-7 sm:h-7 text-teal-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                          Commandes
                        </p>
                        <p className="hidden sm:block text-xs text-gray-500 mt-1">
                          Gérez vos ventes
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/vendeur/messages" className="group">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-200 hover:shadow-md active:scale-[0.98] transition-all h-full">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare className="w-5 h-5 sm:w-7 sm:h-7 text-amber-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                          Messages
                        </p>
                        <p className="hidden sm:block text-xs text-gray-500 mt-1">
                          Répondez à vos clients
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/vendeur/paiements" className="group">
                    <div className="flex flex-col items-center gap-2 sm:gap-4 p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-blue-50 to-white border border-blue-100 hover:border-blue-200 hover:shadow-md active:scale-[0.98] transition-all h-full">
                      <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <TrendingUp className="w-5 h-5 sm:w-7 sm:h-7 text-blue-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900 text-sm sm:text-base leading-tight">
                          Paiements
                        </p>
                        <p className="hidden sm:block text-xs text-gray-500 mt-1">
                          Suivez vos revenus
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Dernières commandes */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-lg md:text-xl font-bold">Dernières commandes</h3>
                  <Link href="/vendeur/commandes" className="text-sm font-bold text-coral-600 hover:underline">
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
                    {/* --- Vue carte mobile (< md) --- */}
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
                            <StatutBadge statut={order.statut} />
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

                    {/* --- Vue tableau desktop (>= md) --- */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-50">
                            <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Client</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Statut</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Montant</th>
                            <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Date</th>
                            <th className="px-8 py-5"></th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {commandes.map((order) => (
                            <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                              <td className="px-8 py-6">
                                <p className="font-semibold text-gray-900">{order.nom_client}</p>
                                <p className="text-sm text-gray-500">{order.numero}</p>
                              </td>
                              <td className="px-8 py-6">
                                <StatutBadge statut={order.statut} />
                              </td>
                              <td className="px-8 py-6 font-semibold text-gray-900">
                                {order.montant_total} F
                              </td>
                              <td className="px-8 py-6 text-sm text-gray-500">
                                {new Date(order.created_at).toLocaleDateString("fr-FR")}
                              </td>
                              <td className="px-8 py-6 text-right">
                                <button
                                  onClick={() => router.push(`/vendeur/commandes/${order.id}`)}
                                  className="p-3 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                  <MoreVertical size={20} />
                                </button>
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

            {/* Colonne latérale */}
            <div className="lg:col-span-4 space-y-8">
              {/* Messages récents */}
              <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                <h3 className="text-lg md:text-xl font-bold mb-6">Messages récents</h3>

                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <p className="text-gray-400 py-8 text-center">Aucun message récent</p>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className="flex gap-4 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-2xl transition-colors"
                      >
                        <div className="relative w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={20} className="text-teal-600" />
                          {msg.lu === false && (
                            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-coral-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm text-gray-700 line-clamp-2 group-hover:text-gray-900 transition-colors">
                            {msg.contenu}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(msg.created_at).toLocaleDateString("fr-FR")}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <Link
                  href="/vendeur/messages"
                  className="block w-full text-center mt-8 py-3.5 bg-gray-900 hover:bg-black text-white text-sm font-bold rounded-2xl transition-colors"
                >
                  Voir tous les messages
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </DashboardLayout>
  );
}
