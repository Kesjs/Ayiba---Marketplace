'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { User, Camera, ShieldCheck, ShieldAlert, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useToast } from '@/context/ToastContext'
import { useUser } from '@/lib/hooks/useUser'
import { useBadgeCounts } from '@/lib/hooks/useBadgeCounts'
import { useClientDashboard } from '@/app/hooks/useClientDashboard'
import { ClientDashboardHeader } from '@/components/client/ClientDashboardHeader'
import { validateBeninPhone } from '@/lib/validation'
import { SettingsField } from '@/components/settings/SettingsForm'

// Page recentrée sur l'identité pure — "Informations, photo, vérification",
// exactement ce que promet sa description dans Compte. Les adresses (qui
// vivaient ici avant, avec un routing en doublon avec cet item) sont
// désormais sur /profil/adresses ; sécurité, notifications, légal,
// déconnexion et suppression de compte vivent ailleurs dans Compte. Bloc
// photo + nom + téléphone en champs inline, repris du pattern déjà utilisé
// sur /vendeur/parametres — même composant SettingsField, même logique
// d'upload d'avatar — pour que les deux espaces se ressemblent.

export default function ProfilPage() {
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()
  const { profile, loading: userLoading } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const { stats, loading: statsLoading } = useClientDashboard()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({ fullName: '', phone: '' })
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null | undefined>(undefined)
  const [emailConfirme, setEmailConfirme] = useState<boolean | null>(null)

  useEffect(() => {
    if (profile) {
      setForm({ fullName: profile.full_name || '', phone: profile.phone || '' })
      setAvatarUrl((prev) => (prev === undefined ? profile.avatar_url : prev))
    }
  }, [profile])

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: Awaited<ReturnType<typeof supabase.auth.getUser>>) => {
      setEmailConfirme(Boolean(data.user?.email_confirmed_at))
    })
  }, [supabase])

  const handleAvatarClick = () => fileInputRef.current?.click()

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    setUploadingAvatar(true)
    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const path = `${profile.id}/avatar-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('avatars').upload(path, file, { upsert: true })
      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path)

      const { error: updateError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('id', profile.id)
      if (updateError) throw updateError

      setAvatarUrl(publicUrl)
      showToast('Photo de profil mise à jour', 'success')
    } catch (err) {
      console.error('Upload avatar:', err)
      showToast("Impossible d'envoyer la photo — réessaie.", 'error')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  const handleSave = useCallback(async () => {
    if (!profile) return
    const errors: Record<string, string> = {}
    if (form.fullName.trim().length < 2) errors.fullName = 'Merci d\'indiquer ton nom complet'
    const phoneCheck = validateBeninPhone(form.phone)
    if (!phoneCheck.isValid) errors.phone = phoneCheck.error || 'Numéro de téléphone invalide'
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('users')
        .update({ full_name: form.fullName.trim(), phone: phoneCheck.formatted })
        .eq('id', profile.id)
      if (error) throw error

      setForm({ fullName: form.fullName.trim(), phone: phoneCheck.formatted })
      showToast('Informations mises à jour', 'success')
    } catch (err) {
      console.error('Error updating profile:', err)
      showToast('Une erreur est survenue. Réessaie.', 'error')
    } finally {
      setSaving(false)
    }
  }, [form, profile, supabase, showToast])

  const displayAvatar = avatarUrl === undefined ? profile?.avatar_url : avatarUrl

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <ClientDashboardHeader
        title="Profil"
        backHref="/menu"
        avatarUrl={displayAvatar}
        fullName={profile?.full_name || undefined}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        logoHref="/"
      />

      <div className="max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {/* Stats — mêmes chiffres que sur Compte, pour rester cohérent avec
            le dashboard vendeur qui affiche ses propres stats sur sa page
            d'identité. */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{statsLoading ? '—' : stats?.total_commandes ?? 0}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">Commandes</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-xl font-bold text-gray-900">
              {statsLoading ? '—' : new Intl.NumberFormat('fr-FR').format(stats?.total_depenses ?? 0)}
            </p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">FCFA dépensés</p>
          </div>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
            <p className="text-xl font-bold text-gray-900">{statsLoading ? '—' : stats?.commandes_en_cours ?? 0}</p>
            <p className="text-[11px] text-gray-400 font-medium mt-0.5">En cours</p>
          </div>
        </div>

        {/* Identité — photo + nom + téléphone, même pattern que
            /vendeur/parametres (avatar cliquable, champs inline). */}
        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={handleAvatarClick}
              disabled={userLoading}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-50 border border-gray-100 shrink-0 group"
            >
              {displayAvatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={displayAvatar} alt={form.fullName || ''} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={32} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={20} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold text-gray-900 mb-1 truncate">{form.fullName || 'Ton nom'}</h2>
              <p className="text-xs text-gray-400">Touche la photo pour la changer</p>
            </div>
          </div>

          <div className="space-y-4">
            <SettingsField label="Nom complet" error={fieldErrors.fullName}>
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="settings-input"
                placeholder="Ton nom complet"
              />
            </SettingsField>
            <SettingsField label="Téléphone" error={fieldErrors.phone}>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="settings-input"
                placeholder="+229 00 00 00 00"
              />
            </SettingsField>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || userLoading}
            className="w-full mt-5 h-11 rounded-xl bg-coral-500 text-white text-sm font-bold hover:bg-coral-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>

        {/* Vérification — un seul signal fiable existe aujourd'hui côté
            Ayiba : la confirmation email Supabase Auth. Le téléphone n'a pas
            de vérification par OTP à ce stade, donc pas de badge inventé
            pour lui : mieux vaut ne rien afficher qu'afficher un statut
            faux. */}
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-3.5 flex items-center gap-3">
          {emailConfirme ? (
            <ShieldCheck size={18} className="text-teal-600 shrink-0" />
          ) : (
            <ShieldAlert size={18} className="text-amber-500 shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-800">
              {emailConfirme === null ? 'Vérification du compte' : emailConfirme ? 'Email vérifié' : 'Email non vérifié'}
            </p>
            <p className="text-xs text-gray-400">
              {emailConfirme === false ? 'Vérifie ta boîte mail pour confirmer ton adresse.' : 'Ton identité est confirmée sur Ayiba.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => router.push('/menu')}
          className="w-full flex items-center justify-between px-1 py-2 text-sm font-semibold text-coral-500"
        >
          <span>Retour à Compte</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  )
}
