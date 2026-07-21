'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { AuthModal } from '@/components/ui/AuthModal'
import { createClient } from '@/lib/supabase/client'
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchFavoriteIds,
  mapArticleRow,
  toggleFavorite,
} from '@/lib/catalogue'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Search, ArrowLeft, X } from 'lucide-react'

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const initialQuery = searchParams.get('q') || ''
  const [query, setQuery] = useState(initialQuery)
  const [products, setProducts] = useState<ArticleCard[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
    }
    loadUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      if (!q.trim()) {
        setProducts([])
        return
      }

      const term = q.trim()
      const { data, error } = await supabase
        .from('articles')
        .select(ARTICLE_CARD_SELECT)
        .eq('statut', 'publie')
        .eq('actif', true)
        .or(`nom.ilike.%${term}%,description.ilike.%${term}%`)

      if (error) throw error

      const rows = (data || []) as unknown as ArticleCardRow[]
      const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id))
      setProducts(rows.map((r) => mapArticleRow(r, ratings)))
    } catch (error) {
      console.error('Error searching articles:', error)
      showToast('Erreur lors de la recherche', 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, showToast])

  // Recherche "live" avec un léger debounce, comme avant.
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => runSearch(query), 400)
    return () => clearTimeout(timer)
  }, [query, runSearch])

  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set())
      return
    }
    fetchFavoriteIds(supabase, userId).then(setFavoriteIds)
  }, [supabase, userId, products.length])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    router.replace(`/recherche?q=${encodeURIComponent(query.trim())}`)
  }

  const handleAddToCart = (product: ArticleCard) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id,
      photos: product.photos,
    })
    showToast('Produit ajouté au panier', 'success')
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!userId) {
      setAuthModalOpen(true)
      return
    }
    const isFav = favoriteIds.has(productId)
    const nowFav = await toggleFavorite(supabase, userId, productId, isFav)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (nowFav) next.add(productId)
      else next.delete(productId)
      return next
    })
    showToast(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success')
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12 py-8">
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0"
          aria-label="Retour"
        >
          <ArrowLeft size={20} />
        </button>
        <form onSubmit={handleSubmit} className="flex-1 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit, une marque..."
            className="w-full h-12 pl-11 pr-10 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all text-sm font-medium"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-200 rounded-full text-gray-400"
            >
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {query.trim() && (
        <div className="mb-6">
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">
            Résultats pour "{query.trim()}"
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {products.length} {products.length > 1 ? 'produits trouvés' : 'produit trouvé'}
          </p>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : !query.trim() ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Search size={32} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Que cherches-tu ?</h2>
          <p className="text-gray-500 max-w-sm mx-auto text-sm">
            Tape un nom de produit, une marque ou une catégorie pour commencer.
          </p>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
            <Search size={32} className="text-gray-300" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-2">Aucun résultat trouvé</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
            Nous n'avons trouvé aucun produit correspondant à "{query.trim()}". Essaie avec d'autres mots-clés.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
            <Button onClick={() => router.push('/explorer')}>
              Voir le catalogue
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {products.map((product) => (
            <Link key={product.id} href={`/produits/${product.id}`} className="block">
              <ProductCardModern
                image={product.photos[0]}
                category={product.categorieLabel}
                name={product.nom}
                rating={product.rating}
                reviewCount={product.reviewCount}
                price={product.prix}
                oldPrice={product.ancien_prix ?? undefined}
                isFavorite={favoriteIds.has(product.id)}
                onAddToCart={() => handleAddToCart(product)}
                onToggleFavorite={() => handleToggleFavorite(product.id)}
              />
            </Link>
          ))}
        </div>
      )}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <Navbar />
      <Suspense
        fallback={
          <div className="flex-1 flex items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
