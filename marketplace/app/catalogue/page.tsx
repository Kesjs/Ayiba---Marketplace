'use client'

import { useState, useEffect, Suspense, useRef, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { getArticlesPublics, getCategoriesActives, type ArticlePublic } from '@/lib/queries/articles'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { WelcomeAddressModal } from '@/components/onboarding/WelcomeAddressModal'
import { AuthModal } from '@/components/ui/AuthModal'
import { createClient } from '@/lib/supabase/client'
import { fetchFavoriteIds, toggleFavorite } from '@/lib/catalogue'
import { Search, SlidersHorizontal, LayoutGrid, List, X, ChevronDown } from 'lucide-react'
import type { User } from '@supabase/supabase-js'

function CatalogueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = useMemo(() => createClient(), [])
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [allProducts, setAllProducts] = useState<ArticlePublic[]>([])
  const [products, setProducts] = useState<ArticlePublic[]>([])
  const [categoryOptions, setCategoryOptions] = useState<{ nom: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorie') || 'Tout')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const promoOnly = searchParams.get('promo') === '1'
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)
  const [showSortMenu, setShowSortMenu] = useState(false)
  const sortMenuRef = useRef<HTMLDivElement>(null)
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [userId, setUserId] = useState<string | null>(null)
  const [authModalOpen, setAuthModalOpen] = useState(false)

  // Utilisateur courant (pour l'état des favoris et savoir s'il est vendeur) — page publique, accessible aussi aux invités.
  const [userRole, setUserRole] = useState<string | null>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }: { data: { user: User | null } }) => {
      setUserId(data.user?.id ?? null)
      if (data.user) {
        const { data: userRow } = await supabase.from('users').select('role').eq('id', data.user.id).single()
        setUserRole(userRow?.role ?? null)
      } else {
        setUserRole(null)
      }
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!userId) {
      setFavoriteIds(new Set())
      return
    }
    fetchFavoriteIds(supabase, userId).then(setFavoriteIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId])

  const categories = ['Tout', ...categoryOptions.map(c => c.nom)]

  // Chargement initial depuis Supabase (une seule fois — le filtrage catégorie/recherche/tri
  // se fait ensuite côté client sur ce jeu de données, comme avant avec les mocks).
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [articles, cats] = await Promise.all([getArticlesPublics(), getCategoriesActives()])
        if (cancelled) return
        setAllProducts(articles)
        setCategoryOptions(cats)
      } catch (err) {
        console.error('Erreur chargement catalogue:', err)
        if (!cancelled) setError('Impossible de charger les produits.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    let filtered = [...allProducts]

    // Un vendeur connecté ne doit jamais voir (ni pouvoir acheter) ses
    // propres articles dans le catalogue — cf. contrainte DB
    // commandes_client_different_vendeur qui bloquerait l'achat de toute
    // façon ; autant ne pas les afficher du tout ici.
    if (userRole === 'vendeur' && userId) {
      filtered = filtered.filter(p => p.vendeur_id !== userId)
    }

    // Lien "Voir tous les produits en promo" depuis la section Ventes flash
    // de la home (?promo=1) — mêmes articles, sans limite à 8, avec la même
    // règle d'expiration que la home (date_fin_promo non dépassée) pour ne
    // jamais lister un article dont le prix va redevenir normal d'une
    // seconde à l'autre.
    if (promoOnly) {
      filtered = filtered.filter(
        p => p.prix_promo != null && p.date_fin_promo != null && new Date(p.date_fin_promo).getTime() > Date.now()
      )
    }

    if (selectedCategory !== 'Tout') {
      filtered = filtered.filter(p => p.categorie?.nom === selectedCategory)
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(p =>
        p.nom.toLowerCase().includes(q) ||
        (p.description || '').toLowerCase().includes(q)
      )
    }

    if (sortBy === 'price-asc') filtered.sort((a, b) => (a.prix_promo ?? a.prix) - (b.prix_promo ?? b.prix))
    if (sortBy === 'price-desc') filtered.sort((a, b) => (b.prix_promo ?? b.prix) - (a.prix_promo ?? a.prix))

    setProducts(filtered)
  }, [allProducts, selectedCategory, searchQuery, sortBy, userRole, userId, promoOnly])

  const handleAddToCart = (product: ArticlePublic) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix_promo ?? product.prix,
      vendeur_id: product.vendeur_id,
      photos: product.photos
    })
    showToast('Produit ajouté au panier', 'success')
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!userId) {
      setAuthModalOpen(true)
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
    <>
      <WelcomeAddressModal />
      <Navbar />
      <main className="min-h-screen bg-gray-50/30 pt-14 md:pt-16">
        {/* Page Header */}
        <section className="bg-white border-b border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">Découvrez nos produits</h1>
            <p className="text-gray-500 font-medium max-w-2xl">Parcourez tout le catalogue Ayiba. Sécurité garantie, livraison locale rapide.</p>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className={`lg:w-64 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Catégories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-coral-50 text-coral-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              {/* Filtres, tri et bascule grille/liste regroupés sur une même
                  ligne (avant : "Filtres" dans le hero, "Trier par" dans la
                  sidebar, toggle ici — trois emplacements différents). */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <Button
                  onClick={() => setShowFilters(!showFilters)}
                  variant="outline"
                  className={`h-11 px-4 rounded-xl border-gray-200 flex items-center gap-2 font-bold text-sm ${showFilters ? 'bg-gray-100' : 'bg-white'}`}
                >
                  <SlidersHorizontal size={16} />
                  Filtres
                </Button>

                <div className="relative" ref={sortMenuRef}>
                  <button
                    onClick={() => setShowSortMenu(!showSortMenu)}
                    className="h-11 px-4 flex items-center justify-between min-w-[200px] bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/20 hover:border-gray-300 transition-colors shadow-sm"
                  >
                    <span>
                      {sortBy === 'popular' ? 'Les plus populaires' : sortBy === 'price-asc' ? 'Prix croissant' : 'Prix décroissant'}
                    </span>
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showSortMenu ? 'rotate-180' : ''}`} />
                  </button>
                  
                  {showSortMenu && (
                    <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-100 rounded-xl shadow-xl z-50 overflow-hidden py-1.5 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { setSortBy('popular'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${sortBy === 'popular' ? 'text-coral-600 bg-coral-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        Les plus populaires
                      </button>
                      <button
                        onClick={() => { setSortBy('price-asc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${sortBy === 'price-asc' ? 'text-coral-600 bg-coral-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        Prix croissant
                      </button>
                      <button
                        onClick={() => { setSortBy('price-desc'); setShowSortMenu(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm font-bold transition-colors ${sortBy === 'price-desc' ? 'text-coral-600 bg-coral-50/50' : 'text-gray-600 hover:bg-gray-50'}`}
                      >
                        Prix décroissant
                      </button>
                    </div>
                  )}
                </div>

                <div className="ml-auto flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {error && (
                <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
                  {error}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" 
                  : "flex flex-col gap-6"
                }>
                  {products.map((product) => (
                    <div key={product.id} className="block">
                      <ProductCardModern
                        image={product.photos[0] || '/images/hero-illustration.png'}
                        category={product.categorie?.nom || 'Divers'}
                        name={product.nom}
                        rating={0}
                        reviewCount={0}
                        price={product.prix_promo ?? product.prix}
                        oldPrice={product.prix_promo ? product.prix : undefined}
                        sellerName={product.vendeur?.nom_boutique || undefined}
                        location={product.vendeur?.quartier || product.vendeur?.commune || undefined}
                        stock={product.stock}
                        createdAt={product.created_at}
                        photosCount={product.photos.length}
                        onAddToCart={() => handleAddToCart(product)}
                        isFavorite={favoriteIds.has(product.id)}
                        onToggleFavorite={() => handleToggleFavorite(product.id)}
                        onClick={() => router.push(`/produits/${product.id}`)}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun résultat</h3>
                  <p className="text-gray-500 mb-8 max-w-xs mx-auto">Nous n'avons trouvé aucun produit correspondant à votre recherche.</p>
                  <Button onClick={() => { setSelectedCategory('Tout'); setSearchQuery(''); }}>Réinitialiser</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </>
  )
}

export default function PublicAccueilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CatalogueContent />
    </Suspense>
  )
}
