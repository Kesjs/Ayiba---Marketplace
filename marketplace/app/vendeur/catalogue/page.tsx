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
import { fetchFavoriteIds, toggleFavorite, getProductUrl, getBoutiqueUrl } from "@/lib/catalogue";
import { Search, ChevronLeft, ChevronRight, MapPin, Zap, Star, ArrowLeft, ArrowRight, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { ContactModal } from "@/components/modals/ContactModal";
import { Select } from "@/components/ui/Select";
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
  const { user, profile, loading: userLoading } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [activeTab, setActiveTab] = useState<"produits" | "boutiques">("produits");
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [contactStore, setContactStore] = useState<BoutiquePublique | null>(null);
  const [boutiquesLoading, setBoutiquesLoading] = useState(false);
  const [boutiquesError, setBoutiquesError] = useState<string | null>(null);
  const [boutiqueFilter, setBoutiqueFilter] = useState("");

  const { articles, loading, categories, categorySlug, setCategorySlug, page, setPage, hasMore, totalCount, search, setSearch, sortBy, setSortBy } = useArticlesPublics({
    pageSize: 18,
    // Même exclusion que pour "Ventes flash"/"Produits du moment" : le
    // vendeur navigue ici en tant qu'acheteur, il ne doit pas croiser ses
    // propres produits dans la grille générale. `enabled: !userLoading`
    // retarde le tout premier fetch jusqu'à ce que le profil soit résolu,
    // pour ne pas partir une première fois sans exclusion puis recharger
    // juste après avec — même clignotement que celui déjà corrigé sur le
    // pool vitrine.
    enabled: !userLoading,
    excludeVendeurId: profile?.role === "vendeur" ? profile.id : undefined,
  });

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
    // On attend que le profil (vendeur ou non) soit résolu avant de charger
    // ce pool : sinon un premier appel part sans excludeVendeurId (profil pas
    // encore connu), pose ses propres produits en promo dans "Ventes flash",
    // puis un second appel arrive juste après avec l'exclusion et les retire
    // — d'où le flash "apparaît puis disparaît" au chargement de la page.
    // Un seul appel, une fois le profil connu, élimine ce clignotement.
    if (userLoading) return;
    let cancelled = false;
    getArticlesPublics({ excludeVendeurId: profile?.role === "vendeur" ? profile.id : undefined })
      .then((data) => { if (!cancelled) setHighlightPool(data); })
      .catch((err) => console.error("Erreur chargement sections vitrine:", err));
    return () => { cancelled = true; };
  }, [userLoading, profile?.id, profile?.role]);

  const flashDealsProducts = useMemo(
    () =>
      highlightPool
        .filter((a) => a.prix_promo != null && a.date_fin_promo != null && new Date(a.date_fin_promo).getTime() > Date.now())
        .slice(0, 8),
    [highlightPool]
  );
  const produitsDuMoment = useMemo(() => highlightPool.slice(0, 8), [highlightPool]);

  // Charger les boutiques une seule fois. Important : `boutiquesLoading` ne
  // doit PAS être dans les dépendances. Il l'était avant, et comme il est
  // mis à `true` dès le début de loadBoutiques(), ça redéclenchait cet effet
  // immédiatement — React exécute alors le cleanup du run précédent, qui
  // met `cancelled = true` sur la fetch tout juste lancée. Résultat : la
  // réponse arrivait bien mais était ignorée (cancelled), et le `finally`
  // ne remettait jamais boutiquesLoading à false non plus (même garde) — le
  // skeleton de chargement restait affiché indéfiniment, d'où l'onglet
  // "vide" en pratique.
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, boutiques.length]);

  const handleAdd = (product: ArticlePublic) => {
    addItem({ id: product.id, nom: product.nom, prix: product.prix_promo ?? product.prix, photos: product.photos, vendeur_id: product.vendeur_id });
    showToast("Produit ajouté au panier", "success");
  };

  const filteredBoutiques = useMemo(() => {
    const q = boutiqueFilter.trim().toLowerCase();
    if (!q) return boutiques;
    return boutiques.filter((b) => b.nom.toLowerCase().includes(q));
  }, [boutiques, boutiqueFilter]);

  // Le vendeur est toujours connecté sur cette page (dashboard), pas besoin
  // de AuthModal comme sur /boutiques (accessible aux visiteurs anonymes).
  const handleContactBoutique = (e: React.MouseEvent, store: BoutiquePublique) => {
    e.stopPropagation();
    setContactStore(store);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        {/* En-tête de page — remplace l'ancien header dashboard (titre "Catalogue
            & Boutiques" + recherche locale) : on réutilise le header public
            (logo, recherche, panier, dropdown profil vendeur) pour éviter la
            double barre de recherche empilée. */}
        <div className="mb-6">
          <Link
            href="/vendeur/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-coral-600 transition-colors mb-2"
          >
            <ArrowLeft size={14} />
            Retour au dashboard
          </Link>
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
                      onClick={() => router.push(getProductUrl(p))}
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
                      onClick={() => router.push(getProductUrl(p))}
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
                <Select
                  value={categorySlug ?? ""}
                  onChange={(v) => setCategorySlug(v || null)}
                  className="w-48"
                  options={[
                    { value: "", label: "Toutes catégories" },
                    ...categories.map((c) => ({ value: c.slug, label: c.nom })),
                  ]}
                />

                <Select
                  value={sortBy ?? "recent"}
                  onChange={(v) => setSortBy(v)}
                  className="w-40"
                  options={[
                    { value: "recent", label: "Récent" },
                    { value: "price-asc", label: "Prix ↑" },
                    { value: "price-desc", label: "Prix ↓" },
                    { value: "popular", label: "Popularité" },
                  ]}
                />
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
                <div className="text-xs text-gray-500 font-medium min-w-16 text-center">
                  <span className="font-bold text-gray-700">{page}</span> / {Math.ceil((totalCount ?? 1) / 18)}
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
                    onClick={() => router.push(getProductUrl(p))}
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

            {/* Filtre discret par nom de boutique — pas une "vraie" barre de
                recherche dupliquée avec celle du header, juste un petit champ
                pour affiner la liste déjà chargée. */}
            {boutiques.length > 0 && (
              <div className="relative max-w-xs">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
                <input
                  type="text"
                  value={boutiqueFilter}
                  onChange={(e) => setBoutiqueFilter(e.target.value)}
                  placeholder="Filtrer par nom de boutique"
                  className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-coral-500/10"
                />
              </div>
            )}
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
              {boutiqueFilter
                ? "Aucune boutique ne correspond à ce filtre."
                : "Aucune boutique disponible pour le moment."}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              {filteredBoutiques.map((store) => (
                <div
                  key={store.id}
                  role="link"
                  tabIndex={0}
                  onClick={() => router.push(getBoutiqueUrl(store))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") router.push(getBoutiqueUrl(store));
                  }}
                  className="group flex flex-col p-5 md:p-6 bg-gray-50/50 rounded-2xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300 cursor-pointer"
                >
                  <div className="relative mb-4 inline-block w-fit">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 bg-coral-50 flex items-center justify-center">
                      {store.logo ? (
                        <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-coral-500 font-bold text-xl">{store.nom.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <h3 className="font-bold text-gray-900 mb-1 group-hover:text-coral-600 transition-colors">{store.nom}</h3>

                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {store.avisCount > 0 && (
                      <div className="flex items-center gap-1">
                        <Star size={12} className="fill-amber-400 text-amber-400" />
                        <span className="text-xs font-bold text-gray-700">{store.note}</span>
                        <span className="text-[11px] text-gray-400">({store.avisCount})</span>
                      </div>
                    )}
                    {store.quartier && (
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <MapPin size={12} />
                        {store.quartier}{store.commune && ` · ${store.commune}`}
                      </p>
                    )}
                  </div>

                  {store.description ? (
                    <p className="text-xs text-gray-400 line-clamp-2 mb-4 flex-1">{store.description}</p>
                  ) : (
                    <div className="flex-1 mb-4" />
                  )}

                  <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-100">
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-500 group-hover:gap-1.5 transition-all">
                      Voir plus
                      <ArrowRight size={13} />
                    </span>
                    <button
                      onClick={(e) => handleContactBoutique(e, store)}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-coral-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-coral-200 bg-white transition-colors"
                    >
                      <MessageCircle size={13} />
                      Contacter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          </div>
        )}
      </main>
      <Footer />

      {contactStore && user && (
        <ContactModal
          open={!!contactStore}
          onOpenChange={(v) => !v && setContactStore(null)}
          recipient={{ id: contactStore.id, nom: contactStore.nom, photo: contactStore.logo || undefined }}
          userId={user.id}
          messagesBasePath="/vendeur/messages"
        />
      )}
    </div>
  );
}
