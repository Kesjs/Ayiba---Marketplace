"use client";

import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ProductCard } from "@/components/ui/ProductCard";
import useArticlesPublics from "@/lib/hooks/useArticlesPublics";
import type { ArticlePublic } from "@/lib/queries/articles";

export default function VendeurCataloguePage() {
  const { profile } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const { articles, loading, categories, categorySlug, setCategorySlug, page, setPage, hasMore, totalCount, search, setSearch, sortBy, setSortBy } = useArticlesPublics({ pageSize: 20 });

  const handleAdd = (product: ArticlePublic) => {
    addItem({ id: product.id, nom: product.nom, prix: product.prix_promo ?? product.prix, photos: product.photos, vendeur_id: product.vendeur_id });
    showToast("Produit ajouté au panier", "success");
  };

  return (
    <DashboardLayout role="vendeur" title="Catalogue" userName={profile?.full_name ?? undefined}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <div className="flex-1 flex items-center gap-3">
          <input
            value={search ?? ""}
            onChange={(e) => setSearch(e.target.value || null)}
            placeholder="Recherche (nom, description)"
            className="flex-1 bg-white border border-gray-200 rounded-lg p-2"
          />

          <select
            value={sortBy ?? "recent"}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-white border border-gray-200 rounded-lg p-2"
          >
            <option value="recent">Récent</option>
            <option value="price-asc">Prix — croissant</option>
            <option value="price-desc">Prix — décroissant</option>
            <option value="popular">Popularité</option>
          </select>

          <label className="sr-only">Filtrer par catégorie</label>
          <select
            value={categorySlug ?? ""}
            onChange={(e) => setCategorySlug(e.target.value || null)}
            className="bg-white border border-gray-200 rounded-lg p-2"
          >
            <option value="">Toutes catégories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>{c.nom}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >Préc</button>
          <div className="text-sm text-gray-600">
            Page {page} • {totalCount ?? "—"} articles
          </div>
          <button
            onClick={() => setPage(page + 1)}
            disabled={!hasMore}
            className="px-3 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >Suiv</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-56 bg-gray-100 rounded-2xl animate-pulse" />
          ))
        ) : (
          articles.map((p) => (
            <div key={p.id}>
              <ProductCard
                image={p.photos?.[0] || "/images/hero-illustration.png"}
                category={p.categorie?.nom || "Divers"}
                name={p.nom}
                rating={0}
                reviewCount={0}
                price={p.prix_promo ?? p.prix}
                oldPrice={p.prix_promo ? p.prix : undefined}
                isFavorite={false}
                onAddToCart={() => handleAdd(p)}
                onToggleFavorite={() => {}}
                onClick={() => undefined}
                isOwnProduct={profile?.id === p.vendeur_id}
                ownHref={`/vendeur/articles/${p.id}`}
              />
            </div>
          ))
        )}
      </div>
    </DashboardLayout>
  );
}
