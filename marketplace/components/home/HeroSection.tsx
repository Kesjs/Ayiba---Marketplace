"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, HelpCircle } from "lucide-react";
import { HowItWorksModal } from "@/components/modals/HowItWorksModal";

export function HeroSection() {
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState(false);

  return (
    <>
      <section className="w-full bg-[#F9F6F0] border-b border-stone-200/60 py-8 md:py-14">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            
            {/* --- CARTE BLANCHE SOLIDE (STYLE VINTED AUTHENTIQUE) --- */}
            <div className="lg:col-span-6 xl:col-span-5">
              <div className="bg-white rounded-3xl p-7 sm:p-9 md:p-11 shadow-sm border border-stone-200/80">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-gray-900 tracking-tight leading-[1.15]">
                  Prêt à faire du tri dans tes placards ?
                </h1>

                <p className="text-sm sm:text-base text-gray-600 mt-4 leading-relaxed font-medium">
                  Donnez une seconde vie à vos vêtements et articles, ou dénichez des pépites uniques au Bénin.
                </p>

                {/* BOUTONS CTA SIMPLES & SOLIDES */}
                <div className="mt-8 flex flex-col gap-3.5">
                  <Link
                    href="/devenir-vendeur"
                    className="w-full py-4 px-6 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] shadow-xs"
                  >
                    <span>Vendre mes articles</span>
                    <ArrowRight size={18} strokeWidth={2.5} />
                  </Link>

                  <button
                    onClick={() => setIsHowItWorksOpen(true)}
                    className="w-full py-3.5 px-6 rounded-xl bg-transparent hover:bg-gray-50 text-gray-700 font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 active:scale-[0.98] cursor-pointer"
                  >
                    <HelpCircle size={17} className="text-amber-600" />
                    <span>Découvrir comment ça marche</span>
                  </button>
                </div>
              </div>
            </div>

            {/* --- PHOTO NATURELLE À DROITE (STYLE LIFE STYLE SHOPPING) --- */}
            <div className="lg:col-span-6 xl:col-span-7 flex justify-center lg:justify-end">
              <div className="relative w-full max-w-lg lg:max-w-none rounded-3xl overflow-hidden shadow-xs border border-stone-200/60">
                <img
                  src="/images/hero-woman-shopping.jpg"
                  alt="Cliente Ayiba Marketplace Shopping"
                  className="w-full h-[360px] sm:h-[440px] lg:h-[500px] object-cover object-center"
                />
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Modal interactif Comment ça marche ? */}
      <HowItWorksModal
        isOpen={isHowItWorksOpen}
        onClose={() => setIsHowItWorksOpen(false)}
      />
    </>
  );
}
