'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Heart, Star, ShoppingBag, MessageCircle, Share2, 
  ChevronLeft, ChevronRight, Minus, Plus, 
  Wallet, Key, ShieldCheck, MapPin, Truck, ChevronUp,
  CheckCircle2
} from 'lucide-react'
import { MOCK_PRODUCTS, MOCK_STORES, CATEGORIES } from '@/lib/mock-data'
import { ScrollToTop } from '@/components/ui/ScrollToTop'

interface Product {
  id: string
  nom: string
  description: string
  prix: number
  ancien_prix: number | null
  categorie: string
  categorieId: string
  photos: string[]
  rating: number
  reviewCount: number
  vendeur: {
    id: string
    full_name: string
    avatar_url: string | null
    note_moyenne: number
    productCount: number
    isVerified: boolean
  }
  distanceKm: number
  is_favorite: boolean
}

const MOCK_REVIEWS = [
  {
    name: "Chimène A.",
    rating: 5,
    date: "Il y a 2 semaines",
    text: "Produit conforme à la description, livraison rapide. Je recommande sans hésiter.",
    avatar: "https://i.pravatar.cc/150?u=review-1",
  },
  {
    name: "Yssouf D.",
    rating: 4,
    date: "Il y a 1 mois",
    text: "Bonne qualité pour le prix. Léger délai à la livraison mais rien de grave, le vendeur a bien communiqué.",
    avatar: "https://i.pravatar.cc/150?u=review-2",
  },
  {
    name: "Aïcha M.",
    rating: 5,
    date: "Il y a 2 mois",
    text: "Exactement ce que j'attendais. Le paiement sécurisé m'a rassurée pour ma première commande sur Ayiba.",
    avatar: "https://i.pravatar.cc/150?u=review-3",
  },
]

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { addItem } = useCart()
  const { user } = useUser()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)

  useEffect(() => {
    fetchProduct()
    setCurrentImageIndex(0)
    setQuantity(1)
    window.scrollTo(0, 0)
  }, [params.id])

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchProduct = () => {
    setLoading(true)
    try {
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === params.id)

      if (!mockProduct) {
        throw new Error('Product not found')
      }

      const store = MOCK_STORES.find(s => s.id === mockProduct.vendeur_id)
      const categoryLabel = CATEGORIES.find(c => c.id === mockProduct.categorie)?.label || 'Divers'

      const pseudoDistance = (mockProduct.id.charCodeAt(0) % 12) + 1

      setProduct({
        id: mockProduct.id,
        nom: mockProduct.nom,
        description: mockProduct.description || "Produit de qualité disponible sur Ayiba.",
        prix: mockProduct.prix,
        ancien_prix: mockProduct.ancien_prix ?? null,
        categorie: categoryLabel,
        categorieId: mockProduct.categorie,
        photos: mockProduct.photos,
        rating: mockProduct.rating,
        reviewCount: mockProduct.reviewCount,
        vendeur: {
          id: mockProduct.vendeur_id || "default",
          full_name: store?.nom || "Boutique Ayiba",
          avatar_url: store?.logo || null,
          note_moyenne: store?.rating || 4.5,
          productCount: store?.productCount || 0,
          isVerified: store?.isVerified ?? false,
        },
        distanceKm: pseudoDistance,
        is_favorite: false
      })
    } catch (error) {
      console.error('Error fetching product:', error)
      showToast('Produit non trouvé', 'error')
      router.push('/catalogue')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        nom: product.nom,
        prix: product.prix,
        vendeur_id: product.vendeur.id,
        photos: product.photos
      })
    }
    setJustAdded(true)
    showToast(`${quantity} article(s) ajouté(s) au panier`, 'success')
    setTimeout(() => setJustAdded(false), 1500)
  }

  const handleBuyNow = () => {
    if (!product) return
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        nom: product.nom,
        prix: product.prix,
        vendeur_id: product.vendeur.id,
        photos: product.photos
      })
    }
    router.push('/checkout')
  }

  const handleToggleFavorite = () => {
    if (!product) return
    if (!user) {
      showToast('Connectez-vous pour ajouter aux favoris', 'warning')
      router.push('/auth/inscription')
      return
    }
    setProduct({ ...product, is_favorite: !product.is_favorite })
    showToast(product.is_favorite ? 'Retiré des favoris' : 'Ajouté aux favoris', 'success')
  }

  const handleContactSeller = () => {
    if (!product) return
    if (!user) {
      showToast('Connectez-vous pour contacter le vendeur', 'warning')
      router.push('/auth/inscription')
      return
    }
    showToast('Conversation avec le vendeur (mock)', 'info')
  }

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: product?.nom,
        text: product?.description,
        url: window.location.href
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      showToast('Lien copié', 'success')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-gray-100 rounded-2xl h-96 animate-pulse" />
            <div className="space-y-4">
              <div className="bg-gray-100 h-8 rounded animate-pulse" />
              <div className="bg-gray-100 h-6 w-1/2 rounded animate-pulse" />
              <div className="bg-gray-100 h-24 rounded animate-pulse" />
              <div className="bg-gray-100 h-16 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!product) return null

  const discount = product.ancien_prix
    ? Math.round(((product.ancien_prix - product.prix) / product.ancien_prix) * 100)
    : null

  const totalPrice = product.prix * quantity

  const specs = [
    { label: "Catégorie", value: product.categorie },
    { label: "Vendu par", value: product.vendeur.full_name },
    { label: "État", value: "Neuf" },
    { label: "Livraison estimée", value: "24 à 48h" },
  ]

  const similarProducts = MOCK_PRODUCTS
    .filter(p => p.categorie === product.categorieId && p.id !== product.id)
    .slice(0, 4)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-6 md:py-8 pb-28 md:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 md:mb-6">
          <button onClick={() => router.back()} className="hover:text-gray-900 flex items-center gap-1">
            <ChevronLeft size={16} />
            Retour
          </button>
          <span>/</span>
          <span className="text-gray-900 truncate">{product.nom}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square">
              {product.photos.length > 0 ? (
                <img
                  src={product.photos[currentImageIndex]}
                  alt={product.nom}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-gray-300">
                    <Share2 size={64} />
                  </div>
                </div>
              )}

              {product.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.photos.length) % product.photos.length)}
                    className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.photos.length)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                  >
                    <ChevronRight size={20} />
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {product.photos.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${
                          i === currentImageIndex ? 'bg-gray-900' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}

              {discount && (
                <div className="absolute top-4 left-4 bg-coral-500 text-white rounded-lg px-3 py-1 text-sm font-bold">
                  -{discount}%
                </div>
              )}

              <div className="absolute top-4 right-4 flex gap-2">
                <button
                  onClick={handleToggleFavorite}
                  className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                >
                  <Heart 
                    size={20} 
                    className={product.is_favorite ? 'fill-coral-500 text-coral-500' : 'text-gray-600'} 
                  />
                </button>
                <button
                  onClick={handleShare}
                  className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg"
                >
                  <Share2 size={20} className="text-gray-600" />
                </button>
              </div>
            </div>

            {product.photos.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                {product.photos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === currentImageIndex ? 'border-coral-500' : 'border-transparent'
                    }`}
                  >
                    <img src={photo} alt={`${product.nom} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {/* Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-5 md:space-y-6"
          >
            <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">
              {product.categorie}
            </span>

            <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight -mt-2">
              {product.nom}
            </h1>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl md:text-3xl font-black text-gray-900">
                {product.prix.toLocaleString('fr-FR')} <span className="text-base font-bold">FCFA</span>
              </span>
              {product.ancien_prix && (
                <span className="text-base md:text-lg text-gray-400 line-through font-medium">
                  {product.ancien_prix.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">{product.rating.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500">({product.reviewCount} avis)</span>
            </div>

            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex flex-col gap-2">
              <div className="flex items-center gap-2 text-sm">
                <MapPin size={16} className="text-teal-600 shrink-0" />
                <span className="text-gray-700 font-medium">
                  Vendeur à environ <strong>{product.distanceKm} km</strong> de vous
                </span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Truck size={16} className="text-teal-600 shrink-0" />
                <span className="text-gray-700 font-medium">
                  Livraison estimée : <strong>24 à 48h</strong>
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed text-sm md:text-base">{product.description}</p>
            </div>

            <div>
              <h3 className="text-sm font-bold text-gray-900 mb-3">Caractéristiques</h3>
              <div className="grid grid-cols-2 gap-3">
                {specs.map((spec, i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide mb-0.5">{spec.label}</p>
                    <p className="text-sm font-semibold text-gray-900 truncate">{spec.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3">
                {product.vendeur.avatar_url ? (
                  <img
                    src={product.vendeur.avatar_url}
                    alt={product.vendeur.full_name}
                    className="w-12 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-coral-100 flex items-center justify-center shrink-0">
                    <span className="text-coral-800 font-bold">
                      {product.vendeur.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-bold text-gray-900 truncate">{product.vendeur.full_name}</h3>
                    {product.vendeur.isVerified && (
                      <CheckCircle2 size={14} className="text-teal-500 fill-teal-50 shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    <span className="text-xs text-gray-600">
                      {product.vendeur.note_moyenne.toFixed(1)} • {product.vendeur.productCount} produits
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={handleContactSeller} className="shrink-0">
                  <MessageCircle size={16} className="mr-2" />
                  Contacter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-amber-50 rounded-xl">
                <Wallet size={18} className="text-amber-500" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">Paiement Escrow</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-coral-50 rounded-xl">
                <Key size={18} className="text-coral-500" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">Validation OTP</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-teal-50 rounded-xl">
                <ShieldCheck size={18} className="text-teal-500" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">Vendeur Vérifié</span>
              </div>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-gray-900">Quantité :</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Minus size={18} />
                </button>
                <span className="w-10 text-center text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
              {quantity > 1 && (
                <span className="text-sm text-gray-500">
                  Total : <strong className="text-gray-900">{totalPrice.toLocaleString('fr-FR')} FCFA</strong>
                </span>
              )}
            </div>

            {/* Actions Desktop Only */}
            <div className="hidden md:flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleAddToCart}
                className={`flex-1 h-13 md:h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors duration-300 ${
                  justAdded
                    ? 'border-teal-600 text-teal-600 bg-teal-50'
                    : 'border-gray-900 text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag size={18} />
                {justAdded ? 'Ajouté ✓' : 'Ajouter au panier'}
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 h-13 md:h-14 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors duration-300"
              >
                Acheter maintenant
              </button>
            </div>
          </motion.div>
        </div>

        {/* Avis clients */}
        <section className="mt-14 md:mt-20 pt-10 md:pt-14 border-t border-gray-100">
          <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
            Avis clients <span className="text-gray-400 font-medium">({product.reviewCount})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            {MOCK_REVIEWS.map((review, i) => (
              <div key={i} className="bg-gray-50 rounded-2xl p-5 md:p-6">
                <div className="flex items-center gap-1 mb-3">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star
                      key={s}
                      size={13}
                      className={s < review.rating ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                    />
                  ))}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">"{review.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={review.avatar} alt={review.name} className="w-9 h-9 rounded-full object-cover" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">{review.name}</p>
                    <p className="text-[11px] text-gray-400">{review.date}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Produits similaires */}
        {similarProducts.length > 0 && (
          <section className="mt-14 md:mt-20 pt-10 md:pt-14 border-t border-gray-100">
            <h2 className="text-lg md:text-2xl font-bold text-gray-900 mb-6 md:mb-8">
              Produits similaires
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {similarProducts.map((p) => (
                <Link key={p.id} href={`/produits/${p.id}`} className="block">
                  <ProductCardModern
                    image={p.photos[0]}
                    category={CATEGORIES.find(c => c.id === p.categorie)?.label || 'Divers'}
                    name={p.nom}
                    rating={p.rating}
                    reviewCount={p.reviewCount}
                    price={p.prix}
                    oldPrice={p.ancien_prix ?? undefined}
                    onAddToCart={() => {
                      addItem({ id: p.id, nom: p.nom, prix: p.prix, vendeur_id: p.vendeur_id || "default", photos: p.photos })
                      showToast('Produit ajouté au panier', 'success')
                    }}
                    onToggleFavorite={() => showToast('Favori ajouté', 'success')}
                  />
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Barre sticky mobile — visible uniquement après scroll > 300px */}
      <AnimatePresence>
        {showStickyBar && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]"
          >
            <div className="flex items-center gap-3">
              <div className="shrink-0">
                <p className="text-2xl font-black text-gray-900 leading-none">
                  {totalPrice.toLocaleString('fr-FR')} <span className="text-base font-bold text-gray-500">FCFA</span>
                </p>
                {quantity > 1 && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{quantity} article(s)</p>
                )}
              </div>
              <button
                onClick={handleAddToCart}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${
                  justAdded ? 'border-teal-600 text-teal-600 bg-teal-50' : 'border-gray-900 text-gray-900 hover:bg-gray-50'
                }`}
                aria-label="Ajouter au panier"
              >
                <ShoppingBag size={26} />
              </button>
              <button
                onClick={handleBuyNow}
                className="flex-1 h-14 rounded-2xl bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white font-bold text-base transition-all shadow-md"
              >
                Acheter maintenant
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ScrollToTop />

      <Footer />
    </div>
  )
}
