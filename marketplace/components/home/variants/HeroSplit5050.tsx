"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Store, ShoppingBag, ShieldCheck, MapPin } from "lucide-react";

export function HeroSplit5050() {
  return (
    <section className="relative w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (55% on lg) */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Pill Tag */}
            <div className="inline-flex items-center gap-2 self-start bg-[#FAECE7] border border-[#F5C7B8] px-3 py-1 rounded-full mb-5">
              <span className="w-2 h-2 rounded-full bg-coral-500 shrink-0" />
              <span className="text-[11px] font-bold uppercase tracking-wider text-coral-800">
                Place de marché locale • Bénin
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-3xl sm:text-4xl lg:text-[42px] font-extrabold text-gray-900 tracking-tight leading-[1.15] mb-4">
              Achetez et vendez facilement entre voisins.
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base text-gray-600 leading-relaxed max-w-xl mb-8">
              Mode, artisanat, maison et high-tech. Commandez auprès des meilleurs créateurs de Cotonou et Calavi avec livraison sécurisée.
            </p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-8">
              <Link
                href="/catalogue"
                className="flex items-center justify-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-6 py-3.5 rounded-xl shadow-xs transition-colors"
              >
                <ShoppingBag size={16} />
                <span>Explorer les articles</span>
              </Link>
              <Link
                href="/devenir-vendeur"
                className="flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-200 font-bold text-sm px-6 py-3.5 rounded-xl transition-colors"
              >
                <Store size={16} className="text-coral-500" />
                <span>Ouvrir une boutique</span>
                <ArrowRight size={14} className="text-gray-400" />
              </Link>
            </div>

            {/* Trust Metrics */}
            <div className="pt-6 border-t border-gray-100 grid grid-cols-3 gap-4">
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-gray-900">100%</p>
                <p className="text-[11px] text-gray-500 font-medium">Boutiques vérifiées</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-gray-900">0 F</p>
                <p className="text-[11px] text-gray-500 font-medium">Frais d'ouverture</p>
              </div>
              <div>
                <p className="text-lg sm:text-xl font-extrabold text-gray-900">Express</p>
                <p className="text-[11px] text-gray-500 font-medium">Livraison suivie</p>
              </div>
            </div>
          </div>

          {/* Right Column (45% on lg) */}
          <div className="lg:col-span-5 relative">
            <div className="relative aspect-[4/3] sm:aspect-[1/1] w-full rounded-2xl overflow-hidden border border-gray-200 shadow-sm bg-gray-100">
              <Image
                src="/images/hero/hero-vendeur.webp"
                alt="Créatrice Ayiba"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover object-[center_top]"
              />
              
              {/* Floating Solid Badge on Bottom of Image */}
              <div className="absolute bottom-3 left-3 right-3 bg-white/95 border border-gray-200 rounded-xl p-3 shadow-xs flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700">
                    <ShieldCheck size={16} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Paiement Mobile Money sécurisé</p>
                    <p className="text-[10px] text-gray-500">Fonds bloqués jusqu'à réception du colis</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md">
                  Garantie
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
