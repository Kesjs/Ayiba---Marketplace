'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/lib/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { AuthModal } from '@/components/ui/AuthModal'
import { ContactModal } from '@/components/modals/ContactModal'
import { Footer } from '@/components/home/Footer'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Heart, Star, ShoppingBag, MessageCircle, Share2,
  ChevronLeft, ChevronRight, Minus, Plus,
  Wallet, QrCode, ShieldCheck, MapPin, Truck
} from 'lucide-react'
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchFavoriteIds,
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

interface Variante {
  id: string
  type_variante: string
  nom_variante: string
  prix: number | null
  stock: number | null
  photo_url: string | null
  ordre: number | null
}

const TYPE_VARIANTE_LABELS: Record<string, string> = {
  couleur: 'Couleur',
  taille: 'Taille',
  modele: 'Modèle',
  format: 'Format',
}

// Un vendeur peut ajouter ses tailles dans n'importe quel ordre (ex: M avant
// S). Pour un affichage soigné, on les retrie par échelle logique quand le
// type de variante est "taille" : numériquement pour des pointures (36, 37,
// 38...), ou selon l'échelle XS→XXXL pour des tailles lettres. Les autres
// types de variante (couleur, modèle, format) gardent l'ordre choisi par le
// vendeur (`ordre`).
const ORDRE_TAILLES_LETTRES: Record<string, number> = {
  XS: 0, S: 1, M: 2, L: 3, XL: 4, XXL: 5, XXXL: 6,
}

function comparerVariantesTaille(a: Variante, b: Variante): number {
  const numA = Number(a.nom_variante)
  const numB = Number(b.nom_variante)
  if (!Number.isNaN(numA) && !Number.isNaN(numB)) return numA - numB

  const rangA = ORDRE_TAILLES_LETTRES[a.nom_variante.trim().toUpperCase()]
  const rangB = ORDRE_TAILLES_LETTRES[b.nom_variante.trim().toUpperCase()]
  if (rangA !== undefined && rangB !== undefined) return rangA - rangB

  return (a.ordre ?? 0) - (b.ordre ?? 0)
}

