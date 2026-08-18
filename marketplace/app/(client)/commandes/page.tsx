'use client'

import { useState, useEffect, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { DashboardLayout } from '@/components/dashboard/DashboardLayout'
import { useUser } from '@/lib/hooks/useUser'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { LABELS_STATUT_COMMANDE } from '@/lib/constants/commandes'

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
}

export default function CommandesPage() {
  const supabase = useMemo(() => createClient(), [])
  const { showToast } = useToast()
  const { profile } = useUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active')

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
          id, statut, created_at, montant_total,
          commande_articles(
            quantite,
            article:articles(nom, prix, article_images(image_url))
          ),
          vendeur:vendeurs(nom_boutique)
        `)
        .eq('client_id', user.id)
        .order('created_at', { ascending: false })

      if (activeTab === 'active') {
        query = query.in('statut', ['en_attente', 'confirmee', 'preparee', 'expediee', 'en_attente_verification'])
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

  const getStatusSteps = (statut: string) => {
    const steps = [
      { key: 'en_attente', label: 'En attente' },
      { key: 'confirmee', label: 'Confirmée' },
      { key: 'preparee', label: 'Préparée' },
      { key: 'expediee', label: 'Expédiée' },
      { key: 'livree', label: 'Livrée' }
    ]

    let mappedStatut = statut;
    if (statut === 'en_attente_verification') mappedStatut = 'expediee';

    const currentIndex = steps.findIndex(s => s.key === mappedStatut)
    return steps.map((step, index) => ({
      ...step,
      status: index < currentIndex ? 'past' : index === currentIndex ? 'current' : 'future'
    }))
  }

  return (
    <DashboardLayout role="client" title="Mes commandes">
      <div className="bg-white rounded-2xl border border-gray-100 mb-6 overflow-hidden shadow-sm">
        <div className="flex">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'active'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-4 text-sm font-bold border-b-2 transition-colors ${
              activeTab === 'history'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Historique
          </button>
        </div>
      </div>

      <div className="flex-1 pb-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-5 h-36 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-20 bg-white rounded-3xl border border-gray-50 shadow-sm">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
              <i className="ti ti-shopping-bag text-2xl text-gray-400" />
            </div>
            <p className="text-gray-500 font-medium">
              {activeTab === 'active' ? 'Aucune commande en cours' : 'Aucune commande terminée'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => {
              const firstItem = order.commande_articles?.[0]
              const article = firstItem?.article
              const photo = article?.article_images?.[0]?.image_url || ''
              
              const labelStatut = (LABELS_STATUT_COMMANDE as any)[order.statut] || order.statut;

              return (
                <Link key={order.id} href={`/commandes/${order.id}`} className="block">
                  <div className="bg-white border border-gray-100 rounded-2xl p-5 transition-all hover:shadow-md hover:border-gray-200 group">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden shrink-0">
                        {photo ? (
                          <img src={photo} alt={article?.nom || ''} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300">
                            <i className="ti ti-photo" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="text-sm font-bold text-gray-900 truncate">
                            {article?.nom || "Commande"} {order.commande_articles?.length > 1 ? `(+${order.commande_articles.length - 1})` : ''}
                          </h3>
                          <span className="text-sm font-bold whitespace-nowrap text-coral-500">
                            {order.montant_total.toLocaleString('fr-FR')} FCFA
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mb-3 truncate">
                          Vendu par <span className="font-medium text-gray-700">{order.vendeur?.nom_boutique}</span>
                        </p>

                        {/* Progress Bar compacte */}
                        <div className="flex items-center gap-1.5 w-full">
                          {getStatusSteps(order.statut).map((step, idx) => (
                            <div key={step.key} className="flex-1 flex flex-col gap-1.5">
                              <div
                                className={`h-1.5 rounded-full w-full ${
                                  step.status === 'past'
                                    ? 'bg-teal-500'
                                    : step.status === 'current'
                                    ? 'bg-gray-900'
                                    : 'bg-gray-100'
                                }`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="flex justify-between items-center mt-3">
                           <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                             Statut: <span className={order.statut === 'livree' ? 'text-teal-600' : 'text-gray-900'}>{labelStatut}</span>
                           </span>
                           <div className="flex items-center gap-1 text-xs font-bold text-coral-500 opacity-0 group-hover:opacity-100 transition-all -translate-x-2 group-hover:translate-x-0">
                             Voir les détails <ChevronRight size={14} />
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
