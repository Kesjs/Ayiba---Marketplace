"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Shield, 
  Settings, 
  Users, 
  Globe, 
  Bell, 
  Lock, 
  ChevronRight, 
  Database,
  Smartphone
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AdminParametresPage() {
  const adminSections = [
    {
      title: "Gestion Plateforme",
      items: [
        { label: "Configuration Système", icon: Settings, value: "Variables d'environnement & API" },
        { label: "Modération de contenu", icon: Shield, value: "Règles de validation auto" },
        { label: "Zones de livraison", icon: Globe, value: "Gestion des secteurs actifs" },
      ]
    },
    {
      title: "Utilisateurs & Rôles",
      items: [
        { label: "Permissions Administrateurs", icon: Lock, value: "3 admins actifs" },
        { label: "Validation Vendeurs", icon: Users, value: "Paramètres KYC" },
      ]
    },
    {
      title: "Infrastructure",
      items: [
        { label: "Base de données", icon: Database, value: "État Supabase: Sain" },
        { label: "Notifications Système", icon: Bell, value: "Journal des erreurs & alertes" },
      ]
    }
  ];

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Paramètres Système">
      <div className="max-w-4xl mx-auto space-y-10">
        
        {/* Admin Header */}
        <div className="bg-gray-900 p-8 rounded-[40px] text-white shadow-xl flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-coral-500/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          
          <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center backdrop-blur-md border border-white/20">
             <Shield size={40} className="text-coral-400" />
          </div>
          
          <div className="text-center md:text-left flex-1 relative z-10">
            <h3 className="text-2xl font-bold mb-1">Espace Super-Admin</h3>
            <p className="text-gray-400 font-medium mb-0">Contrôle total de l'écosystème Ayiba</p>
          </div>
          
          <Button className="rounded-2xl h-12 px-6 bg-coral-500 hover:bg-coral-600 border-none relative z-10">Sauvegarder config</Button>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {adminSections.map((section, i) => (
            <div key={i} className="space-y-4">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">{section.title}</h4>
              <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
                {section.items.map((item, j) => (
                  <button key={j} className="w-full flex items-center justify-between p-6 hover:bg-gray-50 transition-colors group text-left">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-gray-900 group-hover:text-white transition-colors">
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
