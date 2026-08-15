"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import useArticlesPublics from "@/lib/hooks/useArticlesPublics";
import type { ArticlePublic } from "@/lib/queries/articles";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import Link from "next/link";

export default function VendeurCataloguePage() {
  const router = useRouter();
  const { profile } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<"produits" | "boutiques">("produits");
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [boutiquesLoading, setBoutiquesLoading] = useState(false);
  const [boutiquesError, setBoutiquesError] = useState<string | null>(null);
  const [boutiquesSearch, setBoutiquesSearch] = useState("");

  const { articles, loading, categories, categorySlug, setCategorySlug, page, setPage, hasMore, totalCount, search, setSearch, sortBy, setSortBy } = useArticlesPublics({ pageSize: 18 });

  // Charger les boutiques une seule fois
  useEffect(() => {
    if (activeTab === "boutiques" && boutiques.length === 0 && !boutiquesLoading) {
      let cancelled = false;
      async function loadBoutiques() {
        setBoutiquesLoading(true);
        setBoutiquesError(null);
        try {
          const data = await getBoutiquesPopulaires(500);
          if (!cancelled) setBoutiques(data);
        } catch (err) {
          console.error("Erreur chargement boutiques:", err);
          if (!cancelled) setBoutiquesError("Impossible de charger les boutiques pour le moment.");
        } finally {
          if (!cancelled) setBoutiquesLoading(false);
        }
      }
      loadBoutiques();
      return () => { cancelled = true };
    }
  }, [activeTab, boutiques.length, boutiquesLoading]);

  const handleAdd = (product: ArticlePublic) => {
    addItem({ id: product.id, nom: product.nom, prix: product.prix_promo ?? product.prix, photos: product.photos, vendeur_id: product.vendeur_id });
    showToast("Produit ajouté au panier", "success");
  };

  const filteredBoutiques = boutiques.filter((b) =>
    b.nom.toLowerCase().includes(boutiquesSearch.toLowerCase())
  );

  return (
    <DashboardLayout role="vendeur" title="Catalogue & Boutiques" userName={profile?.full_name ?? undefined}>
      {/* Tabs */}
      <div className="mb-8 flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab("produits")}
          className={`px-4 py-3 font-bold text-sm transition-colors ${
            activeTab === "produits"
              ? "text-coral-600 border-b-2 border-coral-500 -mb-[2px]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Produits
        </button>
        <button
          onClick={() => setActiveTab("boutiques")}
          className={`px-4 py-3 font-bold text-sm transition-colors ${
            activeTab === "boutiques"
              ? "text-coral-600 border-b-2 border-coral-500 -mb-[2px]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Boutiques
        </button>
      </div>

      {/* TAB PRODUITS */}
      {activeTab === "produits" && (
        <div>
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 font-medium mb-4">Parcourez le catalogue et ajoutez des produits à votre panier.</p>
            
            {/* Barre de recherche */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={search ?? ""}
                onChange={(e) => setSearch(e.target.value || null)}
                placeholder="Rechercher un produit, une marque..."
                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all text-sm"
              />
            </div>

            {/* Filtres */}
            <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
              <div className="flex-1 flex flex-wrap gap-2">
                <label className="sr-only">Filtrer par catégorie</label>
                <select
                  value={categorySlug ?? ""}
                  onChange={(e) => setCategorySlug(e.target.value || null)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/10"
                >
                  <option value="">Toutes catégories</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.slug}>{c.nom}</option>
                  ))}
                </select>

                <select
                  value={sortBy ?? "recent"}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/10"
                >
                  <option value="recent">Récent</option>
                  <option value="price-asc">Prix ↑</option>
                  <option value="price-desc">Prix ↓</option>
                  <option value="popular">Popularité</option>
                </select>
              </div>

              {/* Pagination compacte */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  aria-label="Page précédente"
                >
                  <ChevronLeft size={16} />
                </button>
                <div className="text-xs text-gray-500 font-medium min-w-24 text-center">
                  <span className="font-bold text-gray-700">{page}</span> / {Math.ceil((totalCount ?? 1) / 18)} • {totalCount ?? 0} articles
                </div>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={!hasMore}
                  className="p-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-40 transition-colors"
                  aria-label="Page suivante"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>

          {/* Grille de produits */}
          <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {loading ? (
              Array.from({ length: 9 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            ) : articles.length > 0 ? (
              articles.map((p) => (
                <div key={p.id} className="block">
                  <ProductCardModern
                    image={p.photos?.[0] || "/images/hero-illustration.png"}
                    category={p.categorie?.nom || "Divers"}
                    name={p.nom}
                    rating={0}
                    reviewCount={0}
                    price={p.prix_promo ?? p.prix}
                    oldPrice={p.prix_promo ? p.prix : undefined}
                    sellerName={p.vendeur?.nom_boutique || undefined}
                    location={p.vendeur?.quartier || p.vendeur?.commune || undefined}
                    stock={p.stock}
                    createdAt={p.created_at}
                    photosCount={p.photos.length}
                    onAddToCart={() => handleAdd(p)}
                    isFavorite={false}
                    onToggleFavorite={() => {}}
                    onClick={() => router.push(`/produits/${p.id}`)}
                  />
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-300">
                  <Search size={28} />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">Aucun produit</h3>
                <p className="text-sm text-gray-500 mb-6">Aucun produit ne correspond à votre recherche.</p>
                <button
                  onClick={() => { setCategorySlug(null); setSearch(null); }}
                  className="inline-flex px-4 py-2 bg-coral-600 hover:bg-coral-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB BOUTIQUES */}
      {activeTab === "boutiques" && (
        <div>
          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 font-medium mb-4">Découvrez les vendeurs vérifiés d'Ayiba, près de chez vous.</p>
            
            {/* Barre de recherche */}
            <div className="relative mb-6 max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                value={boutiquesSearch}
                onChange={(e) => setBoutiquesSearch(e.target.value)}
                placeholder="Rechercher une boutique..."
                className="w-full h-12 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all text-sm"
              />
            </div>
          </div>

          {/* Grille de boutiques */}
          {boutiquesError && (
            <div className="mb-8 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
              {boutiquesError}
            </div>
          )}

          {boutiquesLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : filteredBoutiques.length === 0 ? (
            <div className="py-20 text-center text-gray-400">
              {boutiquesSearch ? `Aucune boutique trouvée pour "${boutiquesSearch}".` : "Aucune boutique disponible pour le moment."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredBoutiques.map((store) => (
                <Link
                  key={store.id}
                  href={`/boutiques/${store.id}`}
                  className="group p-5 md:p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
                >
                  <div className="relative mb-4 inline-block">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 bg-coral-50 flex items-center justify-center">
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
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-coral-600 transition-colors">{store.nom}</h3>
                  {store.quartier && (
                    <p className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                      <MapPin size={12} />
                      {store.quartier}{store.commune && ` · ${store.commune}`}
                    </p>
                  )}
                  <p className="text-xs text-gray-400">
                    {store.productCount} produit{store.productCount > 1 ? "s" : ""} · Vérifiée
                  </p>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </DashboardLayout>
  );
}
