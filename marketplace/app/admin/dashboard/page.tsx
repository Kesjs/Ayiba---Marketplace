"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Users, 
  ShoppingBag, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  Clock, 
  MoreVertical,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  Search,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminDashboardPage() {
  const stats = [
    { label: "Utilisateurs actifs", value: "1 240", change: "+5.4%", trend: "up", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Commandes / jour", value: "87", change: "+12.1%", trend: "up", icon: ShoppingBag, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Litiges ouverts", value: "3", change: "-2", trend: "up", icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Volume d'affaires", value: "540k F", change: "+8.2%", trend: "up", icon: TrendingUp, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  const recentActivities = [
    { type: "user", user: "Modeste K.", action: "s'est inscrit comme vendeur", date: "Il y a 5 min", status: "En attente de validation" },
    { type: "dispute", user: "Koffi vs Warda", action: "Nouveau litige ouvert", date: "Il y a 12 min", status: "Urgent" },
    { type: "order", user: "Sika A.", action: "Commande livrée avec succès", date: "Il y a 25 min", status: "Terminé" },
    { type: "kyc", user: "Jean D.", action: "Document d'identité soumis", date: "Il y a 1h", status: "À vérifier" },
  ];

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Administration Système">
      
      {/* Search & Filter Bar */}
      <div className="flex flex-col md:flex-row gap-4 mb-10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher un utilisateur, une commande, un vendeur..." 
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium text-sm"
          />
        </div>
        <button className="h-12 px-6 bg-white border border-gray-100 rounded-2xl shadow-sm flex items-center gap-2 font-bold text-sm text-gray-600 hover:bg-gray-50 transition-all">
          <Filter size={18} />
          Filtres
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-lg ${stat.trend === 'up' ? 'bg-teal-50 text-teal-600' : 'bg-red-50 text-red-600'}`}>
                {stat.trend === 'up' ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {stat.change}
              </div>
            </div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Recent Activities */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-white rounded-[40px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-bold">Flux d'activités</h3>
              <button className="text-xs font-bold text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">Rafraîchir</button>
            </div>
            <div className="divide-y divide-gray-50">
              {recentActivities.map((activity, i) => (
                <div key={i} className="p-8 hover:bg-gray-50/30 transition-all flex items-start gap-4 group">
                  <div className={`w-10 h-10 rounded-full shrink-0 flex items-center justify-center ${
                    activity.type === "user" ? "bg-blue-50 text-blue-500" :
                    activity.type === "dispute" ? "bg-red-50 text-red-500" :
                    activity.type === "order" ? "bg-teal-50 text-teal-500" :
                    "bg-amber-50 text-amber-500"
                  }`}>
                    {activity.type === "user" ? <Users size={18} /> :
                     activity.type === "dispute" ? <AlertTriangle size={18} /> :
                     activity.type === "order" ? <CheckCircle2 size={18} /> :
                     <ShieldCheck size={18} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-bold text-gray-900 group-hover:text-coral-500 transition-colors">{activity.user}</p>
                      <span className="text-[10px] text-gray-400 font-bold uppercase">{activity.date}</span>
                    </div>
                    <p className="text-sm text-gray-500 font-medium mb-3">{activity.action}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      activity.status === "Urgent" ? "bg-red-50 text-red-600" :
                      activity.status === "Terminé" ? "bg-teal-50 text-teal-600" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {activity.status}
                    </span>
                  </div>
                  <button className="p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={18} />
                  </button>
                </div>
              ))}
            </div>
            <button className="w-full p-6 text-sm font-bold text-gray-400 hover:text-gray-900 bg-gray-50/30 border-t border-gray-50 transition-all">
              Voir tout l'historique
            </button>
          </div>
        </div>

        {/* Sidebar Alerts & Shortcuts */}
        <div className="space-y-8">
          
          {/* Moderation Alert */}
          <div className="bg-gray-900 p-8 rounded-[40px] text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/20 rounded-full -mr-16 -mt-16 blur-3xl" />
            <div className="relative z-10">
              <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-6">
                <ShieldCheck size={24} className="text-coral-400" />
              </div>
              <h4 className="font-bold text-xl mb-3">Modération</h4>
              <p className="text-sm text-gray-400 leading-relaxed font-medium mb-8">
                <span className="text-white font-bold">12 articles</span> sont en attente de validation manuelle pour aujourd'hui.
              </p>
              <button className="w-full py-4 bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-2xl shadow-xl shadow-coral-500/20 transition-all active:scale-[0.98]">
                Lancer la modération
              </button>
            </div>
          </div>

          {/* Dispute Quick Access */}
          <div className="bg-red-50 p-8 rounded-[40px] border border-red-100 group">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-500" size={20} />
              <h4 className="font-bold text-red-700">Litiges Actifs</h4>
            </div>
            <div className="space-y-4">
              <div className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">#DIS-102</p>
                  <p className="text-[10px] text-gray-400 font-medium">Non réception</p>
                </div>
                <button className="p-2 bg-red-50 text-red-500 rounded-lg">
                  <ArrowUpRight size={16} />
                </button>
              </div>
              <div className="bg-white p-4 rounded-2xl border border-red-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-900">#DIS-105</p>
                  <p className="text-[10px] text-gray-400 font-medium">Produit endommagé</p>
                </div>
                <button className="p-2 bg-red-50 text-red-500 rounded-lg">
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