function trierVariantesPourAffichage(variantes: Variante[]): Variante[] {
  if (variantes.length === 0 || variantes[0].type_variante !== 'taille') return variantes
  return [...variantes].sort(comparerVariantesTaille)
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
  const { user, profile } = useUser()
  const supabase = createClient()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [justAdded, setJustAdded] = useState(false)
  const [showStickyBar, setShowStickyBar] = useState(false)
  const [reviews, setReviews] = useState<Avis[]>([])
  const [similarProducts, setSimilarProducts] = useState<ArticleCard[]>([])
  const [similarFavoriteIds, setSimilarFavoriteIds] = useState<Set<string>>(new Set())
  const [vendeurStats, setVendeurStats] = useState<VendeurStats>({ rating: 0, reviewCount: 0, productCount: 0 })
  const [variantes, setVariantes] = useState<Variante[]>([])
  const [selectedVarianteId, setSelectedVarianteId] = useState<string | null>(null)
  const [variantesError, setVariantesError] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [contactModalOpen, setContactModalOpen] = useState(false)
  const [reviewsPage, setReviewsPage] = useState(0)
  const [totalReviewsCount, setTotalReviewsCount] = useState(0)
  const [loadingMoreReviews, setLoadingMoreReviews] = useState(false)
  // Où renvoyer l'utilisateur une fois connecté : /checkout après un "Acheter
  // maintenant" en étant déconnecté, null pour les autres usages (favoris...)
  // où on veut juste rester sur la page produit.
  const [authRedirectTo, setAuthRedirectTo] = useState<string | null>(null)

  useEffect(() => {
    fetchProduct()
    setCurrentImageIndex(0)
    setQuantity(1)
    setSelectedVarianteId(null)
    setVariantesError(null)
    window.scrollTo(0, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id])

  useEffect(() => {
    setCurrentImageIndex(0)
  }, [selectedVarianteId])

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

      const { data: variantesData, error: variantesErr } = await supabase
        .from('article_variantes')
        .select('id, type_variante, nom_variante, prix, stock, photo_url, ordre')
        .eq('article_id', articleId)
        .eq('actif', true)
        .order('ordre', { ascending: true })

      if (variantesErr) {
        setVariantesError("Les options de cet article n'ont pas pu être chargées.")
        setVariantes([])
      } else {
        setVariantes((variantesData as Variante[] | null) ?? [])
      }
    } catch (error) {
      console.error('Error fetching product:', error)
      showToast('Produit non trouvé', 'error')
      router.push('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (articleId: string, pageNumber: number = 0) => {
    if (pageNumber === 0) {
      setReviews([])
      setReviewsPage(0)
    }

    const { data: avisRows, error } = await supabase
      .from('avis')
      .select('id, note, commentaire, created_at, utilisateur_id')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .range(pageNumber * 5, (pageNumber + 1) * 5 - 1)

    if (error || !avisRows) {
      if (pageNumber === 0) setReviews([])
      return
    }

    // Récupérer le nombre total d'avis au premier chargement
    if (pageNumber === 0) {
      const { count } = await supabase
        .from('avis')
        .select('*', { count: 'exact', head: true })
        .eq('article_id', articleId)
      setTotalReviewsCount(count || 0)
    }

    if (avisRows.length === 0) {
      if (pageNumber === 0) setReviews([])
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

    const newReviews = avisRows.map((a: any) => {
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

    setReviews(prev => pageNumber === 0 ? newReviews : [...prev, ...newReviews])
    setReviewsPage(pageNumber)
  }

  const handleLoadMoreReviews = async () => {
    if (!product) return
    setLoadingMoreReviews(true)
    await fetchReviews(product.id, reviewsPage + 1)
    setLoadingMoreReviews(false)
  }

  const fetchSimilar = async (categorieId: string | null, excludeId: string) => {
    if (!categorieId) {
      setSimilarProducts([])
      return
    }
    let query = supabase
      .from('articles')
      .select(ARTICLE_CARD_SELECT)
      .eq('statut', 'publie')
      .eq('actif', true)
      .eq('categorie_id', categorieId)
      .neq('id', excludeId)
      .limit(4)

    // Ne jamais suggérer au vendeur connecté ses propres articles parmi les
    // "produits similaires" — il ne peut de toute façon pas les acheter
    // (contrainte DB commandes_client_different_vendeur).
    if (user) {
      const { data: userRow } = await supabase.from('users').select('role').eq('id', user.id).single()
      if (userRow?.role === 'vendeur') {
        query = query.neq('vendeur_id', user.id)
      }
    }

    const { data, error } = await query

    if (error || !data) {
      setSimilarProducts([])
      return
    }
    const rows = data as unknown as ArticleCardRow[]
    const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id))
    setSimilarProducts(rows.map((r) => mapArticleRow(r, ratings)))
    if (user) {
      fetchFavoriteIds(supabase, user.id).then(setSimilarFavoriteIds)
    }
  }

  // Variante sélectionnée (le cas échéant) et valeurs effectives qui en
  // découlent : une variante avec un prix/stock renseigné prend le dessus
  // sur ceux de l'article, sinon elle en hérite — même logique que
  // creer_commande_service côté base de données.
  const selectedVariante = variantes.find((v) => v.id === selectedVarianteId) ?? null
  const displayPrix = selectedVariante?.prix ?? product?.prix ?? 0
  const displayAncienPrix = selectedVariante?.prix != null ? null : product?.ancien_prix ?? null
  const displayStock = selectedVariante ? selectedVariante.stock : product?.stock ?? null
  const ruptureStock = displayStock !== null && displayStock <= 0

  const isOwnProduct = !!(user && product && product.vendeur.id === user.id)

  const ajouterAuPanier = (): boolean => {
    if (!product) return false
    if (isOwnProduct) {
      showToast("Vous ne pouvez pas acheter votre propre article", 'error')
      return false
    }
    if (variantes.length > 0 && !selectedVarianteId) {
      showToast('Choisis une option avant de continuer', 'error')
      return false
    }
    if (ruptureStock) {
      showToast('Cette option est en rupture de stock', 'error')
      return false
    }
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        nom: product.nom,
        prix: displayPrix,
        vendeur_id: product.vendeur.id,
        photos: product.photos,
        varianteId: selectedVariante?.id ?? null,
        varianteNom: selectedVariante?.nom_variante ?? null,
      })
    }
    return true
  }

  const handleAddToCart = () => {
    if (!ajouterAuPanier()) return
    setJustAdded(true)
    showToast(`${quantity} article(s) ajouté(s) au panier`, 'success')
    setTimeout(() => setJustAdded(false), 1500)
  }

  const handleBuyNow = () => {
    if (!ajouterAuPanier()) return
    // Le panier est stocké en localStorage (indépendant du compte), donc on
    // peut ajouter l'article avant même la connexion : une fois l'utilisateur
    // connecté via la modale, il arrive directement sur le checkout avec son
    // panier intact, au lieu d'être bounce vers /explorer.
    if (!user) {
      setAuthRedirectTo('/checkout')
      setAuthModalOpen(true)
      return
    }
    router.push('/checkout')
  }

  const handleToggleFavorite = async () => {
    if (!product) return
    if (!user) {
      setAuthRedirectTo(null)
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

  const handleToggleFavoriteSimilar = async (productId: string) => {
    if (!user) {
      setAuthRedirectTo(null)
      setAuthModalOpen(true)
      return
    }
    const isFav = similarFavoriteIds.has(productId)
    try {
      const nowFav = await toggleFavorite(supabase, user.id, productId, isFav)
      setSimilarFavoriteIds((prev) => {
        const next = new Set(prev)
        if (nowFav) next.add(productId)
        else next.delete(productId)
        return next
      })
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
    setContactModalOpen(true)
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

  // La photo de la variante sélectionnée passe en priorité dans la galerie,
  // sans masquer les autres photos de l'article — l'acheteur peut toujours
  // les parcourir.
  const galleryPhotos = selectedVariante?.photo_url
    ? [selectedVariante.photo_url, ...product.photos.filter((p) => p !== selectedVariante.photo_url)]
    : product.photos

  const selectionIncomplete = variantes.length > 0 && !selectedVarianteId
  const achatBloque = selectionIncomplete || ruptureStock || isOwnProduct

  const totalPrice = displayPrix * quantity

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

        <div className="grid md:grid-cols-2 gap-6 md:gap-8 lg:gap-12 min-w-0">
          {/* Images */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="min-w-0"
          >
            <div
              className="relative bg-gray-50 rounded-2xl overflow-hidden aspect-square touch-pan-y"
              onTouchStart={(e) => {
                (e.currentTarget as any)._touchStartX = e.touches[0].clientX
              }}
              onTouchEnd={(e) => {
                const startX = (e.currentTarget as any)._touchStartX
                if (startX == null || galleryPhotos.length <= 1) return
                const deltaX = e.changedTouches[0].clientX - startX
                if (Math.abs(deltaX) < 40) return // pas un swipe volontaire
                if (deltaX < 0) {
                  setCurrentImageIndex((prev) => (prev + 1) % galleryPhotos.length)
                } else {
                  setCurrentImageIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)
                }
              }}
            >
              <Image
                src={galleryPhotos[currentImageIndex] ?? galleryPhotos[0]}
                alt={product.nom}
                fill
                className="w-full h-full object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority={currentImageIndex === 0}
              />

              {galleryPhotos.length > 1 && (
                <>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev - 1 + galleryPhotos.length) % galleryPhotos.length)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center"
                    aria-label="Image précédente"
                  >
                    <span className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronLeft size={20} />
                    </span>
                  </button>
                  <button
                    onClick={() => setCurrentImageIndex((prev) => (prev + 1) % galleryPhotos.length)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-12 h-12 flex items-center justify-center"
                    aria-label="Image suivante"
                  >
                    <span className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white transition-colors shadow-lg">
                      <ChevronRight size={20} />
                    </span>
                  </button>
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    {galleryPhotos.map((_, i) => (
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
                <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-red-600 text-white rounded-full px-3 py-1.5 text-sm font-black shadow-sm">
                  <Star size={13} className="fill-white text-white" />
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

            {galleryPhotos.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto pb-2 no-scrollbar">
                {galleryPhotos.map((photo, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentImageIndex(i)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-colors ${
                      i === currentImageIndex ? 'border-coral-500' : 'border-transparent'
                    }`}
                  >
                    <Image src={photo} alt={`${product.nom} ${i + 1}`} fill className="object-cover" loading="lazy" />
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
            className="space-y-5 md:space-y-6 min-w-0"
          >
            <span className="text-xs font-bold text-coral-600 uppercase tracking-wider">
              {product.categorieLabel}
            </span>

            <h1 className="text-xl md:text-3xl font-bold text-gray-900 leading-tight -mt-2">
              {product.nom}
            </h1>

            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-2xl md:text-3xl font-black text-gray-900">
                {displayPrix.toLocaleString('fr-FR')} <span className="text-base font-bold">FCFA</span>
              </span>
              {displayAncienPrix && (
                <span className="text-base md:text-lg text-gray-400 line-through font-medium">
                  {displayAncienPrix.toLocaleString('fr-FR')} FCFA
                </span>
              )}
            </div>

            {variantesError && (
              <p className="text-xs text-red-500">{variantesError}</p>
            )}

            {variantes.length > 0 && (
              <div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">
                  {TYPE_VARIANTE_LABELS[variantes[0].type_variante] ?? 'Options'}
                </h3>
                <div className="flex flex-wrap gap-2">
                  {trierVariantesPourAffichage(variantes).map((v) => {
                    const enRupture = v.stock !== null && v.stock <= 0
                    const selected = v.id === selectedVarianteId
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => setSelectedVarianteId(v.id)}
                        disabled={enRupture}
                        className={`px-4 h-11 rounded-xl border-2 text-sm font-semibold transition-colors flex items-center gap-2 ${
                          selected
                            ? 'border-coral-500 bg-coral-50 text-coral-700'
                            : enRupture
                              ? 'border-gray-100 text-gray-300 line-through cursor-not-allowed'
                              : 'border-gray-200 text-gray-700 hover:border-coral-300'
                        }`}
                      >
                        {v.photo_url && (
                          <Image src={v.photo_url} alt="" width={24} height={24} className="rounded-md object-cover" />
                        )}
                        {v.nom_variante}
                      </button>
                    )
                  })}
                </div>
                {!selectedVarianteId && (
                  <p className="text-xs text-gray-400 mt-2">Choisis une option pour continuer.</p>
                )}
              </div>
            )}

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
                  <Image
                    src={product.vendeur.avatar_url}
                    alt={product.vendeur.full_name}
                    width={48}
                    height={48}
                    className="rounded-xl object-cover shrink-0"
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
                <QrCode size={18} className="text-coral-500" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">Scan & Code Secret</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-teal-50 rounded-xl">
                <ShieldCheck size={18} className="text-teal-500" />
                <span className="text-[10px] font-bold text-gray-700 leading-tight">Vendeur Vérifié</span>
              </div>
            </div>

            {isOwnProduct && (
              <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-100 rounded-xl">
                <ShoppingBag size={18} className="text-amber-500 shrink-0 mt-0.5" />
                <div className="text-sm text-amber-900">
                  <p className="font-semibold">C'est l'un de vos articles</p>
                  <p className="mt-0.5">
                    Vous ne pouvez pas acheter vos propres produits.{' '}
                    <Link href="/vendeur/articles" className="underline font-medium">
                      Gérer cet article
                    </Link>
                  </p>
                </div>
              </div>
            )}

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
                disabled={achatBloque}
                className={`flex-1 h-13 md:h-14 rounded-xl border-2 flex items-center justify-center gap-2 font-bold text-sm transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed ${
                  justAdded
                    ? 'border-teal-600 text-teal-600 bg-teal-50'
                    : 'border-gray-900 text-gray-900 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag size={18} />
                {isOwnProduct ? 'Votre article' : ruptureStock ? 'Rupture de stock' : justAdded ? 'Ajouté ✓' : 'Ajouter au panier'}
              </button>
              <button
                onClick={handleBuyNow}
                disabled={achatBloque}
                className="flex-1 h-13 md:h-14 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isOwnProduct ? 'Non disponible' : 'Acheter maintenant'}
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
                      <Image src={review.reviewer_avatar} alt={review.reviewer_name} width={36} height={36} className="rounded-full object-cover" />
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

          {reviews.length > 0 && reviews.length < totalReviewsCount && (
            <div className="flex justify-center mt-8">
              <Button
                onClick={handleLoadMoreReviews}
                disabled={loadingMoreReviews}
                variant="outline"
                className="px-6"
              >
                {loadingMoreReviews ? 'Chargement...' : `Charger plus d'avis (${totalReviewsCount - reviews.length} restants)`}
              </Button>
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
                    sellerName={p.vendeurNom}
                    location={p.vendeurLocation || undefined}
                    stock={p.stock ?? undefined}
                    createdAt={p.createdAt}
                    photosCount={p.photos.length}
                    onAddToCart={() => {
                      addItem({ id: p.id, nom: p.nom, prix: p.prix, vendeur_id: p.vendeur_id, photos: p.photos })
                      showToast('Produit ajouté au panier', 'success')
                    }}
                    isFavorite={similarFavoriteIds.has(p.id)}
                    onToggleFavorite={() => handleToggleFavoriteSimilar(p.id)}
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
            className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-[60] shadow-lg"
            role="complementary"
            aria-label="Panier mobile flottant"
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
                disabled={achatBloque}
                className={`w-14 h-14 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  justAdded ? 'border-teal-600 text-teal-600 bg-teal-50' : 'border-gray-900 text-gray-900 hover:bg-gray-50'
                }`}
                aria-label={justAdded ? 'Produit ajouté au panier' : 'Ajouter au panier'}
                title={justAdded ? 'Produit ajouté ✓' : 'Ajouter au panier'}
              >
                <ShoppingBag size={26} />
              </button>
              <button
                onClick={handleBuyNow}
                disabled={achatBloque}
                className="flex-1 h-14 rounded-2xl bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white font-bold text-base transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={achatBloque && selectionIncomplete ? 'Choisis une option pour continuer' : isOwnProduct ? 'Impossible - c\'est votre produit' : 'Acheter maintenant'}
              >
                {achatBloque && selectionIncomplete ? 'Choisis une option' : isOwnProduct ? 'Non disponible' : 'Acheter maintenant'}
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
        redirectTo={authRedirectTo}
      />

      {product && user && (
        <ContactModal
          open={contactModalOpen}
          onOpenChange={setContactModalOpen}
          recipient={{
            id: product.vendeur.id,
            nom: product.vendeur.full_name,
            photo: product.vendeur.avatar_url || undefined
          }}
          contextLabel={`À propos de : ${product.nom}`}
          userId={user.id}
          messagesBasePath={profile?.role === "vendeur" ? "/vendeur/messages" : "/messages"}
        />
      )}
    </div>
  )
}
