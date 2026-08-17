"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  ShieldCheck, QrCode, Store, Bike, ArrowRight,
  Wallet, Star, MapPin, Clock,
  ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { AuthModal } from "@/components/ui/AuthModal";
import { useRouter } from "next/navigation";
import { getArticlesPublics, getCategoriesActives, type ArticlePublic } from "@/lib/queries/articles";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { resolveCategoryIcon } from "@/lib/constants/category-icons";
import { useUser } from "@/lib/hooks/useUser";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { toggleFavorite, fetchFavoriteIds } from "@/lib/catalogue";
import { motion, AnimatePresence, Variants } from "framer-motion";
import { HomeSkeleton } from "@/components/ui/Skeleton";


// ============================================
// VARIANTS D'ANIMATION
// ============================================

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const gridStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 }
  }
};

const gridItem: Variants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] }
  }
};

const lightStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const lightItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

// Prix affiché / prix barré à partir d'un article réel : la promo, si elle
// existe, est le prix affiché ; le prix normal devient alors le prix barré
// (même logique que /catalogue et /(client)/accueil).
function prixAffiche(a: ArticlePublic) {
  return a.prix_promo ?? a.prix;
}
function ancienPrixAffiche(a: ArticlePublic) {
  return a.prix_promo ? a.prix : undefined;
}

