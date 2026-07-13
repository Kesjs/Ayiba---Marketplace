"use client";

import { useVendeurDashboard } from "@/hooks/useVendeurDashboard";
import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Star, 
  Plus, 
  Clock, 
  MessageSquare,
  MoreVertical
} from "lucide-react";
import Link from "next/link";
import { DashboardSkeleton } from "@/components/ui/Skeleton";

export default function VendeurDashboardPage() {
const {
  loading,
  error,
  vendeur,
  stats,
  chiffreAffaires,
  commandes,
  messages,
  refresh
} = useVendeurDashboard();

  

  const statsCards = [
  {
    label: "Chiffre d'affaires",
    value: `${chiffreAffaires?.montant_total ?? 0} F`,
    change: "",
    icon: TrendingUp,
    color: "text-teal-600",
    bg: "bg-teal-50"
  },

  {
    label: "Commandes",
    value: stats?.nombre_commandes ?? 0,
    change: "",
    icon: ShoppingBag,
    color: "text-coral-500",
    bg: "bg-coral-50"
  },

  {
    label: "Articles actifs",
    value: stats?.nombre_articles ?? 0,
    change: "",
    icon: Package,
    color: "text-amber-600",
    bg: "bg-amber-50"
  },

  {
    label: "Articles vendus",
    value: stats?.articles_vendus ?? 0,
    change: "",
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

        <p className="text-sm text-red-600 font-medium">

          {error}

        </p>

        <button

          onClick={refresh}

          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold"

        >

          Réessayer

        </button>

      </div>

    )}

    
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
  {statsCards.map((stat, i) => (
    <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
          <stat.icon size={24} />
        </div>

        <span
          className={`text-[11px] font-bold px-2 py-1 rounded-lg ${
            stat.change?.startsWith('+')
              ? 'bg-teal-50 text-teal-600'
              : 'bg-gray-50 text-gray-500'
          }`}
        >
          {stat.change}
        </span>
      </div>

      <p className="text-sm font-medium text-gray-500 mb-1">
        {stat.label}
      </p>

      <p className="text-2xl font-bold text-gray-900">
        {stat.value}
      </p>

    </div>
  ))}
</div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  <div className="lg:col-span-2 space-y-8">

    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold mb-6">
        Actions rapides
      </h3>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">

        <Link
          href="/vendeur/articles/nouveau"
          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-coral-50 text-coral-600 hover:bg-coral-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus size={20} />
          </div>
          <span className="text-xs font-bold">
            Nouvel Article
          </span>
        </Link>


        <Link
          href="/vendeur/commandes"
          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <ShoppingBag size={20} />
          </div>
          <span className="text-xs font-bold">
            Gérer Commandes
          </span>
        </Link>


        <Link
          href="/vendeur/messages"
          className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors group"
        >
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <MessageSquare size={20} />
          </div>
          <span className="text-xs font-bold">
            Messagerie
          </span>
        </Link>

      </div>
    </div>



    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">

      <div className="p-8 border-b border-gray-50 flex items-center justify-between">

        <h3 className="text-lg font-bold">
          Dernières commandes
        </h3>

        <Link
          href="/vendeur/commandes"
          className="text-sm font-bold text-coral-500 hover:underline"
        >
          Voir tout
        </Link>

      </div>



      <div className="overflow-x-auto">

        <table className="w-full text-left border-collapse">

          <thead>

            <tr className="bg-gray-50/50">

              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">
                Client
              </th>

              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">
                Statut
              </th>

              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">
                Montant
              </th>

              <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase">
                Date
              </th>

              <th className="px-8 py-4"></th>

            </tr>

          </thead>


          <tbody className="divide-y divide-gray-50">


          {commandes.length === 0 ? (

            <tr>

              <td
                colSpan={5}
                className="px-8 py-10 text-center text-sm text-gray-400"
              >
                Aucune commande récente
              </td>

            </tr>

          ) : (


            commandes.map((order) => (

              <tr
                key={order.id}
                className="hover:bg-gray-50/30 transition-colors"
              >

                <td className="px-8 py-5">

                  <p className="text-sm font-bold text-gray-900">
                    {order.nom_client}
                  </p>

                  <p className="text-[11px] text-gray-400 font-medium">
                    {order.numero}
                  </p>

                </td>



                <td className="px-8 py-5">

                  <span
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                      order.statut === "En attente"
                      ? "bg-amber-50 text-amber-600 border-amber-100"
                      :
                      order.statut === "Confirmé"
                      ? "bg-teal-50 text-teal-600 border-teal-100"
                      :
                      "bg-gray-50 text-gray-600 border-gray-200"
                    }`}
                  >
                    {order.statut}
                  </span>

                </td>



                <td className="px-8 py-5">

                  <p className="text-sm font-bold text-gray-900">
                    {order.montant_total} F
                  </p>

                </td>



                <td className="px-8 py-5">

                  <div className="flex items-center gap-1.5 text-gray-400">

                    <Clock size={14}/>

                    <span className="text-xs font-medium">
                      {new Date(order.created_at).toLocaleDateString("fr-FR")}
                    </span>

                  </div>

                </td>



                <td className="px-8 py-5 text-right">

                  <button
                    className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all"
                    onClick={() => {
                      window.location.href = `/vendeur/commandes/${order.id}`;
                    }}
                  >

                    <MoreVertical size={18}/>

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





  <div className="space-y-8">

    <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">

      <h3 className="text-lg font-bold mb-6">
        Messages récents
      </h3>


      <div className="space-y-6">


      {messages.length === 0 ? (

        <p className="text-sm text-gray-400">
          Aucun message récent
        </p>

      ) : (


        messages.map((msg) => (

          <div
            key={msg.id}
            className="flex gap-3 group cursor-pointer"
          >

            <div className="w-10 h-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600">
              <MessageSquare size={18}/>
            </div>


            <div className="overflow-hidden">

              <p className="text-xs text-gray-500 truncate group-hover:text-gray-900">
                {msg.contenu}
              </p>


              <span className="text-[10px] text-gray-400">
                {new Date(msg.created_at).toLocaleDateString("fr-FR")}
              </span>

            </div>

          </div>

        ))

      )}


      </div>


      <Link
        href="/vendeur/messages"
        className="block text-center w-full mt-8 py-3 bg-gray-50 text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all"
      >
        Voir tous les messages
      </Link>


    </div>

  </div>


</div>
