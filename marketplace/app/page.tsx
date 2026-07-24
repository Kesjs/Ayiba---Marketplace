"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck, Lock, Key, Store, Bike, ArrowRight, BadgeCheck,
  UserCheck, Wallet, Star, MapPin, Clock,
  CheckCircle2, ChevronRight, Search, Zap
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { AuthModal } from "@/components/ui/AuthModal";
import { useRouter } from "next/navigation";
import { getArticlesPublics, getCategoriesActives, type ArticlePublic } from "@/lib/queries/articles";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { getCategoryStyle } from "@/lib/constants/category-styles";
import { useUser } from "@/lib/hooks/useUser";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { toggleFavorite, fetchFavoriteIds } from "@/lib/catalogue";
import { motion, AnimatePresence, useScroll, useTransform, Variants } from "framer-motion";
import { HomeSkeleton } from "@/components/ui/Skeleton";




// Témoignages (à remplacer plus tard par de vrais avis en base — pas de
// système d'avis clients existant aujourd'hui, décision à prendre séparément
// comme pour les notes produits/boutiques)
const TESTIMONIALS = [
  {
    name: "Fabrice A.",
    role: "Client à Cotonou",
    rating: 5,
    text: "J'ai enfin confiance pour commander en ligne. L'argent reste bloqué jusqu'à ce que je reçoive mon colis, zéro stress.",
    avatar: "https://i.pravatar.cc/150?u=testimonial-1",
  },
  {
    name: "Rachidatou B.",
    role: "Vendeuse — Boutique Chic",
    rating: 5,
    text: "Depuis que je suis sur Ayiba, mes ventes ont doublé. La livraison est gérée automatiquement, je me concentre sur mes produits.",
    avatar: "https://i.pravatar.cc/150?u=testimonial-2",
  },
  {
    name: "Idriss K.",
    role: "Livreur partenaire",
    rating: 5,
    text: "Le code OTP évite les malentendus à la livraison et je suis payé directement sur Mobile Money. Simple et rapide.",
    avatar: "https://i.pravatar.cc/150?u=testimonial-3",
  },
];

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

const heroContainer: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.1 }
  }
};

