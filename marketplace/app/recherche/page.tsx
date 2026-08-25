'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { createClient } from '@/lib/supabase/client'
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchFavoriteIds,
  mapArticleRow,
  toggleFavorite,
  getProductUrl,
} from '@/lib/catalogue'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { Search, ArrowLeft, X, Sparkles, Tag } from 'lucide-react'

interface CatRow {
  id: string
  nom: string
  parent_id: string | null
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [products, setProducts] = useState<ArticleCard[]>([])
  const [matchedCategories, setMatchedCategories] = useState<{ id: string; nom: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Synchronise query dès que l'URL change
  useEffect(() => {
    const q = searchParams.get('q') || ''
    setQuery(q)
  }, [searchParams])

  useEffect(() => {
    const loadUser = async () => {
      const { data } = await supabase.auth.getUser()
      setUserId(data.user?.id ?? null)
      if (data.user) {
        const { data: userRow } = await supabase.from('users').select('role').eq('id', data.user.id).single()
        setUserRole(userRow?.role ?? null)
      }
    }
    loadUser()
  }, [supabase])

  const runSearch = useCallback(async (q: string) => {
    setLoading(true)
    try {
      if (!q.trim()) {
        setProducts([])
        setMatchedCategories([])
        return
      }

      const term = q.trim()

      // 1. Chercher les catégories correspondantes (nom, slug)
      const { data: catData } = await supabase
        .from('categories')
        .select('id, nom, parent_id')
        .ilike('nom', `%${term}%`)

      const catRows = (catData || []) as CatRow[]
      let allMatchingCatIds: string[] = []

      if (catRows.length > 0) {
        setMatchedCategories(catRows.map((c: CatRow) => ({ id: c.id, nom: c.nom })))
        const directCatIds = catRows.map((c: CatRow) => c.id)

        // Récupérer également les sous-catégories des catégories parentes trouvées
        const { data: subData } = await supabase
          .from('categories')
          .select('id, nom, parent_id')
          .in('parent_id', directCatIds)

        const subCatRows = (subData || []) as CatRow[]
        const subCatIds = subCatRows.map((s: CatRow) => s.id)
        allMatchingCatIds = Array.from(new Set([...directCatIds, ...subCatIds]))
      } else {
        setMatchedCategories([])
      }

      // 2. Recherche multi-critères des articles (nom, description, tags, catégorie)
      let searchQueryBuilder = supabase
        .from('articles')
        .select(ARTICLE_CARD_SELECT)
        .eq('statut', 'publie')
        .eq('actif', true)

      if (allMatchingCatIds.length > 0) {
        searchQueryBuilder = searchQueryBuilder.or(
          `nom.ilike.%${term}%,description.ilike.%${term}%,tags_seo.ilike.%${term}%,categorie_id.in.(${allMatchingCatIds.join(',')})`
        )
      } else {
        searchQueryBuilder = searchQueryBuilder.or(
          `nom.ilike.%${term}%,description.ilike.%${term}%,tags_seo.ilike.%${term}%`
        )
      }

      if (userRole === 'vendeur' && userId) {
        searchQueryBuilder = searchQueryBuilder.neq('vendeur_id', userId)
      }

      const { data, error } = await searchQueryBuilder.limit(40)

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
  }, [supabase, showToast, userRole, userId])

  // Recherche live debouncée
  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => runSearch(query), 350)
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
    if (!query.trim()) return
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
      router.push('/connexion')
      return
    }
    const isFav = favoriteIds.has(productId)
    try {
      const nowFav = await toggleFavorite(supabase, userId, productId, isFav)
      setFavoriteIds((prev) => {
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

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12 py-8">
      {/* Header de Recherche */}
      <div className="flex items-center gap-3 md:gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors shrink-0 cursor-pointer"
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
            placeholder="Rechercher un produit, une catégorie, une marque..."
            className="w-full h-12 pl-11 pr-10 bg-gray-50 border border-gray-200 focus:bg-white rounded-2xl focus:outline-none focus:ring-4 focus:ring-coral-500/10 focus:border-coral-500 transition-all text-sm font-medium"
            autoFocus
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                router.replace('/recherche')
              }}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition-colors"
            >
              <X size={16} />
            </button>
          )}
        </form>
      </div>

      {/* Catégories associées si trouvées */}
      {matchedCategories.length > 0 && (
        <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1 no-scrollbar">
          <span className="text-xs font-bold text-gray-400 shrink-0">Catégories :</span>
          {matchedCategories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => router.push(`/catalogue?categorie=${encodeURIComponent(cat.nom)}`)}
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-coral-50 hover:bg-coral-100 text-coral-600 text-xs font-bold rounded-xl border border-coral-200/60 transition-colors shrink-0 cursor-pointer"
            >
              <Tag size={12} />
              <span>{cat.nom}</span>
            </button>
          ))}
        </div>
      )}

      {/* Résultats */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length > 0 ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-sm font-bold text-gray-700">
              {products.length} résultat{products.length > 1 ? 's' : ''} pour « <span className="text-gray-900">{query}</span> »
            </h1>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((product) => (
              <div key={product.id} className="block">
                <ProductCardModern
                  image={product.photos[0] || '/images/hero-illustration.png'}
                  category={product.categorieLabel || 'Divers'}
                  name={product.nom}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  price={product.prix}
                  oldPrice={product.ancien_prix ?? undefined}
                  sellerName={product.vendeurNom || undefined}
                  location={product.vendeurLocation || undefined}
                  stock={product.stock ?? undefined}
                  createdAt={product.createdAt}
                  photosCount={product.photos.length}
                  onAddToCart={() => handleAddToCart(product)}
                  isFavorite={favoriteIds.has(product.id)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                  onClick={() => router.push(getProductUrl(product))}
                />
              </div>
            ))}
          </div>
        </div>
      ) : query ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 max-w-lg mx-auto p-8">
          <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-gray-300">
            <Search size={28} />
          </div>
          <h2 className="text-lg font-bold text-gray-900 mb-1">Aucun produit trouvé</h2>
          <p className="text-xs text-gray-500 mb-6 leading-relaxed">
            Nous n'avons pas trouvé d'article pour « <span className="font-semibold text-gray-800">{query}</span> ». Essayez avec d'autres termes ou explorez toutes les catégories.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
            <Button
              onClick={() => router.push('/catalogue')}
              className="bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold py-2.5 px-5 rounded-xl"
            >
              Voir tout le catalogue
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setQuery('')
                router.replace('/recherche')
              }}
              className="text-xs font-bold py-2.5 px-5 rounded-xl border-gray-200"
            >
              Effacer la recherche
            </Button>
          </div>
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400">
          <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium">Tapez un mot-clé pour lancer votre recherche sur Ayiba</p>
        </div>
      )}
    </div>
  )
}

export default function RecherchePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-1 flex flex-col pt-14 md:pt-16">
        <Suspense
          fallback={
            <div className="flex-1 flex items-center justify-center">
              <div className="w-8 h-8 border-3 border-coral-500 border-t-transparent rounded-full animate-spin" />
            </div>
          }
        >
          <SearchResults />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
