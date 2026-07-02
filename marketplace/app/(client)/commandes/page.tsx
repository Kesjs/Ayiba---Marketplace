'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'

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
  otp_livraison: string
  otp_confirme: boolean
  livreur_latitude: number | null
  livreur_longitude: number | null
}

export default function CommandesPage() {
  const supabase = createClient()
  const { showToast } = useToast()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')
  const [showOtpModal, setShowOtpModal] = useState(false)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [disputeReason, setDisputeReason] = useState('')

  useEffect(() => {
    fetchOrders()
    setupRealtime()
  }, [activeTab])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('orders')
        .select(`
          *,
          product:products(nom, photos, prix),
          vendeur:users(full_name)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (activeTab === 'active') {
        query = query.in('statut', ['en_attente', 'payé', 'en_preparation', 'collecté', 'en_livraison'])
      } else {
        query = query.in('statut', ['livré', 'annulé'])
      }

      const { data, error } = await query

      if (error) throw error
      setOrders(data || [])
    } catch (error) {
      console.error('Error fetching orders:', error)
      showToast('Erreur lors du chargement des commandes', 'error')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
    const channel = supabase
      .channel('orders-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleConfirmDelivery = async () => {
    if (!selectedOrder || otpInput !== selectedOrder.otp_livraison) {
      showToast('Code OTP incorrect', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('orders')
        .update({ otp_confirme: true, statut: 'livré' })
        .eq('id', selectedOrder.id)

      if (error) throw error
      showToast('Livraison confirmée', 'success')
      setShowOtpModal(false)
      setOtpInput('')
      fetchOrders()
    } catch (error) {
      console.error('Error confirming delivery:', error)
      showToast('Erreur lors de la confirmation', 'error')
    }
  }

  const getStatusVariant = (statut: string): 'success' | 'pending' | 'error' | 'neutral' => {
    const statusMap: Record<string, 'success' | 'pending' | 'error' | 'neutral'> = {
      en_attente: 'pending',
      payé: 'success',
      en_preparation: 'pending',
      collecté: 'pending',
      en_livraison: 'pending',
      livré: 'success',
      annulé: 'error'
    }
    return statusMap[statut] || 'neutral'
  }

  const handleOpenDispute = async () => {
    if (!selectedOrder || !disputeReason) {
      showToast('Veuillez renseigner le motif', 'warning')
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { error } = await supabase
        .from('disputes')
        .insert({
          order_id: selectedOrder.id,
          client_id: user.id,
          motif: disputeReason
        })

      if (error) throw error
      showToast('Litige ouvert, le séquestre est bloqué', 'warning')
      setShowDisputeModal(false)
      setDisputeReason('')
    } catch (error) {
      console.error('Error opening dispute:', error)
      showToast('Erreur lors de l\'ouverture du litige', 'error')
    }
  }

  const getStatusSteps = (statut: string) => {
    const steps = [
      { key: 'en_attente', label: 'En attente' },
      { key: 'payé', label: 'Payé' },
      { key: 'en_preparation', label: 'Préparation' },
      { key: 'collecté', label: 'Collecté' },
      { key: 'en_livraison', label: 'En livraison' },
      { key: 'livré', label: 'Livré' }
    ]

    const currentIndex = steps.findIndex(s => s.key === statut)
    return steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'past' : index === currentIndex ? 'current' : 'future'
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-medium text-gray-900">Mes commandes</h1>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-100">
        <div className="flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-coral-400 text-coral-400'
                : 'border-transparent text-gray-400'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-coral-400 text-coral-400'
                : 'border-transparent text-gray-400'
            }`}
          >
            Terminées
          </button>
        </div>
      </div>

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
            <i className="ti ti-shopping-bag text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">
              {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande terminée'}
            </p>
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

                {activeTab === 'active' && (
                  <>
                    {/* Timeline */}
                    <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
                      {getStatusSteps(order.statut).map((step, index) => (
                        <div key={step.key} className="flex flex-col items-center min-w-[60px]">
                          <div
                            className={`w-3 h-3 rounded-full ${
                              step.status === 'past'
                                ? 'bg-teal-400'
                                : step.status === 'current'
                                ? 'bg-coral-400 animate-pulse'
                                : 'bg-gray-100'
                            }`}
                          />
                          <span className="text-[11px] text-gray-600 mt-1">{step.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Delivery Map (if en_livraison) */}
                    {order.statut === 'en_livraison' && order.livreur_latitude && order.livreur_longitude && (
                      <div className="bg-gray-50 rounded-lg h-40 mb-4 flex items-center justify-center">
                        <p className="text-sm text-gray-600">Carte de livraison en temps réel</p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                      {order.statut === 'en_livraison' && !order.otp_confirme && (
                        <Button
                          variant="primary"
                          className="flex-1"
                          onClick={() => {
                            setSelectedOrder(order)
                            setShowOtpModal(true)
                          }}
                        >
                          Confirmer la réception
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="flex items-center gap-2"
                        onClick={() => {
                          setSelectedOrder(order)
                          setShowDisputeModal(true)
                        }}
                      >
                        <i className="ti ti-alert-triangle text-amber-400" />
                        Signaler un problème
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* OTP Modal */}
      {showOtpModal && selectedOrder && (
        <Modal
          isOpen={showOtpModal}
          onClose={() => {
            setShowOtpModal(false)
            setOtpInput('')
          }}
          title="Confirmer la réception"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Entrez le code de livraison à 6 chiffres</p>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value)}
              className="w-full h-10 rounded-lg border border-gray-100 px-3 text-center text-2xl font-medium text-coral-400 focus:border-coral-400 outline-none"
              placeholder="000000"
            />
            <Button variant="primary" className="w-full" onClick={handleConfirmDelivery}>
              Valider
            </Button>
          </div>
        </Modal>
      )}

      {/* Dispute Modal */}
      {showDisputeModal && (
        <Modal
          isOpen={showDisputeModal}
          onClose={() => {
            setShowDisputeModal(false)
            setDisputeReason('')
          }}
          title="Signaler un problème"
        >
          <div className="space-y-4">
            <textarea
              value={disputeReason}
              onChange={(e) => setDisputeReason(e.target.value)}
              placeholder="Décrivez le problème rencontré..."
              className="w-full h-32 rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-coral-400 outline-none resize-none"
            />
            <Button variant="primary" className="w-full" onClick={handleOpenDispute}>
              Ouvrir le litige
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )
}
