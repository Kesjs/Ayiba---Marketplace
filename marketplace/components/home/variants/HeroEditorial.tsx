"use client";

import Link from "next/link";
import { ArrowRight, ShoppingBag, Store, ShieldCheck, Sparkles, CheckCircle2 } from "lucide-react";

const CATEGORY_QUICK_TILES = [
  { name: "Mode & Pagne", count: "120+ articles", href: "/catalogue?cat=mode" },
  { name: "Artisanat d'art", count: "85+ créations", href: "/catalogue?cat=artisanat" },
  { name: "Cosmétique naturelle", count: "60+ soins", href: "/catalogue?cat=beaute" },
  { name: "Maison & Déco", count: "45+ objets", href: "/catalogue?cat=maison" },
];

export function HeroEditorial() {
  return (
    <section className="relative w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        
        {/* Main Central Stage */}
        <div className="text-center max-w-3xl mx-auto">
          
          {/* Overline Badge */}
          <div className="inline-flex items-center gap-2 bg-[#FAF9F6] border border-gray-200 px-3.5 py-1 rounded-full text-xs font-semibold text-gray-700 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-coral-500" />
            <span>Marketplace d'achat et vente au Bénin</span>
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-[1.12] mb-5">
            L'excellence artisanale et locale à portée de clic.
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mx-auto mb-8">
            Achetez directement auprès des créateurs indépendants du Bénin. Paiement sécurisé par Mobile Money et livraison suivie à domicile.
          </p>

          {/* Dual Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mb-12">
            <Link
              href="/catalogue"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-7 py-3.5 rounded-xl shadow-xs transition-colors"
            >
              <ShoppingBag size={16} />
              <span>Découvrir les créations</span>
            </Link>
            <Link
              href="/devenir-vendeur"
              className="w-full sm:w-auto flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-bold text-sm px-7 py-3.5 rounded-xl transition-colors"
            >
              <Store size={16} className="text-coral-500" />
              <span>Vendre sur Ayiba</span>
              <ArrowRight size={14} className="text-gray-400" />
            </Link>
          </div>

          {/* Trust Guarantees Strip */}
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs font-medium text-gray-500 mb-12">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Boutiques 100% vérifiées</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Paiement bloqué jusqu'à livraison</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-teal-600" />
              <span>Support local basé à Cotonou</span>
            </div>
          </div>
        </div>

        {/* Quick Category Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto pt-8 border-t border-gray-100">
          {CATEGORY_QUICK_TILES.map((tile) => (
            <Link
              key={tile.name}
              href={tile.href}
              className="p-4 rounded-xl border border-gray-200 bg-[#FAFAF9] hover:bg-white hover:border-coral-300 hover:shadow-2xs transition-all text-left group"
            >
              <p className="text-xs font-bold text-gray-900 group-hover:text-coral-600 transition-colors">
                {tile.name}
              </p>
              <p className="text-[11px] text-gray-500 mt-0.5">{tile.count}</p>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
}
