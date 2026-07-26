'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { useUser } from '@/lib/hooks/useUser'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { AnimatePresence, motion } from 'framer-motion'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { Button } from '@/components/ui/Button'
import { ChipSelect } from '@/components/ui/ChipSelect'
import { useGeolocationAdresse } from '@/lib/hooks/useGeolocationAdresse'
import { COMMUNES_COUVERTES } from '@/lib/constants/communes'
import {
  MapPin, ChevronLeft, ShoppingBag, Wallet, ShieldCheck,
  Plus, Minus, Trash2, Loader2, Home, Briefcase, MoreHorizontal, LocateFixed,
  Route, AlertCircle,
} from 'lucide-react'

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

const OPTIONS_LABEL = [
  { value: 'domicile', label: 'Domicile', icon: Home },
  { value: 'bureau', label: 'Bureau', icon: Briefcase },
  { value: 'autre', label: 'Autre', icon: MoreHorizontal },
]

const OPTIONS_COMMUNE = COMMUNES_COUVERTES.map((c) => ({ value: c, label: c }))

// Icône affichée dans la liste de sélection selon le label de l'adresse.
function iconePourLabel(label: string) {
  if (label === 'bureau') return Briefcase
  if (label === 'domicile') return Home
  return MoreHorizontal
}