// Mélange Fisher-Yates : utilisé pour que la grille catalogue de la home
// n'affiche pas systématiquement les mêmes articles en tête (ordre
// d'arrivée). "Produits du moment" et "Ventes flash" gardent volontairement
// l'ordre chronologique/promo d'origine, qui a un sens produit.
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
  const supabase = createClient();

  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [categories, setCategories] = useState<{ id: string; nom: string; slug: string; icone: string | null; couleur: string | null }[]>([]);
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState("Tout");
  const [visibleProductsCount, setVisibleProductsCount] = useState(8);

  // Countdown pour les ventes flash — basé sur la vraie date_fin_promo de
  // chaque article en promo (fixée par le vendeur), pas sur un cycle
  // artificiel. On affiche le temps restant avant la PROCHAINE expiration
  // parmi les articles actuellement en vente flash : c'est la date la plus
  // proche qui déclenchera un vrai changement visible dans la section
  // (l'article expiré redevient un prix normal, via le job serveur qui
  // nettoie prix_promo/date_fin_promo automatiquement).
  const [countdown, setCountdown] = useState<{ h: number; m: number; s: number } | null>(null);

  // Redirige automatiquement vendeur/livreur/admin vers leur dashboard —
  // la home publique ne sert qu'aux visiteurs (guest) et clients.
  // Le dashboard livreur (/livreur/missions) est verrouillé par
  // requireValidLivreur() tant que le KYC n'est pas validé : rediriger un
  // livreur en attente là-bas provoquait une boucle (missions → kyc → cet
  // effet relance vers missions...). On n'auto-redirige donc le livreur que
  // s'il est validé ; sinon il reste sur la home, comme demandé quand il
  // clique "Retour à l'accueil" depuis l'écran KYC.
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
          getCategoriesActives(),
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

  // Prochaine expiration parmi les articles actuellement en promo avec une
  // date_fin_promo (recalculé à chaque nouveau chargement d'articles).
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
        // La promo la plus proche vient d'expirer : le job serveur va la
        // nettoyer sous peu et le prochain chargement d'articles fera
        // disparaître ce produit de "Ventes flash" / recalculera la
        // prochaine échéance. On arrête juste le décompte ici.
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

  // Ordre aléatoire, recalculé seulement quand la liste d'articles change
  // (nouveau chargement) et non à chaque re-render — sinon les produits
  // sauteraient dans tous les sens à chaque clic (filtre, "voir plus"...).
  const articlesMelanges = useMemo(() => melanger(articles), [articles]);

  // Règle produit : ne jamais afficher une catégorie vide (sans aucun article
  // publié), que ce soit dans les onglets de filtre ou la grille "Catégories
  // populaires" — sinon on affiche une catégorie cliquable qui mène à un
  // état "Aucun produit pour le moment", ce qui est trompeur pour le client.
  const categoriesAvecProduits = useMemo(
    () => categories.filter((cat) => articles.some((a) => a.categorie?.slug === cat.slug)),
    [categories, articles]
  );

  const filteredProducts = activeTab === "Tout"
    ? articlesMelanges
    : articlesMelanges.filter(a => a.categorie?.nom === activeTab);

  const productsToShow = filteredProducts.slice(0, visibleProductsCount);
  const hasMoreProducts = visibleProductsCount < filteredProducts.length;

  // "Produits du moment" : les plus récemment publiés (l'ordre vient déjà
  // de la requête). Pas de note produit en base pour trier par popularité —
  // même décision que pour les cartes produit (reviewCount à 0 plutôt
  // qu'inventé).
  const produitsDuMoment = articles.slice(0, 4);

  // Ventes flash : uniquement les articles avec une vraie promo active EN
  // COURS (date_fin_promo non expirée). Le job serveur (cron, toutes les
  // 5 min) nettoie prix_promo/date_fin_promo une fois la date dépassée,
  // mais ce filtre côté client évite qu'un article expiré depuis quelques
  // secondes reste visible jusqu'au prochain passage du cron.
  // 8 = garantit au moins 2 lignes pleines sur desktop (grille 4 colonnes)
  // tout en restant cohérent avec le reste (mobile 2 colonnes → 4 lignes).
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

  // Écran de transition pendant la redirection (évite le flash de la home publique)
  if (userLoading || shouldRedirectToDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {dataLoading ? (
        <div className="pt-20">
          <HomeSkeleton />
        </div>
      ) : (
        <>
          {dataError && (
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 pt-24">
              <div className="rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                {dataError}
              </div>
            </div>
          )}

          {/* --- 1. CATÉGORIES + BANDE DE CONFIANCE ---
              Remplace l'ancien hero marketing (titre/sous-titre/2 CTA/
              illustration en filigrane). Une marketplace part du principe
              que le visiteur est déjà venu pour acheter : on va direct à
              l'essentiel (recherche dans la Navbar, catégories, catalogue)
              plutôt que de le faire lire une tagline avant d'agir — donc
              les catégories (contenu actionnable) passent avant la ligne de
              confiance (texte à lire), jamais l'inverse. */}
          {categoriesAvecProduits.length > 0 && (
            <section className="pt-6 pb-3 md:pt-8">
              <div className="max-w-7xl mx-auto pl-4 md:pl-8 lg:pl-12">
                <div className="flex gap-2.5 md:gap-3 overflow-x-auto pr-4 md:pr-8 lg:pr-12 no-scrollbar snap-x snap-mandatory">
                  {categoriesAvecProduits.map((cat) => {
                    const Icon = resolveCategoryIcon(cat.icone);
                    const couleur = cat.couleur || "#9CA3AF";
                    return (
                      <Link
                        key={cat.id}
                        href={`/catalogue?categorie=${cat.slug}`}
                        className="group flex items-center gap-2 shrink-0 snap-start pl-2 pr-4 py-2 rounded-full border border-gray-100 hover:border-coral-100 hover:shadow-sm transition-all duration-200 bg-white"
                      >
                        <span
                          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 group-hover:scale-110"
                          style={{ backgroundColor: `${couleur}1a`, color: couleur }}
                        >
                          <Icon size={16} />
                        </span>
                        <span className="text-[13px] font-bold text-gray-700 whitespace-nowrap">{cat.nom}</span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          {/* Bande de confiance : sous les catégories, en note discrète —
              utile tant qu'on est en phase de développement (peu de
              vendeurs/avis encore) pour rassurer sans jamais passer avant
              du contenu actionnable. */}
          <section className="pb-6 md:pb-8">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-4 gap-y-1 text-[10px] md:text-[11px] font-medium text-gray-400">
                <span className="flex items-center gap-1.5">
                  <Wallet size={12} className="text-amber-400" /> Paiement Escrow
                </span>
                <span className="flex items-center gap-1.5">
                  <QrCode size={12} className="text-coral-400" /> Code de livraison secret
                </span>
                <span className="flex items-center gap-1.5">
                  <ShieldCheck size={12} className="text-teal-500" /> Vendeurs vérifiés
                </span>
              </div>
            </div>
          </section>

          {/* --- 2. BANDEAU CLIENT CONNECTÉ / LIVREUR EN ATTENTE ---
              Vendeur (dashboard non verrouillé) et admin sont redirigés
              avant ce rendu (cf. plus haut). Le livreur n'est lui redirigé
              vers son dashboard que s'il est validé (cf. useLivreurVerificationStatut
              plus haut) — un livreur en attente atterrit donc ici et voit un
              rappel dédié plutôt que rien. On n'affiche plus de compteurs
              inventés (favoris/commandes) pour le client — afficher un faux
              chiffre à un utilisateur connecté sur ses propres données,
              c'est pire qu'un état vide. À réintroduire avec de vraies
              requêtes (favoris, commandes) séparément. */}
          <AnimatePresence>
            {profile && profile.role === "client" && (
              <motion.section
                key="client-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 pb-4 bg-white"
              >
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                  <div className="bg-gray-50 rounded-[28px] md:rounded-[32px] p-5 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-coral-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm shrink-0">
                        {profile.avatar_url ? (
                          <img src={profile.avatar_url} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <span className="text-coral-500 font-bold text-lg">
                            {(profile.full_name || "A").charAt(0).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Bienvenue, {profile.full_name || "l'ami"} !</h2>
                        <p className="text-xs md:text-sm text-gray-500 font-medium">Content de vous revoir sur Ayiba.</p>
                      </div>
                    </div>

                    <Link href="/profil">
                      <Button className="h-10 md:h-11 px-4 md:px-6 rounded-xl text-xs font-bold whitespace-nowrap">Mon Profil</Button>
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}

            {profile && profile.role === "livreur" && !livreurStatutLoading && !isLivreurValide && (
              <motion.section
                key="livreur-pending-banner"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="pt-4 pb-4 bg-white"
              >
                <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                  <div className="bg-gray-50 rounded-[28px] md:rounded-[32px] p-5 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-5 md:gap-6 shadow-sm">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 border-4 border-white shadow-sm shrink-0">
                        <Clock size={26} />
                      </div>
                      <div>
                        <h2 className="text-lg md:text-xl font-bold text-gray-900">Dossier en cours de vérification</h2>
                        <p className="text-xs md:text-sm text-gray-500 font-medium">Activation sous 24-48h. En attendant, découvre le catalogue.</p>
                      </div>
                    </div>

                    <Link href="/livreur/kyc">
                      <Button
                        variant="outline"
                        className="h-10 md:h-11 px-4 md:px-6 rounded-xl text-xs font-bold whitespace-nowrap"
                      >
                        Voir mon dossier
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.section>
            )}
          </AnimatePresence>

          {/* --- 3. FLASH DEALS --- */}
          {flashDealsProducts.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-12 md:py-16 bg-gradient-to-br from-coral-50/60 via-white to-amber-50/30"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6 mb-6 md:mb-8">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
                      <Zap size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Ventes flash</h2>
                      <p className="text-gray-500 text-xs md:text-sm mt-0.5 md:mt-1">Offres limitées, jusqu'à épuisement des stocks</p>
                    </div>
                  </div>

                  {countdown && (
                    <div className="flex items-center gap-2 bg-white rounded-2xl px-3 md:px-4 py-2 md:py-2.5 border border-coral-100 shadow-sm self-start sm:self-auto">
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">Se termine dans</span>
                      <div className="flex items-center gap-1 font-mono font-bold text-coral-600 text-xs md:text-sm">
                        <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.h).padStart(2, '0')}</span>:
                        <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.m).padStart(2, '0')}</span>:
                        <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.s).padStart(2, '0')}</span>
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
                  {flashDealsProducts.map((product) => (
                    <motion.div key={product.id} variants={gridItem}>
                      <div className="block">
                        <ProductCardModern
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
                          onClick={() => router.push(`/produits/${product.id}`)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>

                <div className="flex justify-center mt-6 md:mt-8">
                  <Link
                    href="/catalogue?promo=1"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-coral-600 hover:text-coral-700 transition-colors group"
                  >
                    Voir tous les produits en promo
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </div>
            </motion.section>
          )}

          {/* --- 4. POUR VOUS (produits + tabs) --- */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="py-14 md:py-20 bg-gray-50/50 border-y border-gray-100"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 md:gap-6 mb-8 md:mb-12">
                <div>
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Pour vous</h2>
                  <p className="text-gray-500 text-xs md:text-sm mt-1">Sélectionnés avec soin selon vos envies</p>
                </div>

                <div className="flex items-center gap-4">
                  <Link href="/catalogue">
                    <Button variant="outline" className="h-9 md:h-10 px-4 md:px-5 text-xs font-bold rounded-xl border-gray-200 bg-white shadow-sm">
                      Voir toutes les catégories
                      <ArrowRight size={14} className="ml-2" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Navigation Tabs */}
              <div className="flex gap-2 overflow-x-auto pb-4 md:pb-6 no-scrollbar mb-6 md:mb-8">
                <button
                  onClick={() => { setActiveTab("Tout"); setVisibleProductsCount(8); }}
                  className={`shrink-0 px-5 md:px-6 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                    activeTab === "Tout"
                      ? 'bg-coral-50 text-coral-600 border-2 border-coral-200'
                      : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                  }`}
                >
                  Tout
                </button>
                {categoriesAvecProduits.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => { setActiveTab(cat.nom); setVisibleProductsCount(8); }}
                    className={`shrink-0 px-5 md:px-6 py-2 md:py-2.5 rounded-2xl text-xs md:text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                      activeTab === cat.nom
                        ? 'bg-coral-50 text-coral-600 border-2 border-coral-200'
                        : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                    }`}
                  >
                    {cat.nom}
                  </button>
                ))}
              </div>

              {productsToShow.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
                  <p className="font-semibold text-gray-700">Aucun produit pour le moment</p>
                  <p className="text-sm text-gray-400">Revenez bientôt, de nouveaux articles arrivent régulièrement.</p>
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
                  {productsToShow.map((product) => (
                    <motion.div key={product.id} variants={gridItem}>
                      <div className="block">
                        <ProductCardModern
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
                          onClick={() => router.push(`/produits/${product.id}`)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {filteredProducts.length > 0 && (
                <div className="mt-10 md:mt-16 text-center">
                  <Button
                    onClick={() => router.push(activeTab === "Tout" ? "/catalogue" : `/catalogue?categorie=${encodeURIComponent(activeTab)}`)}
                    variant="outline"
                    className="h-11 md:h-12 px-8 md:px-10 text-sm font-bold rounded-2xl border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
                  >
                    Voir plus de produits
                  </Button>
                </div>
              )}
            </div>
          </motion.section>

          {/* --- 5. BOUTIQUES POPULAIRES --- */}
          {boutiques.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-10 md:py-12 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex items-center justify-between mb-6 md:mb-8">
                  <div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Explorer les boutiques</h2>
                    <p className="text-gray-500 text-xs md:text-sm mt-1">Les vendeurs actifs de votre quartier</p>
                  </div>
                  <Link href="/boutiques" className="text-xs md:text-sm font-bold text-coral-500 hover:underline whitespace-nowrap ml-3">
                    Voir tout
                  </Link>
                </div>

                <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 no-scrollbar">
                  {boutiques.map((store) => (
                    <Link
                      key={store.id}
                      href={`/boutiques/${store.id}`}
                      className="group shrink-0 w-56 md:w-64 p-4 md:p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
                    >
                      <div className="relative mb-3 md:mb-4">
                        <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 bg-coral-50 flex items-center justify-center">
                          {store.logo ? (
                            <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-coral-500 font-bold text-xl">{store.nom.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors truncate">{store.nom}</h3>
                      {store.avisCount > 0 && (
                        <div className="flex items-center gap-1 mb-2">
                          <Star size={11} className="fill-amber-400 text-amber-400" />
                          <span className="text-xs font-bold text-gray-700">{store.note}</span>
                          <span className="text-[11px] text-gray-400">({store.avisCount})</span>
                        </div>
                      )}
                      {(store.quartier || store.commune) && (
                        <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 w-fit">
                          <MapPin size={11} />
                          {[store.quartier, store.commune].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </motion.section>
          )}

          {/* --- 6. PRODUITS DU MOMENT --- */}
          {/* Caché tant que le catalogue est trop petit pour donner l'impression
              d'un vrai choix (seuil ~8 articles au total, décidé avec Ken) —
              avant ça, "Produits du moment" ne fait que répéter tout le catalogue. */}
          {articles.length >= 8 && produitsDuMoment.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-14 md:py-24 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="flex items-center justify-between mb-8 md:mb-12">
                  <div className="flex items-center gap-3 md:gap-4">
                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                      <Star size={22} />
                    </div>
                    <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight">Produits du moment</h2>
                  </div>
                  <Link href="/catalogue" className="hidden sm:flex group items-center gap-2 text-sm font-bold text-gray-900 hover:text-coral-500 transition-colors whitespace-nowrap">
                    Découvrir la sélection
                    <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>

                <motion.div
                  variants={gridStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6"
                >
                  {produitsDuMoment.map((product) => (
                    <motion.div key={product.id} variants={gridItem}>
                      <div className="block">
                        <ProductCardModern
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
                          onClick={() => router.push(`/produits/${product.id}`)}
                        />
                      </div>
                    </motion.div>
                  ))}
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* --- 7. DUAL CTA SECTION --- */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="py-14 md:py-20 bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="flex flex-col md:flex-row items-stretch gap-5 md:gap-6">
                <div className="flex-1 bg-coral-50/50 rounded-3xl p-7 md:p-10 flex flex-col items-center text-center group">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-coral-500 mb-5 md:mb-6 shadow-xs border border-coral-100/50">
                    <Store size={22} />
                  </div>
                  <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3 tracking-tight">Ouvrez votre boutique.</h2>
                  <p className="text-gray-500 text-sm mb-6 md:mb-8 font-medium max-w-xs leading-relaxed">Vendez vos produits en toute sérénité. Ayiba gère la logistique et sécurise vos paiements.</p>
                  <Link href="/devenir-vendeur" className="mt-auto">
                    <Button className="h-11 px-6 text-sm font-bold rounded-xl shadow-lg shadow-coral-500/10">
                      Commencer à vendre
                    </Button>
                  </Link>
                </div>

                <div className="flex-1 bg-teal-50/50 rounded-3xl p-7 md:p-10 flex flex-col items-center text-center group">
                  <div className="w-11 h-11 md:w-12 md:h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 mb-5 md:mb-6 shadow-xs border border-teal-100/50">
                    <Bike size={22} />
                  </div>
                  <h2 className="text-lg md:text-2xl font-semibold text-gray-900 mb-2 md:mb-3 tracking-tight">Livrez et Gagnez.</h2>
                  <p className="text-gray-500 text-sm mb-6 md:mb-8 font-medium max-w-xs leading-relaxed">Devenez partenaire livreur. Gérez votre temps et encaissez vos gains instantanément via Mobile Money.</p>
                  <Link href="/devenir-livreur" className="mt-auto">
                    <Button className="h-11 px-6 text-sm font-bold rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/10">
                      Devenir livreur
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.section>

          <Footer />
        </>
      )}

      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-15px); }
        }
        .animate-float-slow {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float 6s ease-in-out infinite 3s;
        }
        .animate-bounce-slow {
          animation: bounce-slow 5s ease-in-out infinite;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        @media (prefers-reduced-motion: reduce) {
          * {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </div>
  );
}
