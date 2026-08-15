'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Send, ArrowRight, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useToast } from '@/context/ToastContext'

interface QuickContactModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendor: {
    id: string
    nom: string
    photo?: string
  }
  productName: string
  productId: string
  userId: string
  onConversationCreated?: () => void
}

export function QuickContactModal({
  open,
  onOpenChange,
  vendor,
  productName,
  productId,
  userId,
  onConversationCreated
}: QuickContactModalProps) {
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
      // Créer une conversation et un message initial
      const response = await fetch('/api/conversations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vendeurId: vendor.id,
          clientId: userId,
          initialMessage: message,
          productId: productId,
          productName: productName
        })
      })

      if (!response.ok) throw new Error('Erreur lors de la création de la conversation')

      const data = await response.json()
      
      setShowConfirmation(true)
      setMessage('')
      
      if (onConversationCreated) {
        onConversationCreated()
      }

      // Rediriger vers messages après 2 secondes
      setTimeout(() => {
        onOpenChange(false)
        setShowConfirmation(false)
        router.push(`/messages?conversation=${data.conversationId}`)
      }, 2000)
    } catch (error) {
      console.error('Erreur:', error)
      showToast('Erreur lors de l\'envoi du message', 'error')
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
        <div
          className="absolute inset-0 bg-black/40"
          onClick={handleClose}
        />
        <div className="relative bg-white rounded-2xl p-8 max-w-sm w-full mx-4 text-center space-y-4">
          <div className="flex justify-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-coral-500 to-coral-600 flex items-center justify-center">
              <Send className="text-white" size={24} />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">Message envoyé !</h2>
          <p className="text-sm text-gray-600">
            Le vendeur va vous répondre dans les messages
          </p>
          <Button 
            onClick={() => {
              handleClose()
              router.push('/messages')
            }}
            className="w-full bg-gradient-to-r from-coral-500 to-coral-600 text-white hover:from-coral-600 hover:to-coral-700"
          >
            Voir la conversation
            <ArrowRight size={16} className="ml-2" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={handleClose}
      />
      <div className="relative bg-white rounded-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header avec gradient */}
        <div className="bg-gradient-to-r from-coral-500 to-coral-600 text-white p-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Contacter le vendeur
          </h2>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-white/20 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Vendeur info */}
          <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
            <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex-shrink-0">
              {vendor.photo ? (
                <Image
                  src={vendor.photo}
                  alt={vendor.nom}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-teal-200 to-teal-300 flex items-center justify-center">
                  <span className="text-sm font-semibold text-teal-700">
                    {vendor.nom.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-gray-900 truncate">
                {vendor.nom}
              </p>
              <p className="text-xs text-gray-500 truncate">
                À propos de : {productName}
              </p>
            </div>
          </div>

          {/* Message input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Votre message
            </label>
            <textarea
              placeholder="Bonjour, j'aimerais en savoir plus..."
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, 500))}
              className="w-full min-h-24 resize-none rounded-lg border border-gray-200 p-3 font-sans text-sm focus:border-coral-500 focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-all"
              disabled={loading}
            />
            <p className="text-xs text-gray-500">
              {message.length}/500 caractères
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={loading}
            >
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
