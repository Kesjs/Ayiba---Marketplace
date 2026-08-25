"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ShieldCheck, QrCode, Store, Bike, ArrowRight,
  Wallet, Star, MapPin, Clock, MessageCircle,
  ChevronRight, Zap, ChevronLeft, Menu, Sparkles, CheckCircle2, Heart, Quote
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { ContactModal } from "@/components/modals/ContactModal";
import { useRouter } from "next/navigation";
import { getArticlesPublics, getCategoriesFormulaire, type ArticlePublic, type CategorieArbre } from "@/lib/queries/articles";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { resolveCategoryIcon } from "@/lib/constants/category-icons";
import { useUser } from "@/lib/hooks/useUser";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { toggleFavorite, fetchFavoriteIds, getProductUrl, getBoutiqueUrl } from "@/lib/catalogue";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HomeSkeleton } from "@/components/ui/Skeleton";
import { HeroSection } from "@/components/home/HeroSection";
import { DeliveryAssuranceBanner } from "@/components/home/DeliveryAssuranceBanner";

// ============================================
// VARIANTS D'ANIMATION (Framer Motion)
// ============================================

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } }
};

const gridStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.98 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

// Prix affiché / prix barré
function prixAffiche(a: ArticlePublic) {
  return a.prix_promo ?? a.prix;
}
function ancienPrixAffiche(a: ArticlePublic) {
  return a.prix_promo ? a.prix : undefined;
}

