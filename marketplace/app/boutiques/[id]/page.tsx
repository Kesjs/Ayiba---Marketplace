"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ArrowLeft, MapPin, Star, LayoutGrid, List, SlidersHorizontal, Heart } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/ui/AuthModal";
import { ContactModal } from "@/components/modals/ContactModal";
import { getBoutiqueParId, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { getArticlesPublics, type ArticlePublic } from "@/lib/queries/articles";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { fetchFavoriteIds, toggleFavorite, extractIdFromSlugParam, getProductUrl } from "@/lib/catalogue";

function prixAffiche(a: ArticlePublic) {
  return a.prix_promo ?? a.prix;
}
function ancienPrixAffiche(a: ArticlePublic) {
  return a.prix_promo ? a.prix : undefined;
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const rawParam = (params.id as string) || "";
  const boutiqueId = extractIdFromSlugParam(rawParam);
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { user, profile } = useUser();
  const supabase = createClient();

  const [store, setStore] = useState<BoutiquePublique | null>(null);
  const [storeProducts, setStoreProducts] = useState<ArticlePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [contactModalOpen, setContactModalOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [selectedCategory, setSelectedCategory] = useState("Tout");
  const [sortBy, setSortBy] = useState<"nouveautes" | "prix-croissant" | "prix-decroissant" | "promo">("nouveautes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const availableCategories = useMemo(() => {
    const catsMap = new Map<string, number>();
    storeProducts.forEach((p) => {
      const catName = p.categorie?.nom || "Divers";
      catsMap.set(catName, (catsMap.get(catName) || 0) + 1);
    });
    return Array.from(catsMap.entries());
  }, [storeProducts]);

  const displayedProducts = useMemo(() => {
    let list = [...storeProducts];

    if (selectedCategory !== "Tout") {
      list = list.filter((p) => (p.categorie?.nom || "Divers") === selectedCategory);
    }

    list.sort((a, b) => {
      if (sortBy === "prix-croissant") {
        return prixAffiche(a) - prixAffiche(b);
      }
      if (sortBy === "prix-decroissant") {
        return prixAffiche(b) - prixAffiche(a);
      }
      if (sortBy === "promo") {
        const aHasPromo = !!a.prix_promo ? 1 : 0;
        const bHasPromo = !!b.prix_promo ? 1 : 0;
        if (bHasPromo !== aHasPromo) return bHasPromo - aHasPromo;
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    return list;
  }, [storeProducts, selectedCategory, sortBy]);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    fetchFavoriteIds(supabase, user.id).then(setFavoriteIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (!boutiqueId) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setNotFound(false);
      try {
        const [storeData, productsData] = await Promise.all([
          getBoutiqueParId(boutiqueId),
          getArticlesPublics({ vendeurId: boutiqueId }),
        ]);
        if (cancelled) return;
        if (!storeData) {
          setNotFound(true);
        } else {
          setStore(storeData);
          setStoreProducts(productsData);
        }
      } catch (err) {
        console.error("Erreur chargement boutique:", err);
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [boutiqueId]);

  const isOwnBoutique = !!(user && store && user.id === store.id);

  const handleAddToCart = (product: ArticlePublic) => {
    if (isOwnBoutique) {
      showToast("Vous ne pouvez pas acheter vos propres articles", "error");
      return;
    }
    addItem({
      id: product.id,
      nom: product.nom,
      prix: prixAffiche(product),
      vendeur_id: product.vendeur_id,
      photos: product.photos,
    });
    showToast("Produit ajouté au panier", "success");
  };

  const handleContact = () => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    if (!store) return;
    setContactModalOpen(true);
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      setAuthModalOpen(true);
      return;
    }
    const isFav = favoriteIds.has(productId);
    try {
      const nowFav = await toggleFavorite(supabase, user.id, productId, isFav);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (nowFav) next.add(productId);
        else next.delete(productId);
        return next;
      });
      showToast(nowFav ? "Ajouté aux favoris" : "Retiré des favoris", "success");
    } catch (error: any) {
      showToast(error?.message || "Impossible de mettre à jour les favoris", "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
          <div className="h-32 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse mb-10" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-50 border border-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (notFound || !store) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <p className="text-gray-400 mb-4">Boutique introuvable.</p>
          <Link href="/boutiques" className="text-coral-500 font-bold text-sm">
            ← Retour aux boutiques
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
        <Link href="/boutiques" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} />
          Toutes les boutiques
        </Link>

        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 md:p-8 mb-8 md:mb-10 flex flex-col md:flex-row md:items-start gap-5 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-4 border-white shadow-sm bg-coral-50 flex items-center justify-center">
              {store.logo ? (
                <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-coral-500 font-bold text-2xl">{store.nom.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{store.nom}</h1>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              {store.avisCount > 0 && (
                <div className="flex items-center gap-1">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-sm font-bold text-gray-700">{store.note}</span>
                  <span className="text-xs text-gray-400">({store.avisCount} avis)</span>
                </div>
              )}
              {(store.quartier || store.commune) && (
                <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1.5 rounded-md border border-gray-100 w-fit">
                  <MapPin size={11} />
                  {[store.quartier, store.commune].filter(Boolean).join(", ")}
                </div>
              )}
            </div>
            {store.description && (
              <p className="text-sm text-gray-600 max-w-2xl">{store.description}</p>
            )}
          </div>

          {isOwnBoutique ? (
            <span className="shrink-0 text-xs font-bold text-gray-400 uppercase tracking-wider px-3 py-2">
              Votre boutique
            </span>
          ) : (
            <Button variant="outline" onClick={handleContact} className="shrink-0">
              <MessageCircle size={16} className="mr-2" />
              Contacter
            </Button>
          )}
        </div>

        {isOwnBoutique && (
          <div className="flex items-start gap-3 p-4 mb-8 bg-amber-50 border border-amber-100 rounded-xl">
            <CheckCircle2 size={18} className="text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-900">
              <p className="font-semibold">C'est votre boutique</p>
              <p className="mt-0.5">
                Vous voyez ici l'aperçu public, mais vous ne pouvez pas acheter vos propres articles.{" "}
                <Link href="/vendeur/articles" className="underline font-medium">
                  Gérer mes articles
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* --- BARRE DE CONTRÔLES (Filtres Catégories + Tri + Grille/Liste) --- */}
        {storeProducts.length > 0 && (
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100">
            {/* Onglets Filtres par Catégorie */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
              <button
                onClick={() => setSelectedCategory("Tout")}
                className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 border ${
                  selectedCategory === "Tout"
                    ? "bg-coral-500 text-white border-coral-500 shadow-xs"
                    : "bg-gray-50 hover:bg-white text-gray-700 border-gray-200"
                }`}
              >
                Tout ({storeProducts.length})
              </button>
              {availableCategories.map(([catName, count]) => (
                <button
                  key={catName}
                  onClick={() => setSelectedCategory(catName)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold transition-all shrink-0 border ${
                    selectedCategory === catName
                      ? "bg-coral-500 text-white border-coral-500 shadow-xs"
                      : "bg-gray-50 hover:bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  {catName} ({count})
                </button>
              ))}
            </div>

            {/* Tri & Bascule Grille / Liste */}
            <div className="flex items-center justify-between md:justify-end gap-3 shrink-0">
              {/* Select de Tri */}
              <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-xl px-3 py-1.5 text-xs font-bold text-gray-700">
                <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent font-bold text-gray-900 border-none outline-none cursor-pointer pr-1"
                >
                  <option value="nouveautes">Nouveautés</option>
                  <option value="prix-croissant">Prix : croissant</option>
                  <option value="prix-decroissant">Prix : décroissant</option>
                  <option value="promo">En promo</option>
                </select>
              </div>

              {/* Bascule Grille / Liste */}
              <div className="flex items-center bg-gray-50 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setViewMode("grid")}
                  title="Vue Grille"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "grid"
                      ? "bg-white text-coral-500 shadow-xs font-bold"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <LayoutGrid size={16} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  title="Vue Liste"
                  className={`p-1.5 rounded-lg transition-all ${
                    viewMode === "list"
                      ? "bg-white text-coral-500 shadow-xs font-bold"
                      : "text-gray-400 hover:text-gray-700"
                  }`}
                >
                  <List size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {storeProducts.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-bold mb-1">Cette boutique n'a pas encore de produits en ligne</p>
            <p className="text-xs text-gray-400">Revenez bientôt pour découvrir ses nouveautés.</p>
          </div>
        ) : displayedProducts.length === 0 ? (
          <div className="py-16 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200">
            <p className="text-gray-500 font-bold mb-1">Aucun produit dans la catégorie "{selectedCategory}"</p>
            <button
              onClick={() => setSelectedCategory("Tout")}
              className="mt-2 text-xs font-bold text-coral-500 hover:underline"
            >
              Afficher tous les produits
            </button>
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {displayedProducts.map((product) => (
              <ProductCardModern
                key={product.id}
                image={product.photos[0] || "/images/hero-illustration.png"}
                category={product.categorie?.nom || "Divers"}
                name={product.nom}
                rating={0}
                reviewCount={0}
                price={prixAffiche(product)}
                oldPrice={ancienPrixAffiche(product)}
                location={product.vendeur?.quartier || product.vendeur?.commune || undefined}
                stock={product.stock}
                createdAt={product.created_at}
                photosCount={product.photos.length}
                onAddToCart={() => handleAddToCart(product)}
                isFavorite={favoriteIds.has(product.id)}
                onToggleFavorite={() => handleToggleFavorite(product.id)}
                onClick={() => router.push(getProductUrl(product))}
              />
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {displayedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-3xl border border-gray-100 p-4 md:p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 hover:border-coral-200 hover:shadow-lg transition-all group"
              >
                <div
                  onClick={() => router.push(getProductUrl(product))}
                  className="relative w-full sm:w-36 h-36 rounded-2xl overflow-hidden bg-gray-50 shrink-0 cursor-pointer"
                >
                  <img
                    src={product.photos[0] || "/images/hero-illustration.png"}
                    alt={product.nom}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {!!product.prix_promo && (
                    <span className="absolute top-2 left-2 bg-coral-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full shadow-xs">
                      PROMO
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-coral-500 mb-1 block">
                      {product.categorie?.nom || "Divers"}
                    </span>
                    <Link
                      href={getProductUrl(product)}
                      className="font-extrabold text-base text-gray-900 hover:text-coral-500 transition-colors line-clamp-1"
                    >
                      {product.nom}
                    </Link>
                    {product.description && (
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 font-medium leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-gray-50">
                    <div>
                      <p className="text-lg font-black text-coral-500">
                        {prixAffiche(product).toLocaleString("fr-FR")} F
                      </p>
                      {!!ancienPrixAffiche(product) && (
                        <p className="text-xs text-gray-400 line-through font-medium">
                          {ancienPrixAffiche(product)?.toLocaleString("fr-FR")} F
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleFavorite(product.id)}
                        className={`p-2.5 rounded-xl border transition-colors ${
                          favoriteIds.has(product.id)
                            ? "bg-rose-50 text-rose-500 border-rose-200"
                            : "bg-gray-50 text-gray-400 border-gray-100 hover:text-gray-600"
                        }`}
                      >
                        <Heart size={16} className={favoriteIds.has(product.id) ? "fill-rose-500" : ""} />
                      </button>
                      <Button
                        onClick={() => handleAddToCart(product)}
                        className="h-10 px-4 text-xs font-bold rounded-xl shadow-xs"
                      >
                        Ajouter au panier
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
        redirectTo={`/messages?vendeur=${store.id}`}
      />

      {user && (
        <ContactModal
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          recipient={{ id: store.id, nom: store.nom, photo: store.logo || undefined }}
          userId={user.id}
          messagesBasePath={profile?.role === "vendeur" ? "/vendeur/messages" : "/messages"}
        />
      )}
    </div>
  );
}
