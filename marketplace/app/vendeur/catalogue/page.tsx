"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import useArticlesPublics from "@/lib/hooks/useArticlesPublics";
import type { ArticlePublic } from "@/lib/queries/articles";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

export default function VendeurCataloguePage() {
  const { profile } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const { articles, loading, categories, categorySlug, setCategorySlug, page, setPage, hasMore, totalCount, search, setSearch, sortBy, setSortBy } = useArticlesPublics({ pageSize: 18 });

  const handleAdd = (product: ArticlePublic) => {
    addItem({ id: product.id, nom: product.nom, prix: product.prix_promo ?? product.prix, photos: product.photos, vendeur_id: product.vendeur_id });
    showToast("Produit ajouté au panier", "success");
  };

  return (
    <DashboardLayout role="vendeur" title="Catalogue" userName={profile?.full_name ?? undefined}>
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

      {/* Grille de produits — harmonisée avec le catalogue public */}
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
                onClick={() => undefined}
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
    </DashboardLayout>
  );
}
