"use client";

import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { ProductCardSkeleton } from "@/components/ui/Skeleton";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import useArticlesPublics from "@/lib/hooks/useArticlesPublics";
import { getArticlesPublics, type ArticlePublic } from "@/lib/queries/articles";
import { createClient } from "@/lib/supabase/client";
import { fetchFavoriteIds, toggleFavorite } from "@/lib/catalogue";
import { Search, ChevronLeft, ChevronRight, CheckCircle2, MapPin, Zap, Star } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import Link from "next/link";

// Prix affiché / prix barré — même logique que la home et /catalogue.
function prixAffiche(a: ArticlePublic) {
  return a.prix_promo ?? a.prix;
}
function ancienPrixAffiche(a: ArticlePublic) {
  return a.prix_promo ? a.prix : undefined;
}

export default function VendeurCataloguePage() {
  const router = useRouter();
  const { user, profile } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"produits" | "boutiques">("produits");
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [boutiquesLoading, setBoutiquesLoading] = useState(false);
  const [boutiquesError, setBoutiquesError] = useState<string | null>(null);

  const { articles, loading, categories, categorySlug, setCategorySlug, page, setPage, hasMore, totalCount, search, setSearch, sortBy, setSortBy } = useArticlesPublics({ pageSize: 18 });

  // Favoris réels du vendeur (en tant qu'acheteur) — synchronisés avec la
  // table `favoris`, comme sur la home et /catalogue. Auparavant ce toggle
  // était un no-op ici : le cœur changeait de couleur localement mais rien
  // n'était sauvegardé, donc rien n'apparaissait nulle part ensuite.
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    fetchFavoriteIds(supabase, user.id).then(setFavoriteIds);
  }, [supabase, user, articles.length]);

  const handleToggleFavorite = async (articleId: string) => {
    if (!user) return;
    const isFav = favoriteIds.has(articleId);
    try {
      const nowFav = await toggleFavorite(supabase, user.id, articleId, isFav);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (nowFav) next.add(articleId); else next.delete(articleId);
        return next;
      });
      showToast(nowFav ? "Ajouté aux favoris" : "Retiré des favoris", "success");
    } catch (err) {
      console.error("Erreur toggle favori:", err);
      showToast("Impossible de mettre à jour les favoris", "error");
    }
  };

  // Pool léger et non paginé (comme sur la home) pour calculer "Ventes
  // flash" et "Produits du moment" — indépendant de la pagination/recherche
  // de la grille principale, qui ne reflète qu'une page filtrée à la fois.
  const [highlightPool, setHighlightPool] = useState<ArticlePublic[]>([]);
  useEffect(() => {
    let cancelled = false;
    getArticlesPublics({ excludeVendeurId: profile?.role === "vendeur" ? profile.id : undefined })
      .then((data) => { if (!cancelled) setHighlightPool(data); })
      .catch((err) => console.error("Erreur chargement sections vitrine:", err));
    return () => { cancelled = true; };
  }, [profile?.id, profile?.role]);

  const flashDealsProducts = useMemo(
    () =>
      highlightPool
        .filter((a) => a.prix_promo != null && a.date_fin_promo != null && new Date(a.date_fin_promo).getTime() > Date.now())
        .slice(0, 8),
    [highlightPool]
  );
  const produitsDuMoment = useMemo(() => highlightPool.slice(0, 8), [highlightPool]);

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

  const filteredBoutiques = boutiques;

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {/* En-tête de page — remplace l'ancien header dashboard (titre "Catalogue
            & Boutiques" + recherche locale) : on réutilise le header public
            (logo, recherche, panier, dropdown profil vendeur) pour éviter la
            double barre de recherche empilée. */}
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Catalogue & Boutiques</h1>
        </div>

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
            {/* Ventes flash — grille figée en 4 colonnes sur desktop (jamais en
              colonne unique "sur le côté"), 2 colonnes sur mobile comme le reste. */}
          {flashDealsProducts.length > 0 && (
            <div className="mb-10 rounded-3xl bg-gradient-to-br from-coral-50/60 via-white to-amber-50/30 border border-coral-100/60 p-5 md:p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
                  <Zap size={20} />
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Ventes flash</h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-0.5">Offres limitées, jusqu'à épuisement des stocks</p>
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {flashDealsProducts.map((p) => (
                  <div key={p.id} className="block">
                    <ProductCardModern
                      image={p.photos?.[0] || "/images/hero-illustration.png"}
                      category={p.categorie?.nom || "Divers"}
                      name={p.nom}
                      rating={0}
                      reviewCount={0}
                      price={prixAffiche(p)}
                      oldPrice={ancienPrixAffiche(p)}
                      sellerName={p.vendeur?.nom_boutique || undefined}
                      location={p.vendeur?.quartier || p.vendeur?.commune || undefined}
                      stock={p.stock}
                      createdAt={p.created_at}
                      photosCount={p.photos.length}
                      onAddToCart={() => handleAdd(p)}
                      isFavorite={favoriteIds.has(p.id)}
                      onToggleFavorite={() => handleToggleFavorite(p.id)}
                      onClick={() => router.push(`/produits/${p.id}`)}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Produits du moment — même grille 4 colonnes sur desktop. */}
          {produitsDuMoment.length > 0 && (
            <div className="mb-10">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                  <Star size={20} />
                </div>
                <h2 className="text-lg md:text-xl font-bold text-gray-900 tracking-tight">Produits du moment</h2>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {produitsDuMoment.map((p) => (
                  <div key={p.id} className="block">
                    <ProductCardModern
                      image={p.photos?.[0] || "/images/hero-illustration.png"}
                      category={p.categorie?.nom || "Divers"}
                      name={p.nom}
                      rating={0}
                      reviewCount={0}
                      price={prixAffiche(p)}
                      oldPrice={ancienPrixAffiche(p)}
                      sellerName={p.vendeur?.nom_boutique || undefined}
                      location={p.vendeur?.quartier || p.vendeur?.commune || undefined}
                      stock={p.stock}
                      createdAt={p.created_at}
                      photosCount={p.photos.length}
                      onAddToCart={() => handleAdd(p)}
                      isFavorite={favoriteIds.has(p.id)}
                      onToggleFavorite={() => handleToggleFavorite(p.id)}
                      onClick={() => router.push(`/produits/${p.id}`)}
                    />
                  </div>
                ))}
              </div>
              <div className="mt-8 border-b border-gray-100" />
            </div>
          )}

          {/* Header */}
          <div className="mb-8">
            <p className="text-sm text-gray-500 font-medium mb-4">Parcourez le catalogue et ajoutez des produits à votre panier. Utilisez la recherche en haut de page pour trouver un produit précis.</p>

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
                    isFavorite={favoriteIds.has(p.id)}
                    onToggleFavorite={() => handleToggleFavorite(p.id)}
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
              Aucune boutique disponible pour le moment.
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
      </main>
      <Footer />
    </div>
  );
}
