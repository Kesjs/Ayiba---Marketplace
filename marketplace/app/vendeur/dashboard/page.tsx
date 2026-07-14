"use client";

import { useVendeurDashboard } from "@/lib/hooks/useVendeurDashboard";

import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Star, 
  Plus, 
  MessageSquare,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

// Calcule un % de variation propre entre deux périodes.
// Retourne null si pas assez de données pour que le % ait un sens.
function calculerVariation(actuel: number, precedent: number): string | null {
  if (precedent === 0) {
    return actuel > 0 ? "Nouveau" : null;
  }
  const pct = ((actuel - precedent) / precedent) * 100;
  const signe = pct >= 0 ? "+" : "";
  return `${signe}${Math.round(pct)}%`;
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
    refresh
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
    ? calculerVariation(Number(evolution.articles_vendus_periode_actuelle), Number(evolution.articles_vendus_periode_precedente))
    : null;

  const statsCards = [
    {
      label: "Chiffre d'affaires",
      value: `${chiffreAffaires?.montant_total ?? 0} F`,
      change: caChange,
      icon: TrendingUp,
      color: "text-teal-600",
      bg: "bg-teal-50"
    },
    {
      label: "Commandes",
      value: stats?.nombre_commandes ?? 0,
      change: commandesChange,
      icon: ShoppingBag,
      color: "text-coral-500",
      bg: "bg-coral-50"
    },
    {
      label: "Articles actifs",
      value: stats?.nombre_articles ?? 0,
      change: articlesChange,
      icon: Package,
      color: "text-amber-600",
      bg: "bg-amber-50"
    },
    {
      label: "Articles vendus",
      value: stats?.articles_vendus ?? 0,
      change: articlesVendusChange,
      icon: Star,
      color: "text-blue-600",
      bg: "bg-blue-50"
    },
  ];

  return (
    <DashboardLayout 
      role="vendeur" 
      userName={vendeur?.nom_complet || "Vendeur"}
      title="Tableau de bord Vendeur"
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
        <div className="space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {statsCards.map((stat, i) => (
              <div 
                key={i} 
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  {stat.change && (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      stat.change.startsWith('+') || stat.change === "Nouveau"
                        ? 'bg-teal-50 text-teal-600' 
                        : 'bg-red-50 text-red-600'
                    }`}>
                      {stat.change}
                    </span>
                  )}
                </div>

                <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Colonne principale */}
            <div className="lg:col-span-8 space-y-8">
              {/* Actions rapides */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold">Actions rapides</h3>
                  <Link
                    href="/vendeur/articles/nouveau"
                    className="flex items-center gap-2 bg-coral-600 hover:bg-coral-700 text-white px-5 py-2.5 rounded-2xl text-sm font-bold transition-all active:scale-95"
                  >
                    <Plus size={18} />
                    Nouvel article
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Link href="/vendeur/articles/nouveau" className="group">
                    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-br from-coral-50 to-white border border-coral-100 hover:border-coral-200 hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Plus size={28} className="text-coral-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900">Nouvel Article</p>
                        <p className="text-xs text-gray-500">Ajoutez rapidement un produit</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/vendeur/commandes" className="group">
                    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-br from-teal-50 to-white border border-teal-100 hover:border-teal-200 hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <ShoppingBag size={28} className="text-teal-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900">Commandes</p>
                        <p className="text-xs text-gray-500">Gérez vos ventes</p>
                      </div>
                    </div>
                  </Link>

                  <Link href="/vendeur/messages" className="group">
                    <div className="flex flex-col items-center gap-4 p-6 rounded-3xl bg-gradient-to-br from-amber-50 to-white border border-amber-100 hover:border-amber-200 hover:shadow-md transition-all">
                      <div className="w-14 h-14 rounded-2xl bg-white shadow flex items-center justify-center group-hover:scale-110 transition-transform">
                        <MessageSquare size={28} className="text-amber-600" />
                      </div>
                      <div className="text-center">
                        <p className="font-bold text-gray-900">Messages</p>
                        <p className="text-xs text-gray-500">Répondez à vos clients</p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>

              {/* Dernières commandes */}
              <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex items-center justify-between">
                  <h3 className="text-xl font-bold">Dernières commandes</h3>
                  <Link href="/vendeur/commandes" className="text-sm font-bold text-coral-600 hover:underline">
                    Voir tout →
                  </Link>
                </div>

                <div className="overflow-x-auto">
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
                      {commandes.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-8 py-16 text-center text-gray-400">
                            Aucune commande récente
                          </td>
                        </tr>
                      ) : (
                        commandes.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-8 py-6">
                              <p className="font-semibold text-gray-900">{order.nom_client}</p>
                              <p className="text-sm text-gray-500">{order.numero}</p>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${
                                order.statut === "En attente"
                                  ? "bg-amber-50 text-amber-700 border-amber-100"
                                  : order.statut === "Confirmé"
                                  ? "bg-teal-50 text-teal-700 border-teal-100"
                                  : "bg-gray-100 text-gray-600 border-gray-200"
                              }`}>
                                {order.statut}
                              </span>
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
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Colonne latérale */}
            <div className="lg:col-span-4 space-y-8">
              {/* Messages récents */}
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm h-fit">
                <h3 className="text-xl font-bold mb-6">Messages récents</h3>
                
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <p className="text-gray-400 py-8 text-center">Aucun message récent</p>
                  ) : (
                    messages.map((msg) => (
                      <div key={msg.id} className="flex gap-4 group cursor-pointer hover:bg-gray-50 -mx-2 px-2 py-2 rounded-2xl transition-colors">
                        <div className="w-10 h-10 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0">
                          <MessageSquare size={20} className="text-teal-600" />
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
        </div>
      )}
    </DashboardLayout>
  );
}
