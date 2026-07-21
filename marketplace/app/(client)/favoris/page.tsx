'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { ProductCardModern } from '@/components/ui/ProductCardVariants'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { ClientDashboardHeader } from '@/components/client/ClientDashboardHeader'
import { useUser } from '@/lib/hooks/useUser'
import { useBadgeCounts } from '@/lib/hooks/useBadgeCounts'
import {
  ARTICLE_CARD_SELECT,
  ArticleCard,
  ArticleCardRow,
  fetchArticleRatings,
  fetchFavoriteIds,
  mapArticleRow,
  toggleFavorite,
} from '@/lib/catalogue'

export default function FavorisPage() {
  const router = useRouter()
  const { profile } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const supabase = createClient()
  const { showToast } = useToast()
  const { addItem } = useCart()

  const [products, setProducts] = useState<ArticleCard[]>([])
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (profile) {
      fetchFavorites()
    }
  }, [profile?.id])

  const fetchFavorites = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const ids = await fetchFavoriteIds(supabase, profile.id)
      setFavoriteIds(ids)

      if (ids.size === 0) {
        setProducts([])
        return
      }

      const { data, error } = await supabase
        .from('articles')
        .select(ARTICLE_CARD_SELECT)
        .in('id', Array.from(ids))

      if (error) throw error

      const rows = (data || []) as unknown as ArticleCardRow[]
      const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id))
      setProducts(rows.map((r) => mapArticleRow(r, ratings)))
    } catch (error) {
      console.error('Error fetching favorites:', error)
      showToast('Erreur lors du chargement des favoris', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: ArticleCard) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id,
      photos: product.photos,
    })
    showToast('Ajouté au panier', 'success')
  }

  const handleToggleFavorite = async (productId: string) => {
    if (!profile) return
    const isFav = favoriteIds.has(productId)
    const nowFav = await toggleFavorite(supabase, profile.id, productId, isFav)
    setFavoriteIds((prev) => {
      const next = new Set(prev)
      if (nowFav) next.add(productId)
      else next.delete(productId)
      return next
    })
    if (!nowFav) {
      // Retiré : on l'enlève aussi de la liste affichée sans tout recharger.
      setProducts((prev) => prev.filter((p) => p.id !== productId))
    }
    showToast(nowFav ? 'Ajouté aux favoris' : 'Retiré des favoris', 'success')
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <ClientDashboardHeader
        title="Favoris"
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name || undefined}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        onAvatarClick={() => router.push('/profil')}
        logoHref="/accueil"
      />

      {/* Product List */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="grid grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <i className="ti ti-heart-off text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">Aucun favori pour le moment</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {products.map((product) => (
              <Link key={product.id} href={`/produits/${product.id}`} className="block">
                <ProductCardModern
                  image={product.photos[0] || ''}
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
      </div>
    </div>
  )
}
