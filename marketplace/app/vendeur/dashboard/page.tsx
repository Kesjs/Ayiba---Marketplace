"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  TrendingUp, 
  Package, 
  ShoppingBag, 
  Star, 
  Plus, 
  ArrowUpRight, 
  Clock, 
  MessageSquare,
  ChevronRight,
  MoreVertical
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function VendeurDashboardPage() {
  const [showProductForm, setShowProductForm] = useState(false);

  const stats = [
    { label: "Ventes du mois", value: "245 000 F", change: "+12%", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Commandes", value: "24", change: "+4", icon: ShoppingBag, color: "text-coral-500", bg: "bg-coral-50" },
    { label: "Articles actifs", value: "12", change: "Stable", icon: Package, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Note vendeur", value: "4.8/5", change: "154 avis", icon: Star, color: "text-blue-600", bg: "bg-blue-50" },
  ];

  const recentOrders = [
    { id: "#ORD-892", customer: "Koffi M.", date: "Il y a 2h", status: "En attente", amount: "15 000 F" },
    { id: "#ORD-891", customer: "Sika A.", date: "Il y a 5h", status: "Confirmé", amount: "8 500 F" },
    { id: "#ORD-890", customer: "Jean D.", date: "Hier", status: "Livré", amount: "22 000 F" },
  ];

  return (
    <DashboardLayout role="vendeur" userName="Aminata" title="Tableau de bord Vendeur">
      
      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <span className={`text-[11px] font-bold px-2 py-1 rounded-lg ${stat.change.startsWith('+') ? 'bg-teal-50 text-teal-600' : 'bg-gray-50 text-gray-500'}`}>
                {stat.change}
              </span>
            </div>
            <p className="text-sm font-medium text-gray-500 mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left: Orders & Actions */}
        <div className="lg:col-span-2 space-y-8">
          
          {/* Quick Actions */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Actions rapides</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <Link href="/vendeur/articles/nouveau" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-coral-50 text-coral-600 hover:bg-coral-100 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <Plus size={20} />
                </div>
                <span className="text-xs font-bold">Nouvel Article</span>
              </Link>
              <Link href="/vendeur/commandes" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-teal-50 text-teal-600 hover:bg-teal-100 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <ShoppingBag size={20} />
                </div>
                <span className="text-xs font-bold">Gérer Commandes</span>
              </Link>
              <Link href="/vendeur/messages" className="flex flex-col items-center gap-3 p-4 rounded-2xl bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors group">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                  <MessageSquare size={20} />
                </div>
                <span className="text-xs font-bold">Messagerie</span>
              </Link>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold">Dernières commandes</h3>
              <Link href="/vendeur/commandes" className="text-sm font-bold text-coral-500 hover:underline">Voir tout</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Client</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Montant</th>
                    <th className="px-8 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
                    <th className="px-8 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {recentOrders.map((order, i) => (
                    <tr key={i} className="hover:bg-gray-50/30 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-900">{order.customer}</p>
                        <p className="text-[11px] text-gray-400 font-medium">{order.id}</p>
                      </td>
                      <td className="px-8 py-5">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                          order.status === "En attente" ? "bg-amber-50 text-amber-600 border-amber-100" :
                          order.status === "Confirmé" ? "bg-teal-50 text-teal-600 border-teal-100" :
                          "bg-gray-50 text-gray-600 border-gray-200"
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-gray-900">{order.amount}</p>
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-1.5 text-gray-400">
                          <Clock size={14} />
                          <span className="text-xs font-medium">{order.date}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all">
                          <MoreVertical size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Messages & Tips */}
        <div className="space-y-8">
          
          {/* Recent Messages */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Messages récents</h3>
            <div className="space-y-6">
              {[
                { name: "Koffi M.", msg: "Est-ce que l'article est dispo ?", time: "10m", online: true },
                { name: "Sika A.", msg: "Merci pour la livraison rapide !", time: "1h", online: false },
              ].map((msg, i) => (
                <div key={i} className="flex gap-3 group cursor-pointer">
                  <div className="relative shrink-0">
                    <img src={`https://i.pravatar.cc/100?u=${msg.name}`} className="w-10 h-10 rounded-full object-cover" />
                    {msg.online && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-teal-500 border-2 border-white rounded-full" />}
                  </div>
                  <div className="overflow-hidden">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-bold text-gray-900 truncate">{msg.name}</p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{msg.time}</span>
                    </div>
                    <p className="text-xs text-gray-500 truncate group-hover:text-gray-900 transition-colors">{msg.msg}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-8 py-3 bg-gray-50 text-gray-900 text-xs font-bold rounded-xl hover:bg-gray-100 transition-all">
              Voir tous les messages
            </button>
          </div>

          {/* Tips Card */}
          <div className="bg-linear-to-br from-coral-500 to-coral-600 p-8 rounded-3xl text-white shadow-xl shadow-coral-500/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-6">
                <TrendingUp size={20} />
              </div>
              <h4 className="font-bold text-lg mb-2">Boostez vos ventes</h4>
              <p className="text-sm text-white/80 leading-relaxed font-medium mb-6">Ajoutez des photos de haute qualité pour attirer plus de clients sur vos articles.</p>
              <button className="px-5 py-2.5 bg-white text-coral-600 text-xs font-bold rounded-xl hover:shadow-lg transition-all active:scale-[0.98]">
                En savoir plus
              </button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
