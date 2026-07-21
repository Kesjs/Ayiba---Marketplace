'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useToast } from '@/context/ToastContext'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

/**
 * Mini-étape post-inscription, skippable : proposée une seule fois au client
 * fraîchement inscrit (redirigé vers /catalogue?welcome=1), s'il n'a encore
 * aucune adresse enregistrée. Ne bloque jamais le parcours — l'adresse reste
 * de toute façon redemandée à la commande (commandes.adresse_livraison).
 */
export function WelcomeAddressModal() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const { showToast } = useToast()
  const { profile, loading: userLoading } = useUser()

  // Capturé une seule fois au montage : on se fiche que le paramètre
  // disparaisse ensuite de l'URL.
  const [wasWelcome] = useState(() => searchParams.get('welcome') === '1')
  const [hasChecked, setHasChecked] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [adresse, setAdresse] = useState('')
  const [quartier, setQuartier] = useState('')
  const [commune, setCommune] = useState('')
  const [saving, setSaving] = useState(false)

  // Nettoie l'URL tout de suite pour ne pas rouvrir la modale sur un
  // refresh ou un retour arrière.
  useEffect(() => {
    if (!wasWelcome) return
    const params = new URLSearchParams(searchParams.toString())
    params.delete('welcome')
    router.replace(params.toString() ? `/catalogue?${params.toString()}` : '/catalogue')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (!wasWelcome || userLoading || hasChecked) return

    if (!profile || profile.role !== 'client') {
      setHasChecked(true)
      return
    }

    let cancelled = false
    supabase
      .from('addresses')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', profile.id)
      .then(({ count }) => {
        if (cancelled) return
        if (!count) setIsOpen(true)
        setHasChecked(true)
      })

    return () => {
      cancelled = true
    }
  }, [wasWelcome, userLoading, profile, hasChecked, supabase])

  const handleSkip = () => setIsOpen(false)

  const handleSave = async () => {
    if (!profile || !quartier.trim() || !commune.trim()) {
      showToast('Merci d\u2019indiquer au moins ton quartier et ta commune', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: profile.id,
        label: 'domicile',
        adresse_complete: adresse.trim(),
        quartier: quartier.trim(),
        commune: commune.trim(),
        est_defaut: true,
      })

      if (error) throw error

      showToast('Adresse enregistrée', 'success')
      setIsOpen(false)
    } catch (err) {
      console.error('Error saving welcome address:', err)
      showToast('Erreur lors de l\u2019enregistrement de l\u2019adresse', 'error')
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal isOpen={isOpen} onClose={handleSkip} title="Bienvenue sur Ayiba \u{1F44B}">
      <p className="text-sm text-gray-500 mb-4">
        Ajoute ton adresse pour des livraisons plus rapides. Tu pourras toujours la modifier plus tard depuis ton profil.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <input
          type="text"
          value={commune}
          onChange={(e) => setCommune(e.target.value)}
          placeholder="Commune (ex: Calavi)"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
        />
        <input
          type="text"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          placeholder="Quartier (ex: Godomey)"
          className="h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
        />
      </div>

      <div className="mb-4">
        <div className="flex items-start border border-gray-200 rounded-lg px-3 py-2 focus-within:border-coral-400 transition-colors">
          <MapPin size={16} className="text-gray-400 shrink-0 mt-2" />
          <textarea
            value={adresse}
            onChange={(e) => setAdresse(e.target.value)}
            placeholder="Rue, précisions (facultatif)"
            rows={2}
            autoFocus
            className="flex-1 text-sm px-2 py-1.5 focus:outline-none resize-none"
          />
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={handleSkip} disabled={saving}>
          Plus tard
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={saving || !quartier.trim() || !commune.trim()}>
          {saving ? 'Enregistrement...' : 'Enregistrer'}
        </Button>
      </div>
    </Modal>
  )
}
