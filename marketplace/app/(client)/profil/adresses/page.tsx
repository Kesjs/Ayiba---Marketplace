'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, LocateFixed, Loader2, Star, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { useGeolocationAdresse } from '@/lib/hooks/useGeolocationAdresse'
import { COMMUNES_COUVERTES } from '@/lib/constants/communes'
import { AdresseAutocomplete } from '@/components/ui/AdresseAutocomplete'
import type { SuggestionAdresse } from '@/lib/hooks/useAdresseAutocomplete'

// Gestion des adresses de livraison — anciennement mélangée dans
// /profil/page.tsx (qui est redevenue une page d'identité pure : photo, nom,
// téléphone, vérification). "Mes adresses" pointait par erreur vers /profil
// (même route que l'item "Profil" juste au-dessus dans Compte) ; cette page
// lui donne enfin sa propre route.

interface Address {
  id: string
  label: string
  adresse_complete: string
  quartier: string
  commune: string
  latitude: number | null
  longitude: number | null
  repere: string | null
  est_defaut: boolean
}

export default function AdressesPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const { profile, loading: userLoading } = useUser()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)
  const [newAddress, setNewAddress] = useState({
    label: 'domicile',
    adresse_complete: '',
    quartier: '',
    commune: '',
    latitude: null as number | null,
    longitude: null as number | null,
    repere: '',
    est_defaut: false
  })
  const { localiser, loading: localisationEnCours } = useGeolocationAdresse()

  useEffect(() => {
    if (profile) fetchAddresses()
  }, [profile?.id])

  const fetchAddresses = async () => {
    if (!profile) return
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('addresses')
        .select('*')
        .eq('user_id', profile.id)
        .order('est_defaut', { ascending: false })

      if (error) throw error
      setAddresses(data || [])
    } catch (error) {
      console.error('Error fetching addresses:', error)
      showToast('Erreur lors du chargement des adresses', 'error')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAddress = async () => {
    if (!profile) return

    if (!newAddress.quartier.trim() || !newAddress.commune.trim()) {
      showToast('Le quartier et la commune sont obligatoires', 'error')
      return
    }

    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: profile.id,
          label: newAddress.label,
          adresse_complete: newAddress.adresse_complete,
          quartier: newAddress.quartier.trim(),
          commune: newAddress.commune.trim(),
          latitude: newAddress.latitude,
          longitude: newAddress.longitude,
          repere: newAddress.repere.trim() || null,
          est_defaut: newAddress.est_defaut
        })

      if (error) throw error
      showToast('Adresse ajoutée', 'success')
      setShowAddressModal(false)
      setNewAddress({ label: 'domicile', adresse_complete: '', quartier: '', commune: '', latitude: null, longitude: null, repere: '', est_defaut: false })
      fetchAddresses()
    } catch (error) {
      console.error('Error adding address:', error)
      showToast("Erreur lors de l'ajout de l'adresse", 'error')
    }
  }

  const handleSetDefault = async (addressId: string) => {
    try {
      const { error } = await supabase
        .from('addresses')
        .update({ est_defaut: false })
        .eq('user_id', profile!.id)

      if (error) throw error

      const { error: updateError } = await supabase
        .from('addresses')
        .update({ est_defaut: true })
        .eq('id', addressId)

      if (updateError) throw updateError
      showToast('Adresse par défaut mise à jour', 'success')
      fetchAddresses()
    } catch (error) {
      console.error('Error setting default:', error)
      showToast('Erreur lors de la mise à jour', 'error')
    }
  }

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return

    try {
      const { error } = await supabase
        .from('addresses')
        .delete()
        .eq('id', addressToDelete)

      if (error) throw error
      showToast('Adresse supprimée', 'success')
      setShowDeleteModal(false)
      setAddressToDelete(null)
      fetchAddresses()
    } catch (error) {
      console.error('Error deleting address:', error)
      showToast('Erreur lors de la suppression', 'error')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push('/menu')} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Mes adresses</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {addresses.length > 0 ? `${addresses.length} adresse${addresses.length > 1 ? 's' : ''} enregistrée${addresses.length > 1 ? 's' : ''}` : ''}
          </p>
          <button
            onClick={() => setShowAddressModal(true)}
            className="text-sm font-semibold text-coral-400 hover:text-coral-600"
          >
            + Ajouter
          </button>
        </div>

        {loading || userLoading ? (
          <div className="space-y-3">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center">
            <p className="text-sm text-gray-500 mb-4">Aucune adresse enregistrée</p>
            <Button variant="secondary" onClick={() => setShowAddressModal(true)}>
              Ajouter une adresse
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {addresses.map((address) => (
              <div
                key={address.id}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-start justify-between"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-gray-900 capitalize">{address.label}</span>
                    {address.est_defaut && (
                      <span className="text-[11px] bg-teal-50 text-teal-800 rounded-pill px-2 py-0.5">Défaut</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">{address.adresse_complete}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{address.quartier}, {address.commune}</p>
                  {address.repere && (
                    <p className="text-xs text-gray-500 mt-0.5">Repère : {address.repere}</p>
                  )}
                </div>
                <div className="flex gap-3 shrink-0 ml-2">
                  {!address.est_defaut && (
                    <button
                      onClick={() => handleSetDefault(address.id)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Définir par défaut"
                    >
                      <Star size={18} />
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setAddressToDelete(address.id)
                      setShowDeleteModal(true)
                    }}
                    className="text-red-400 hover:text-red-600"
                    aria-label="Supprimer"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <Modal
          isOpen={showAddressModal}
          onClose={() => {
            setShowAddressModal(false)
            setNewAddress({ label: 'domicile', adresse_complete: '', quartier: '', commune: '', latitude: null, longitude: null, repere: '', est_defaut: false })
          }}
          title="Ajouter une adresse"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Type</label>
              <select
                value={newAddress.label}
                onChange={(e) => setNewAddress({ ...newAddress, label: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm focus:border-coral-400 outline-none"
              >
                <option value="domicile">Domicile</option>
                <option value="bureau">Bureau</option>
                <option value="autre">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rechercher une adresse</label>
              <AdresseAutocomplete
                placeholder="Rechercher ton adresse (rue, quartier, ville)..."
                onSelect={(s: SuggestionAdresse) => {
                  setNewAddress((prev) => ({
                    ...prev,
                    latitude: s.latitude,
                    longitude: s.longitude,
                    commune: s.commune || prev.commune,
                    quartier: s.quartier || prev.quartier,
                    adresse_complete: s.texte,
                  }))
                }}
              />
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  const resultat = await localiser()
                  setNewAddress((prev) => ({
                    ...prev,
                    latitude: resultat.latitude,
                    longitude: resultat.longitude,
                    commune: resultat.communeDetectee || prev.commune,
                    quartier: resultat.quartierDetecte || prev.quartier,
                  }))
                  showToast('Position détectée', 'success')
                } catch (err) {
                  showToast(err instanceof Error ? err.message : 'Localisation impossible', 'error')
                }
              }}
              disabled={localisationEnCours}
              className="w-full flex items-center justify-center gap-2 h-10 rounded-lg bg-coral-50 text-coral-700 font-semibold text-sm hover:bg-coral-100 transition-colors disabled:opacity-60"
            >
              {localisationEnCours ? <Loader2 size={16} className="animate-spin" /> : <LocateFixed size={16} />}
              {localisationEnCours ? 'Localisation en cours...' : 'Utiliser ma position actuelle'}
            </button>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Commune *</label>
              <select
                value={newAddress.commune}
                onChange={(e) => setNewAddress({ ...newAddress, commune: e.target.value })}
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm bg-white focus:border-coral-400 outline-none"
              >
                <option value="">Choisir une commune...</option>
                {COMMUNES_COUVERTES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <p className="text-[11px] text-gray-400 mt-1">
                Pré-remplie automatiquement via la recherche ou la position — modifiable si besoin.
              </p>
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Quartier *</label>
              <input
                type="text"
                value={newAddress.quartier}
                onChange={(e) => setNewAddress({ ...newAddress, quartier: e.target.value })}
                placeholder="Ex: Godomey"
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm focus:border-coral-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Rue / description</label>
              <textarea
                value={newAddress.adresse_complete}
                onChange={(e) => setNewAddress({ ...newAddress, adresse_complete: e.target.value })}
                placeholder="Numéro, rue, précisions..."
                className="w-full h-20 rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-coral-400 outline-none resize-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Point de repère (facultatif)</label>
              <input
                type="text"
                value={newAddress.repere}
                onChange={(e) => setNewAddress({ ...newAddress, repere: e.target.value })}
                placeholder="Ex: près du carrefour, portail bleu..."
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm focus:border-coral-400 outline-none"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={newAddress.est_defaut}
                onChange={(e) => setNewAddress({ ...newAddress, est_defaut: e.target.checked })}
                className="w-4 h-4 rounded border-gray-100 text-coral-400 focus:ring-coral-400"
              />
              <span className="text-sm text-gray-900">Définir comme adresse par défaut</span>
            </label>
            <Button
              variant="primary"
              className="w-full"
              onClick={handleAddAddress}
              disabled={!newAddress.quartier.trim() || !newAddress.commune.trim()}
            >
              Ajouter
            </Button>
          </div>
        </Modal>
      )}

      {/* Delete Address Modal */}
      {showDeleteModal && (
        <Modal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false)
            setAddressToDelete(null)
          }}
          title="Supprimer l'adresse"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Êtes-vous sûr de vouloir supprimer cette adresse ?</p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowDeleteModal(false)
                  setAddressToDelete(null)
                }}
              >
                Annuler
              </Button>
              <Button variant="destructive" className="flex-1" onClick={handleDeleteAddress}>
                Supprimer
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </main>
  )
}
