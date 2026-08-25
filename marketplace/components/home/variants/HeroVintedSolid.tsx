"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, Store, Bike } from "lucide-react";

export function HeroVintedSolid() {
  const [role, setRole] = useState<"vendeur" | "livreur">("vendeur");

  return (
    <section className="relative w-full overflow-hidden bg-[#FBFBF9] border-b border-gray-200/80">
      {/* Background Image Container */}
      <div className="relative w-full min-h-[460px] md:min-h-[520px] flex items-center">
        <div className="absolute inset-0 z-0">
          <Image
            src={role === "vendeur" ? "/images/hero/hero-vendeur.webp" : "/images/hero/hero-livreur.webp"}
            alt="Ayiba Marketplace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[75%_20%] md:object-[80%_center]"
          />
          {/* Subtle clean contrast overlay without blur */}
          <div className="absolute inset-0 bg-gradient-to-r from-black/30 via-transparent to-transparent md:from-black/20" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 w-full">
          <div className="max-w-[400px] bg-white rounded-2xl border border-gray-200 shadow-lg shadow-black/5 p-6 md:p-7">
            {/* Segmented Control */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-5">
              <button
                type="button"
                onClick={() => setRole("vendeur")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  role === "vendeur"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/60"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Store size={14} className={role === "vendeur" ? "text-coral-500" : "text-gray-400"} />
                <span>Espace Vendeur</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("livreur")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  role === "livreur"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/60"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Bike size={14} className={role === "livreur" ? "text-teal-600" : "text-gray-400"} />
                <span>Espace Livreur</span>
              </button>
            </div>

            {/* Dynamic Content */}
            {role === "vendeur" ? (
              <>
                <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-2.5">
                  Vendez vos créations partout au Bénin.
                </h1>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed mb-5">
                  Créez votre boutique en 2 minutes. Encaissez par Mobile Money en toute sécurité, nous gérons la livraison.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Zap size={14} className="text-coral-500 shrink-0" />
                    <span>0 F de frais d'inscription ou d'abonnement</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                    <span>Paiements garantis et transférés immédiatement</span>
                  </div>
                </div>

                <Link
                  href="/devenir-vendeur"
                  className="flex items-center justify-center gap-2 w-full bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm py-3.5 px-5 rounded-xl shadow-xs transition-colors"
                >
                  <span>Ouvrir ma boutique</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-2xl sm:text-[26px] font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-2.5">
                  Livrez dans votre zone, gagnez chaque jour.
                </h1>
                <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed mb-5">
                  Rejoignez le réseau des livreurs partenaires Ayiba. Choisissez vos horaires et recevez vos gains par course.
                </p>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Zap size={14} className="text-teal-600 shrink-0" />
                    <span>Courses optimisées selon votre itinéraire</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                    <span>Paiements instantanés sur Moov / MTN</span>
                  </div>
                </div>

                <Link
                  href="/devenir-livreur"
                  className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-sm py-3.5 px-5 rounded-xl shadow-xs transition-colors"
                >
                  <span>Devenir livreur partenaire</span>
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
