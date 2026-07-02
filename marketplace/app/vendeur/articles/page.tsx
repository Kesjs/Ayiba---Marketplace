"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { 
  Package, 
  Plus, 
  Search, 
  MoreVertical, 
  ExternalLink, 
  Trash2, 
  Edit3 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { MOCK_PRODUCTS, CATEGORIES } from "@/lib/mock-data";

export default function MesArticlesPage() {
  // Simuler les articles du vendeur "v1"
  const myArticles = MOCK_PRODUCTS.filter(p => p.vendeur_id === "v1" || p.id.startsWith('m'));

  return (
    <DashboardLayout role="vendeur" userName="Aminata" title="Mes Articles">
      
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher parmi mes articles..." 
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium text-sm"
          />
        </div>
        <Link href="/vendeur/articles/nouveau">
          <Button className="h-12 px-6 rounded-2xl flex items-center gap-2">
            <Plus size={20} />
            Ajouter un article
          </Button>
        </Link>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {myArticles.map((item) => (
          <div key={item.id} className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-300">
            <div className="relative aspect-square overflow-hidden">
              <img 
                src={item.photos[0]} 
                alt={item.nom} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-coral-500 shadow-sm">
                  <Edit3 size={16} />
                </button>
                <button className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-6">
              <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest mb-1">
                {CATEGORIES.find(c => c.id === item.categorie)?.label}
              </p>
              <h3 className="font-bold text-gray-900 truncate mb-2">{item.nom}</h3>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">{item.prix.toLocaleString()} F</p>
                <div className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
                  En ligne
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State Card */}
        <Link 
          href="/vendeur/articles/nouveau"
          className="aspect-square rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-coral-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-gray-400 group-hover:text-coral-500">Nouvel article</span>
        </Link>
      </div>
    </DashboardLayout>
  );
}
