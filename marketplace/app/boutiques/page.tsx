"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, CheckCircle2, MapPin } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";

export default function BoutiquesPage() {
  const [search, setSearch] = useState("");
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBoutiquesPopulaires(500);
        if (!cancelled) setBoutiques(data);
      } catch (err) {
        console.error("Erreur chargement boutiques:", err);
        if (!cancelled) setError("Impossible de charger les boutiques pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredStores = boutiques.filter((store) =>
    store.nom.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Toutes les boutiques
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Découvrez les vendeurs vérifiés d'Ayiba, près de chez vous.
          </p>
        </div>

        <div className="relative mb-8 md:mb-10 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Rechercher une boutique..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-12 pl-11 pr-4 rounded-full bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:border-coral-300 focus:bg-white transition-colors"
          />
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-40 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : filteredStores.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            {search ? `Aucune boutique trouvée pour "${search}".` : "Aucune boutique disponible pour le moment."}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {filteredStores.map((store) => (
              <Link
                key={store.id}
                href={`/boutiques/${store.id}`}
                className="group p-5 md:p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
              >
                <div className="relative mb-4 inline-block">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 bg-coral-50 flex items-center justify-center">
                    {store.logo ? (
                      <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-coral-500 font-bold text-xl">{store.nom.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  {store.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 size={18} className="text-teal-500 fill-teal-50" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors truncate">
                  {store.nom}
                </h3>

                <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                  <span className="font-bold text-gray-700">{store.productCount}</span>
                  <span>produit{store.productCount > 1 ? "s" : ""}</span>
                </div>

                {(store.quartier || store.commune) && (
                  <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 w-fit">
                    <MapPin size={11} />
                    {[store.quartier, store.commune].filter(Boolean).join(", ")}
                  </div>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
