"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { Star, CheckCircle2, MessageCircle, ArrowLeft } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { ProductCardModern } from "@/components/ui/ProductCardVariants";
import { Button } from "@/components/ui/Button";
import { MOCK_STORES, MOCK_PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/context/ToastContext";

export default function BoutiqueDetailPage() {
  const params = useParams();
  const { addItem } = useCart();
  const { showToast } = useToast();

  const store = MOCK_STORES.find((s) => s.id === params.id);
  const storeProducts = MOCK_PRODUCTS.filter((p) => p.vendeur_id === params.id);

  if (!store) {
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

  const handleAddToCart = (product: any) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id || store.id,
      photos: product.photos,
    });
    showToast("Produit ajouté au panier", "success");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-6 md:py-10">
        <Link href="/boutiques" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-6">
          <ArrowLeft size={16} />
          Toutes les boutiques
        </Link>

        {/* Header boutique */}
        <div className="bg-gray-50/50 rounded-3xl border border-gray-100 p-6 md:p-8 mb-8 md:mb-10 flex flex-col md:flex-row md:items-center gap-5 md:gap-6">
          <div className="relative shrink-0">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl overflow-hidden border-4 border-white shadow-sm">
              <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
            </div>
            {store.isVerified && (
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm">
                <CheckCircle2 size={20} className="text-teal-500 fill-teal-50" />
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">{store.nom}</h1>
            <div className="flex items-center gap-2 mb-3">
              <Star size={16} className="fill-amber-400 text-amber-400" />
              <span className="text-sm font-bold text-gray-700">{store.rating}</span>
              <span className="text-sm text-gray-400">• {store.productCount} produits</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {store.categories.map((cat, i) => (
                <span
                  key={i}
                  className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-white px-2.5 py-1.5 rounded-md border border-gray-100"
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>

          <Button variant="outline" className="shrink-0">
            <MessageCircle size={16} className="mr-2" />
            Contacter
          </Button>
        </div>

        {/* Produits de la boutique */}
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
                  image={product.photos[0]}
                  category={CATEGORIES.find((c) => c.id === product.categorie)?.label || "Divers"}
                  name={product.nom}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  price={product.prix}
                  oldPrice={product.ancien_prix ?? undefined}
                  onAddToCart={() => handleAddToCart(product)}
                  onToggleFavorite={() => showToast("Favori ajouté", "success")}
                />
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
