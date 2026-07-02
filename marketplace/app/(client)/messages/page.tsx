'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'

interface Conversation {
  id: string
  vendeur: {
    full_name: string
    avatar_url: string | null
  }
  product: {
    nom: string
    photos: string[]
  } | null
  last_message: {
    contenu: string
    created_at: string
    sender_id: string
  } | null
  unread_count: number
}

export default function MessagesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConversations()
    setupRealtime()
  }, [])

  const fetchConversations = async () => {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data, error } = await supabase
        .from('conversations')
        .select(`
          *,
          vendeur:users!conversations_vendeur_id_fkey(full_name, avatar_url),
          product:products(nom, photos),
          last_message:messages(contenu, created_at, sender_id)
        `)
        .eq('client_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error

      // Count unread messages per conversation
      const conversationsWithUnread = await Promise.all(
        (data || []).map(async (conv: any) => {
          const { count } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('conversation_id', conv.id)
            .eq('lu', false)
            .neq('sender_id', user.id)

          return {
            ...conv,
            unread_count: count || 0
          }
        })
      )

      setConversations(conversationsWithUnread)
    } catch (error) {
      console.error('Error fetching conversations:', error)
      showToast('Erreur lors du chargement des messages', 'error')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtime = () => {
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
  }

  const handleConversationClick = async (conversationId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Mark messages as read
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

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-medium text-gray-900">Messages</h1>
      </header>

      {/* Conversations List */}
      <div className="flex-1">
        {loading ? (
          <div className="space-y-3 p-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-lg p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <i className="ti ti-message-circle-off text-4xl text-gray-400 mb-4" />
            <p className="text-gray-600">Aucune conversation</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {conversations.map((conversation) => (
              <button
                key={conversation.id}
                onClick={() => handleConversationClick(conversation.id)}
                className="w-full bg-white p-4 flex gap-3 hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="relative">
                  {conversation.vendeur.avatar_url ? (
                    <img
                      src={conversation.vendeur.avatar_url}
                      alt={conversation.vendeur.full_name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-coral-100 flex items-center justify-center">
                      <span className="text-coral-800 font-medium">
                        {conversation.vendeur.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  {conversation.unread_count > 0 && (
                    <span className="absolute -top-1 -right-1 bg-coral-400 text-white rounded-full text-[10px] w-5 h-5 flex items-center justify-center">
                      {conversation.unread_count}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium text-gray-900">{conversation.vendeur.full_name}</h3>
                    {conversation.last_message && (
                      <span className="text-xs text-gray-400">
                        {new Date(conversation.last_message.created_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        })}
                      </span>
                    )}
                  </div>
                  {conversation.product && (
                    <p className="text-xs text-gray-500 mb-1 truncate">{conversation.product.nom}</p>
                  )}
                  {conversation.last_message && (
                    <p className="text-sm text-gray-600 truncate">
                      {conversation.last_message.contenu}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
