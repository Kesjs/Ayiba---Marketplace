'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useCart } from '@/context/CartContext'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

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
  const supabase = createClient()
  const { showToast } = useToast()
  const { addItem } = useCart()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [quantity, setQuantity] = useState(1)
  const [showContactModal, setShowContactModal] = useState(false)

  useEffect(() => {
    fetchProduct()
  }, [params.id])

  const fetchProduct = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()

      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          vendeur:users!products_vendeur_id_fkey(id, full_name, avatar_url, note_moyenne, nb_avis)
        `)
        .eq('id', params.id)
        .eq('statut', 'actif')
        .single()

      if (error) throw error

      // Check if favorite
      let isFavorite = false
      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .eq('product_id', params.id)
          .single()
        isFavorite = !!favData
      }

      setProduct({
        ...data,
        vendeur: data.vendeur,
        distance: 0,
        is_favorite: isFavorite
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

  const handleToggleFavorite = async () => {
    if (!product) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Connectez-vous pour ajouter aux favoris', 'warning')
        return
      }

      if (product.is_favorite) {
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', product.id)

        if (error) throw error
        showToast('Retiré des favoris', 'info')
      } else {
        const { error } = await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            product_id: product.id
          })

        if (error) throw error
        showToast('Ajouté aux favoris', 'success')
      }

      setProduct({ ...product, is_favorite: !product.is_favorite })
    } catch (error) {
      console.error('Error toggling favorite:', error)
      showToast('Erreur lors de la modification des favoris', 'error')
    }
  }

  const handleContactSeller = async () => {
    if (!product) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        showToast('Connectez-vous pour contacter le vendeur', 'warning')
        return
      }

      // Check if conversation exists
      const { data: existingConv } = await supabase
        .from('conversations')
        .select('*')
        .eq('client_id', user.id)
        .eq('vendeur_id', product.vendeur.id)
        .eq('product_id', product.id)
        .single()

      if (existingConv) {
        router.push(`/messages/${existingConv.id}`)
      } else {
        // Create new conversation
        const { data: newConv, error } = await supabase
          .from('conversations')
          .insert({
            client_id: user.id,
            vendeur_id: product.vendeur.id,
            product_id: product.id
          })
          .select()
          .single()

        if (error) throw error
        router.push(`/messages/${newConv.id}`)
      }
    } catch (error) {
      console.error('Error contacting seller:', error)
      showToast('Erreur lors de la création de la conversation', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-lg p-4 h-64 animate-pulse" />
          <div className="bg-white border border-gray-100 rounded-lg p-4 h-48 animate-pulse" />
        </div>
      </div>
    )
  }

  if (!product) return null

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="text-gray-600">
          <i className="ti ti-arrow-left text-xl" />
        </button>
        <h1 className="text-lg font-medium text-gray-900 flex-1">{product.nom}</h1>
        <button
          onClick={handleToggleFavorite}
          className="text-gray-600"
        >
          <i className={`ti ti-heart text-xl ${product.is_favorite ? 'text-coral-400' : ''}`} />
        </button>
      </header>

      {/* Product Images */}
      <div className="bg-white border-b border-gray-100">
        {product.photos.length > 0 ? (
          <img
            src={product.photos[0]}
            alt={product.nom}
            className="w-full h-64 object-cover"
          />
        ) : (
          <div className="w-full h-64 bg-gray-100 flex items-center justify-center">
            <i className="ti ti-photo text-4xl text-gray-300" />
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="flex-1 p-4 space-y-4">
        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-2xl font-medium text-coral-400">
            {product.prix.toLocaleString()} FCFA
          </span>
          {product.ancien_prix && (
            <span className="text-sm text-gray-400 line-through">
              {product.ancien_prix.toLocaleString()} FCFA
            </span>
          )}
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
          <StatusBadge variant="neutral">{product.categorie}</StatusBadge>
        </div>

        {/* Description */}
        <div>
          <h2 className="text-sm font-medium text-gray-900 mb-2">Description</h2>
          <p className="text-sm text-gray-600">{product.description}</p>
        </div>

        {/* Seller Info */}
        <div className="bg-white border border-gray-100 rounded-lg p-4">
          <div className="flex items-center gap-3 mb-3">
            {product.vendeur.avatar_url ? (
              <img
                src={product.vendeur.avatar_url}
                alt={product.vendeur.full_name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center">
                <span className="text-coral-800 font-medium">
                  {product.vendeur.full_name.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-medium text-gray-900">{product.vendeur.full_name}</h3>
              <div className="flex items-center gap-1">
                <i className="ti ti-star text-amber-400 text-xs" />
                <span className="text-xs text-gray-600">
                  {product.vendeur.note_moyenne.toFixed(1)} ({product.vendeur.nb_avis})
                </span>
              </div>
            </div>
          </div>
          <Button variant="secondary" className="w-full" onClick={handleContactSeller}>
            Contacter le vendeur
          </Button>
        </div>
      </div>

      {/* Bottom Action Bar */}
      <div className="bg-white border-t border-gray-100 p-4">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-100 text-gray-600"
          >
            <i className="ti ti-minus" />
          </button>
          <span className="w-8 text-center text-sm font-medium">{quantity}</span>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-gray-100 text-gray-600"
          >
            <i className="ti ti-plus" />
          </button>
        </div>
        <Button variant="primary" className="w-full" onClick={handleAddToCart}>
          Ajouter au panier
        </Button>
      </div>
    </div>
  )
}
