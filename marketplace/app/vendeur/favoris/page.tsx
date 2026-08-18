"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/lib/hooks/useUser";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Heart } from "lucide-react";
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchFavoriteIds,
  mapArticleRow,
  toggleFavorite,
  getProductUrl,
} from "@/lib/catalogue";

export default function VendeurFavorisPage() {
  const router = useRouter();
  const { profile } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const { addItem } = useCart();

  const [products, setProducts] = useState<ArticleCard[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) {
      fetchFavorites();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  const fetchFavorites = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const ids = await fetchFavoriteIds(supabase, profile.id);
      setFavoriteIds(ids);

      if (ids.size === 0) {
        setProducts([]);
        return;
      }

      const { data, error } = await supabase
        .from("articles")
        .select(ARTICLE_CARD_SELECT)
        .in("id", Array.from(ids));

      if (error) throw error;

      const rows = (data || []) as unknown as ArticleCardRow[];
      const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id));
      setProducts(rows.map((r) => mapArticleRow(r, ratings)));
    } catch (error) {
      console.error("Erreur chargement favoris vendeur:", error);
      showToast("Erreur lors du chargement des favoris", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: ArticleCard) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id,
      photos: product.photos,
    });
    showToast("Ajouté au panier", "success");
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!profile) return;
    const isFav = favoriteIds.has(productId);
    try {
      const nowFav = await toggleFavorite(supabase, profile.id, productId, isFav);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (nowFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
      if (!nowFav) {
        // Retiré : on l'enlève aussi de la liste affichée sans tout recharger.
        setProducts((prev) => prev.filter((p) => p.id !== productId));
      }
      showToast(nowFav ? "Ajouté aux favoris" : "Retiré des favoris", "success");
    } catch (error: any) {
      showToast(error?.message || "Impossible de mettre à jour les favoris", "error");
    }
  };

  return (
    <DashboardLayout role="vendeur" title="Favoris" userName={profile?.full_name ?? undefined}>
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
            <Heart size={28} />
          </div>
          <p className="font-bold text-gray-900">Aucun favori pour le moment</p>
          <p className="text-sm text-gray-500 max-w-sm">
            Les produits que vous ajoutez au cœur depuis le catalogue apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <div key={product.id} className="block">
              <ProductCardModern
                image={product.photos[0] || ""}
                category={product.categorieLabel}
                name={product.nom}
                rating={product.rating}
                reviewCount={product.reviewCount}
                price={product.prix}
                oldPrice={product.ancien_prix ?? undefined}
                sellerName={product.vendeurNom}
                location={product.vendeurLocation || undefined}
                stock={product.stock ?? undefined}
                createdAt={product.createdAt}
                photosCount={product.photos.length}
                isFavorite={favoriteIds.has(product.id)}
                onAddToCart={() => handleAddToCart(product)}
                onToggleFavorite={() => handleToggleFavorite(product.id)}
                onClick={() => router.push(getProductUrl(product))}
              />
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
