'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Home, Briefcase, MoreHorizontal, LocateFixed, Loader2, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useToast } from '@/context/ToastContext'
import { useGeolocationAdresse } from '@/lib/hooks/useGeolocationAdresse'
import { COMMUNES_COUVERTES } from '@/lib/constants/communes'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { ChipSelect } from '@/components/ui/ChipSelect'

const OPTIONS_LABEL = [
  { value: 'domicile', label: 'Domicile', icon: Home },
  { value: 'bureau', label: 'Bureau', icon: Briefcase },
  { value: 'autre', label: 'Autre', icon: MoreHorizontal },
]

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
  const { localiser, loading: localisationEnCours } = useGeolocationAdresse()

  // Capturé une seule fois au montage : on se fiche que le paramètre
  // disparaisse ensuite de l'URL.
  const [wasWelcome] = useState(() => searchParams.get('welcome') === '1')
  const [hasChecked, setHasChecked] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [label, setLabel] = useState('domicile')
  const [adresse, setAdresse] = useState('')
  const [quartier, setQuartier] = useState('')
  const [commune, setCommune] = useState('')
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
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

    const checkAddresses = async () => {
      const { count } = await supabase
        .from('addresses')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', profile.id)

      if (cancelled) return
      if (!count) setIsOpen(true)
      setHasChecked(true)
    }

    checkAddresses()

    return () => {
      cancelled = true
    }
  }, [wasWelcome, userLoading, profile, hasChecked, supabase])

  const handleSkip = () => setIsOpen(false)

  // CTA principal : géolocalisation du téléphone. Remplit les coordonnées
  // exactes (le plus important pour le futur calcul des frais de livraison)
  // et propose une commune/quartier détectés, que l'utilisateur peut
  // corriger via les chips juste en dessous si besoin.
  const handleLocaliser = async () => {
    try {
      const resultat = await localiser()
      setLatitude(resultat.latitude)
      setLongitude(resultat.longitude)
      if (resultat.communeDetectee) setCommune(resultat.communeDetectee)
      if (resultat.quartierDetecte) setQuartier(resultat.quartierDetecte)
      showToast('Position détectée', 'success')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Localisation impossible', 'error')
    }
  }

  const handleSave = async () => {
    if (!profile || !quartier.trim() || !commune.trim()) {
      showToast('Merci d\u2019indiquer au moins ton quartier et ta commune', 'error')
      return
    }

    setSaving(true)
    try {
      const { error } = await supabase.from('addresses').insert({
        user_id: profile.id,
        label,
        adresse_complete: adresse.trim(),
        quartier: quartier.trim(),
        commune: commune.trim(),
        latitude,
        longitude,
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
    <Modal isOpen={isOpen} onClose={handleSkip} title="Bienvenue sur Ayiba">
      <p className="text-sm text-gray-500 mb-4">
        Ajoute ton adresse pour des livraisons plus rapides. Tu pourras toujours la modifier plus tard depuis ton profil.
      </p>

      <button
        type="button"
        onClick={handleLocaliser}
        disabled={localisationEnCours}
        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-coral-50 text-coral-700 font-semibold text-sm hover:bg-coral-100 transition-colors disabled:opacity-60"
      >
        {localisationEnCours ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
        {localisationEnCours ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
      </button>

      <AnimatePresence>
        {latitude !== null && longitude !== null && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 10 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-2 text-xs font-semibold text-teal-700 overflow-hidden"
          >
            <CheckCircle2 size={14} />
            Position enregistrée
          </motion.div>
        )}
      </AnimatePresence>

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2 mt-4">Nom de l&rsquo;adresse</p>
      <ChipSelect layoutId="welcome-label" options={OPTIONS_LABEL} value={label} onChange={setLabel} className="mb-4" />

      <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Commune</p>
      <select
        value={commune}
        onChange={(e) => setCommune(e.target.value)}
        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm bg-white mb-4 focus:outline-none focus:border-coral-400"
      >
        <option value="">Choisir une commune...</option>
        {COMMUNES_COUVERTES.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>

      <div className="mb-3">
        <input
          type="text"
          value={quartier}
          onChange={(e) => setQuartier(e.target.value)}
          placeholder="Quartier (ex: Godomey)"
          className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
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
