'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Send, ArrowRight, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'
import { createClient } from '@/lib/supabase/client'

interface ContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  recipient: {
    id: string
    nom: string
    photo?: string
  }
  /** Ex: "À propos de : Montre connectée" ou "Boutique Chez Awa" — affiché
   *  sous le nom du destinataire pour donner le contexte du contact. */
  contextLabel?: string
  userId: string
  /** /messages, /vendeur/messages ou /livreur/messages selon le rôle de
   *  l'expéditeur — pour le bouton "Voir la conversation" une fois envoyé. */
  messagesBasePath: string
}

/**
 * Modal "Contacter" unique, réutilisé partout dans l'app (fiche produit,
 * accueil, liste boutiques, fiche boutique, catalogue vendeur). Écrit
 * directement dans la table `messages` (expediteur_id/destinataire_id),
 * exactement comme le font déjà useClientMessages/useVendeurMessages/
 * useLivreurMessages — pas de table `conversations` séparée, pas d'API
 * dédiée : une conversation, ici, c'est juste l'historique des messages
 * entre deux utilisateurs, retrouvable ensuite dans /messages.
 */
export function ContactModal({
  open,
  onOpenChange,
  recipient,
  contextLabel,
  userId,
  messagesBasePath,
}: ContactModalProps) {
  const router = useRouter()
  const { showToast } = useToast()
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)

  if (!open) return null

  const handleSendMessage = async () => {
    if (!message.trim()) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.from('messages').insert({
        expediteur_id: userId,
        destinataire_id: recipient.id,
        contenu: message.trim(),
      })

      if (error) throw error

      setShowConfirmation(true)
      setMessage('')
    } catch (error) {
      console.error('Erreur:', error)
      showToast("Erreur lors de l'envoi du message", 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setShowConfirmation(false)
    setMessage('')
    onOpenChange(false)
  }

  if (showConfirmation) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
        <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center">
              <Send className="text-white" size={24} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Message envoyé !</h2>
          <p className="text-sm text-gray-600">
            {recipient.nom} vous répondra dans les messages
          </p>
          <div className="flex flex-col gap-2">
            <Button
              onClick={() => {
                handleClose()
                router.push(`${messagesBasePath}?vendeur=${recipient.id}`)
              }}
              className="w-full bg-gradient-to-r from-coral-500 to-coral-600 text-white hover:from-coral-600 hover:to-coral-700"
            >
              Voir la conversation
              <ArrowRight size={16} className="ml-2" />
            </Button>
            <Button variant="outline" onClick={handleClose} className="w-full">
              Fermer
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        <div className="bg-gradient-to-r from-coral-500 to-coral-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Contacter</h2>
          <button onClick={handleClose} className="p-1 hover:bg-white/20 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {recipient.photo ? (
                <Image src={recipient.photo} alt={recipient.nom} fill className="object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-200 to-teal-300 flex items-center justify-center">
                  <span className="text-sm font-semibold text-teal-700">
                    {recipient.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">{recipient.nom}</p>
              {contextLabel && <p className="text-xs text-gray-500 truncate">{contextLabel}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Votre message</label>
            <textarea
              placeholder="Bonjour, j'aimerais en savoir plus..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              className="w-full min-h-24 resize-none rounded-lg border border-gray-200 p-3 font-sans text-sm focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all"
              disabled={loading}
              autoFocus
            />
            <p className="text-xs text-gray-500">{message.length}/500 caractères</p>
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="outline" onClick={handleClose} className="flex-1" disabled={loading}>
              Annuler
            </Button>
            <Button
              onClick={handleSendMessage}
              disabled={!message.trim() || loading}
              className="flex-1 bg-gradient-to-r from-coral-500 to-coral-600 text-white hover:from-coral-600 hover:to-coral-700"
            >
              {loading ? 'Envoi...' : 'Envoyer'}
              <Send size={16} className="ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
