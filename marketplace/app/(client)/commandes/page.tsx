'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QrScannerModal } from '@/components/scanner/QrScannerModal'
import { QrCode, Keyboard } from 'lucide-react'

interface Order {
  id: string
  statut: string
  created_at: string
  commande_articles: {
    quantite: number
    article: {
      nom: string
      prix: number
      article_images: { image_url: string }[]
    }
  }[]
  vendeur: {
    nom_boutique: string
  }
  montant_total: number
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
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [confirmMode, setConfirmMode] = useState<'choice' | 'scan' | 'manual'>('choice')
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [otpInput, setOtpInput] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [disputeReason, setDisputeReason] = useState('')

  useEffect(() => {
    fetchOrders()
    const cleanup = setupRealtime()
    return cleanup
  }, [activeTab])

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let query = supabase
        .from('commandes')
        .select(`
          id, statut, created_at, montant_total, otp_confirme,
          livreur_latitude, livreur_longitude,
          commande_articles(
            quantite,
            article:articles(nom, prix, article_images(image_url))
          ),
          vendeur:vendeurs(nom_boutique)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (activeTab === 'active') {
        query = query.in('statut', ['en_attente', 'confirmee', 'preparee', 'expediee'])
      } else {
        query = query.in('statut', ['livree', 'annulee', 'remboursee'])
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
      .channel('commandes-client')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'commandes' }, () => {
        fetchOrders()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const confirmDelivery = async (code: string) => {
    if (!selectedOrder) return

    setConfirming(true)
    try {
      const { error } = await supabase.rpc('client_confirmer_livraison', {
        p_commande_id: selectedOrder.id,
        p_code: code,
      })

      if (error) {
        showToast(error.message || 'Code incorrect ou expiré', 'error')
        setConfirmMode('choice')
        return
      }

      showToast('Livraison confirmée', 'success')
      closeConfirmModal()
      fetchOrders()
    } catch (error) {
      console.error('Error confirming delivery:', error)
      showToast('Erreur lors de la confirmation', 'error')
    } finally {
      setConfirming(false)
    }
  }

  const handleManualConfirm = () => {
    if (otpInput.length !== 6) {
      showToast('Veuillez entrer un code à 6 chiffres', 'error')
      return
    }
    confirmDelivery(otpInput)
  }

  const handleQrScan = (decodedText: string) => {
    confirmDelivery(decodedText)
  }

  const closeConfirmModal = () => {
    setShowConfirmModal(false)
    setConfirmMode('choice')
    setOtpInput('')
  }

  const getStatusVariant = (statut: string): 'success' | 'pending' | 'error' | 'neutral' => {
    const statusMap: Record<string, 'success' | 'pending' | 'error' | 'neutral'> = {
      en_attente: 'pending',
      confirmee: 'success',
      preparee: 'pending',
      expediee: 'pending',
      livree: 'success',
      annulee: 'error',
      remboursee: 'error'
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
          commande_id: selectedOrder.id,
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
      { key: 'confirmee', label: 'Confirmée' },
      { key: 'preparee', label: 'Préparation' },
      { key: 'expediee', label: 'Expédiée' },
      { key: 'livree', label: 'Livrée' }
    ]

    const currentIndex = steps.findIndex(s => s.key === statut)
    return steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'past' : index === currentIndex ? 'current' : 'future'
    }))
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-medium text-gray-900">Mes commandes</h1>
      </header>

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
            {orders.map((order) => {
              const firstItem = order.commande_articles?.[0]
              const article = firstItem?.article
              const photo = article?.article_images?.[0]?.image_url || ''

              return (
                <div key={order.id} className="bg-white border border-gray-100 rounded-lg p-5">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={photo}
                      alt={article?.nom || ''}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900 mb-1">{article?.nom}</h3>
                      <p className="text-xs text-gray-500 mb-1">{order.vendeur?.nom_boutique}</p>
                      <p className="text-sm font-medium text-coral-400">
                        {order.montant_total.toLocaleString()} FCFA
                      </p>
                    </div>
                    <StatusBadge variant={getStatusVariant(order.statut)}>{order.statut}</StatusBadge>
                  </div>

                  {activeTab === 'active' && (
                    <>
                      <div className="flex items-center justify-between mb-4 overflow-x-auto pb-2">
                        {getStatusSteps(order.statut).map((step) => (
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

                      {order.statut === 'expediee' && order.livreur_latitude && order.livreur_longitude && (
                        <div className="bg-gray-50 rounded-lg h-40 mb-4 flex items-center justify-center">
                          <p className="text-sm text-gray-600">Carte de livraison en temps réel</p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {order.statut === 'expediee' && !order.otp_confirme && (
                          <Button
                            variant="primary"
                            className="flex-1"
                            onClick={() => {
                              setSelectedOrder(order)
                              setConfirmMode('choice')
                              setShowConfirmModal(true)
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
              )
            })}
          </div>
        )}
      </div>

      {/* Choix : scanner ou saisie manuelle */}
      {showConfirmModal && selectedOrder && confirmMode === 'choice' && (
        <Modal isOpen={showConfirmModal} onClose={closeConfirmModal} title="Confirmer la réception">
          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-4">
              Demande au livreur d'afficher son QR code, ou entre le code de secours à 6 chiffres.
            </p>
            <button
              onClick={() => setConfirmMode('scan')}
              className="w-full h-14 rounded-xl border border-gray-200 flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors"
            >
              <QrCode className="text-coral-400" size={22} />
              <span className="font-medium text-gray-900">Scanner le QR code</span>
            </button>
            <button
              onClick={() => setConfirmMode('manual')}
              className="w-full h-14 rounded-xl border border-gray-200 flex items-center gap-3 px-4 hover:bg-gray-50 transition-colors"
            >
              <Keyboard className="text-coral-400" size={22} />
              <span className="font-medium text-gray-900">Entrer le code manuellement</span>
            </button>
          </div>
        </Modal>
      )}

      {/* Scanner caméra */}
      <QrScannerModal
        isOpen={showConfirmModal && confirmMode === 'scan'}
        onClose={closeConfirmModal}
        onScan={handleQrScan}
      />

      {/* Saisie manuelle */}
      {showConfirmModal && confirmMode === 'manual' && (
        <Modal isOpen={showConfirmModal} onClose={closeConfirmModal} title="Code de secours">
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Entrez le code de livraison à 6 chiffres</p>
            <input
              type="text"
              maxLength={6}
              value={otpInput}
              onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
              className="w-full h-10 rounded-lg border border-gray-100 px-3 text-center text-2xl font-medium text-coral-400 focus:border-coral-400 outline-none"
              placeholder="000000"
              inputMode="numeric"
            />
            <Button variant="primary" className="w-full" onClick={handleManualConfirm} disabled={confirming}>
              {confirming ? 'Vérification...' : 'Valider'}
            </Button>
          </div>
        </Modal>
      )}

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
