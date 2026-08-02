'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useCart, cartKey } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/ui/Navbar'
import { CheckoutFooter } from '@/components/checkout/CheckoutFooter'
import { Button } from '@/components/ui/Button'
import { StepIndicator, type WizardStep } from '@/components/kyc/StepIndicator'
import { MobileMoneySelector } from '@/components/kyc/MobileMoneySelector'
import { PaiementWaitingOverlay } from '@/components/checkout/PaiementWaitingOverlay'
import { getDistanceRoutiereKm } from '@/lib/osrm'
import { validateBeninPhone } from '@/lib/validation'
import {
  ChevronLeft, ChevronDown, ShoppingBag, Wallet, ShieldCheck,
  Plus, Minus, Trash2, Loader2, Home, Briefcase, MoreHorizontal, MapPin,
  Route, AlertCircle, Truck, CheckCircle2,
} from 'lucide-react'

const CHECKOUT_STEPS: WizardStep[] = [
  { label: 'Livraison', icon: Truck },
  { label: 'Paiement', icon: Wallet },
  { label: 'Confirmation', icon: CheckCircle2 },
]

interface Address {
  id: string
  label: string
  adresse_complete: string
  quartier: string
  commune: string
  latitude: number | null
  longitude: number | null
  est_defaut: boolean
}

interface FraisLivraison {
  distance_km: number
  frais_livraison: number
  distance_fiable: boolean
}

type Etape = 'livraison' | 'paiement' | 'confirmation'
type StatutPaiement = 'attente' | 'succes' | 'echec' | 'timeout'

function iconePourLabel(label: string) {
  if (label === 'bureau') return Briefcase
  if (label === 'domicile') return Home
  return MoreHorizontal
}

