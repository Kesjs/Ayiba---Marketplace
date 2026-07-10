"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  ShieldCheck, Lock, Key, Store, Bike, ArrowRight, BadgeCheck, 
  UserCheck, Wallet, Utensils, Shirt, Smartphone, Star, 
  CheckCircle2, ChevronRight, Search 
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ProductCard } from "@/components/ui/ProductCard";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { useRouter } from "next/navigation";
import { CATEGORIES, MOCK_PRODUCTS, MOCK_STORES } from "@/lib/mock-data";
import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { motion, AnimatePresence } from "framer-motion";
import { HomeSkeleton } from "@/components/ui/Skeleton";

export default function Home() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { addItem } = useCart();
  const { showToast } = useToast();
  const [products, setProducts] = useState<any[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState("Tout");
  const [visibleProductsCount, setVisibleProductsCount] = useState(8);

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => {
      setProducts(MOCK_PRODUCTS);
      setProductsLoading(false);
    }, 1200); // Un peu plus long pour voir le skeleton
    return () => clearTimeout(timer);
  }, []);

  const filteredProducts = activeTab === "Tout" 
    ? [...products].sort(() => Math.random() - 0.5)
    : products.filter(p => CATEGORIES.find(c => c.id === p.categorie)?.label === activeTab);

  const productsToShow = filteredProducts.slice(0, visibleProductsCount);
  const hasMoreProducts = visibleProductsCount < filteredProducts.length;

  const trendingProducts = [...products].sort((a, b) => b.rating - a.rating).slice(0, 4);

  const sectionVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id || "default",
      photos: product.photos
    });
    showToast("Produit ajouté au panier", "success");
  };

  const handleToggleFavorite = (productId: string) => {
    // TODO: Implement favorites logic
    showToast("Favori ajouté", "success");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans antialiased">
      <Navbar />

      {productsLoading ? (
        <div className="pt-20">
          <HomeSkeleton />
        </div>
      ) : (
        <>
          {/* --- ROLE BASED WIDGETS --- */}
      <AnimatePresence>
        {profile && (
          <motion.section 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="pt-24 pb-4 bg-white"
          >
            <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
              <div className="bg-gray-50 rounded-[32px] p-6 md:p-8 border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-coral-100 flex items-center justify-center overflow-hidden border-4 border-white shadow-sm">
                    <img src={`https://i.pravatar.cc/150?u=${profile.id}`} className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Bienvenue, {profile.full_name || "l'ami"} !</h2>
                    <p className="text-sm text-gray-500 font-medium">Content de vous revoir sur Ayiba.</p>
                  </div>
                </div>

                {profile.role === "client" && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Favoris</p>
                      <p className="text-xl font-bold text-gray-900">12</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Commandes</p>
                      <p className="text-xl font-bold text-gray-900">3</p>
                    </div>
                    <Link href="/profil">
                      <Button className="h-11 px-6 rounded-xl text-xs font-bold">Mon Profil</Button>
                    </Link>
                  </div>
                )}

                {profile.role === "vendeur" && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Ventes du jour</p>
                      <p className="text-xl font-bold text-teal-600">45 000 F</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Stock</p>
                      <p className="text-xl font-bold text-gray-900">24</p>
                    </div>
                    <Link href="/vendeur/dashboard">
                      <Button className="h-11 px-6 rounded-xl text-xs font-bold">Mon Dashboard</Button>
                    </Link>
                  </div>
                )}

                {profile.role === "livreur" && (
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gains</p>
                      <p className="text-xl font-bold text-amber-600">8 500 F</p>
                    </div>
                    <div className="w-px h-8 bg-gray-200" />
                    <div className="text-center">
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Missions</p>
                      <p className="text-xl font-bold text-gray-900">4</p>
                    </div>
                    <Link href="/livreur/missions">
                      <Button className="h-11 px-6 rounded-xl text-xs font-bold bg-teal-600 hover:bg-teal-700">Mes Missions</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* --- HERO SECTION --- */}
<section className="relative pt-10 pb-20 md:pt-16 md:pb-28 overflow-hidden">
  {/* Wave Background Decoration */}
  <div className="absolute top-0 right-0 w-2/3 h-[110%] -z-10 bg-gradient-to-bl from-coral-50/40 via-white to-transparent opacity-80" />
  <div className="absolute -top-24 -right-24 w-96 h-96 bg-teal-50/50 rounded-full blur-3xl -z-10" />

  {/* Illustration en background subtil - visible sur tous les écrans */}
  <div className="absolute inset-0 -z-0 flex items-center justify-center lg:justify-end pointer-events-none">
    <img
      src="/images/hero-illustration.png"
      alt=""
      className="w-full max-w-2xl lg:max-w-3xl h-auto object-contain opacity-[0.08] lg:opacity-[0.12]"
    />
  </div>

  <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
      {/* Contenu texte - pleine largeur puisque l'image est en fond */}
      <div className={`lg:col-span-12 xl:col-span-8 transition-all duration-1000 ${mounted ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
        <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-1.5 mb-8 shadow-sm">
          <BadgeCheck className="w-4 h-4 text-teal-600" />
          <span className="text-[10px] font-bold text-teal-800 uppercase tracking-widest leading-none">
            Achats 100% Sécurisés • Bénin
          </span>
        </div>

        <h1 className="text-[32px] md:text-[48px] lg:text-[56px] font-semibold text-gray-900 leading-[1.1] mb-6 tracking-tight text-center lg:text-left">
          Tout votre quartier, <br />
          <span className="text-coral-500">en toute confiance.</span>
        </h1>

        <p className="text-base md:text-lg text-gray-500 mb-10 max-w-xl leading-relaxed font-medium text-center lg:text-left mx-auto lg:ml-0">
          Achetez local, l'esprit tranquille. Votre argent est protégé jusqu'à ce que vous validiez la livraison.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-4 mb-12 justify-center lg:justify-start">
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
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-x-8 gap-y-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600 shadow-xs border border-teal-100/50">
              <Lock size={18} />
            </div>
            <p className="text-[13px] font-bold text-gray-700 whitespace-nowrap">Paiement Escrow</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shadow-xs border border-coral-100/50">
              <Key size={18} />
            </div>
            <p className="text-[13px] font-bold text-gray-700 whitespace-nowrap">Validation par OTP</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-xs border border-amber-100/50">
              <UserCheck size={18} />
            </div>
            <p className="text-[13px] font-bold text-gray-700 whitespace-nowrap">Acteurs Vérifiés</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>


      {/* --- 1. EXPLORER LES BOUTIQUES --- */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-12 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Explorer les boutiques</h2>
              <p className="text-gray-500 text-sm mt-1">Les meilleurs vendeurs de votre quartier</p>
            </div>
            <Link href="/boutiques" className="text-sm font-bold text-coral-500 hover:underline">
              Voir tout
            </Link>
          </div>

          <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
            {MOCK_STORES.map((store) => (
              <Link 
                key={store.id} 
                href={`/boutiques/${store.id}`}
                className="group shrink-0 w-64 p-5 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
              >
                <div className="relative mb-4">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                    <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                  </div>
                  {store.isVerified && (
                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm">
                      <CheckCircle2 size={18} className="text-teal-500 fill-teal-50" />
                    </div>
                  )}
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors">{store.nom}</h3>
                <div className="flex items-center gap-1.5 mb-3">
                  <Star size={14} className="fill-amber-400 text-amber-400" />
                  <span className="text-xs font-bold text-gray-700">{store.rating}</span>
                  <span className="text-xs text-gray-400">• {store.productCount} produits</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {store.categories.slice(0, 2).map((cat, i) => (
                    <span key={i} className="text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100">
                      {cat}
                    </span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- 2. DYNAMIC CATEGORIES & PRODUCTS --- */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-20 bg-gray-50/50 border-y border-gray-100"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Pour vous</h2>
              <p className="text-gray-500 text-sm mt-1">Sélectionnés avec soin selon vos envies</p>
            </div>
            
            <div className="flex items-center gap-4">
              <Link href="/catalogue">
                <Button variant="outline" className="h-10 px-5 text-xs font-bold rounded-xl border-gray-200 bg-white shadow-sm">
                  Voir toutes les catégories
                  <ArrowRight size={14} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-6 no-scrollbar mb-8">
            <button
              onClick={() => { setActiveTab("Tout"); setVisibleProductsCount(8); }}
              className={`shrink-0 px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                activeTab === "Tout"
                  ? 'bg-coral-50 text-coral-600 border-2 border-coral-200'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
              }`}
            >
              Tout
            </button>
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setActiveTab(cat.label); setVisibleProductsCount(8); }}
                className={`shrink-0 px-6 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeTab === cat.label
                    ? 'bg-coral-50 text-coral-600 border-2 border-coral-200'
                    : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-100'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8 min-h-[400px]">
            {productsToShow.map((product) => (
              <Link key={product.id} href={`/produits/${product.id}`} className="block transition-transform hover:-translate-y-1 duration-300">
                <ProductCardModern
                  image={product.photos[0]}
                  category={CATEGORIES.find(c => c.id === product.categorie)?.label || 'Divers'}
                  name={product.nom}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  price={product.prix}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                />
              </Link>
            ))}
          </div>

          {hasMoreProducts && (
            <div className="mt-16 text-center">
              <Button 
                onClick={() => setVisibleProductsCount(prev => prev + 8)}
                variant="outline" 
                className="h-12 px-10 text-sm font-bold rounded-2xl border-gray-200 bg-white hover:bg-gray-50 shadow-sm"
              >
                Voir plus de produits
              </Button>
            </div>
          )}
        </div>
      </motion.section>

      {/* --- 3. PRODUITS DU MOMENT --- */}
      <motion.section 
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
        className="py-24 bg-white"
      >
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Star size={24} />
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 tracking-tight">Produits du moment</h2>
            </div>
            <Link href="/catalogue?sort=popular" className="group flex items-center gap-2 text-sm font-bold text-gray-900 hover:text-coral-500 transition-colors">
              Découvrir la sélection
              <ChevronRight size={18} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {trendingProducts.map((product) => (
              <Link key={product.id} href={`/produits/${product.id}`} className="block transition-transform hover:-translate-y-1 duration-300">
                <ProductCardModern
                  image={product.photos[0]}
                  category={CATEGORIES.find(c => c.id === product.categorie)?.label || 'Divers'}
                  name={product.nom}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  price={product.prix}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                />
              </Link>
            ))}
          </div>
        </div>
      </motion.section>

      {/* --- 4. THE AYIBA ECOSYSTEM (TRUST) --- */}
      <section id="comment-ca-marche" className="py-24 bg-gray-50/50 text-gray-900 overflow-hidden relative border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-2xl md:text-4xl font-semibold mb-4 tracking-tight">Zéro risque, <span className="text-coral-500 underline decoration-coral-500/20 underline-offset-8">100% plaisir.</span></h2>
            <p className="text-gray-500 text-base md:text-lg leading-relaxed font-medium">
              Nous avons construit Ayiba pour éliminer les arnaques et garantir que chaque transaction se termine par un sourire.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-10 lg:gap-12">
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
              <div key={i} className="group flex flex-col items-center text-center p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300">
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 transition-transform duration-500 group-hover:scale-110 ${feature.color}`}>
                  <feature.icon size={28} strokeWidth={2} />
                </div>
                <h3 className="text-lg font-semibold mb-3 tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* --- 5. DUAL CTA SECTION --- */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="flex flex-col md:flex-row items-stretch gap-6">
            {/* Vendeur Section */}
            <div className="flex-1 bg-coral-50/50 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-coral-500 mb-6 shadow-xs border border-coral-100/50">
                <Store size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 tracking-tight">Ouvrez votre boutique.</h2>
              <p className="text-gray-500 text-sm mb-8 font-medium max-w-xs leading-relaxed">Vendez vos produits en toute sérénité. Ayiba gère la logistique et sécurise vos paiements.</p>
              <Link href="/devenir-vendeur" className="mt-auto">
                <Button className="h-11 px-6 text-sm font-bold rounded-xl shadow-lg shadow-coral-500/10">
                  Commencer à vendre
                </Button>
              </Link>
            </div>

            {/* Livreur Section */}
            <div className="flex-1 bg-teal-50/50 rounded-3xl p-8 md:p-10 flex flex-col items-center text-center group">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-teal-600 mb-6 shadow-xs border border-teal-100/50">
                <Bike size={24} />
              </div>
              <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-3 tracking-tight">Livrez et Gagnez.</h2>
              <p className="text-gray-500 text-sm mb-8 font-medium max-w-xs leading-relaxed">Devenez partenaire livreur. Gérez votre temps et encaissez vos gains instantanément via Mobile Money.</p>
              <Link href="/devenir-livreur" className="mt-auto">
                <Button className="h-11 px-6 text-sm font-bold rounded-xl bg-teal-600 hover:bg-teal-700 shadow-lg shadow-teal-500/10">
                  Devenir livreur
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

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
      `}</style>
    </div>
  );
}
