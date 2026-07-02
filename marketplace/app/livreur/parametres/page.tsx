"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  User, 
  Bike, 
  Bell, 
  Shield, 
  ChevronRight, 
  Camera,
  MapPin,
  Wallet,
  Settings
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function LivreurParametresPage() {
  const sections = [
    {
      title: "Mon Profil Livreur",
      items: [
        { label: "Informations personnelles", icon: User, value: "Moussa Diouf" },
        { label: "Mon Véhicule", icon: Bike, value: "Moto (Yamaha 125)" },
        { label: "Zone de service", icon: MapPin, value: "Cotonou Centre & Littoral" },
      ]
    },
    {
      title: "Gains & Paiement",
      items: [
        { label: "Compte de réception", icon: Wallet, value: "MTN Mobile Money" },
        { label: "Historique des gains", icon: ChevronRight, value: "Voir mes relevés" },
      ]
    },
    {
      title: "Compte",
      items: [
        { label: "Sécurité & Mot de passe", icon: Shield, value: "Dernière modif: 2 mois" },
        { label: "Notifications", icon: Bell, value: "Activées" },
      ]
    }
  ];

  return (
    <DashboardLayout role="livreur" userName="Moussa" title="Paramètres">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-md">
              <img src="https://i.pravatar.cc/200?u=Moussa" className="w-full h-full object-cover" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform">
              <Camera size={18} />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Moussa Diouf</h3>
            <p className="text-gray-500 font-medium mb-4">Livreur partenaire Ayiba Gold</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">Disponible</span>
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">Top Rated</span>
            </div>
          </div>
          <Button variant="secondary" className="rounded-2xl h-12 px-6">Modifier le profil</Button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">{section.title}</h4>
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {section.items.map((item, j) => (
                  <button key={j} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-teal-50 group-hover:text-teal-600 transition-colors">
                        <item.icon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-400 font-medium mt-0.5">{item.value}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all" />
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