function stylePourLabel(label: string) {
  if (label === 'bureau') return 'bg-teal-50 text-teal-600'
  if (label === 'domicile') return 'bg-coral-50 text-coral-500'
  return 'bg-gray-100 text-gray-500'
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile, loading: userLoading } = useUser()
  const { items, total, updateQty, removeItem, updatePrix, clearCart } = useCart()
  const { showToast } = useToast()

  // Le panier garde le prix capturé au moment de l'ajout (localStorage) — si
  // une promo a été ajoutée/retirée/modifiée depuis, on paierait un montant
  // obsolète. On revalide donc systématiquement contre la base au chargement
  // du checkout, avant même que le client voie un total.
  useEffect(() => {
    if (items.length === 0) return
    let annule = false
    ;(async () => {
      const ids = Array.from(new Set(items.map((i) => i.id)))
      const { data, error } = await supabase.from('articles').select('id, prix, prix_promo').in('id', ids)
      if (error || !data || annule) return
      const prixActuelParId = new Map(
        data.map((a: { id: string; prix: number; prix_promo: number | null }) => [a.id, a.prix_promo ?? a.prix])
      )
      let auMoinsUnChangement = false
      for (const item of items) {
        const prixActuel = prixActuelParId.get(item.id)
        if (prixActuel != null && prixActuel !== item.prix) {
          updatePrix(cartKey(item), prixActuel)
          auMoinsUnChangement = true
        }
      }
      if (auMoinsUnChangement) {
        showToast('Le prix de certains articles a été mis à jour', 'info')
      }
    })()
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const [etape, setEtape] = useState<Etape>('livraison')

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)

  const [nomClient, setNomClient] = useState('')
  const [telephone, setTelephone] = useState('')

  const [fraisParVendeur, setFraisParVendeur] = useState<Record<string, FraisLivraison>>({})
  const [calculFraisEnCours, setCalculFraisEnCours] = useState(false)
  const [coordsParVendeur, setCoordsParVendeur] = useState<
    Record<string, { latitude: number | null; longitude: number | null }>
  >({})

  // Étape 2 — Paiement
  const [reseau, setReseau] = useState<'mtn' | 'moov' | 'celtiis' | ''>('')
  const [telephoneMomo, setTelephoneMomo] = useState('')
  const [recapOuvert, setRecapOuvert] = useState(false)
  const [passageEnCours, setPassageEnCours] = useState(false)
  const [declenchementEnCours, setDeclenchementEnCours] = useState(false)
  const [paiementCheckoutId, setPaiementCheckoutId] = useState<string | null>(null)
  const [statutPaiement, setStatutPaiement] = useState<StatutPaiement | null>(null)
  const [raisonEchec, setRaisonEchec] = useState<string | null>(null)
  // Le délai de 150s affiché dans l'overlay est purement visuel : la
  // transaction FedaPay peut aboutir après coup (opérateur lent, réseau
  // faible). On continue donc à écouter en arrière-plan même une fois
  // l'écran "Pas de réponse" affiché, pour basculer automatiquement vers le
  // succès si la confirmation finit par arriver plutôt que de laisser le
  // client bloqué sur un faux échec.
  const [attentePassiveDepassee, setAttentePassiveDepassee] = useState(false)
  const [erreurInitiation, setErreurInitiation] = useState<string | null>(null)
  const [commandeIds, setCommandeIds] = useState<string[]>([])
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Garde l'ID de paiement en cours dans l'URL (sans navigation ni rechargement
  // de la page — juste l'historique du navigateur) pour pouvoir le restaurer
  // si l'utilisateur actualise pendant qu'il attend la confirmation MoMo.
  function synchroniserUrlPaiement(id: string | null) {
    const url = new URL(window.location.href)
    if (id) url.searchParams.set('paiement', id)
    else url.searchParams.delete('paiement')
    window.history.replaceState(null, '', url.toString())
  }

  // Reprise après un refresh : si l'URL contient encore ?paiement=xxx, on
  // relance l'écran d'attente et on interroge tout de suite le statut actuel
  // (au cas où le paiement se soit résolu pendant que la page était rechargée).
  useEffect(() => {
    const idEnCours = new URLSearchParams(window.location.search).get('paiement')
    if (!idEnCours) return
    setPaiementCheckoutId(idEnCours)
    setStatutPaiement('attente')
    setEtape('paiement')
    fetch(`/api/paiements/statut?id=${idEnCours}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!data) return
        if (data.reseau) setReseau(data.reseau)
        if (data.telephone) setTelephoneMomo(data.telephone)
        appliquerResultatPaiement(data)
      })
      .catch(() => {
        // silencieux — le polling normal (démarré par paiementCheckoutId) prendra le relais
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (userLoading) return
    if (!user) {
      showToast('Connecte-toi pour passer commande', 'info')
      router.push('/explorer')
      return
    }
    if (items.length === 0 && etape === 'livraison' && !paiementCheckoutId) {
      router.push('/explorer')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user, items.length, paiementCheckoutId])

  useEffect(() => {
    if (profile) {
      setNomClient(profile.full_name || '')
      // profile.phone peut encore contenir d'anciens formats (8 chiffres sans
      // le préfixe "01", avec ou sans indicatif "+229" déjà collé devant) —
      // on normalise avant de préremplir, sinon on affiche un "+229" en
      // double dans le champ Mobile Money (qui ajoute déjà son propre badge
      // indicatif) et un numéro à 8 chiffres non conforme à la nouvelle
      // numérotation ARCEP (10 chiffres, préfixe 01) depuis le 30/11/2024.
      const { isValid, formatted } = validateBeninPhone(profile.phone || '')
      setTelephone(isValid ? formatted : profile.phone || '')
      setTelephoneMomo(isValid ? formatted.replace('+229', '') : (profile.phone || '').replace(/\D/g, '').replace(/^229/, ''))
    }
  }, [profile])

  useEffect(() => {
    if (!user) return
    const loadAddresses = async () => {
      setLoadingAddresses(true)
      const { data } = await supabase
        .from('addresses')
        .select('id, label, adresse_complete, quartier, commune, latitude, longitude, est_defaut')
        .eq('user_id', user.id)
        .order('est_defaut', { ascending: false })

      const rows = (data as Address[]) || []
      setAddresses(rows)
      if (rows.length > 0) {
        setSelectedAddressId(rows[0].id)
      }
      setLoadingAddresses(false)
    }
    loadAddresses()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  // Une "commande" = un seul vendeur. Le panier peut contenir plusieurs
  // vendeurs, donc on le scinde ici avant de créer les commandes.
  const groupesParVendeur = items.reduce<Record<string, typeof items>>((acc, item) => {
    acc[item.vendeur_id] = acc[item.vendeur_id] || []
    acc[item.vendeur_id].push(item)
    return acc
  }, {})
  const nbVendeurs = Object.keys(groupesParVendeur).length

  const adresseActive = (() => {
    const addr = addresses.find((a) => a.id === selectedAddressId)
    return addr ? { commune: addr.commune, latitude: addr.latitude, longitude: addr.longitude } : null
  })()

  // Coordonnées GPS des vendeurs présents dans le panier — nécessaires pour
  // calculer la distance routière réelle (OSRM) vendeur -> client. Rechargé
  // uniquement quand la liste de vendeurs du panier change.
  useEffect(() => {
    const vendeurIds = Object.keys(groupesParVendeur)
    if (vendeurIds.length === 0) {
      setCoordsParVendeur({})
      return
    }
    let annule = false
    ;(async () => {
      const { data, error }: {
        data: { id: string; latitude: number | null; longitude: number | null }[] | null
        error: unknown
      } = await supabase.from('vendeurs').select('id, latitude, longitude').in('id', vendeurIds)
      if (annule || error || !data) return
      setCoordsParVendeur(
        Object.fromEntries(
          data.map((v) => [v.id, { latitude: v.latitude, longitude: v.longitude }])
        )
      )
    })()
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Object.keys(groupesParVendeur).join(',')])

  // Chantier 2 : dès que l'adresse a au moins une commune, on calcule le
  // frais réel par vendeur (RPC `calculer_frais_livraison`).
  useEffect(() => {
    if (!adresseActive?.commune || nbVendeurs === 0) {
      setFraisParVendeur({})
      return
    }
    let annule = false
    setCalculFraisEnCours(true)
    Promise.all(
      Object.keys(groupesParVendeur).map(async (vendeurId) => {
        // Distance routière réelle (OSRM) quand on a les 4 coordonnées ;
        // sinon on laisse p_distance_route_km à null et la fonction Postgres
        // retombe elle-même sur haversine/commune (voir calculer_frais_livraison).
        const coordsVendeur = coordsParVendeur[vendeurId]
        let distanceRouteKm: number | null = null
        if (
          coordsVendeur?.latitude != null &&
          coordsVendeur?.longitude != null &&
          adresseActive.latitude != null &&
          adresseActive.longitude != null
        ) {
          distanceRouteKm = await getDistanceRoutiereKm(
            coordsVendeur.latitude,
            coordsVendeur.longitude,
            adresseActive.latitude,
            adresseActive.longitude
          )
        }

        const { data, error } = await supabase.rpc('calculer_frais_livraison', {
          p_vendeur_id: vendeurId,
          p_latitude: adresseActive.latitude,
          p_longitude: adresseActive.longitude,
          p_commune: adresseActive.commune,
          p_distance_route_km: distanceRouteKm,
        })
        if (error) throw error
        return [vendeurId, data as FraisLivraison] as const
      })
    )
      .then((entries) => {
        if (annule) return
        setFraisParVendeur(Object.fromEntries(entries))
      })
      .catch((err) => {
        console.error('[checkout] calculer_frais_livraison error:', err)
      })
      .finally(() => {
        if (!annule) setCalculFraisEnCours(false)
      })
    return () => {
      annule = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    adresseActive?.commune,
    adresseActive?.latitude,
    adresseActive?.longitude,
    Object.keys(groupesParVendeur).join(','),
    coordsParVendeur,
  ])

  const totalFraisLivraison = Object.values(fraisParVendeur).reduce((acc, f) => acc + f.frais_livraison, 0)
  const totalGeneral = total + totalFraisLivraison
  const estimationSeulement = Object.values(fraisParVendeur).some((f) => !f.distance_fiable)

  // Adresse finale figée au moment où on passe à l'étape Paiement (évite
  // qu'un changement d'adresse pendant l'attente du paiement désynchronise
  // ce qui a été affiché du total payé).
  const [adresseFinale, setAdresseFinale] = useState<{
    adresse_complete: string
    quartier: string
    commune: string
    latitude: number | null
    longitude: number | null
  } | null>(null)

  const passerAuPaiement = async () => {
    if (!user || passageEnCours) return
    setPassageEnCours(true)
    try {
      const addr = addresses.find((a) => a.id === selectedAddressId)
      if (!addr) {
        showToast('Choisis une adresse de livraison', 'error')
        return
      }

      if (!nomClient.trim() || !telephone.trim()) {
        showToast('Indique ton nom et un numéro de téléphone', 'error')
        return
      }

      setAdresseFinale(addr)
      setEtape('paiement')
    } finally {
      setPassageEnCours(false)
    }
  }

  // Abonnement Realtime + filet de sécurité (polling) pendant l'attente — et
  // encore un moment après le faux timeout visuel (voir attentePassiveDepassee).
  useEffect(() => {
    if (!paiementCheckoutId || (statutPaiement !== 'attente' && !(statutPaiement === 'timeout' && attentePassiveDepassee))) return

    const channel = supabase
      .channel(`paiement-checkout-${paiementCheckoutId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'paiements_checkout',
          filter: `id=eq.${paiementCheckoutId}`,
        },
        (payload: any) => {
          appliquerResultatPaiement(payload.new)
        }
      )
      .subscribe()

    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/paiements/statut?id=${paiementCheckoutId}`)
        if (!res.ok) return
        const data = await res.json()
        appliquerResultatPaiement(data)
      } catch {
        // silencieux — la prochaine tentative (ou Realtime) prendra le relais
      }
    }, 4000)

    return () => {
      supabase.removeChannel(channel)
      if (pollRef.current) clearInterval(pollRef.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paiementCheckoutId, statutPaiement])

  function appliquerResultatPaiement(row: { statut: string; commande_ids?: string[] | null; raison_echec?: string | null }) {
    if (row.statut === 'paye') {
      if (pollRef.current) clearInterval(pollRef.current)
      setCommandeIds(row.commande_ids || [])
      setStatutPaiement('succes')
      synchroniserUrlPaiement(null)
      clearCart()
    } else if (row.statut === 'echoue') {
      if (pollRef.current) clearInterval(pollRef.current)
      setRaisonEchec(row.raison_echec || null)
      setStatutPaiement('echec')
      synchroniserUrlPaiement(null)
    }
  }

  const declencherPaiement = async () => {
    if (!reseau) {
      showToast('Choisis un réseau Mobile Money', 'error')
      return
    }
    if (!telephoneMomo.trim()) {
      showToast('Indique le numéro Mobile Money', 'error')
      return
    }
    if (!adresseFinale) return

    setDeclenchementEnCours(true)
    setErreurInitiation(null)
    // Le serveur peut mettre du temps à se réveiller (cold start Render) —
    // on laisse 20s avant d'abandonner plutôt que de laisser Safari décider
    // seul, ce qui donne juste "Load failed" sans explication à l'utilisateur.
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 20000)
    try {
      const adresseLigne = [adresseFinale.adresse_complete, adresseFinale.quartier, adresseFinale.commune]
        .filter(Boolean)
        .join(', ')

      const groupes = Object.entries(groupesParVendeur).map(([vendeurId, articlesVendeur]) => ({
        vendeur_id: vendeurId,
        articles: articlesVendeur.map((a) => ({ article_id: a.id, quantite: a.quantite, variante_id: a.varianteId ?? null })),
        nom_client: nomClient.trim(),
        telephone_client: telephone.trim(),
        adresse_livraison: adresseLigne,
        commune: adresseFinale.commune,
        latitude: adresseFinale.latitude,
        longitude: adresseFinale.longitude,
      }))

      const res = await fetch('/api/paiements/initier', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupes,
          montant: totalGeneral,
          reseau,
          telephone: telephoneMomo.trim(),
          nomClient: nomClient.trim(),
        }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Échec du déclenchement du paiement')

      setPaiementCheckoutId(data.paiementCheckoutId)
      setStatutPaiement('attente')
      setRaisonEchec(null)
      setAttentePassiveDepassee(false)
      synchroniserUrlPaiement(data.paiementCheckoutId)
    } catch (err) {
      console.error('[checkout] initier paiement error:', err)
      if (err instanceof DOMException && err.name === 'AbortError') {
        // Le serveur n'a pas répondu à temps (souvent un cold start).
        setErreurInitiation("Le serveur met trop de temps à répondre. Réessaie dans quelques secondes.")
      } else if (err instanceof TypeError) {
        // fetch() échoue avec un TypeError ("Load failed", "Failed to fetch"...)
        // uniquement quand la requête n'a jamais atteint le serveur : coupure
        // réseau, wifi/4G instable, etc. — jamais une erreur métier FedaPay.
        setErreurInitiation("Connexion réseau interrompue. Vérifie ta connexion et réessaie.")
      } else {
        // Erreur métier renvoyée par notre API (FedaPay, validation, etc.)
        setErreurInitiation(err instanceof Error ? err.message : 'Impossible de démarrer le paiement')
      }
    } finally {
      clearTimeout(timeoutId)
      setDeclenchementEnCours(false)
    }
  }

  const reessayerPaiement = () => {
    setStatutPaiement(null)
    setPaiementCheckoutId(null)
    setRaisonEchec(null)
    setAttentePassiveDepassee(false)
    synchroniserUrlPaiement(null)
  }

  // Bouton Payer à 3 états : guide l'utilisateur sans jamais afficher de message d'erreur pour un simple champ manquant
  const paiementDisabled = !reseau || !telephoneMomo.trim() || declenchementEnCours
  const libellePayer = declenchementEnCours
    ? 'Connexion...'
    : !reseau
    ? 'Choisis un réseau'
    : !telephoneMomo.trim()
    ? 'Indique ton numéro'
    : `Payer ${totalGeneral.toLocaleString('fr-FR')} F`

  if (userLoading || !user || (items.length === 0 && etape === 'livraison' && !paiementCheckoutId)) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {statutPaiement && (
        <PaiementWaitingOverlay
          statut={statutPaiement}
          reseau={reseau as 'mtn' | 'moov' | 'celtiis'}
          telephone={telephoneMomo}
          montant={totalGeneral}
          raisonEchec={raisonEchec}
          onTimeout={() => {
            setStatutPaiement('timeout')
            setAttentePassiveDepassee(true)
          }}
          onReessayer={reessayerPaiement}
          onVoirCommande={() =>
            router.push(commandeIds.length === 1 ? `/commandes/${commandeIds[0]}` : '/commandes')
          }
        />
      )}

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-32 md:pb-8">
        <button
          onClick={() => (etape === 'paiement' ? setEtape('livraison') : router.back())}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ChevronLeft size={16} />
          Retour
        </button>

        <div className="mb-6">
          <StepIndicator
            currentStep={etape === 'livraison' ? 1 : etape === 'paiement' ? 2 : 3}
            steps={CHECKOUT_STEPS}
          />
        </div>

        {etape === 'livraison' && (
          <>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Finaliser la commande</h1>

            {nbVendeurs > 1 && (
              <div className="mb-6 p-3 rounded-xl bg-amber-50 text-amber-700 text-sm">
                Ton panier contient des articles de {nbVendeurs} boutiques différentes — ça fera {nbVendeurs} commandes séparées, une par boutique.
              </div>
            )}

            {/* Récap panier */}
            <section className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
                Ton panier ({items.length})
              </h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={cartKey(item)} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100">
                    <img
                      src={item.photos[0] || '/images/hero-illustration.png'}
                      alt={item.nom}
                      className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-50"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{item.nom}</p>
                      {item.varianteNom && (
                        <p className="text-xs text-gray-400 truncate">{item.varianteNom}</p>
                      )}
                      <p className="text-sm text-gray-500">{item.prix.toLocaleString('fr-FR')} F</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => updateQty(cartKey(item), item.quantite - 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-6 text-center text-sm font-bold">{item.quantite}</span>
                      <button
                        onClick={() => updateQty(cartKey(item), item.quantite + 1)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <button
                      onClick={() => removeItem(cartKey(item))}
                      className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 shrink-0"
                      aria-label="Retirer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </section>

            {/* Adresse de livraison */}
            <section className="mb-8">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">
                  Adresse de livraison
                </h2>
                {addresses.length > 0 && (
                  <button
                    onClick={() => router.push('/adresses/nouvelle?retour=/checkout')}
                    className="flex items-center gap-1 text-xs font-semibold text-coral-500 hover:text-coral-600"
                  >
                    <Plus size={14} /> Ajouter
                  </button>
                )}
              </div>

              {loadingAddresses ? (
                <div className="h-24 rounded-2xl bg-gray-50 animate-pulse" />
              ) : addresses.length === 0 ? (
                <button
                  onClick={() => router.push('/adresses/nouvelle?retour=/checkout')}
                  className="w-full flex flex-col items-center gap-2 p-6 rounded-2xl border-2 border-dashed border-gray-200 text-gray-500 hover:border-coral-300 hover:text-coral-600 transition-colors"
                >
                  <MapPin size={22} />
                  <span className="text-sm font-semibold">Ajouter une adresse de livraison</span>
                </button>
              ) : (
                <div className="space-y-3">
                  {addresses.map((addr, index) => {
                    const IconeAdresse = iconePourLabel(addr.label)
                    const estSelectionnee = selectedAddressId === addr.id
                    return (
                      <motion.label
                        key={addr.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.04, duration: 0.25 }}
                        className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                          estSelectionnee
                            ? 'border-coral-400 bg-coral-50/40 shadow-sm shadow-coral-100'
                            : 'border-gray-100 hover:border-gray-200'
                        }`}
                      >
                        <input
                          type="radio"
                          name="address"
                          checked={estSelectionnee}
                          onChange={() => setSelectedAddressId(addr.id)}
                          className="sr-only"
                        />
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            estSelectionnee ? 'border-coral-500 bg-coral-500' : 'border-gray-300'
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full bg-white transition-opacity ${estSelectionnee ? 'opacity-100' : 'opacity-0'}`} />
                        </div>
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${stylePourLabel(addr.label)}`}>
                          <IconeAdresse size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold text-gray-900 capitalize">{addr.label}</p>
                            {addr.est_defaut && (
                              <span className="text-[10px] font-bold text-coral-600 bg-coral-50 rounded-full px-2 py-0.5">
                                Par défaut
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">
                            {[addr.quartier, addr.commune].filter(Boolean).join(', ')}
                          </p>
                          {addr.adresse_complete && (
                            <p className="text-xs text-gray-400 truncate">{addr.adresse_complete}</p>
                          )}
                        </div>
                      </motion.label>
                    )
                  })}
                </div>
              )}
            </section>

            {/* Contact */}
            <section className="mb-8">
              <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-1">
                Qui réceptionne la commande ?
              </h2>
              <p className="text-xs text-gray-400 mb-3">Tes coordonnées, pour que le livreur puisse te joindre.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  value={nomClient}
                  onChange={(e) => setNomClient(e.target.value)}
                  placeholder="Nom complet"
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
                />
                <input
                  type="tel"
                  value={telephone}
                  onChange={(e) => setTelephone(e.target.value)}
                  placeholder="Téléphone"
                  className="h-11 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
                />
              </div>
            </section>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-amber-50 rounded-xl">
                <Wallet size={18} className="text-amber-500" />
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Paiement bloqué jusqu'à réception</span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5 p-3 bg-teal-50 rounded-xl">
                <ShieldCheck size={18} className="text-teal-500" />
                <span className="text-[11px] font-bold text-gray-700 leading-tight">Vendeur vérifié</span>
              </div>
            </div>

            {adresseActive?.commune && (
              <section className="mb-6 space-y-2">
                {Object.entries(groupesParVendeur).map(([vendeurId], index) => {
                  const frais = fraisParVendeur[vendeurId]
                  return (
                    <motion.div
                      key={vendeurId}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.25 }}
                      className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-teal-50/60 text-sm"
                    >
                      <div className="flex items-center gap-2 text-gray-600">
                        <Route size={14} className="text-teal-500 shrink-0" />
                        {nbVendeurs > 1 ? `Livraison boutique ${index + 1}` : 'Frais de livraison'}
                        {frais && !frais.distance_fiable && (
                          <span className="text-[10px] font-semibold text-amber-600 bg-amber-50 rounded-full px-2 py-0.5">
                            estimé
                          </span>
                        )}
                      </div>
                      {calculFraisEnCours || !frais ? (
                        <Loader2 size={14} className="animate-spin text-gray-300" />
                      ) : (
                        <span className="font-bold text-gray-800">{frais.frais_livraison.toLocaleString('fr-FR')} F</span>
                      )}
                    </motion.div>
                  )
                })}
              </section>
            )}

            <div className="hidden md:flex items-center justify-between p-5 rounded-2xl bg-gray-50">
              <div>
                <p className="text-xs text-gray-400">Sous-total articles + livraison</p>
                <p className="text-2xl font-black text-gray-900">
                  {calculFraisEnCours ? (
                    <Loader2 size={20} className="animate-spin text-gray-300 inline" />
                  ) : (
                    `${totalGeneral.toLocaleString('fr-FR')} F`
                  )}
                </p>
                {adresseActive?.commune ? (
                  estimationSeulement && (
                    <p className="text-[11px] text-amber-600 mt-1 flex items-center gap-1">
                      <AlertCircle size={12} /> Frais estimés, sans GPS précis
                    </p>
                  )
                ) : (
                  <p className="text-[11px] text-gray-400 mt-1">Choisis une adresse pour voir le total réel</p>
                )}
              </div>
              <Button onClick={passerAuPaiement} disabled={passageEnCours} className="min-w-[220px]">
                {passageEnCours ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
                Continuer{totalGeneral > 0 ? ` — ${totalGeneral.toLocaleString('fr-FR')} F` : ''}
              </Button>
            </div>
          </>
        )}

        {etape === 'paiement' && adresseFinale && (
          <>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-6">Paiement</h1>

            {/* Récap en accordéon fermé, pour ne pas distraire au moment de payer */}
            <section className="mb-6">
              <button
                onClick={() => setRecapOuvert((v) => !v)}
                className="w-full flex items-center justify-between p-4 rounded-2xl bg-gray-50"
              >
                <span className="text-sm font-semibold text-gray-700">
                  {items.length} article{items.length > 1 ? 's' : ''} · {[adresseFinale.quartier, adresseFinale.commune].filter(Boolean).join(', ')}
                </span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${recapOuvert ? 'rotate-180' : ''}`} />
              </button>
              <AnimatePresence initial={false}>
                {recapOuvert && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="pt-3 space-y-2">
                      {items.map((item) => (
                        <div key={cartKey(item)} className="flex items-center justify-between text-sm px-1">
                          <span className="text-gray-600">
                            {item.quantite}× {item.nom}
                            {item.varianteNom && <span className="text-gray-400"> ({item.varianteNom})</span>}
                          </span>
                          <span className="font-semibold text-gray-800">{(item.prix * item.quantite).toLocaleString('fr-FR')} F</span>
                        </div>
                      ))}
                      {Object.entries(groupesParVendeur).map(([vendeurId], index) => {
                        const frais = fraisParVendeur[vendeurId]
                        return (
                          <div key={vendeurId} className="flex items-center justify-between text-sm px-1 text-gray-500">
                            <span>{nbVendeurs > 1 ? `Livraison boutique ${index + 1}` : 'Livraison'}</span>
                            <span>{frais ? `${frais.frais_livraison.toLocaleString('fr-FR')} F` : '—'}</span>
                          </div>
                        )
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </section>

            <section className="mb-6">
              <MobileMoneySelector
                selected={reseau}
                onSelect={(r) => { setReseau(r); setErreurInitiation(null) }}
                phoneNumber={telephoneMomo}
                onPhoneChange={(v) => { setTelephoneMomo(v); setErreurInitiation(null) }}
                montant={totalGeneral}
              />
            </section>

            {erreurInitiation && (
              <div className="mb-6 flex items-start gap-3 p-4 rounded-2xl bg-red-50">
                <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-red-700">Le paiement n'a pas pu démarrer</p>
                  <p className="text-xs text-red-600 mt-0.5">{erreurInitiation}</p>
                </div>
                <button
                  onClick={declencherPaiement}
                  disabled={declenchementEnCours}
                  className="shrink-0 text-xs font-bold text-coral-600 hover:text-coral-700 px-3 py-1.5 rounded-full border border-coral-200 hover:bg-coral-50 transition-colors disabled:opacity-50"
                >
                  Réessayer
                </button>
              </div>
            )}

            <div className="hidden md:flex items-center justify-between p-5 rounded-2xl bg-gray-50">
              <div>
                <p className="text-xs text-gray-400">Total à payer</p>
                <p className="text-2xl font-black text-gray-900">{totalGeneral.toLocaleString('fr-FR')} F</p>
              </div>
              <Button
                onClick={declencherPaiement}
                disabled={paiementDisabled}
                className={`min-w-[220px] transition-shadow ${!paiementDisabled ? 'shadow-lg shadow-coral-500/30' : ''}`}
              >
                {declenchementEnCours ? <Loader2 size={16} className="animate-spin" /> : <Wallet size={16} />}
                {libellePayer}
              </Button>
            </div>
          </>
        )}
      </main>

      {/* Barre sticky mobile — change d'action selon l'étape */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-white border-t border-gray-100 p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] z-50 shadow-[0_-4px_20px_rgba(0,0,0,0.08)]">
        <div className="flex items-center gap-3">
          <div className="shrink-0">
            <p className="text-xl font-black text-gray-900 leading-none">
              {calculFraisEnCours ? (
                <Loader2 size={16} className="animate-spin text-gray-300 inline" />
              ) : (
                `${totalGeneral.toLocaleString('fr-FR')} F`
              )}
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              {etape === 'paiement'
                ? 'à payer'
                : adresseActive?.commune
                ? (nbVendeurs > 1 ? 'articles + livraisons' : 'articles + livraison')
                : '+ livraison'}
            </p>
            {etape === 'livraison' && adresseActive?.commune && estimationSeulement && (
              <p className="text-[10px] text-amber-600 mt-0.5 flex items-center gap-1">
                <AlertCircle size={10} /> Frais estimés, sans GPS précis
              </p>
            )}
          </div>
          {etape === 'livraison' ? (
            <button
              onClick={passerAuPaiement}
              disabled={passageEnCours}
              className="flex-1 h-13 rounded-2xl bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {passageEnCours ? <Loader2 size={16} className="animate-spin" /> : null}
              Continuer
            </button>
          ) : (
            <button
              onClick={declencherPaiement}
              disabled={paiementDisabled}
              className={`flex-1 h-13 rounded-2xl bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white font-bold text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 ${
                !paiementDisabled ? 'shadow-lg shadow-coral-500/30' : 'shadow-md'
              }`}
            >
              {declenchementEnCours ? <Loader2 size={16} className="animate-spin" /> : null}
              {libellePayer}
            </button>
          )}
        </div>
      </div>

      <div className="hidden">
        <Link href="/explorer">Continuer mes achats</Link>
      </div>

      <CheckoutFooter />
    </div>
  )
}
