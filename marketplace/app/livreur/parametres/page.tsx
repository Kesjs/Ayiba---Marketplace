"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  MapPin,
  Bike,
  Wallet,
  Bell,
  LogOut,
  Camera,
  Check,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { createClient } from "@/lib/supabase/client";
import {
  useLivreurParametres,
  type TypeVehicule,
  type MobileMoneyNetwork,
} from "@/app/hooks/useLivreurParametres";
import {
  SettingsSection,
  SettingsField,
  SettingsToggle,
  DangerZoneButton,
  DangerZoneConfirm,
} from "@/components/settings/SettingsForm";

const VEHICULES: { value: TypeVehicule; label: string }[] = [
  { value: "motocyclette", label: "Motocyclette" },
  { value: "velo", label: "Vélo" },
  { value: "tricycle", label: "Tricycle" },
  { value: "a_pied", label: "À pied" },
];

const RESEAUX: { value: MobileMoneyNetwork; label: string }[] = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "celtiis", label: "Celtiis Cash" },
];

export default function LivreurParametresPage() {
  const router = useRouter();
  const {
    loading,
    saving,
    uploadingAvatar,
    error,
    successMessage,
    data,
    save,
    uploadAvatar,
    togglingPause,
    pauseError,
    togglePause,
    deleting,
    deleteError,
    requestAccountDeletion,
  } = useLivreurParametres();

  const [form, setForm] = useState(data);
  const [initialized, setInitialized] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!loading && !initialized) {
    setForm(data);
    setInitialized(true);
  }

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadAvatar(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    await save(form);
  };

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  // ---- Zone sensible ----
  const [showConfirmPause, setShowConfirmPause] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteSent, setDeleteSent] = useState(false);

  const handleConfirmPause = async () => {
    try {
      await togglePause();
      setForm((f) => ({ ...f, enPause: !f.enPause }));
      setShowConfirmPause(false);
    } catch {
      // pauseError est déjà affiché dans le panneau de confirmation
    }
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER") return;
    try {
      await requestAccountDeletion();
      setDeleteSent(true);
      setDeleteConfirmText("");
    } catch {
      // deleteError est déjà affiché dans le panneau de confirmation
    }
  };

  return (
    <DashboardLayout role="livreur" title="Paramètres" backHref="/livreur/profil" backLabel="Profil">
      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="max-w-2xl">
          {error && (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Avatar + nom */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6 flex items-center gap-5"
          >
            <button
              onClick={handleAvatarClick}
              disabled={uploadingAvatar}
              className="relative w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0 group"
            >
              {form.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.avatarUrl} alt="Photo de profil" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-300">
                  <User size={28} />
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div className="min-w-0">
              <p className="font-bold text-gray-900 truncate">{form.fullName || "Ton nom"}</p>
              <p className="text-xs text-gray-400 font-medium mt-0.5">Touche la photo pour la changer</p>
            </div>
          </motion.div>

          {/* Profil */}
          <SettingsSection icon={User} title="Profil" delay={0.05}>
            <SettingsField label="Nom complet">
              <input
                type="text"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                className="settings-input"
                placeholder="Ton nom complet"
              />
            </SettingsField>
            <SettingsField label="Téléphone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="settings-input"
                placeholder="+229 00 00 00 00"
              />
            </SettingsField>
          </SettingsSection>

          {/* Localisation */}
          <SettingsSection icon={MapPin} title="Localisation" delay={0.1}>
            <SettingsField label="Quartier">
              <input
                type="text"
                value={form.quartier}
                onChange={(e) => setForm((f) => ({ ...f, quartier: e.target.value }))}
                className="settings-input"
                placeholder="Ex: Godomey"
              />
            </SettingsField>
            <SettingsField label="Commune">
              <input
                type="text"
                value={form.commune}
                onChange={(e) => setForm((f) => ({ ...f, commune: e.target.value }))}
                className="settings-input"
                placeholder="Ex: Calavi"
              />
            </SettingsField>
          </SettingsSection>

          {/* Véhicule */}
          <SettingsSection icon={Bike} title="Véhicule" delay={0.15}>
            <SettingsField label="Type de véhicule">
              <select
                value={form.typeVehicule}
                onChange={(e) =>
                  setForm((f) => ({ ...f, typeVehicule: e.target.value as TypeVehicule }))
                }
                className="settings-input"
              >
                <option value="">Sélectionner</option>
                {VEHICULES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </SettingsField>
            {form.typeVehicule && form.typeVehicule !== "velo" && form.typeVehicule !== "a_pied" && (
              <SettingsField label="Plaque d'immatriculation">
                <input
                  type="text"
                  value={form.plaqueImmatriculation}
                  onChange={(e) => setForm((f) => ({ ...f, plaqueImmatriculation: e.target.value }))}
                  className="settings-input"
                  placeholder="Ex: AB 1234 RB"
                />
              </SettingsField>
            )}
          </SettingsSection>

          {/* Mobile money */}
          <SettingsSection icon={Wallet} title="Mobile Money" delay={0.2}>
            <SettingsField label="Réseau">
              <select
                value={form.mobileMoneyNetwork}
                onChange={(e) =>
                  setForm((f) => ({ ...f, mobileMoneyNetwork: e.target.value as MobileMoneyNetwork }))
                }
                className="settings-input"
              >
                <option value="">Sélectionner</option>
                {RESEAUX.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </SettingsField>
            <SettingsField label="Numéro Mobile Money">
              <input
                type="tel"
                value={form.mobileMoneyNumber}
                onChange={(e) => setForm((f) => ({ ...f, mobileMoneyNumber: e.target.value }))}
                className="settings-input"
                placeholder="+229 00 00 00 00"
              />
            </SettingsField>
          </SettingsSection>

          {/* Notifications */}
          <SettingsSection icon={Bell} title="Notifications" delay={0.25}>
            <SettingsToggle
              label="Notifications push"
              checked={form.notifPush}
              onChange={(v) => setForm((f) => ({ ...f, notifPush: v }))}
            />
            <SettingsToggle
              label="Notifications WhatsApp"
              checked={form.notifWhatsapp}
              onChange={(v) => setForm((f) => ({ ...f, notifWhatsapp: v }))}
            />
            <SettingsToggle
              label="Notifications email"
              checked={form.notifEmail}
              onChange={(v) => setForm((f) => ({ ...f, notifEmail: v }))}
            />
          </SettingsSection>

          {/* Bouton sauvegarder */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50 flex items-center justify-center gap-2 mb-4"
          >
            {saving ? (
              "Enregistrement..."
            ) : successMessage ? (
              <>
                <Check size={18} /> {successMessage}
              </>
            ) : (
              "Enregistrer les modifications"
            )}
          </motion.button>

          {/* Déconnexion */}
          <button
            onClick={handleLogout}
            className="w-full h-14 border border-red-100 text-red-600 font-bold rounded-2xl hover:bg-red-50 transition-all flex items-center justify-center gap-2 mb-10"
          >
            <LogOut size={18} /> Déconnexion
          </button>

          {/* Zone sensible */}
          <div className="space-y-3 mb-10">
            <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest ml-4">Zone sensible</h4>

            <AnimatePresence mode="wait">
              {!showConfirmPause ? (
                <DangerZoneButton
                  key="pause-button"
                  icon={form.enPause ? PlayCircle : PauseCircle}
                  label={form.enPause ? "Réactiver mon compte" : "Suspendre temporairement mon compte"}
                  tone="amber"
                  onClick={() => setShowConfirmPause(true)}
                />
              ) : (
                <DangerZoneConfirm
                  key="pause-confirm"
                  tone="amber"
                  description={
                    form.enPause
                      ? "Ton compte redeviendra visible et tu recevras de nouveau des missions."
                      : "Tu ne recevras plus de nouvelles missions tant que ton compte est en pause. Tu pourras le réactiver à tout moment depuis cette page."
                  }
                  error={pauseError}
                  confirmLabel={form.enPause ? "Réactiver" : "Mettre en pause"}
                  loading={togglingPause}
                  onCancel={() => setShowConfirmPause(false)}
                  onConfirm={handleConfirmPause}
                />
              )}
            </AnimatePresence>

            <AnimatePresence mode="wait">
              {deleteSent ? (
                <div
                  key="delete-sent"
                  className="w-full p-4 sm:p-5 rounded-2xl border border-teal-100 bg-teal-50 text-teal-800 text-sm font-semibold flex items-center gap-3"
                >
                  <Check size={18} />
                  Demande envoyée — notre équipe te contactera sous 48h.
                </div>
              ) : !showConfirmDelete ? (
                <DangerZoneButton
                  key="delete-button"
                  icon={Trash2}
                  label="Supprimer mon compte"
                  tone="red"
                  onClick={() => setShowConfirmDelete(true)}
                />
              ) : (
                <DangerZoneConfirm
                  key="delete-confirm"
                  tone="red"
                  description="Cette action envoie une demande de suppression définitive. Notre équipe la traitera sous 48h, après vérification de tes livraisons en cours."
                  error={deleteError}
                  confirmLabel="Envoyer la demande"
                  confirmDisabled={deleteConfirmText !== "SUPPRIMER"}
                  loading={deleting}
                  onCancel={() => {
                    setShowConfirmDelete(false);
                    setDeleteConfirmText("");
                  }}
                  onConfirm={handleConfirmDelete}
                >
                  <div>
                    <p className="text-xs text-gray-500 font-medium mb-2">
                      Tape <strong className="text-gray-900">SUPPRIMER</strong> pour confirmer :
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmText}
                      onChange={(e) => setDeleteConfirmText(e.target.value)}
                      className="settings-input"
                      placeholder="SUPPRIMER"
                    />
                  </div>
                </DangerZoneConfirm>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
