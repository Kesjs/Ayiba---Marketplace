'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { ClientDashboardHeader } from '@/components/client/ClientDashboardHeader'
import { useUser } from '@/lib/hooks/useUser'
import { useBadgeCounts } from '@/lib/hooks/useBadgeCounts'

interface Order {
  id: string
  statut: string
  statut_paiement: string
  created_at: string
  product: {
    nom: string
    photos: string[]
    prix: number
  }
  vendeur: {
    full_name: string
  }
  quantite: number
  montant_total: number
  review: {
    note: number
    commentaire: string
  } | null
}

export default function HistoriquePage() {
  const router = useRouter()
  const { profile } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const supabase = createClient()
  const { showToast } = useToast()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reviewNote, setReviewNote] = useState(5)
  const [reviewComment, setReviewComment] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          product:products(nom, photos, prix),
          vendeur:users(full_name),
          review:reviews(note, commentaire)
        `)
        .eq('client_id', user.id)
        .in('statut', ['livré', 'annulé'])
        .order('created_at', { ascending: false })

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching history:', error)
      showToast('Erreur lors du chargement de l\'historique', 'error')
    } finally {
      setLoading(false)
    }
  }

  const getStatusVariant = (statut: string): 'success' | 'pending' | 'error' | 'neutral' => {
    const statusMap: Record<string, 'success' | 'pending' | 'error' | 'neutral'> = {
      livré: 'success',
      annulé: 'error'
    }
    return statusMap[statut] || 'neutral'
  }

  const handleSubmitReview = async () => {
    if (!selectedOrder) return

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('reviews')
        .insert({
          order_id: selectedOrder.id,
          client_id: user.id,
          vendeur_id: selectedOrder.vendeur.full_name,
          note: reviewNote,
          commentaire: reviewComment
        })

      if (error) throw error
      showToast('Avis enregistré', 'success')
      setShowReviewModal(false)
      setReviewNote(5)
      setReviewComment('')
      fetchOrders()
    } catch (error) {
      console.error('Error submitting review:', error)
      showToast('Erreur lors de l\'enregistrement de l\'avis', 'error')
    }
  }

  const handleReorder = async (order: Order) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('orders')
        .insert({
          client_id: user.id,
          vendeur_id: order.vendeur.full_name,
          product_id: order.product.nom,
          quantite: order.quantite,
          montant_total: order.montant_total
        })

      if (error) throw error
      showToast('Commande passée', 'success')
      router.push('/commandes')
    } catch (error) {
      console.error('Error reordering:', error)
      showToast('Erreur lors de la commande', 'error')
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <ClientDashboardHeader
        title="Historique"
        backHref="/menu"
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name || undefined}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        onAvatarClick={() => router.push('/profil')}
        logoHref="/accueil"
      />

      {/* Orders List */}
      <div className="flex-1 p-4">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 h-32 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <i className="ti ti-clock text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">Aucune commande terminée</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-5">
                <div className="flex gap-4 mb-4">
                  <img
                    src={order.product.photos[0] || ''}
                    alt={order.product.nom}
                    className="w-14 h-14 object-cover rounded-lg"
                  />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-gray-900 mb-1">{order.product.nom}</h3>
                    <p className="text-xs text-gray-500 mb-1">{order.vendeur.full_name}</p>
                    <p className="text-sm font-medium text-coral-400">
                      {order.montant_total.toLocaleString()} FCFA
                    </p>
                  </div>
                  <StatusBadge variant={getStatusVariant(order.statut)}>{order.statut}</StatusBadge>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                  <span>{new Date(order.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  })}</span>
                  <span>Quantité: {order.quantite}</span>
                </div>

                {/* Review Section */}
                {order.statut === 'livré' && (
                  <div className="border-t border-gray-50 pt-4">
                    {order.review ? (
                      <div className="flex items-center gap-2">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <i
                              key={i}
                              className={`ti ti-star text-sm ${
                                order.review && i < order.review.note ? 'text-amber-400' : 'text-gray-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-sm text-gray-600">{order.review?.commentaire}</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowReviewModal(true)
                        }}
                        className="text-sm text-coral-400 hover:text-coral-600"
                      >
                        Noter le vendeur
                      </button>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-4">
                  {order.statut === 'livré' && (
                    <button
                      onClick={() => handleReorder(order)}
                      className="flex-1 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
                    >
                      Commander à nouveau
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowReviewModal(false)}
          />
          <div className="relative bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-base font-medium text-gray-900 mb-4">Noter le vendeur</h2>
            <div className="flex gap-2 mb-4">
              {[1, 2, 3, 4, 5].map((note) => (
                <button
                  key={note}
                  onClick={() => setReviewNote(note)}
                  className="text-2xl"
                >
                  <i
                    className={`ti ti-star ${
                      note <= reviewNote ? 'text-amber-400' : 'text-gray-200'
                    }`}
                  />
                </button>
              ))}
            </div>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              placeholder="Votre avis..."
              className="w-full h-24 rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-coral-400 outline-none resize-none mb-4"
            />
            <div className="flex gap-3">
              <button
                onClick={() => setShowReviewModal(false)}
                className="flex-1 py-2 rounded-lg border border-gray-100 text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmitReview}
                className="flex-1 py-2 rounded-lg bg-coral-400 text-white text-sm font-medium hover:bg-coral-500 transition-colors"
              >
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
