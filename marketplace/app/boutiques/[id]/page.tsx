"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, MessageCircle, ArrowLeft, MapPin } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/ui/AuthModal";
import { getBoutiqueParId, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { getArticlesPublics, type ArticlePublic } from "@/lib/queries/articles";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/lib/hooks/useUser";

function prixAffiche(a: ArticlePublic) {
  return a.prix_promo ?? a.prix;
}
function ancienPrixAffiche(a: ArticlePublic) {
  return a.prix_promo ? a.prix : undefined;
}

export default function BoutiqueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const boutiqueId = params.id as string;
  const { addItem } = useCart();
  const { showToast } = useToast();
  const { user } = useUser();

  const [store, setStore] = useState<BoutiquePublique | null>(null);
  const [storeProducts, setStoreProducts] = useState<ArticlePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);

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

  const handleAddToCart = (product: ArticlePublic) => {
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
    router.push(`/messages?vendeur=${store.id}`);
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

        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 md:p-8 mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-4 border-white shadow-sm bg-coral-50 flex items-center justify-center">
              {store.logo ? (
                <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
              ) : (
                <span className="text-coral-500 font-bold text-2xl">{store.nom.charAt(0).toUpperCase()}</span>
              )}
            </div>
            {store.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <CheckCircle2 size={20} className="text-teal-500 fill-teal-50" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{store.nom}</h1>
            <div className="flex items-center gap-2 mb-3 text-sm text-gray-400">
              <span className="font-bold text-gray-700">{store.productCount}</span>
              <span>produit{store.productCount > 1 ? "s" : ""}</span>
            </div>
            {(store.quartier || store.commune) && (
              <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1.5 rounded-md border border-gray-100 w-fit">
                <MapPin size={11} />
                {[store.quartier, store.commune].filter(Boolean).join(", ")}
              </div>
            )}
          </div>

          <Button variant="outline" onClick={handleContact} className="shrink-0">
            <MessageCircle size={16} className="mr-2" />
            Contacter
          </Button>
        </div>

        <h2 className="text-lg md:text-xl font-bold text-gray-900 mb-5 md:mb-6">
          Produits ({storeProducts.length})
        </h2>

        {storeProducts.length === 0 ? (
          <p className="text-gray-400 text-sm py-10 text-center">
            Cette boutique n'a pas encore de produits en ligne.
          </p>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {storeProducts.map((product) => (
              <Link key={product.id} href={`/produits/${product.id}`} className="block">
                <ProductCardModern
                  image={product.photos[0] || "/images/hero-illustration.png"}
                  category={product.categorie?.nom || "Divers"}
                  name={product.nom}
                  rating={0}
                  reviewCount={0}
                  price={prixAffiche(product)}
                  oldPrice={ancienPrixAffiche(product)}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => showToast("Favori ajouté", "success")}
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </div>
  );
}
