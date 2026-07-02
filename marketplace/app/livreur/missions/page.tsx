"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Truck, 
  MapPin, 
  Clock, 
  Wallet, 
  Navigation, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Phone,
  ChevronRight,
  ShieldCheck,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import dynamic from "next/dynamic";

const DeliveryMap = dynamic(() => import("@/components/dashboard/DeliveryMap"), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold">Chargement de la carte...</div>
});

export default function LivreurMissionsPage() {
  const [activeTab, setActiveTab] = useState<"disponibles" | "en-cours" | "historique">("disponibles");

  const demoPoints = [
    { lat: 6.366, lng: 2.418, label: "Boutique Warda (Retrait)", type: "pickup" as const },
    { lat: 6.350, lng: 2.390, label: "Client Cadjehoun (Livraison)", type: "delivery" as const }
  ];

  const stats = [
    { label: "Gains du jour", value: "8 500 F", icon: Wallet, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Missions", value: "14", icon: Truck, color: "text-coral-500", bg: "bg-coral-50" },
    { label: "Note", value: "4.9/5", icon: Star, color: "text-amber-500", bg: "bg-amber-50" },
  ];

  const missions = [
    { 
      id: "MS-452", 
      from: "Akpakpa, Boutique Warda", 
      to: "Cadjehoun, Rue 125", 
      distance: "3.2 km", 
      time: "15 min", 
      reward: "1 500 F",
      items: 3
    },
    { 
      id: "MS-453", 
      from: "Fidjrossè, Tech Ben", 
      to: "Ganhi, Immeuble Orange", 
      distance: "5.1 km", 
      time: "22 min", 
      reward: "2 200 F",
      items: 1
    },
  ];

  return (
    <DashboardLayout role="livreur" userName="Moussa" title="Mes Missions">
      
      {/* Earnings & Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                <stat.icon size={24} />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mb-8">
        {[
          { id: "disponibles", label: "Disponibles", count: 2 },
          { id: "en-cours", label: "En cours", count: 1 },
          { id: "historique", label: "Historique", count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`
              px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
              ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}
            `}
          >
            {tab.label}
            {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${activeTab === tab.id ? "bg-coral-500 text-white" : "bg-gray-200 text-gray-500"}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Main Mission List */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "disponibles" ? (
            missions.map((mission) => (
              <div key={mission.id} className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
                      <Truck size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">Mission {mission.id}</p>
                      <p className="text-xs text-gray-400 font-medium">{mission.items} articles à livrer</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-coral-500">{mission.reward}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gain estimé</p>
                  </div>
                </div>

                <div className="space-y-6 relative mb-8">
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-dashed border-l-2 border-dashed border-gray-100" />
                  
                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center z-10">
                      <div className="w-2 h-2 bg-teal-500 rounded-full" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">Point de retrait</p>
                      <p className="text-sm font-bold text-gray-900">{mission.from}</p>
                    </div>
                  </div>

                  <div className="flex gap-4 relative">
                    <div className="w-6 h-6 rounded-full bg-coral-50 flex items-center justify-center z-10">
                      <MapPin size={12} className="text-coral-500" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-coral-600 uppercase tracking-widest mb-0.5">Point de livraison</p>
                      <p className="text-sm font-bold text-gray-900">{mission.to}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6 p-4 bg-gray-50 rounded-2xl mb-8">
                  <div className="flex items-center gap-2">
                    <Navigation size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{mission.distance}</span>
                  </div>
                  <div className="w-px h-4 bg-gray-200" />
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">{mission.time}</span>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all">Refuser</button>
                  <button className="flex-[2] h-12 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-900/10">Accepter la mission</button>
                </div>
              </div>
            ))
          ) : activeTab === "en-cours" ? (
            <div className="bg-white p-8 rounded-3xl border border-teal-100 shadow-xl shadow-teal-500/5 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4">
                <span className="flex h-3 w-3 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
                </span>
              </div>
              
              <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
                Mission Actuelle 
                <span className="text-xs font-bold px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md">EN COURS</span>
              </h3>

              {/* Interactive Map */}
              <div className="h-64 mb-8">
                <DeliveryMap points={demoPoints} />
              </div>

              <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 mb-8">
                <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Instructions</p>
                <p className="text-sm font-medium text-gray-900 leading-relaxed">Récupérer le colis à la boutique <span className="font-bold">Saveurs du Pays</span>. Le client attend à Cadjehoun.</p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button className="flex-1 h-14 bg-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20">
                  <Navigation size={20} />
                  Ouvrir GPS
                </button>
                <button className="flex-1 h-14 border border-teal-200 text-teal-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-50 transition-all">
                  <Phone size={20} />
                  Appeler Client
                </button>
              </div>

              <div className="mt-10 pt-8 border-t border-gray-100">
                <p className="text-sm font-bold mb-4">Code de validation (OTP)</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <input key={i} type="text" maxLength={1} className="w-full h-14 text-center text-xl font-bold border-2 border-gray-100 rounded-xl focus:border-teal-500 focus:outline-none transition-all" />
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 mt-4 text-center font-medium">Demandez le code au client pour valider la livraison</p>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-400 font-bold">Aucun historique disponible</p>
            </div>
          )}
        </div>

        {/* Sidebar Info */}
        <div className="space-y-8">
          
          {/* Status Card */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold mb-6">Mon Status</h3>
            <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-500 shadow-xs">
                  <CheckCircle2 size={20} />
                </div>
                <span className="text-sm font-bold text-teal-700">En Ligne</span>
              </div>
              <button className="text-[11px] font-bold text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Déconnexion</button>
            </div>
          </div>

          {/* Safety Tips */}
          <div className="bg-gray-900 p-8 rounded-3xl text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
            <div className="relative z-10">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                <ShieldCheck size={20} className="text-coral-400" />
              </div>
              <h4 className="font-bold text-lg mb-2">Sécurité d'abord</h4>
              <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium">Respectez le code de la route et portez toujours votre casque Ayiba pendant vos missions.</p>
              <div className="flex items-center gap-2 text-xs font-bold text-coral-400 group-hover:gap-4 transition-all cursor-pointer">
                Guide de sécurité <ChevronRight size={14} />
              </div>
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
}
