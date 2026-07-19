"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { CATEGORIES, MOCK_PRODUCTS, MOCK_STORES } from "@/lib/mock-data";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { Search, SlidersHorizontal, CheckCircle2, Star } from "lucide-react";

// Fusion des anciennes pages /catalogue (produits) et /boutiques (vendeurs)
// en un seul point d'entrée — voir dashboard-client.md, Décision 3. Pas de
// Navbar/Footer publics ici : le layout (client) fournit déjà sidebar +
// bottom nav pour un utilisateur connecté.

type Onglet = "produits" | "boutiques";

function ExplorerContent() {
  const searchParams = useSearchParams();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const [onglet, setOnglet] = useState<Onglet>("produits");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categorie") || "Tout");
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("popular");
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<any[]>([]);

  const categories = ["Tout", ...CATEGORIES.map((c) => c.label)];

  useEffect(() => {
    if (onglet !== "produits") return;
    setLoading(true);
    const timer = setTimeout(() => {
      let filtered = [...MOCK_PRODUCTS];

      if (selectedCategory !== "Tout") {
        filtered = filtered.filter((p) => {
          const cat = CATEGORIES.find((c) => c.id === p.categorie);
          return cat?.label === selectedCategory;
        });
      }

      if (searchQuery) {
        filtered = filtered.filter(
          (p) =>
            p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
            p.description.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      if (sortBy === "price-asc") filtered.sort((a, b) => a.prix - b.prix);
      if (sortBy === "price-desc") filtered.sort((a, b) => b.prix - a.prix);
      if (sortBy === "rating") filtered.sort((a, b) => b.rating - a.rating);

      setProducts(filtered);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [onglet, selectedCategory, searchQuery, sortBy]);

  const filteredStores = MOCK_STORES.filter((store) =>
    store.nom.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id || "default",
      photos: product.photos,
    });
    showToast("Produit ajouté au panier", "success");
  };

  return (
    <main className="min-h-screen bg-gray-50/30">
      <section className="bg-white border-b border-gray-100 px-4 md:px-8 py-6 md:py-10">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight mb-1">Explorer</h1>
        <p className="text-gray-500 text-sm font-medium mb-6">
          Produits et boutiques vérifiées, au même endroit.
        </p>

        {/* Toggle Produits / Boutiques */}
        <div className="flex bg-gray-50 rounded-xl p-1 w-fit mb-6">
          <button
            onClick={() => setOnglet("produits")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              onglet === "produits" ? "bg-white text-coral-600 shadow-sm" : "text-gray-500"
            }`}
          >
            Produits
          </button>
          <button
            onClick={() => setOnglet("boutiques")}
            className={`px-5 py-2 rounded-lg text-sm font-bold transition-colors ${
              onglet === "boutiques" ? "bg-white text-coral-600 shadow-sm" : "text-gray-500"
            }`}
          >
            Boutiques
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder={onglet === "produits" ? "Rechercher un produit..." : "Rechercher une boutique..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all text-sm font-medium"
            />
          </div>
          {onglet === "produits" && (
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-5 rounded-2xl border border-gray-200 flex items-center gap-2 font-bold text-sm ${
                showFilters ? "bg-gray-100" : "bg-white"
              }`}
            >
              <SlidersHorizontal size={16} />
              Filtres
            </button>
          )}
        </div>
      </section>

      <div className="px-4 md:px-8 py-6 md:py-8">
        {onglet === "produits" ? (
          <div className="flex flex-col lg:flex-row gap-8">
            {showFilters && (
              <aside className="lg:w-56 space-y-6">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Catégories</h3>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                          selectedCategory === cat ? "bg-coral-50 text-coral-600" : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Trier par</h3>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full h-10 px-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none"
                  >
                    <option value="popular">Les plus populaires</option>
                    <option value="price-asc">Prix croissant</option>
                    <option value="price-desc">Prix décroissant</option>
                    <option value="rating">Mieux notés</option>
                  </select>
                </div>
              </aside>
            )}

            <div className="flex-1">
              <p className="text-sm text-gray-500 font-bold mb-4">
                {products.length} <span className="font-medium">produits</span>
              </p>
              {loading ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {products.map((product) => (
                    <Link key={product.id} href={`/produits/${product.id}`} className="block">
                      <ProductCardModern
                        image={product.photos[0]}
                        category={CATEGORIES.find((c) => c.id === product.categorie)?.label || "Divers"}
                        name={product.nom}
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                        price={product.prix}
                        oldPrice={product.ancien_prix ?? undefined}
                        onAddToCart={() => handleAddToCart(product)}
                        onToggleFavorite={() => showToast("Favori ajouté", "success")}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <Search size={32} className="mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun résultat</h3>
                  <p className="text-gray-500 text-sm">Essaie une autre recherche ou catégorie.</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            {filteredStores.length === 0 ? (
              <div className="py-20 text-center text-gray-400">Aucune boutique trouvée.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {filteredStores.map((store) => (
                  <Link
                    key={store.id}
                    href={`/boutiques/${store.id}`}
                    className="group p-5 bg-white rounded-3xl border border-gray-100 hover:border-coral-100 hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
                  >
                    <div className="relative mb-4 inline-block">
                      <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-white shadow-sm">
                        <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                      </div>
                      {store.isVerified && (
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                          <CheckCircle2 size={16} className="text-teal-500 fill-teal-50" />
                        </div>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors truncate">
                      {store.nom}
                    </h3>
                    <div className="flex items-center gap-1.5">
                      <Star size={13} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{store.rating}</span>
                      <span className="text-xs text-gray-400">• {store.productCount} produits</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export default function ExplorerPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ExplorerContent />
    </Suspense>
  );
}
