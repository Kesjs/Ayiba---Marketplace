'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { MessageCircleOff, Store, Bike, LifeBuoy } from 'lucide-react'

interface Conversation {
  id: string
  type: 'vendeur' | 'livreur' | 'support'
  vendeur: { full_name: string; avatar_url: string | null } | null
  livreur: { full_name: string; avatar_url: string | null } | null
  product: { nom: string; photos: string[] } | null
  last_message: { contenu: string; created_at: string; sender_id: string } | null
  unread_count: number
}

// Onglets Vendeurs / Livreurs / Support — voir dashboard-client.md section 7.
// Nécessite la migration 0006 (colonnes type + livreur_id sur conversations).
const ONGLETS = [
  { id: 'vendeur' as const, label: 'Vendeurs', icon: Store },
  { id: 'livreur' as const, label: 'Livreurs', icon: Bike },
  { id: 'support' as const, label: 'Support', icon: LifeBuoy },
]

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [onglet, setOnglet] = useState<'vendeur' | 'livreur' | 'support'>('vendeur')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          id, type,
          vendeur:users!conversations_vendeur_id_fkey(full_name, avatar_url),
          livreur:users!conversations_livreur_id_fkey(full_name, avatar_url),
          product:products(nom, photos),
          last_message:messages(contenu, created_at, sender_id)
        `)
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('lu', false)
            .neq('sender_id', user.id)

          return { ...conv, unread_count: count || 0 }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      showToast('Erreur lors du chargement des messages', 'error')
    } finally {
      setLoading(false)
    }
  }, [supabase, showToast])

  useEffect(() => {
    fetchConversations()
    const channel = supabase
      .channel('messages-client')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
        fetchConversations()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase, fetchConversations])

  const handleConversationClick = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await supabase
        .from('messages')
        .update({ lu: true })
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)

      router.push(`/messages/${conversationId}`)
    } catch (error) {
      console.error('Error marking as read:', error)
    }
  }

  const conversationsFiltrees = conversations.filter((c) => c.type === onglet)

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      {/* Header + onglets — sticky pour rester visible en scroll, mobile-first */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="px-4 pt-4 pb-2">
          <h1 className="text-lg font-bold text-gray-900">Messages</h1>
        </div>
        <div className="flex px-4 gap-1 overflow-x-auto">
          {ONGLETS.map((o) => {
            const actif = onglet === o.id
            const count = conversations.filter((c) => c.type === o.id && c.unread_count > 0).length
            return (
              <button
                key={o.id}
                onClick={() => setOnglet(o.id)}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  actif ? 'border-coral-400 text-coral-600' : 'border-transparent text-gray-400'
                }`}
              >
                <o.icon size={15} />
                {o.label}
                {count > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center bg-coral-400 text-white text-[10px] rounded-full">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </header>

      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : conversationsFiltrees.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
            <MessageCircleOff size={36} className="text-gray-300 mb-4" />
            <p className="text-gray-500 text-sm">Aucune conversation {ONGLETS.find((o) => o.id === onglet)?.label.toLowerCase()}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversationsFiltrees.map((conversation) => {
              const interlocuteur = conversation.type === 'vendeur' ? conversation.vendeur : conversation.livreur
              const nom = interlocuteur?.full_name || (conversation.type === 'support' ? 'Support Ayiba' : 'Utilisateur')
              return (
                <button
                  key={conversation.id}
                  onClick={() => handleConversationClick(conversation.id)}
                  className="w-full bg-white p-4 flex gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    {interlocuteur?.avatar_url ? (
                      <img
                        src={interlocuteur.avatar_url}
                        alt={nom}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-coral-50 flex items-center justify-center">
                        <span className="text-coral-600 font-bold">{nom.charAt(0).toUpperCase()}</span>
                      </div>
                    )}
                    {conversation.unread_count > 0 && (
                      <span className="absolute -top-1 -right-1 bg-coral-400 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
                        {conversation.unread_count}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 text-left min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-gray-900 truncate">{nom}</h3>
                      {conversation.last_message && (
                        <span className="text-[11px] text-gray-400 shrink-0">
                          {new Date(conversation.last_message.created_at).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      )}
                    </div>
                    {conversation.product && (
                      <p className="text-xs text-gray-500 mb-1 truncate">{conversation.product.nom}</p>
                    )}
                    {conversation.last_message && (
                      <p className="text-sm text-gray-500 truncate">{conversation.last_message.contenu}</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
