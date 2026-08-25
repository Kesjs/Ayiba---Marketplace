"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Store, Bike, ShieldCheck, Zap, Sparkles } from "lucide-react";

export function HeroBentoGrid() {
  return (
    <section className="relative w-full bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
          
          {/* Main Large Bento Block (8 cols on lg) */}
          <div className="lg:col-span-7 bg-[#FAF9F6] border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between relative overflow-hidden min-h-[380px] sm:min-h-[420px]">
            {/* Top Badge */}
            <div className="relative z-10">
              <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200/80 px-3 py-1 rounded-full text-xs font-bold text-gray-800 shadow-2xs mb-4">
                <Sparkles size={13} className="text-coral-500" />
                <span>Créateurs & Boutiques du Bénin</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-[34px] font-extrabold text-gray-900 tracking-tight leading-[1.2] max-w-lg mb-3">
                Commandez local. Payez en confiance.
              </h1>
              <p className="text-xs sm:text-sm text-gray-600 leading-relaxed max-w-md">
                Découvrez des articles uniques confectionnés avec passion par des artisans et créateurs certifiés à Cotonou et Calavi.
              </p>
            </div>

            {/* Bottom Actions & Image accent */}
            <div className="relative z-10 pt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/catalogue"
                className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors shadow-xs flex items-center gap-2"
              >
                <span>Explorer le catalogue</span>
                <ArrowRight size={14} />
              </Link>
              <Link
                href="/comment-ca-marche"
                className="bg-white hover:bg-gray-50 text-gray-800 border border-gray-200 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-colors"
              >
                <span>Comment ça marche</span>
              </Link>
            </div>

            {/* Subtle Right Art Graphic */}
            <div className="absolute right-0 bottom-0 w-[180px] sm:w-[260px] h-[200px] sm:h-[280px] pointer-events-none opacity-90 hidden sm:block">
              <Image
                src="/images/hero/hero-acheteuse.webp"
                alt="Shopping local"
                fill
                sizes="260px"
                className="object-contain object-bottom-right"
              />
            </div>
          </div>

          {/* Right Column Bento Stack (5 cols on lg) */}
          <div className="lg:col-span-5 grid grid-cols-1 gap-4 sm:gap-6">
            
            {/* Top Right Bento: Vendeurs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-coral-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-coral-50 text-coral-600 rounded-xl border border-coral-100">
                    <Store size={18} />
                  </span>
                  <span className="text-[11px] font-bold text-coral-700 bg-coral-50 px-2 py-0.5 rounded-md">
                    0 F d'inscription
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
                  Vous créez ou vendez ?
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Ouvrez votre boutique en ligne et encaissez vos ventes par Mobile Money dès aujourd'hui.
                </p>
              </div>

              <Link
                href="/devenir-vendeur"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-coral-600 hover:text-coral-700 group"
              >
                <span>Créer ma boutique</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

            {/* Bottom Right Bento: Livreurs */}
            <div className="bg-white border border-gray-200 rounded-2xl p-6 flex flex-col justify-between hover:border-teal-300 transition-colors">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="p-2 bg-teal-50 text-teal-700 rounded-xl border border-teal-100">
                    <Bike size={18} />
                  </span>
                  <span className="text-[11px] font-bold text-teal-800 bg-teal-50 px-2 py-0.5 rounded-md">
                    Paiement par course
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold text-gray-900 mb-1.5">
                  Devenez livreur partenaire
                </h2>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Livrez les commandes dans votre quartier selon vos disponibilités et recevez vos gains en direct.
                </p>
              </div>

              <Link
                href="/devenir-livreur"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 group"
              >
                <span>Rejoindre la flotte</span>
                <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>

          </div>

        </div>
      </div>
    </section>
  );
}
