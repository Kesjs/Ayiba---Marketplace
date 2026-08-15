'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { ClientDashboardHeader } from '@/components/client/ClientDashboardHeader'
import { AuthModal } from '@/components/ui/AuthModal'
import { useUser } from '@/lib/hooks/useUser'
import { useBadgeCounts } from '@/lib/hooks/useBadgeCounts'
import { createClient } from '@/lib/supabase/client'
import { fetchFavoriteIds, toggleFavorite } from '@/lib/catalogue'
import { getArticlesPublics, getCategoriesActives, type ArticlePublic } from '@/lib/queries/articles'
import { useCallback } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

function saluerSelonHeure(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Bonjour'
  if (h < 18) return 'Bon après-midi'
  return 'Bonsoir'
}

export default function AccueilPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const { showToast } = useToast()
  const { profile } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const supabase = createClient()

  const displayName = profile?.full_name || 'Utilisateur'
  const prenom = displayName.split(' ')[0]

  const [products, setProducts] = useState<ArticlePublic[]>([])
  const [categories, setCategories] = useState<{ nom: string; slug: string }[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedCategory, setSelectedCategory] = useState('Tout')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent')
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [authModalOpen, setAuthModalOpen] = useState(false)

  useEffect(() => {
    if (!profile) {
      setFavoriteIds(new Set())
      return
    }
    fetchFavoriteIds(supabase, profile.id).then(setFavoriteIds)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id])

  const categoryLabels = ['Tout', ...categories.map((c) => c.nom)]

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const [articles, cats] = await Promise.all([
          // Un vendeur connecté ne doit pas voir (ni pouvoir acheter) ses
          // propres articles ici — cf. contrainte DB
          // commandes_client_different_vendeur.
          getArticlesPublics({
            excludeVendeurId: profile?.role === 'vendeur' ? profile.id : undefined,
          }),
          getCategoriesActives(),
        ])
        if (cancelled) return
        setProducts(articles)
        setCategories(cats)
      } catch (err) {
        console.error('Erreur chargement catalogue:', err)
        if (!cancelled) setError('Impossible de charger les produits.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [profile?.id, profile?.role])

  const filteredProducts = products
    .filter((p) => selectedCategory === 'Tout' || p.categorie?.nom === selectedCategory)
    .filter((p) => {
      const needle = search.trim().toLocaleLowerCase()
      return !needle || `${p.nom} ${p.description || ''}`.toLocaleLowerCase().includes(needle)
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return (a.prix_promo ?? a.prix) - (b.prix_promo ?? b.prix)
      if (sortBy === 'price-desc') return (b.prix_promo ?? b.prix) - (a.prix_promo ?? a.prix)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })

  const handleToggleFavorite = async (productId: string) => {
    if (!profile) {
      setAuthModalOpen(true)
      return
    }
    const isFav = favoriteIds.has(productId)
    try {
      const nowFav = await toggleFavorite(supabase, profile.id, productId, isFav)
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

  const handleCategoryClick = useCallback((categoryName: string) => setSelectedCategory(categoryName), [])

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      <ClientDashboardHeader
        title="Tableau de bord"
        greeting={`${saluerSelonHeure()} ${prenom} 👋`}
        subtitle="Découvrez les meilleures offres de votre quartier"
        avatarUrl={profile?.avatar_url}
        fullName={displayName}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        onAvatarClick={() => router.push('/profil')}
        logoHref="/accueil"
      />

      {/* Categories Bar */}
      <section className="bg-white border-b border-gray-50 flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar shrink-0">
        {categoryLabels.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryClick(cat)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/20'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <label className="relative flex-1">
              <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher un produit" className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none focus:border-coral-400" />
            </label>
            <label className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 text-sm text-gray-600">
              <SlidersHorizontal size={17} />
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="bg-transparent py-3 outline-none">
                <option value="recent">Plus récents</option><option value="price-asc">Prix croissant</option><option value="price-desc">Prix décroissant</option>
              </select>
            </label>
          </div>
          {error && (
            <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center">
              <p className="font-semibold text-gray-700">Aucun produit pour le moment</p>
              <p className="text-sm text-gray-400">Revenez bientôt, de nouveaux articles arrivent régulièrement.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.photos[0] || '/images/hero-illustration.png'}
                  category={product.categorie?.nom || 'Divers'}
                  name={product.nom}
                  rating={0}
                  reviewCount={0}
                  price={product.prix_promo ?? product.prix}
                  oldPrice={product.prix_promo ? product.prix : undefined}
                  onClick={() => router.push(`/produits/${product.id}`)}
                  onAddToCart={() => {
                    addItem({
                      id: product.id,
                      nom: product.nom,
                      prix: product.prix_promo ?? product.prix,
                      photos: product.photos,
                      vendeur_id: product.vendeur_id,
                    })
                    showToast('Produit ajouté au panier !', 'success')
                  }}
                  isFavorite={favoriteIds.has(product.id)}
                  onToggleFavorite={() => handleToggleFavorite(product.id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
      />
    </div>
  )
}
