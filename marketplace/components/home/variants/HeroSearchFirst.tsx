"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, MapPin, ArrowRight, Store, Sparkles, TrendingUp } from "lucide-react";

const POPULAR_SEARCHES = ["Pagne Wax", "Chaussures", "Cosmétiques bio", "Bijoux artisanaux", "Tech"];
const CITIES = ["Tout le Bénin", "Cotonou", "Abomey-Calavi", "Porto-Novo", "Parakou"];

export function HeroSearchFirst() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedCity, setSelectedCity] = useState("Tout le Bénin");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    router.push(`/recherche?q=${encodeURIComponent(query)}`);
  };

  return (
    <section className="relative w-full bg-[#FAF9F6] border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-14">
        
        {/* Top Header / Value Statement */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-1.5 bg-white border border-gray-200 px-3 py-1 rounded-full text-xs font-semibold text-gray-700 shadow-2xs mb-3">
            <Sparkles size={13} className="text-coral-500" />
            <span>Marketplace officielle de proximité</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-[36px] font-extrabold text-gray-900 tracking-tight leading-[1.2] mb-3">
            Trouvez ce que vous cherchez, tout près de chez vous.
          </h1>
          <p className="text-xs sm:text-sm text-gray-600">
            Des milliers d'articles vérifiés disponibles immédiatement en livraison directe.
          </p>
        </div>

        {/* Central Search Card */}
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-3 sm:p-4 mb-6">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            
            {/* City Selector */}
            <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200/80 rounded-xl sm:w-[180px] shrink-0">
              <MapPin size={16} className="text-coral-500 shrink-0" />
              <select
                value={selectedCity}
                onChange={(e) => setSelectedCity(e.target.value)}
                aria-label="Sélectionner une zone"
                className="w-full bg-transparent text-xs font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Input */}
            <div className="flex-1 flex items-center px-3 py-2 bg-gray-50 sm:bg-transparent border sm:border-0 border-gray-200/80 rounded-xl">
              <Search size={16} className="text-gray-400 mr-2 shrink-0" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder='Ex : "Sac à dos en cuir", "Robe en pagne"...'
                className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-6 py-3 rounded-xl transition-colors shrink-0 shadow-xs flex items-center justify-center gap-2"
            >
              <span>Rechercher</span>
              <ArrowRight size={15} />
            </button>
          </form>

          {/* Popular Tag Pills */}
          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2 flex-wrap text-xs">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <TrendingUp size={12} /> Tendances :
            </span>
            {POPULAR_SEARCHES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => router.push(`/recherche?q=${encodeURIComponent(item)}`)}
                className="bg-gray-100 hover:bg-coral-50 hover:text-coral-600 text-gray-600 font-medium px-2.5 py-1 rounded-lg text-[11px] transition-colors"
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {/* Bottom Fast B2B / Seller Strip */}
        <div className="max-w-xl mx-auto flex items-center justify-center gap-4 text-xs text-gray-600 font-medium">
          <span>Vous fabriquez ou vendez des articles ?</span>
          <Link
            href="/devenir-vendeur"
            className="inline-flex items-center gap-1 font-bold text-coral-600 hover:text-coral-700 underline underline-offset-4"
          >
            <Store size={13} />
            <span>Ouvrir votre boutique en ligne</span>
            <ArrowRight size={12} />
          </Link>
        </div>

      </div>
    </section>
  );
}
