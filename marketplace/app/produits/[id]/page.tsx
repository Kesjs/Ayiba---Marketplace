'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { motion } from 'framer-motion'
import { 
  Heart, Star, ShoppingCart, MessageCircle, Share2, 
  ChevronLeft, ChevronRight, Minus, Plus, Shield, Truck 
} from 'lucide-react'
import { MOCK_PRODUCTS } from '@/lib/mock-data'

interface Product {
  id: string
  nom: string
  description: string
  prix: number
  ancien_prix: number | null
  categorie: string
  photos: string[]
  vendeur: {
    id: string
    full_name: string
    avatar_url: string | null
    note_moyenne: number
    nb_avis: number
  }
  distance: number
  is_favorite: boolean
}

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

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = () => {
    setLoading(true)
    try {
      // Use mock data
      const mockProduct = MOCK_PRODUCTS.find(p => p.id === params.id)
      
      if (!mockProduct) {
        throw new Error('Product not found')
      }

      setProduct({
        id: mockProduct.id,
        nom: mockProduct.nom,
        description: mockProduct.description || "Produit de qualité disponible sur Ayiba.",
        prix: mockProduct.prix,
        ancien_prix: mockProduct.ancien_prix || null,
        categorie: mockProduct.categorie || "Divers",
        photos: mockProduct.photos,
        vendeur: {
          id: mockProduct.vendeur_id || "default",
          full_name: "Vendeur Ayiba",
          avatar_url: null,
          note_moyenne: 4.5,
          nb_avis: 42
        },
        distance: 0,
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
    showToast(`${quantity} article(s) ajouté(s) au panier`, 'success')
  }

  const handleToggleFavorite = () => {
    if (!product) return

    if (!user) {
      showToast('Connectez-vous pour ajouter aux favoris', 'warning')
      router.push('/auth/inscription')
      return
    }

    // Toggle favorite locally (mock)
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

    // Mock: show toast for now
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

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <button onClick={() => router.back()} className="hover:text-gray-900 flex items-center gap-1">
            <ChevronLeft size={16} />
            Retour
          </button>
          <span>/</span>
          <span className="text-gray-900">{product.nom}</span>
        </div>

        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
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

              {/* Image navigation */}
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

              {/* Action buttons */}
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

            {/* Thumbnails */}
            {product.photos.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2">
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
            className="space-y-6"
          >
            {/* Category */}
            <div>
              <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">
                {product.categorie}
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
              {product.nom}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-gray-900">
                {product.prix.toLocaleString()} <span className="text-lg font-bold">FCFA</span>
              </span>
              {product.ancien_prix && (
                <span className="text-lg text-gray-400 line-through font-medium">
                  {product.ancien_prix.toLocaleString()} FCFA
                </span>
              )}
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-amber-50 px-3 py-1.5 rounded-lg">
                <Star size={16} className="fill-amber-500 text-amber-500" />
                <span className="text-sm font-bold text-amber-700">{product.vendeur.note_moyenne.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500">({product.vendeur.nb_avis} avis)</span>
            </div>

            {/* Description */}
            <div className="prose prose-sm">
              <h3 className="text-sm font-bold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 leading-relaxed">{product.description}</p>
            </div>

            {/* Seller Info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                {product.vendeur.avatar_url ? (
                  <img
                    src={product.vendeur.avatar_url}
                    alt={product.vendeur.full_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center">
                    <span className="text-coral-800 font-bold">
                      {product.vendeur.full_name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900">{product.vendeur.full_name}</h3>
                  <div className="flex items-center gap-1">
                    <Star size={12} className="fill-amber-500 text-amber-500" />
                    <span className="text-xs text-gray-600">
                      {product.vendeur.note_moyenne.toFixed(1)} ({product.vendeur.nb_avis} avis)
                    </span>
                  </div>
                </div>
                <Button variant="outline" onClick={handleContactSeller}>
                  <MessageCircle size={16} className="mr-2" />
                  Contacter
                </Button>
              </div>
            </div>

            {/* Trust badges */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Shield size={16} className="text-teal-500" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600">
                <Truck size={16} className="text-teal-500" />
                <span>Livraison rapide</span>
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
                <span className="w-12 text-center text-lg font-bold">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                >
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Add to cart */}
            <Button 
              variant="primary" 
              className="w-full h-14 text-base"
              onClick={handleAddToCart}
            >
              <ShoppingCart size={20} className="mr-2" />
              Ajouter au panier
            </Button>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  )
}