export default function CheckoutPage() {
  const router = useRouter()
  const supabase = createClient()
  const { user, profile, loading: userLoading } = useUser()
  const { items, total, updateQty, removeItem, clearCart } = useCart()
  const { showToast } = useToast()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loadingAddresses, setLoadingAddresses] = useState(true)
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [addingNew, setAddingNew] = useState(false)

  const [nomClient, setNomClient] = useState('')
  const [telephone, setTelephone] = useState('')
  const [nouveauLabel, setNouveauLabel] = useState('domicile')
  const [nouvelleCommune, setNouvelleCommune] = useState('')
  const [nouveauQuartier, setNouveauQuartier] = useState('')
  const [nouvelleAdresse, setNouvelleAdresse] = useState('')
  const [nouvelleLatitude, setNouvelleLatitude] = useState<number | null>(null)
  const [nouvelleLongitude, setNouvelleLongitude] = useState<number | null>(null)

  const { localiser, loading: localisationEnCours } = useGeolocationAdresse()

  const [submitting, setSubmitting] = useState(false)
  const [fraisParVendeur, setFraisParVendeur] = useState<Record<string, FraisLivraison>>({})
  const [calculFraisEnCours, setCalculFraisEnCours] = useState(false)

  // Redirige proprement si pas connecté ou panier vide — checkout n'a pas
  // sa propre modale d'auth, contrairement au reste du site.
  useEffect(() => {
    if (userLoading) return
    if (!user) {
      showToast('Connecte-toi pour passer commande', 'info')
      router.push('/explorer')
      return
    }
    if (items.length === 0) {
      router.push('/explorer')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoading, user, items.length])

  useEffect(() => {
    if (profile) {
      setNomClient(profile.full_name || '')
      setTelephone(profile.phone || '')
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
      } else {
        setAddingNew(true)
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

  // Adresse "active" pour le calcul des frais : celle sélectionnée dans la
  // liste, ou celle en cours de saisie si le client ajoute une nouvelle adresse.
  const adresseActive = addingNew
    ? { commune: nouvelleCommune, latitude: nouvelleLatitude, longitude: nouvelleLongitude }
    : (() => {
        const addr = addresses.find((a) => a.id === selectedAddressId)
        return addr ? { commune: addr.commune, latitude: addr.latitude, longitude: addr.longitude } : null
      })()

  // Chantier 2 : dès que l'adresse a au moins une commune, on calcule le
  // frais réel par vendeur (RPC `calculer_frais_livraison`) — GPS si dispo,
  // sinon fallback par commune côté serveur.
  useEffect(() => {
    if (!adresseActive?.commune || nbVendeurs === 0) {
      setFraisParVendeur({})
      return
    }
    let annule = false
    setCalculFraisEnCours(true)
    Promise.all(
      Object.keys(groupesParVendeur).map(async (vendeurId) => {
        const { data, error } = await supabase.rpc('calculer_frais_livraison', {
          p_vendeur_id: vendeurId,
          p_latitude: adresseActive.latitude,
          p_longitude: adresseActive.longitude,
          p_commune: adresseActive.commune,
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
  }, [adresseActive?.commune, adresseActive?.latitude, adresseActive?.longitude, Object.keys(groupesParVendeur).join(',')])

  const totalFraisLivraison = Object.values(fraisParVendeur).reduce((acc, f) => acc + f.frais_livraison, 0)
  const totalGeneral = total + totalFraisLivraison
  const estimationSeulement = Object.values(fraisParVendeur).some((f) => !f.distance_fiable)

  const handleConfirmer = async () => {
    if (!user) return

    let adresseFinale: { adresse_complete: string; quartier: string; commune: string; latitude: number | null; longitude: number | null }

    if (addingNew) {
      if (!nouvelleCommune.trim() || !nouveauQuartier.trim()) {
        showToast('Indique au moins ta commune et ton quartier', 'error')
        return
      }
      adresseFinale = {
        adresse_complete: nouvelleAdresse.trim(),
        quartier: nouveauQuartier.trim(),
        commune: nouvelleCommune.trim(),
        latitude: nouvelleLatitude,
        longitude: nouvelleLongitude,
      }
    } else {
      const addr = addresses.find((a) => a.id === selectedAddressId)
      if (!addr) {
        showToast('Choisis une adresse de livraison', 'error')
        return
      }
      adresseFinale = addr
    }

    if (!nomClient.trim() || !telephone.trim()) {
      showToast('Indique ton nom et un numéro de téléphone', 'error')
      return
    }

    setSubmitting(true)
    try {
      // Sauvegarde la nouvelle adresse pour la prochaine fois, sans bloquer
      // la commande si ça échoue.
      if (addingNew) {
        await supabase.from('addresses').insert({
          user_id: user.id,
          label: nouveauLabel,
          adresse_complete: adresseFinale.adresse_complete,
          quartier: adresseFinale.quartier,
          commune: adresseFinale.commune,
          latitude: adresseFinale.latitude,
          longitude: adresseFinale.longitude,
          est_defaut: addresses.length === 0,
        })
      }

      const adresseLigne = [adresseFinale.adresse_complete, adresseFinale.quartier, adresseFinale.commune]
        .filter(Boolean)
        .join(', ')

      const commandeIds: string[] = []
      for (const [vendeurId, articlesVendeur] of Object.entries(groupesParVendeur)) {
        const { data, error } = await supabase.rpc('creer_commande', {
          p_vendeur_id: vendeurId,
          p_articles: articlesVendeur.map((a) => ({ article_id: a.id, quantite: a.quantite })),
          p_nom_client: nomClient.trim(),
          p_telephone_client: telephone.trim(),
          p_adresse_livraison: adresseLigne,
          p_commune: adresseFinale.commune,
          p_latitude: adresseFinale.latitude,
          p_longitude: adresseFinale.longitude,
        })
        if (error) throw error
        commandeIds.push(data as string)
      }

      clearCart()
      showToast(
        commandeIds.length > 1
          ? `${commandeIds.length} commandes créées`
          : 'Commande créée avec succès',
        'success'
      )
      router.push(commandeIds.length === 1 ? `/commandes/${commandeIds[0]}` : '/commandes')
    } catch (err) {
      console.error('[checkout] creer_commande error:', err)
      showToast(err instanceof Error ? err.message : 'Erreur lors de la création de la commande', 'error')
    } finally {
      setSubmitting(false)
    }
  }

  if (userLoading || !user || items.length === 0) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 className="animate-spin text-gray-300" size={28} />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-8 pb-32 md:pb-8">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-6"
        >
          <ChevronLeft size={16} />
          Retour
        </button>

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
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-2xl border border-gray-100">
                <img
                  src={item.photos[0] || '/images/hero-illustration.png'}
                  alt={item.nom}
                  className="w-16 h-16 rounded-xl object-cover shrink-0 bg-gray-50"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{item.nom}</p>
                  <p className="text-sm text-gray-500">{item.prix.toLocaleString('fr-FR')} F</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => updateQty(item.id, item.quantite - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Minus size={14} />
                  </button>
                  <span className="w-6 text-center text-sm font-bold">{item.quantite}</span>
                  <button
                    onClick={() => updateQty(item.id, item.quantite + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50"
                  >
                    <Plus size={14} />
                  </button>
                </div>
                <button
                  onClick={() => removeItem(item.id)}
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
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">
            Adresse de livraison
          </h2>

          {loadingAddresses ? (
            <div className="h-24 rounded-2xl bg-gray-50 animate-pulse" />
          ) : (
            <div className="space-y-3">
              {addresses.map((addr, index) => {
                const IconeAdresse = iconePourLabel(addr.label)
                return (
                  <motion.label
                    key={addr.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.04, duration: 0.25 }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                      !addingNew && selectedAddressId === addr.id
                        ? 'border-coral-400 bg-coral-50/40'
                        : 'border-gray-100 hover:border-gray-200'
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={!addingNew && selectedAddressId === addr.id}
                      onChange={() => {
                        setSelectedAddressId(addr.id)
                        setAddingNew(false)
                      }}
                      className="mt-1"
                    />
                    <div className="w-9 h-9 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
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
                    </div>
                  </motion.label>
                )
              })}

              <label
                className={`flex items-start gap-3 p-4 rounded-2xl border-2 cursor-pointer transition-colors ${
                  addingNew ? 'border-coral-400 bg-coral-50/40' : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <input
                  type="radio"
                  name="address"
                  checked={addingNew}
                  onChange={() => setAddingNew(true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-900">Nouvelle adresse</p>
                  <AnimatePresence initial={false}>
                    {addingNew && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                      <div className="mt-3 space-y-3">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const resultat = await localiser()
                            setNouvelleLatitude(resultat.latitude)
                            setNouvelleLongitude(resultat.longitude)
                            if (resultat.communeDetectee) setNouvelleCommune(resultat.communeDetectee)
                            if (resultat.quartierDetecte) setNouveauQuartier(resultat.quartierDetecte)
                            showToast('Position détectée', 'success')
                          } catch (err) {
                            showToast(err instanceof Error ? err.message : 'Localisation impossible', 'error')
                          }
                        }}
                        disabled={localisationEnCours}
                        className="w-full flex items-center justify-center gap-2 h-11 rounded-xl bg-coral-50 text-coral-700 font-semibold text-sm hover:bg-coral-100 transition-colors disabled:opacity-60"
                      >
                        {localisationEnCours ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
                        {localisationEnCours ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
                      </button>

                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Nom de l&rsquo;adresse</p>
                        <ChipSelect layoutId="checkout-label" options={OPTIONS_LABEL} value={nouveauLabel} onChange={setNouveauLabel} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Commune</p>
                        <ChipSelect layoutId="checkout-commune" options={OPTIONS_COMMUNE} value={nouvelleCommune} onChange={setNouvelleCommune} />
                      </div>

                      <input
                        type="text"
                        value={nouveauQuartier}
                        onChange={(e) => setNouveauQuartier(e.target.value)}
                        placeholder="Quartier (ex: Godomey)"
                        className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
                      />
                      <textarea
                        value={nouvelleAdresse}
                        onChange={(e) => setNouvelleAdresse(e.target.value)}
                        placeholder="Rue, précisions (facultatif)"
                        rows={2}
                        className="w-full text-sm rounded-lg border border-gray-200 px-3 py-2 focus:outline-none focus:border-coral-400 resize-none"
                      />
                      </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </label>
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

        {/* Détail des frais de livraison, par boutique si plusieurs */}
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

        {/* Total + confirmation (desktop) */}
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
          <Button onClick={handleConfirmer} disabled={submitting} className="min-w-[220px]">
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <ShoppingBag size={16} />}
            {submitting ? 'Création...' : `Confirmer${totalGeneral > 0 ? ` — ${totalGeneral.toLocaleString('fr-FR')} F` : ''}`}
          </Button>
        </div>
      </main>

      {/* Barre sticky mobile */}
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
              {adresseActive?.commune ? (nbVendeurs > 1 ? 'articles + livraisons' : 'articles + livraison') : '+ livraison'}
            </p>
          </div>
          <button
            onClick={handleConfirmer}
            disabled={submitting}
            className="flex-1 h-13 rounded-2xl bg-coral-500 hover:bg-coral-600 active:bg-coral-700 text-white font-bold text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : null}
            {submitting ? 'Création...' : 'Confirmer la commande'}
          </button>
        </div>
      </div>

      <div className="hidden">
        <Link href="/explorer">Continuer mes achats</Link>
      </div>

      <Footer />
    </div>
  )
}
