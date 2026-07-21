'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { ClientDashboardHeader } from '@/components/client/ClientDashboardHeader'
import { useUser } from '@/lib/hooks/useUser'
import { useBadgeCounts } from '@/lib/hooks/useBadgeCounts'

interface Product {
  id: string
  nom: string
  description: string
  prix: number
  ancien_prix: number | null
  categorie: string
  photos: string[]
  vendeur_id: string
}

export default function FavorisPage() {
  const router = useRouter()
  const { profile } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const supabase = createClient()
  const { showToast } = useToast()
  const { addItem } = useCart()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchFavorites()
  }, [])

  const fetchFavorites = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('favorites')
        .select(`
          product:products(*)
        `)
        .eq('user_id', user.id)

      if (error) throw error

      setProducts(data?.map((f: any) => f.product).filter(Boolean) || [])
    } catch (error) {
      console.error('Error fetching favorites:', error)
      showToast('Erreur lors du chargement des favoris', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddToCart = (product: Product) => {
    addItem({
      id: product.id,
      nom: product.nom,
      prix: product.prix,
      vendeur_id: product.vendeur_id,
      photos: product.photos
    })
    showToast('Ajouté au panier', 'success')
  }

  const handleToggleFavorite = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: existing } = await supabase
        .from('favorites')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .single()

      if (existing) {
        await supabase.from('favorites').delete().eq('id', existing.id)
        showToast('Retiré des favoris', 'info')
        fetchFavorites()
      }
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showToast('Erreur lors de la modification des favoris', 'error')
    }
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
          <div className="space-y-3">
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
          <div className="space-y-3">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                image={product.photos[0] || ''}
                category={product.categorie}
                name={product.nom}
                rating={4.5}
                reviewCount={12}
                price={product.prix}
                oldPrice={product.ancien_prix || undefined}
                onAddToCart={() => handleAddToCart(product)}
                onToggleFavorite={() => handleToggleFavorite(product.id)}
                onClick={() => router.push(`/produits/${product.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