const heroItem: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
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

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const supabase = createClient();

  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [categories, setCategories] = useState<{ id: string; nom: string; slug: string }[]>([]);
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Tout");
  const [visibleProductsCount, setVisibleProductsCount] = useState(8);

  // Countdown pour les ventes flash — la fenêtre de 3h est un choix produit
  // indépendant des données ; à faire évoluer séparément si un vrai système
  // de promos programmées est décidé.
  const [flashEndTime, setFlashEndTime] = useState<number>(() => Date.now() + 1000 * 60 * 60 * 3);
  const [countdown, setCountdown] = useState({ h: 3, m: 0, s: 0 });

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: heroScrollProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const illustrationY = useTransform(heroScrollProgress, [0, 1], [0, 100]);
  const illustrationOpacity = useTransform(heroScrollProgress, [0, 1], [1, 0.4]);

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
    setMounted(true);
    let cancelled = false;
    async function load() {
      setDataLoading(true);
      setDataError(null);
      try {
        const [articlesData, categoriesData, boutiquesData] = await Promise.all([
          getArticlesPublics(),
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

  useEffect(() => {
    const interval = setInterval(() => {
      const diff = flashEndTime - Date.now();
      if (diff <= 0) {
        setFlashEndTime(Date.now() + 1000 * 60 * 60 * 3);
        return;
      }
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown({ h, m, s });
    }, 1000);
    return () => clearInterval(interval);
  }, [flashEndTime]);

  const filteredProducts = activeTab === "Tout"
    ? articles
    : articles.filter(a => a.categorie?.nom === activeTab);

  const productsToShow = filteredProducts.slice(0, visibleProductsCount);
  const hasMoreProducts = visibleProductsCount < filteredProducts.length;

  // "Produits du moment" : les plus récemment publiés (l'ordre vient déjà
  // de la requête). Pas de note produit en base pour trier par popularité —
  // même décision que pour les cartes produit (reviewCount à 0 plutôt
  // qu'inventé).
  const produitsDuMoment = articles.slice(0, 4);

  // Ventes flash : uniquement les articles avec une vraie promo en base.
  const flashDealsProducts = articles.filter(a => a.prix_promo != null).slice(0, 4);

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

          {/* --- 1. HERO SECTION --- */}
          <section ref={heroRef} className="relative pt-10 pb-16 md:pt-16 md:pb-28 overflow-hidden">
            {/* Wave Background Decoration */}
            <div className="absolute top-0 right-0 w-2/3 h-[110%] -z-10 bg-gradient-to-bl from-coral-50/40 via-white to-transparent opacity-80" />
            <div className="absolute -top-24 -right-24 w-72 h-72 md:w-96 md:h-96 bg-teal-50/50 rounded-full blur-3xl -z-10" />

            <motion.div
              style={{ y: illustrationY, opacity: illustrationOpacity }}
              className="absolute inset-0 -z-0 flex items-center justify-center lg:justify-end pointer-events-none"
            >
              <img
                src="/images/hero-illustration.png"
                alt=""
                className="w-full max-w-xl md:max-w-2xl lg:max-w-3xl h-auto object-contain opacity-[0.18] lg:opacity-[0.22]"
              />
            </motion.div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <motion.div
                  variants={heroContainer}
                  initial="hidden"
                  animate={mounted ? "visible" : "hidden"}
                  className="lg:col-span-12 xl:col-span-8"
                >
                  <motion.div variants={heroItem} className="flex justify-center lg:justify-start">
                    <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 mb-6 md:mb-8 shadow-sm">
                      <BadgeCheck className="w-4 h-4 text-teal-600" />
                      <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest leading-none">
                        100% Garanti • Bénin
                      </span>
                    </div>
                  </motion.div>

                  <motion.h1
                    variants={heroItem}
                    className="text-[26px] md:text-[42px] lg:text-[56px] font-semibold text-gray-900 leading-[1.15] mb-5 md:mb-6 tracking-tight text-center lg:text-left"
                  >
                    La marketplace béninoise <br className="hidden sm:block" />
                    qui livre en toute confiance
                  </motion.h1>

                  <motion.p
                    variants={heroItem}
                    className="text-base md:text-lg text-gray-500 mb-8 md:mb-10 max-w-xl leading-relaxed font-medium text-center lg:text-left mx-auto lg:ml-0"
                  >
                    Trouvez des milliers de produits près de chez vous. Votre argent est bloqué en sécurité jusqu'à ce que vous validiez la réception.
                  </motion.p>

                  <motion.div
                    variants={heroItem}
                    className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-10 md:mb-12 justify-center lg:justify-start"
                  >
                    <Link href="/catalogue" className="w-full sm:w-auto">
                      <Button className="h-12 px-8 text-base font-bold rounded-xl shadow-xl shadow-coral-500/20 w-full">
                        Parcourir le catalogue
                      </Button>
                    </Link>
                    <Link href="/#comment-ca-marche" className="w-full sm:w-auto">
                      <Button variant="outline" className="h-12 px-8 text-base font-bold rounded-xl border-2 w-full">
                        Comment ça marche ?
                      </Button>
                    </Link>
                  </motion.div>

                  <motion.div
                    variants={heroItem}
                    className="grid grid-cols-3 gap-2 sm:gap-3 max-w-md mx-auto lg:mx-0 lg:max-w-none lg:flex lg:gap-8"
                  >
                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3 text-center lg:text-left">
                      <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-xs border border-teal-100/50 shrink-0">
                        <Lock size={18} />
                      </div>
                      <p className="text-[11px] lg:text-[13px] font-bold text-gray-700 leading-tight">Paiement Escrow</p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3 text-center lg:text-left">
                      <div className="w-9 h-9 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shadow-xs border border-coral-100/50 shrink-0">
                        <Key size={18} />
                      </div>
                      <p className="text-[11px] lg:text-[13px] font-bold text-gray-700 leading-tight">Validation par OTP</p>
                    </div>
                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-2 lg:gap-3 text-center lg:text-left">
                      <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-xs border border-amber-100/50 shrink-0">
                        <UserCheck size={18} />
                      </div>
                      <p className="text-[11px] lg:text-[13px] font-bold text-gray-700 leading-tight">Acteurs Vérifiés</p>
                    </div>
                  </motion.div>
                </motion.div>
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

                  <div className="flex items-center gap-2 bg-white rounded-2xl px-3 md:px-4 py-2 md:py-2.5 border border-coral-100 shadow-sm self-start sm:self-auto">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest hidden md:inline">Se termine dans</span>
                    <div className="flex items-center gap-1 font-mono font-bold text-coral-600 text-xs md:text-sm">
                      <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.h).padStart(2, '0')}</span>:
                      <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.m).padStart(2, '0')}</span>:
                      <span className="bg-coral-50 px-1.5 md:px-2 py-1 rounded-lg">{String(countdown.s).padStart(2, '0')}</span>
                    </div>
                  </div>
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
                {categories.map((cat) => (
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

              {hasMoreProducts && (
                <div className="mt-10 md:mt-16 text-center">
                  <Button
                    onClick={() => setVisibleProductsCount(prev => prev + 8)}
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
                        {store.isVerified && (
                          <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                            <CheckCircle2 size={18} className="text-teal-500 fill-teal-50" />
                          </div>
                        )}
                      </div>
                      <h3 className="text-base md:text-lg font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors truncate">{store.nom}</h3>
                      <div className="flex items-center gap-1.5 mb-3 text-xs text-gray-400">
                        <span className="font-bold text-gray-700">{store.productCount}</span>
                        <span>produit{store.productCount > 1 ? 's' : ''}</span>
                      </div>
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
          {produitsDuMoment.length > 0 && (
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

          {/* --- 7. COMMENT ÇA MARCHE (Zéro risque) --- */}
          <section id="comment-ca-marche" className="py-14 md:py-24 bg-gray-50/50 text-gray-900 overflow-hidden relative border-y border-gray-100">
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
              <motion.div
                variants={sectionVariants}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
              >
                <h2 className="text-2xl md:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">Zéro risque, <span className="text-coral-500 underline decoration-coral-500/20 underline-offset-8">100% plaisir.</span></h2>
                <p className="text-gray-500 text-sm md:text-lg leading-relaxed font-medium">
                  Nous avons construit Ayiba pour éliminer les arnaques et garantir que chaque transaction se termine par un sourire.
                </p>
              </motion.div>

              <motion.div
                variants={lightStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12"
              >
                {[
                  {
                    icon: Wallet,
                    title: "Paiement en Escrow",
                    desc: "Ayiba bloque votre argent en toute sécurité. Le vendeur n'est payé que 24h après votre confirmation de réception.",
                    color: "text-amber-500",
                    bg: "bg-amber-50"
                  },
                  {
                    icon: Key,
                    title: "Validation par OTP",
                    desc: "Zéro triche sur la livraison. Vous communiquez votre code secret au livreur seulement quand il est devant vous.",
                    color: "text-coral-500",
                    bg: "bg-coral-50"
                  },
                  {
                    icon: ShieldCheck,
                    title: "Acteurs Vérifiés",
                    desc: "Chaque vendeur et livreur passe par une validation manuelle d'identité. Pas de faux profils sur Ayiba.",
                    color: "text-teal-500",
                    bg: "bg-teal-50"
                  }
                ].map((feature, i) => (
                  <motion.div
                    key={i}
                    variants={lightItem}
                    className="group flex flex-col items-center text-center p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 md:mb-6 transition-transform duration-500 group-hover:scale-110 ${feature.color}`}>
                      <feature.icon size={26} strokeWidth={2} />
                    </div>
                    <h3 className="text-base md:text-lg font-semibold mb-2 md:mb-3 tracking-tight">{feature.title}</h3>
                    <p className="text-gray-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* --- 8. CATÉGORIES POPULAIRES --- */}
          {categories.length > 0 && (
            <motion.section
              variants={sectionVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              className="py-14 md:py-24 bg-white"
            >
              <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
                <div className="text-center max-w-2xl mx-auto mb-8 md:mb-14">
                  <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2 md:mb-3">Catégories populaires</h2>
                  <p className="text-gray-500 text-xs md:text-base">Naviguez directement vers ce que vous cherchez</p>
                </div>

                <motion.div
                  variants={lightStagger}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, margin: "-80px" }}
                  className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-6"
                >
                  {categories.map((cat) => {
                    const style = getCategoryStyle(cat.nom);
                    const count = articles.filter(a => a.categorie?.slug === cat.slug).length;
                    return (
                      <motion.div key={cat.id} variants={lightItem}>
                        <Link
                          href={`/catalogue?categorie=${cat.slug}`}
                          className="group flex flex-col items-center text-center p-4 md:p-6 rounded-3xl border border-gray-100 hover:border-coral-100 hover:shadow-lg transition-all duration-300"
                        >
                          <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl ${style.color} flex items-center justify-center mb-3 md:mb-4 transition-transform duration-300 group-hover:scale-110 shadow-sm`}>
                            <style.icon size={22} />
                          </div>
                          <h3 className="text-xs md:text-sm font-bold text-gray-900 mb-0.5 md:mb-1">{cat.nom}</h3>
                          <p className="text-[10px] md:text-xs text-gray-400 font-medium">{count} produit{count > 1 ? 's' : ''}</p>
                        </Link>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.section>
          )}

          {/* --- 9. TÉMOIGNAGES --- */}
          <motion.section
            variants={sectionVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            className="py-14 md:py-24 bg-gray-50/50 border-y border-gray-100"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-14">
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-tight mb-2 md:mb-3">Ils nous font confiance</h2>
                <p className="text-gray-500 text-xs md:text-base">Ce que disent nos clients, vendeurs et livreurs</p>
              </div>

              <motion.div
                variants={lightStagger}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-80px" }}
                className="grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-8"
              >
                {TESTIMONIALS.map((t, i) => (
                  <motion.div
                    key={i}
                    variants={lightItem}
                    className="bg-white rounded-3xl p-6 md:p-8 border border-gray-100 shadow-sm flex flex-col"
                  >
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Star
                          key={s}
                          size={14}
                          className={s < t.rating ? "fill-amber-400 text-amber-400" : "fill-gray-100 text-gray-100"}
                        />
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm leading-relaxed font-medium mb-6 flex-1">"{t.text}"</p>
                    <div className="flex items-center gap-3">
                      <img src={t.avatar} alt={t.name} className="w-10 h-10 md:w-11 md:h-11 rounded-xl object-cover border-2 border-white shadow-sm shrink-0" />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-bold text-gray-900">{t.name}</p>
                          <CheckCircle2 size={13} className="text-teal-500 fill-teal-50" />
                        </div>
                        <p className="text-xs text-gray-400 font-medium">{t.role}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.section>

          {/* --- 10. DUAL CTA SECTION --- */}
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
