'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { AuthModal } from '@/components/ui/AuthModal'
import { Footer } from '@/components/home/Footer'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Star, ShoppingBag, MessageCircle, Share2,
  ChevronLeft, ChevronRight, Minus, Plus,
  Wallet, Key, ShieldCheck, MapPin, Truck,
  CheckCircle2
} from 'lucide-react'
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchVendeurStats,
  mapArticleRow,
  toggleFavorite,
  VendeurStats,
} from '@/lib/catalogue'
import { ScrollToTop } from '@/components/ui/ScrollToTop'

interface VendeurInfo {
  id: string
  full_name: string
  avatar_url: string | null
  commune: string | null
  isVerified: boolean
}

interface Product extends ArticleCard {
  vendeur: VendeurInfo
  is_favorite: boolean
}

interface Avis {
  id: string
  note: number
  commentaire: string | null
  created_at: string
  reviewer_name: string
  reviewer_avatar: string | null
}

// Type dédié à la requête de détail produit (avec le profil vendeur complet).
// Volontairement indépendant de ArticleCardRow pour éviter une intersection
// de types sur le champ `vendeurs` (qui a une forme différente dans
// ARTICLE_CARD_SELECT vs. ce select dédié).
interface VendeurDetailRow {
  id: string
  nom_boutique: string | null
  photo_profil_url: string | null
  commune: string | null
  statut: string
}

interface ArticleDetailRow {
  id: string
  nom: string
  description: string
  prix: number
  prix_promo: number | null
  categorie_id: string | null
  vendeur_id: string
  vues: number
  created_at: string
  categories: { nom: string; slug: string } | { nom: string; slug: string }[] | null
  article_images: { image_url: string; ordre: number }[]
  vendeurs: VendeurDetailRow | VendeurDetailRow[] | null
}