// Mélange Fisher-Yates
function melanger<T>(liste: T[]): T[] {
  const copie = [...liste];
  for (let i = copie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copie[i], copie[j]] = [copie[j], copie[i]];
  }
  return copie;
}

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);

  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [contactStore, setContactStore] = useState<BoutiquePublique | null>(null);

  const handleContactBoutique = (e: React.MouseEvent, store: BoutiquePublique) => {
    e.stopPropagation();
    if (!user) {
      router.push(`/connexion?redirect=/messages?vendeur=${store.id}`);
      return;
    }
    setContactStore(store);
  };

  const [activeTab, setActiveTab] = useState("Tout");
  const [visibleProductsCount, setVisibleProductsCount] = useState(20);

  // Mouse Drag Scroll pour les catégories sur Desktop
  const [isDraggingCat, setIsDraggingCat] = useState(false);
  const [catStartX, setCatStartX] = useState(0);
  const [catScrollLeft, setCatScrollLeft] = useState(0);
  const catDragDistanceRef = useRef(0);

  const handleCatMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDraggingCat(true);
    catDragDistanceRef.current = 0;
    setCatStartX(e.pageX - e.currentTarget.offsetLeft);
    setCatScrollLeft(e.currentTarget.scrollLeft);
  };

  const handleCatMouseLeave = () => {
    setIsDraggingCat(false);
  };

  const handleCatMouseUp = () => {
    setIsDraggingCat(false);
  };

  const handleCatMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDraggingCat) return;
    e.preventDefault();
    const x = e.pageX - e.currentTarget.offsetLeft;
    const walk = (x - catStartX) * 1.6;
    catDragDistanceRef.current += Math.abs(e.movementX);
    e.currentTarget.scrollLeft = catScrollLeft - walk;
  };

  const [countdown, setCountdown] = useState<{ h: number; m: number; s: number } | null>(null);

  const { isValide: isLivreurValide, loading: livreurStatutLoading } =
    useLivreurVerificationStatut(profile?.role === "livreur");

  const DASHBOARD_REDIRECTS: Record<string, string> = {
    vendeur: "/vendeur/dashboard",
    livreur: "/livreur/missions",
    admin: "/admin/dashboard",
  };
  const shouldRedirectToDashboard =
    !userLoading &&
    !!profile?.role &&
    !!DASHBOARD_REDIRECTS[profile.role] &&
    (profile.role !== "livreur" || (!livreurStatutLoading && isLivreurValide));

  useEffect(() => {
    if (shouldRedirectToDashboard && profile) {
      router.replace(DASHBOARD_REDIRECTS[profile.role]);
    }
  }, [shouldRedirectToDashboard, profile, router]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDataLoading(true);
      setDataError(null);
      try {
        const [articlesData, categoriesData, boutiquesData] = await Promise.all([
          getArticlesPublics({
            excludeVendeurId: profile?.role === "vendeur" ? profile.id : undefined,
          }),
          getCategoriesFormulaire({ activesUniquement: true, avecArticlesUniquement: true }),
          getBoutiquesPopulaires(),
        ]);
        if (cancelled) return;
        setArticles(articlesData);
        setCategories(categoriesData);
        setBoutiques(boutiquesData);
      } catch (err) {
        console.error("Erreur chargement page d'accueil:", err);
        if (!cancelled) setDataError("Impossible de charger le catalogue pour le moment.");
      } finally {
        if (!cancelled) setDataLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!user) {
      setFavoriteIds(new Set());
      return;
    }
    fetchFavoriteIds(supabase, user.id).then(setFavoriteIds);
  }, [supabase, user, articles.length]);

  const nextFlashEnd = useMemo(() => {
    const dates = articles
      .filter((a) => a.prix_promo != null && a.date_fin_promo)
      .map((a) => new Date(a.date_fin_promo as string).getTime())
      .filter((t) => t > Date.now());
    return dates.length > 0 ? Math.min(...dates) : null;
  }, [articles]);

  useEffect(() => {
    if (nextFlashEnd === null) {
      setCountdown(null);
      return;
    }
    const tick = () => {
      const diff = nextFlashEnd - Date.now();
      if (diff <= 0) {
        setCountdown({ h: 0, m: 0, s: 0 });
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ h, m, s });
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [nextFlashEnd]);

  const articlesMelanges = useMemo(() => melanger(articles), [articles]);

  const grandeCategorieActive = useMemo(
    () => categories.find(c => c.nom === activeTab) ?? null,
    [categories, activeTab]
  );

  const filteredProducts = activeTab === "Tout"
    ? articlesMelanges
    : grandeCategorieActive
      ? articlesMelanges.filter(a => {
          const nomsEnfants = new Set(grandeCategorieActive.sousCategories.map(s => s.nom));
          return a.categorie?.nom && nomsEnfants.has(a.categorie.nom);
        })
      : articlesMelanges.filter(a => a.categorie?.nom === activeTab);

  const productsToShow = filteredProducts.slice(0, visibleProductsCount);

  const produitsDuMoment = articles.slice(0, 4);

  const flashDealsProducts = articles
    .filter(
      (a) =>
        a.prix_promo != null &&
        a.date_fin_promo != null &&
        new Date(a.date_fin_promo).getTime() > Date.now()
    )
    .slice(0, 8);

  const handleAddToCart = (article: ArticlePublic) => {
    addItem({
      id: article.id,
      nom: article.nom,
      prix: prixAffiche(article),
      vendeur_id: article.vendeur_id,
      photos: article.photos,
    });
    showToast("Produit ajouté au panier", "success");
  };

  const handleToggleFavorite = async (productId: string) => {
    if (!user) {
      router.push('/connexion');
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

  if (userLoading || shouldRedirectToDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F1EFE8]">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans antialiased text-[#2C2C2A]">
      <Navbar />

      {/* --- HERO SECTION (100% Acheteur) --- */}
      <HeroSection />
      <DeliveryAssuranceBanner />

      {/* --- 1. BARRE DE CATÉGORIES (Sticky Pilules) --- */}
      {/* Mobile uniquement : sur desktop, le MegaMenu de la Navbar remplit déjà ce rôle
          (évite d'avoir deux barres de catégories qui font doublon). */}
      {!dataLoading && categories.length > 0 && (
        <section className="md:hidden border-b border-gray-100 bg-white sticky top-14 z-30 shadow-2xs">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-2.5">
            <div className="relative flex items-center gap-1.5">
              <div className="sticky left-0 z-20 shrink-0 bg-white pr-2 py-0.5 flex items-center gap-2">
                <button
                  onClick={() => {
                    setActiveTab("Tout");
                    setVisibleProductsCount(20);
                    document.getElementById('pour-vous')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                    activeTab === 'Tout'
                      ? 'bg-coral-500 text-white border-coral-500 shadow-md shadow-coral-500/20 scale-[1.02]'
                      : 'bg-gray-50 hover:bg-white text-gray-700 hover:text-coral-600 border-gray-200/70 hover:border-coral-300 shadow-2xs'
                  }`}
                >
                  <div className={`p-1 rounded-full flex items-center justify-center ${
                    activeTab === 'Tout' ? 'bg-white/25 text-white' : 'bg-white text-coral-500 shadow-xs group-hover:scale-110'
                  } transition-transform duration-200`}>
                    <Menu size={14} strokeWidth={2.2} />
                  </div>
                  <span>Tout</span>
                </button>
                <div className="h-6 w-[1.5px] bg-gray-300 shrink-0" />
              </div>

              <div
                id="cat-scroll"
                onMouseDown={handleCatMouseDown}
                onMouseLeave={handleCatMouseLeave}
                onMouseUp={handleCatMouseUp}
                onMouseMove={handleCatMouseMove}
                onWheel={(e) => {
                  if (Math.abs(e.deltaX) < Math.abs(e.deltaY)) {
                    e.currentTarget.scrollBy({ left: e.deltaY, behavior: 'auto' });
                  }
                }}
                className={`flex items-center gap-2.5 overflow-x-auto no-scrollbar snap-x py-1 w-full select-none ${
                  isDraggingCat ? 'cursor-grabbing' : 'cursor-grab'
                }`}
              >
                {categories.map((cat) => {
                  const Icon = resolveCategoryIcon(cat.icone);
                  const isSelected = activeTab === cat.nom;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => {
                        if (catDragDistanceRef.current > 10) return;
                        setActiveTab(cat.nom);
                        setVisibleProductsCount(20);
                        document.getElementById('pour-vous')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={`group flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all duration-200 shrink-0 snap-start border ${
                        isSelected
                          ? 'bg-coral-500 text-white border-coral-500 shadow-md shadow-coral-500/20 scale-[1.02]'
                          : 'bg-gray-50 hover:bg-white text-gray-700 hover:text-coral-600 border-gray-200/70 hover:border-coral-300 shadow-2xs'
                      }`}
                    >
                      <div className={`p-1 rounded-full flex items-center justify-center ${
                        isSelected ? 'bg-white/25 text-white' : 'bg-white text-coral-500 shadow-xs group-hover:scale-110'
                      } transition-transform duration-200`}>
                        <Icon size={14} strokeWidth={2.2} />
                      </div>
                      <span>{cat.nom}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </section>
      )}

      {dataLoading ? (
        <div className="pt-4">
          <HomeSkeleton />
        </div>
      ) : (
        <>
          {dataError && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-4">
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                {dataError}
              </div>
            </div>
          )}

          {/* BANDEAU CLIENT CONNECTÉ */}
          <AnimatePresence>
            {profile && profile.role === "client" && (
              <motion.section
                key="client-banner"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-6 pb-2 bg-white"
              >
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                  <div className="bg-[#F1EFE8] rounded-3xl p-5 md:p-6 border border-gray-200/60 flex flex-col md:flex-row items-center justify-between gap-4 shadow-2xs">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-coral-100 flex items-center justify-center overflow-hidden border-2 border-white shadow-xs shrink-0 relative">
                        {profile.avatar_url && (
                          <img 
                            src={profile.avatar_url} 
                            className="w-full h-full object-cover absolute inset-0" 
                            alt="" 
                            onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                          />
                        )}
                        <span className="text-coral-600 font-bold text-base">
                          {(profile.full_name || "A").charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <h2 className="text-base md:text-lg font-extrabold text-gray-900">Bienvenue, {profile.full_name || "l'ami"} !</h2>
                        <p className="text-xs text-gray-600 font-medium">Content de vous revoir sur Ayiba.</p>
                      </div>
                    </div>

                    <Link href="/profil">
                      <Button className="h-10 px-5 rounded-xl text-xs font-bold whitespace-nowrap bg-coral-500 hover:bg-coral-600">Mon Profil</Button>
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* --- 2. VENTES FLASH --- */}
          {flashDealsProducts.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-8 md:py-12 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 md:mb-8">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 tracking-tight">Ventes flash</h2>
                      <p className="text-gray-500 text-xs mt-0.5">Offres limitées proposées par nos boutiques créatrices</p>
                    </div>
                  </div>

                  {countdown && (
                    <div className="flex items-center gap-2 bg-coral-50/60 rounded-2xl px-3 md:px-4 py-2 border border-coral-100 shadow-2xs self-start sm:self-auto">
                      <span className="text-[10px] font-bold text-coral-800 uppercase tracking-widest hidden md:inline">Expire dans</span>
                      <div className="flex items-center gap-1 font-mono font-extrabold text-coral-600 text-xs md:text-sm">
                        <span className="bg-white px-2 py-1 rounded-md shadow-2xs">{String(countdown.h).padStart(2, '0')}</span>:
                        <span className="bg-white px-2 py-1 rounded-md shadow-2xs">{String(countdown.m).padStart(2, '0')}</span>:
                        <span className="bg-white px-2 py-1 rounded-md shadow-2xs">{String(countdown.s).padStart(2, '0')}</span>
                      </div>
                    </div>
                  )}
                </div>

                <motion.div
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                >
                  {flashDealsProducts.map((product, index) => (
                    <motion.div key={product.id} variants={gridItem}>
                      <ProductCardModern
                        priority={index < 4}
                        image={product.photos[0] || '/images/hero-illustration.png'}
                        category={product.categorie?.nom || 'Divers'}
                        name={product.nom}
                        rating={0}
                        reviewCount={0}
                        price={prixAffiche(product)}
                        oldPrice={ancienPrixAffiche(product)}
                        sellerName={product.vendeur?.nom_boutique || undefined}
                        location={product.vendeur?.quartier || product.vendeur?.commune || undefined}
                        stock={product.stock}
                        createdAt={product.created_at}
                        photosCount={product.photos.length}
                        onAddToCart={() => handleAddToCart(product)}
                        isFavorite={favoriteIds.has(product.id)}
                        onToggleFavorite={() => handleToggleFavorite(product.id)}
                        onClick={() => router.push(getProductUrl(product))}
                      />
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex justify-center mt-8">
                  <Link
                    href="/catalogue?promo=1"
                    className="inline-flex items-center gap-2 text-xs md:text-sm font-bold text-coral-600 hover:text-coral-700 transition-colors group"
                  >
                    <span>Voir toutes les pépites en promotion</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.section>
          )}

          {/* --- 3. POUR VOUS (Catalogue Éditorial) --- */}
          <motion.section
            id="pour-vous"
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="py-10 md:py-14 bg-[#F7F6F2] border-y border-gray-200/60"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-6 md:mb-8">
                <div>
                  <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 tracking-tight">Pour vous</h2>
                  <p className="text-gray-600 text-xs mt-0.5">Sélection d'articles des créateurs locaux</p>
                </div>

                <div className="flex items-center gap-4">
                  <Link href="/catalogue">
                    <Button variant="outline" className="h-9 px-4 text-xs font-bold rounded-xl border-gray-300 bg-white hover:bg-gray-50 shadow-2xs">
                      Voir tout le catalogue
                      <ArrowRight size={13} className="ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>

              {activeTab !== 'Tout' && (
                <div className="flex items-center gap-2 mb-6">
                  <span className="text-xs font-semibold text-gray-500">Filtré par :</span>
                  <button
                    onClick={() => { setActiveTab('Tout'); setVisibleProductsCount(20); }}
                    className="flex items-center gap-2 px-3 py-1 rounded-full bg-coral-50 text-coral-600 border border-coral-200 text-xs font-bold hover:bg-coral-100 transition-colors"
                  >
                    {activeTab} <span className="text-coral-400 ml-1">×</span>
                  </button>
                </div>
              )}

              {productsToShow.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <p className="font-semibold text-gray-700">Aucun produit pour le moment</p>
                  <p className="text-sm text-gray-400">De nouvelles créations arrivent bientôt.</p>
                </div>
              ) : (
                <motion.div
                  key={activeTab}
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6 min-h-[400px]"
                >
                  {productsToShow.map((product, index) => (
                    <motion.div key={product.id} variants={gridItem}>
                      <ProductCardModern
                        priority={index < 4}
                        image={product.photos[0] || '/images/hero-illustration.png'}
                        category={product.categorie?.nom || 'Divers'}
                        name={product.nom}
                        rating={0}
                        reviewCount={0}
                        price={prixAffiche(product)}
                        oldPrice={ancienPrixAffiche(product)}
                        sellerName={product.vendeur?.nom_boutique || undefined}
                        location={product.vendeur?.quartier || product.vendeur?.commune || undefined}
                        stock={product.stock}
                        createdAt={product.created_at}
                        photosCount={product.photos.length}
                        onAddToCart={() => handleAddToCart(product)}
                        isFavorite={favoriteIds.has(product.id)}
                        onToggleFavorite={() => handleToggleFavorite(product.id)}
                        onClick={() => router.push(getProductUrl(product))}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {filteredProducts.length > 0 && (
                <div className="mt-10 md:mt-16 text-center">
                  <Button
                    onClick={() => router.push(activeTab === "Tout" ? "/catalogue" : `/catalogue?categorie=${encodeURIComponent(activeTab)}`)}
                    variant="outline"
                    className="h-11 md:h-12 px-8 md:px-10 text-sm font-bold rounded-2xl border-gray-300 bg-white hover:bg-gray-50 shadow-2xs"
                  >
                    Explorer l'intégralité des créations
                  </Button>
                </div>
              )}
            </div>
          </motion.section>

          {/* --- 4. EXPLORER LES BOUTIQUES POPULAIRES --- */}
          {boutiques.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-8 md:py-12 bg-white border-b border-gray-100"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-lg md:text-2xl font-extrabold text-gray-900 tracking-tight">Explorer les boutiques</h2>
                    <p className="text-gray-500 text-xs mt-0.5">Découvrez les artisans et commerçants passionnés de votre ville</p>
                  </div>
                  <Link href="/boutiques" className="text-xs font-bold text-coral-600 hover:underline whitespace-nowrap ml-3">
                    Voir toutes les boutiques
                  </Link>
                </div>

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
                  {boutiques.map((store) => (
                    <div
                      key={store.id}
                      role="link"
                      tabIndex={0}
                      onClick={() => router.push(getBoutiqueUrl(store))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") router.push(getBoutiqueUrl(store));
                      }}
                      className="group flex flex-col shrink-0 w-60 md:w-68 p-5 bg-[#F1EFE8] rounded-3xl border border-gray-200/60 hover:border-coral-300 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300 cursor-pointer"
                    >
                      <div className="relative mb-4">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-xs transition-transform duration-300 group-hover:scale-105 bg-coral-50 flex items-center justify-center relative">
                          {store.logo && (
                            <img
                              src={store.logo}
                              alt={store.nom}
                              className="w-full h-full object-cover absolute inset-0 z-10"
                              onError={(e) => { (e.currentTarget as HTMLElement).style.display = 'none'; }}
                            />
                          )}
                          <span className="text-coral-600 font-extrabold text-xl">{store.nom.charAt(0).toUpperCase()}</span>
                        </div>
                      </div>
                      <h3 className="text-base font-extrabold text-gray-900 mb-1 group-hover:text-coral-600 transition-colors truncate">{store.nom}</h3>
                      {store.avisCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={12} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-gray-800">{store.note}</span>
                          <span className="text-[11px] text-gray-400">({store.avisCount})</span>
                        </div>
                      )}
                      {(store.quartier || store.commune) && (
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-gray-600 bg-white px-2 py-1 rounded-md border border-gray-200/70 w-fit mb-3">
                          <MapPin size={11} className="text-coral-500" />
                          {[store.quartier, store.commune].filter(Boolean).join(', ')}
                        </div>
                      )}
                      {store.description ? (
                        <p className="text-xs text-gray-600 line-clamp-2 mb-4 flex-1">{store.description}</p>
                      ) : (
                        <div className="flex-1 mb-4" />
                      )}
                      <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-200/60">
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-600 group-hover:gap-1.5 transition-all">
                          Visiter la boutique
                          <ArrowRight size={13} />
                        </span>
                        <button
                          onClick={(e) => handleContactBoutique(e, store)}
                          className="inline-flex items-center gap-1 text-xs font-bold text-gray-700 hover:text-coral-600 px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white transition-colors"
                        >
                          <MessageCircle size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          <Footer />
        </>
      )}

      {contactStore && user && (
        <ContactModal
          open={!!contactStore}
          onOpenChange={(v) => !v && setContactStore(null)}
          recipient={{ id: contactStore.id, nom: contactStore.nom, photo: contactStore.logo || undefined }}
          userId={user.id}
          messagesBasePath={profile?.role === "vendeur" ? "/vendeur/messages" : "/messages"}
        />
      )}
    </div>
  );
}
