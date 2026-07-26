'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, XCircle, RotateCcw } from 'lucide-react'

type Statut = 'attente' | 'succes' | 'echec' | 'timeout'

const LOGO_PAR_RESEAU: Record<'mtn' | 'moov' | 'celtiis', { src: string; label: string }> = {
  mtn: { src: '/logos/mtn.png', label: 'MTN MoMo' },
  moov: { src: '/logos/moov.jpg', label: 'Moov Money' },
  celtiis: { src: '/logos/celtiis.jpg', label: 'Celtiis Cash' },
}

const DUREE_TIMEOUT_SECONDES = 90

interface PaiementWaitingOverlayProps {
  statut: Statut
  reseau: 'mtn' | 'moov' | 'celtiis'
  telephone: string
  montant: number
  raisonEchec?: string | null
  onTimeout: () => void
  onReessayer: () => void
  onVoirCommande?: () => void
  // Si fourni, redirige automatiquement vers la commande après ce nombre
  // de secondes une fois le paiement confirmé (le bouton reste utilisable
  // pour ne pas attendre).
  autoRedirectSecondes?: number
}

export function PaiementWaitingOverlay({
  statut,
  reseau,
  telephone,
  montant,
  raisonEchec,
  onTimeout,
  onReessayer,
  onVoirCommande,
  autoRedirectSecondes,
}: PaiementWaitingOverlayProps) {
  const [secondesRestantes, setSecondesRestantes] = useState(DUREE_TIMEOUT_SECONDES)
  const [secondesAvantRedirection, setSecondesAvantRedirection] = useState(autoRedirectSecondes ?? 0)
  const logo = LOGO_PAR_RESEAU[reseau]

  // Redirection automatique vers la commande une fois le paiement confirmé,
  // avec un léger décompte affiché — le bouton "Voir ma commande" reste
  // cliquable à tout moment pour ne pas forcer l'attente.
  useEffect(() => {
    if (statut !== 'succes' || !autoRedirectSecondes || !onVoirCommande) return
    setSecondesAvantRedirection(autoRedirectSecondes)
    const interval = setInterval(() => {
      setSecondesAvantRedirection((s) => {
        if (s <= 1) {
          clearInterval(interval)
          onVoirCommande()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut, autoRedirectSecondes])

  useEffect(() => {
    if (statut !== 'attente') return
    setSecondesRestantes(DUREE_TIMEOUT_SECONDES)
    const interval = setInterval(() => {
      setSecondesRestantes((s) => {
        if (s <= 1) {
          clearInterval(interval)
          onTimeout()
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statut])

  return (
    <div className="fixed inset-0 z-[100] bg-white flex items-center justify-center p-6">
      <AnimatePresence mode="wait">
        {statut === 'attente' && (
          <motion.div
            key="attente"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <div className="relative w-20 h-20 mb-6">
              <div className="absolute inset-0 rounded-2xl bg-gray-50 flex items-center justify-center overflow-hidden">
                <img src={logo.src} alt={logo.label} className="w-14 h-14 object-contain" />
              </div>
              <motion.div
                className="absolute -inset-1.5 rounded-2xl border-2 border-coral-400"
                animate={{ opacity: [0.3, 1, 0.3], scale: [1, 1.04, 1] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
            </div>
            <Loader2 className="animate-spin text-coral-400 mb-4" size={22} />
            <h2 className="text-lg font-bold text-gray-900 mb-2">
              Valide le paiement sur ton téléphone
            </h2>
            <p className="text-sm text-gray-500 mb-1">
              Un message {logo.label} va s&rsquo;afficher sur le {telephone}
            </p>
            <p className="text-sm text-gray-400 mb-6">pour confirmer {montant.toLocaleString('fr-FR')} F</p>
            <p className="text-xs text-gray-300 font-mono">
              {Math.floor(secondesRestantes / 60)}:{String(secondesRestantes % 60).padStart(2, '0')}
            </p>
          </motion.div>
        )}

        {statut === 'succes' && (
          <motion.div
            key="succes"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
            >
              <CheckCircle2 className="text-teal-500 mb-6" size={64} strokeWidth={1.5} />
            </motion.div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Paiement confirmé</h2>
            <p className="text-sm text-gray-500 mb-8">
              {montant.toLocaleString('fr-FR')} F réglés — ta commande est en route vers le vendeur.
            </p>
            {onVoirCommande && (
              <>
                <button
                  onClick={onVoirCommande}
                  className="h-12 px-8 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors"
                >
                  Voir ma commande
                </button>
                {!!autoRedirectSecondes && secondesAvantRedirection > 0 && (
                  <p className="text-xs text-gray-300 mt-4">
                    Redirection automatique dans {secondesAvantRedirection}s...
                  </p>
                )}
              </>
            )}
          </motion.div>
        )}

        {(statut === 'echec' || statut === 'timeout') && (
          <motion.div
            key="echec"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center text-center max-w-sm"
          >
            <XCircle className="text-red-400 mb-6" size={64} strokeWidth={1.5} />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {statut === 'timeout' ? "Pas de réponse" : 'Paiement refusé'}
            </h2>
            <p className="text-sm text-gray-500 mb-8">
              {statut === 'timeout'
                ? "Tu n'as pas validé à temps sur ton téléphone. Ton panier est conservé."
                : raisonEchec === 'transaction.canceled'
                ? 'Le paiement a été annulé. Ton panier est conservé.'
                : "L'opérateur a refusé la transaction. Vérifie ton solde ou réessaie."}
            </p>
            <button
              onClick={onReessayer}
              className="h-12 px-8 rounded-2xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              Réessayer
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
