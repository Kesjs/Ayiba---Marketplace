"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  User, 
  Store, 
  Bell, 
  Shield, 
  Smartphone, 
  ChevronRight, 
  Camera,
  MapPin,
  CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function VendeurParametresPage() {
  const sections = [
    {
      title: "Profil & Boutique",
      items: [
        { label: "Informations personnelles", icon: User, value: "Aminata Koné" },
        { label: "Nom de la boutique", icon: Store, value: "Warda Mode" },
        { label: "Adresse physique", icon: MapPin, value: "Cotonou, Fidjrossè" },
      ]
    },
    {
      title: "Paiements & Sécurité",
      items: [
        { label: "Méthodes de retrait", icon: CreditCard, value: "Moov Money / MTN" },
        { label: "Sécurité du compte", icon: Shield, value: "Validation par code activée" },
      ]
    },
    {
      title: "Préférences",
      items: [
        { label: "Notifications", icon: Bell, value: "Push & WhatsApp" },
        { label: "Application", icon: Smartphone, value: "Version 1.2.0" },
      ]
    }
  ];

  return (
    <DashboardLayout role="vendeur" userName="Aminata" title="Paramètres">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Profile Header */}
        <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-24 h-24 rounded-3xl bg-gray-100 overflow-hidden border-4 border-white shadow-md">
              <img src="https://i.pravatar.cc/200?u=Aminata" className="w-full h-full object-cover" />
            </div>
            <button className="absolute -bottom-2 -right-2 w-10 h-10 bg-coral-500 text-white rounded-xl flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 transition-transform">
              <Camera size={18} />
            </button>
          </div>
          <div className="text-center md:text-left flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-1">Aminata Koné</h3>
            <p className="text-gray-500 font-medium mb-4">Vendeuse certifiée depuis Mars 2024</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">Boutique Vérifiée</span>
              <span className="px-3 py-1 bg-coral-50 text-coral-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-coral-100">Premium</span>
            </div>
          </div>
          <Button variant="secondary" className="rounded-2xl h-12 px-6">Modifier le profil</Button>
        </div>

        {/* Settings Sections */}
        <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
          {sections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">{section.title}</h4>
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {section.items.map((item, j) => (
                  <button key={j} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors">
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

        {/* Dangerous Zone */}
        <div className="pt-6 border-t border-gray-100">
          <button className="w-full p-6 bg-red-50 text-red-600 rounded-[32px] border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white text-red-500 flex items-center justify-center shadow-sm">
                <Shield size={20} />
              </div>
              <p className="font-bold text-sm">Fermer temporairement la boutique</p>
            </div>
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
