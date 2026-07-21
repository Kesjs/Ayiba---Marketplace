'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { LogoutConfirmModal } from '@/components/ui/LogoutConfirmModal'

interface Address {
  id: string
  label: string
  adresse_complete: string
  est_defaut: boolean
}

// ============================================
// Traduction des erreurs Supabase Auth en français
// ============================================
function translateAuthError(err: any): string {
  const message = (err?.message || '').toLowerCase()
  if (!message) return 'Une erreur est survenue. Réessaie.'
  if (message.includes('password') && message.includes('weak')) {
    return 'Ce mot de passe est trop faible.'
  }
  if (message.includes('same password') || message.includes('different from')) {
    return "Le nouveau mot de passe doit être différent de l'ancien."
  }
  if (message.includes('rate limit') || message.includes('too many')) {
    return 'Trop de tentatives. Réessaie dans quelques instants.'
  }
  return 'Une erreur est survenue. Réessaie.'
}

function validatePasswordStrength(value: string): string | null {
  if (value.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.'
  if (!/[A-Z]/.test(value)) return 'Le mot de passe doit contenir au moins une majuscule.'
  if (!/[0-9]/.test(value)) return 'Le mot de passe doit contenir au moins un chiffre.'
  return null
}

export default function ProfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const { profile, loading: userLoading } = useUser()

  const [addresses, setAddresses] = useState<Address[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddressModal, setShowAddressModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false)
  const [isDeletingAccount, setIsDeletingAccount] = useState(false)
  const [newAddress, setNewAddress] = useState({
    label: 'domicile',
    adresse_complete: '',
    est_defaut: false
  })
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null)

  // ---- Sécurité / mot de passe ----
  const [showSecurityModal, setShowSecurityModal] = useState(false)
  const [passwordForm, setPasswordForm] = useState({ next: '', confirm: '' })
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [isSavingPassword, setIsSavingPassword] = useState(false)

  const closeSecurityModal = () => {
    setShowSecurityModal(false)
    setPasswordForm({ next: '', confirm: '' })
    setPasswordError(null)
  }

  const handleChangePassword = async () => {
    setPasswordError(null)
    if (!passwordForm.next && !passwordForm.confirm) return

    const strengthError = validatePasswordStrength(passwordForm.next)
    if (strengthError) {
      setPasswordError(strengthError)
      return
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError('Les mots de passe ne correspondent pas.')
      return
    }

    setIsSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next })
      if (error) throw error

      closeSecurityModal()
      showToast('Mot de passe modifié avec succès.', 'success')
    } catch (err: any) {
      setPasswordError(translateAuthError(err))
    } finally {
      setIsSavingPassword(false)
    }
  }

  useEffect(() => {
    if (profile) {
      fetchAddresses()
    }
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

    try {
      const { error } = await supabase
        .from('addresses')
        .insert({
          user_id: profile.id,
          label: newAddress.label,
          adresse_complete: newAddress.adresse_complete,
          est_defaut: newAddress.est_defaut
        })

      if (error) throw error
      showToast('Adresse ajoutée', 'success')
      setShowAddressModal(false)
      setNewAddress({ label: 'domicile', adresse_complete: '', est_defaut: false })
      fetchAddresses()
    } catch (error) {
      console.error('Error adding address:', error)
      showToast('Erreur lors de l\'ajout de l\'adresse', 'error')
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

  const confirmLogout = async () => {
    setShowLogoutModal(false)
    await supabase.auth.signOut()
    router.push('/')
  }

  const handleDeleteAccount = async () => {
    setIsDeletingAccount(true)
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', profile!.id)

      if (error) throw error
      await supabase.auth.signOut()
      router.push('/')
    } catch (error) {
      console.error('Error deleting account:', error)
      showToast('Erreur lors de la suppression du compte', 'error')
      setIsDeletingAccount(false)
      setShowDeleteAccountModal(false)
    }
  }

  if (userLoading || loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <header className="bg-white border-b border-gray-100 p-4">
          <div className="h-6 w-32 bg-gray-100 rounded animate-pulse" />
        </header>
        <div className="flex-1 p-4 space-y-4">
          <div className="bg-white border border-gray-100 rounded-lg p-5 h-40 animate-pulse" />
          <div className="bg-white border border-gray-100 rounded-lg p-5 h-32 animate-pulse" />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 p-4">
        <h1 className="text-lg font-medium text-gray-900">Mon profil</h1>
      </header>

      {/* Profile Info */}
      <div className="p-4">
        <div className="bg-white border border-gray-100 rounded-lg p-5 mb-4">
          <div className="flex items-center gap-4 mb-4">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.full_name || ''}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-coral-100 flex items-center justify-center">
                <span className="text-coral-800 text-xl font-medium">
                  {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            )}
            <div>
              <h2 className="text-base font-medium text-gray-900">{profile?.full_name || 'Non renseigné'}</h2>
              <p className="text-sm text-gray-500">{profile?.phone || ''}</p>
            </div>
          </div>
          <Button variant="secondary" className="w-full">
            Modifier mes informations
          </Button>
        </div>

        {/* Addresses */}
        <div className="bg-white border border-gray-100 rounded-lg p-5 mb-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-medium text-gray-900">Mes adresses</h3>
            <button
              onClick={() => setShowAddressModal(true)}
              className="text-sm text-coral-400 hover:text-coral-600"
            >
              Ajouter
            </button>
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">Aucune adresse enregistrée</p>
          ) : (
            <div className="space-y-3">
              {addresses.map((address) => (
                <div
                  key={address.id}
                  className="border border-gray-100 rounded-lg p-3 flex items-start justify-between"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-gray-900 capitalize">{address.label}</span>
                      {address.est_defaut && (
                        <span className="text-[11px] bg-teal-50 text-teal-800 rounded-pill px-2 py-0.5">Défaut</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{address.adresse_complete}</p>
                  </div>
                  <div className="flex gap-2">
                    {!address.est_defaut && (
                      <button
                        onClick={() => handleSetDefault(address.id)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <i className="ti ti-star text-lg" />
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setAddressToDelete(address.id)
                        setShowDeleteModal(true)
                      }}
                      className="text-red-400 hover:text-red-600"
                    >
                      <i className="ti ti-trash text-lg" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Settings */}
        <div className="bg-white border border-gray-100 rounded-lg divide-y divide-gray-100">
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">Notifications</span>
            <i className="ti ti-chevron-right text-gray-400" />
          </button>
          <button
            onClick={() => setShowSecurityModal(true)}
            className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <span className="text-sm text-gray-900">Sécurité</span>
            <i className="ti ti-chevron-right text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">Conditions d'utilisation</span>
            <i className="ti ti-chevron-right text-gray-400" />
          </button>
          <button className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
            <span className="text-sm text-gray-900">Politique de confidentialité</span>
            <i className="ti ti-chevron-right text-gray-400" />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full mt-4 py-3 rounded-lg border border-gray-100 text-sm font-medium text-red-400 hover:bg-red-50 transition-colors"
        >
          Déconnexion
        </button>

        {/* Delete Account */}
        <button
          onClick={() => setShowDeleteAccountModal(true)}
          className="w-full mt-3 py-3 rounded-lg text-sm text-gray-400 hover:text-red-400 transition-colors"
        >
          Supprimer mon compte
        </button>
      </div>

      {/* Add Address Modal */}
      {showAddressModal && (
        <Modal
          isOpen={showAddressModal}
          onClose={() => {
            setShowAddressModal(false)
            setNewAddress({ label: 'domicile', adresse_complete: '', est_defaut: false })
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
              <label className="block text-sm text-gray-600 mb-2">Adresse</label>
              <textarea
                value={newAddress.adresse_complete}
                onChange={(e) => setNewAddress({ ...newAddress, adresse_complete: e.target.value })}
                placeholder="Rue, quartier, ville..."
                className="w-full h-24 rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-coral-400 outline-none resize-none"
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
            <Button variant="primary" className="w-full" onClick={handleAddAddress}>
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

      {/* Security / Change Password Modal */}
      {showSecurityModal && (
        <Modal isOpen={showSecurityModal} onClose={closeSecurityModal} title="Sécurité">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-600 mb-2">Nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm focus:border-coral-400 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-2">Confirmer le nouveau mot de passe</label>
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                className="w-full h-10 rounded-lg border border-gray-100 px-3 text-sm focus:border-coral-400 outline-none"
              />
            </div>
            {passwordError && <p className="text-xs font-semibold text-red-500">{passwordError}</p>}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleChangePassword}
              disabled={isSavingPassword || (!passwordForm.next && !passwordForm.confirm)}
            >
              {isSavingPassword ? 'Modification...' : 'Modifier le mot de passe'}
            </Button>
          </div>
        </Modal>
      )}

      <LogoutConfirmModal
        open={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />

      {showDeleteAccountModal && (
        <Modal
          isOpen={showDeleteAccountModal}
          onClose={() => setShowDeleteAccountModal(false)}
          title="Supprimer définitivement mon compte"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Cette action est <span className="font-semibold text-red-500">définitive et irréversible</span>.
              Toutes tes données personnelles, adresses et favoris seront supprimés. Cette action ne peut pas être annulée.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setShowDeleteAccountModal(false)}
                disabled={isDeletingAccount}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={handleDeleteAccount}
                disabled={isDeletingAccount}
              >
                {isDeletingAccount ? 'Suppression...' : 'Oui, supprimer'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