function timeAgo(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime()
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (days <= 0) return "Aujourd'hui"
  if (days === 1) return 'Il y a 1 jour'
  if (days < 30) return `Il y a ${days} jours`
  const months = Math.floor(days / 30)
  if (months === 1) return 'Il y a 1 mois'
  if (months < 12) return `Il y a ${months} mois`
  const years = Math.floor(months / 12)
  return years === 1 ? 'Il y a 1 an' : `Il y a ${years} ans`
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { showToast } = useToast()
  const { addItem } = useCart()
  const { user } = useUser()
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [reviews, setReviews] = useState<Avis[]>([])
  const [similarProducts, setSimilarProducts] = useState<ArticleCard[]>([])
  const [vendeurStats, setVendeurStats] = useState<VendeurStats>({ rating: 0, reviewCount: 0, productCount: 0 })
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    fetchProduct()
    setCurrentImageIndex(0)
    setQuantity(1)
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    const handleScroll = () => {
      setShowStickyBar(window.scrollY > 300)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const articleId = params.id as string

      // Select dédié (plutôt que ARTICLE_CARD_SELECT) pour éviter d'embarquer
      // deux fois la relation vendeurs avec des colonnes différentes : ici on
      // a besoin du profil complet du vendeur (commune, statut...).
      const { data: row, error } = await supabase
        .from('articles')
        .select(`
          id, nom, description, prix, prix_promo, categorie_id, vendeur_id, vues, created_at,
          categories ( nom, slug ),
          article_images ( image_url, ordre ),
          vendeurs ( id, nom_boutique, photo_profil_url, commune, statut )
        `)
        .eq('id', articleId)
        .eq('statut', 'publie')
        .eq('actif', true)
        .single()

      if (error || !row) throw error || new Error('Product not found')

      const articleRow = row as unknown as ArticleDetailRow
      const vendeurRow = Array.isArray(articleRow.vendeurs) ? articleRow.vendeurs[0] : articleRow.vendeurs

      const ratings = await fetchArticleRatings(supabase, [articleId])
      const card = mapArticleRow(articleRow as unknown as ArticleCardRow, ratings)

      let isFavorite = false
      if (user) {
        const { data: fav } = await supabase
          .from('favoris')
          .select('id')
          .eq('client_id', user.id)
          .eq('article_id', articleId)
          .maybeSingle()
        isFavorite = !!fav
      }

      setProduct({
        ...card,
        vendeur: {
          id: vendeurRow?.id || card.vendeur_id,
          full_name: vendeurRow?.nom_boutique || 'Boutique Ayiba',
          avatar_url: vendeurRow?.photo_profil_url || null,
          commune: vendeurRow?.commune || null,
          isVerified: vendeurRow?.statut === 'valide',
        },
        is_favorite: isFavorite,
      })

      fetchReviews(articleId)
      fetchSimilar(articleRow.categorie_id, articleId)
      if (vendeurRow?.id) {
        fetchVendeurStats(supabase, vendeurRow.id).then(setVendeurStats)
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      showToast('Produit non trouvé', 'error')
      router.push('/explorer')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (articleId: string) => {
    const { data: avisRows, error } = await supabase
      .from('avis')
      .select('id, note, commentaire, created_at, utilisateur_id')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !avisRows || avisRows.length === 0) {
      setReviews([])
      return
    }

    const userIds = [...new Set(avisRows.map((a: any) => a.utilisateur_id))]
    const { data: reviewers } = await supabase
      .from('users')
      .select('id, full_name, avatar_url')
      .in('id', userIds)

    const reviewerMap = new Map<string, { full_name: string | null; avatar_url: string | null }>(
      (reviewers || []).map((u: any) => [u.id, u])
    )

    setReviews(
      avisRows.map((a: any) => {
        const reviewer = reviewerMap.get(a.utilisateur_id)
        return {
          id: a.id,
          note: a.note,
          commentaire: a.commentaire,
          created_at: a.created_at,
          reviewer_name: reviewer?.full_name || 'Client Ayiba',
          reviewer_avatar: reviewer?.avatar_url || null,
        }
      })
    )
  }

  const fetchSimilar = async (categorieId: string | null, excludeId: string) => {
    if (!categorieId) {
      setSimilarProducts([])
      return
    }
    const { data, error } = await supabase
      .from('articles')
      .select(ARTICLE_CARD_SELECT)
      .eq('statut', 'publie')
      .eq('actif', true)
      .eq('categorie_id', categorieId)
      .neq('id', excludeId)
      .limit(4)

    if (error || !data) {
      setSimilarProducts([])
      return
    }
    const rows = data as unknown as ArticleCardRow[]
    const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id))
    setSimilarProducts(rows.map((r) => mapArticleRow(r, ratings)))
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

  const handleToggleFavorite = async () => {
    if (!product) return
    if (!user) {
      setAuthModalOpen(true)
      return
    }
    try {
      const nowFav = await toggleFavorite(supabase, user.id, product.id, product.is_favorite)
      setProduct({ ...product, is_favorite: nowFav })
      showToast(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success')
    } catch (error: any) {
      showToast(error?.message || 'Impossible de mettre à jour les favoris', 'error')
    }
  }

  const handleContactSeller = () => {
    if (!product) return
    if (!user) {
      setAuthModalOpen(true)
      return
    }
    showToast('Conversation avec le vendeur bientôt disponible', 'info')
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
    { label: "Catégorie", value: product.categorieLabel },
    { label: "Vendu par", value: product.vendeur.full_name },
    { label: "État", value: "Neuf" },
    { label: "Livraison estimée", value: "24 à 48h" },
  ]

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
            <div
              className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square touch-pan-y"
              onTouchStart={(e) => {
                (e.currentTarget as any)._touchStartX = e.touches[0].clientX
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any)._touchStartX
                if (startX == null || product.photos.length <= 1) return
                const deltaX = e.changedTouches[0].clientX - startX
                if (Math.abs(deltaX) < 40) return // pas un swipe volontaire
                if (deltaX < 0) {
                  setCurrentImageIndex((prev) => (prev + 1) % product.photos.length)
                } else {
                  setCurrentImageIndex((prev) => (prev - 1 + product.photos.length) % product.photos.length)
                }
              }}
            >
              <img
                src={product.photos[currentImageIndex]}
                alt={product.nom}
                className="w-full h-full object-cover"
              />

              {product.photos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + product.photos.length) % product.photos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center"
                    aria-label="Image précédente"
                  >
                    <span className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronLeft size={20} />
                    </span>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % product.photos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center"
                    aria-label="Image suivante"
                  >
                    <span className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronRight size={20} />
                    </span>
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
              {product.categorieLabel}
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

            {product.vendeur.commune && (
              <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={16} className="text-teal-600 shrink-0" />
                  <span className="text-gray-700 font-medium">
                    Vendeur basé à <strong>{product.vendeur.commune}</strong>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Truck size={16} className="text-teal-600 shrink-0" />
                  <span className="text-gray-700 font-medium">
                    Livraison estimée : <strong>24 à 48h</strong>
                  </span>
                </div>
              </div>
            )}

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
                      {vendeurStats.rating.toFixed(1)} • {vendeurStats.productCount} produits
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
          {reviews.length === 0 ? (
            <div className="py-12 text-center bg-gray-50 rounded-2xl">
              <Star size={28} className="mx-auto mb-3 text-gray-300" />
              <p className="text-gray-500 text-sm">Aucun avis pour le moment. Soyez le premier à donner votre avis après achat.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
              {reviews.map((review) => (
                <div key={review.id} className="bg-gray-50 rounded-2xl p-5 md:p-6">
                  <div className="flex items-center gap-1 mb-3">
                    {Array.from({ length: 5 }).map((_, s) => (
                      <Star
                        key={s}
                        size={13}
                        className={s < review.note ? "fill-amber-400 text-amber-400" : "fill-gray-200 text-gray-200"}
                      />
                    ))}
                  </div>
                  {review.commentaire && (
                    <p className="text-sm text-gray-600 leading-relaxed mb-4">&ldquo;{review.commentaire}&rdquo;</p>
                  )}
                  <div className="flex items-center gap-3">
                    {review.reviewer_avatar ? (
                      <img src={review.reviewer_avatar} alt={review.reviewer_name} className="w-9 h-9 rounded-full object-cover" />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-coral-100 flex items-center justify-center">
                        <span className="text-coral-800 text-xs font-bold">
                          {review.reviewer_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-xs font-bold text-gray-900">{review.reviewer_name}</p>
                      <p className="text-[11px] text-gray-400">{timeAgo(review.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
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
                    category={p.categorieLabel}
                    name={p.nom}
                    rating={p.rating}
                    reviewCount={p.reviewCount}
                    price={p.prix}
                    oldPrice={p.ancien_prix ?? undefined}
                    onAddToCart={() => {
                      addItem({ id: p.id, nom: p.nom, prix: p.prix, vendeur_id: p.vendeur_id, photos: p.photos })
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

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </div>
  )
}
