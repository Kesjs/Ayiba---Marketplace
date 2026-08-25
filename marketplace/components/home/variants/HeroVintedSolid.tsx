"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap, Store, Bike } from "lucide-react";

export function HeroVintedSolid() {
  const [role, setRole] = useState<"vendeur" | "livreur">("vendeur");

  return (
    <section className="relative w-full overflow-hidden bg-[#FBFBF9] border-b border-gray-200">
      
      {/* ================= DESKTOP (md+) ================= */}
      <div className="hidden md:flex relative min-h-[500px] lg:min-h-[540px] items-center">
        {/* Background Photo */}
        <div className="absolute inset-0 z-0">
          <Image
            src={role === "vendeur" ? "/images/hero/hero-vendeur.webp" : "/images/hero/hero-livreur.webp"}
            alt="Ayiba Marketplace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[82%_top] lg:object-[80%_top]"
          />
          {/* Subtle gradient to ensure left card legibility */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#FBFBF9]/80 via-transparent to-transparent w-2/3" />
        </div>

        {/* Floating Solid Card */}
        <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-12 py-10 w-full">
          <div className="max-w-[370px] bg-white rounded-2xl border border-gray-200 shadow-md shadow-black/5 p-6">
            
            {/* Segmented Switcher */}
            <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-4">
              <button
                type="button"
                onClick={() => setRole("vendeur")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
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
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  role === "livreur"
                    ? "bg-white text-gray-900 shadow-xs border border-gray-200/60"
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <Bike size={14} className={role === "livreur" ? "text-teal-600" : "text-gray-400"} />
                <span>Espace Livreur</span>
              </button>
            </div>

            {/* Content */}
            {role === "vendeur" ? (
              <>
                <h1 className="text-xl lg:text-[23px] font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-2">
                  Vendez vos créations partout au Bénin.
                </h1>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Créez votre boutique en 2 minutes. Encaissez par Mobile Money en toute sécurité, nous gérons la livraison.
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Zap size={13} className="text-coral-500 shrink-0" />
                    <span>0 F de frais d'inscription ou d'abonnement</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ShieldCheck size={13} className="text-teal-600 shrink-0" />
                    <span>Paiements garantis et transférés immédiatement</span>
                  </div>
                </div>

                <Link
                  href="/devenir-vendeur"
                  className="flex items-center justify-center gap-2 w-full bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-colors"
                >
                  <span>Ouvrir ma boutique</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            ) : (
              <>
                <h1 className="text-xl lg:text-[23px] font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-2">
                  Livrez dans votre zone, gagnez chaque jour.
                </h1>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  Rejoignez le réseau des livreurs partenaires Ayiba. Choisissez vos horaires et recevez vos gains par course.
                </p>

                <div className="space-y-2 mb-5">
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <Zap size={13} className="text-teal-600 shrink-0" />
                    <span>Courses optimisées selon votre itinéraire</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-gray-700">
                    <ShieldCheck size={13} className="text-teal-600 shrink-0" />
                    <span>Paiements instantanés sur Moov / MTN</span>
                  </div>
                </div>

                <Link
                  href="/devenir-livreur"
                  className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 px-4 rounded-xl shadow-xs transition-colors"
                >
                  <span>Devenir livreur partenaire</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}

          </div>
        </div>
      </div>

      {/* ================= MOBILE (< md) ================= */}
      <div className="md:hidden">
        {/* Photo Top Frame showing full head/face */}
        <div className="relative w-full h-[260px] bg-gray-100 overflow-hidden">
          <Image
            src={role === "vendeur" ? "/images/hero/hero-vendeur.webp" : "/images/hero/hero-livreur.webp"}
            alt="Ayiba Marketplace"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[center_top]"
          />
        </div>

        {/* Card Body */}
        <div className="p-4 bg-white border-t border-gray-200">
          {/* Segmented Switcher */}
          <div className="flex items-center p-1 bg-gray-100 rounded-xl mb-3.5">
            <button
              type="button"
              onClick={() => setRole("vendeur")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === "vendeur"
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Store size={13} className={role === "vendeur" ? "text-coral-500" : "text-gray-400"} />
              <span>Vendeur</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("livreur")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                role === "livreur"
                  ? "bg-white text-gray-900 shadow-xs border border-gray-200/60"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              <Bike size={13} className={role === "livreur" ? "text-teal-600" : "text-gray-400"} />
              <span>Livreur</span>
            </button>
          </div>

          {role === "vendeur" ? (
            <>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-1.5">
                Vendez vos créations partout au Bénin.
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed mb-3.5">
                Boutique en 2 min, paiements sécurisés par Mobile Money et livraisons prises en charge.
              </p>
              <Link
                href="/devenir-vendeur"
                className="flex items-center justify-center gap-2 w-full bg-coral-500 hover:bg-coral-600 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
              >
                <span>Ouvrir ma boutique</span>
                <ArrowRight size={14} />
              </Link>
            </>
          ) : (
            <>
              <h1 className="text-lg font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-1.5">
                Livrez dans votre zone, gagnez chaque jour.
              </h1>
              <p className="text-xs text-gray-600 leading-relaxed mb-3.5">
                Courses optimisées selon votre itinéraire et paiements directs Mobile Money.
              </p>
              <Link
                href="/devenir-livreur"
                className="flex items-center justify-center gap-2 w-full bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs py-3 rounded-xl shadow-xs"
              >
                <span>Devenir livreur</span>
                <ArrowRight size={14} />
              </Link>
            </>
          )}
        </div>
      </div>

    </section>
  );
}
