"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User,
  Bell,
  Store,
  Lock,
  LogOut,
  Camera,
  Check,
  ChevronRight,
  PauseCircle,
  PlayCircle,
  Trash2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { validateBeninPhone } from "@/lib/validation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import {
  SettingsSection,
  SettingsField,
  SettingsToggle,
  DangerZoneButton,
  DangerZoneConfirm,
} from "@/components/settings/SettingsForm";

// ============================================
// Traduction des erreurs Supabase Auth en français
// ============================================
function translateAuthError(err: any): string {
  const message = (err?.message || "").toLowerCase();
  if (!message) return "Une erreur est survenue. Réessaie.";
  if (message.includes("email") && message.includes("already")) {
    return "Cet email est déjà utilisé par un autre compte.";
  }
  if (message.includes("invalid email")) return "Adresse email invalide.";
  if (message.includes("password") && message.includes("weak")) {
    return "Ce mot de passe est trop faible.";
  }
  if (message.includes("same password") || message.includes("different from")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Trop de tentatives. Réessaie dans quelques instants.";
  }
  if (message.includes("network") || message.includes("fetch")) {
    return "Problème de connexion. Vérifie ta connexion internet.";
  }
  return "Une erreur est survenue. Réessaie.";
}

interface UsersRow {
  full_name: string | null;
  phone: string;
  avatar_url: string | null;
  notif_push: boolean;
  notif_whatsapp: boolean;
  notif_email: boolean;
}

interface VendeurRow {
  nom_complet: string | null;
  nom_boutique: string | null;
  statut: string;
  en_pause: boolean;
}

export default function VendeurParametresPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ---- Chargement des données réelles ----
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [usersRow, setUsersRow] = useState<UsersRow | null>(null);
  const [vendeurRow, setVendeurRow] = useState<VendeurRow | null>(null);

  // ---- Formulaire inline ----
  const [form, setForm] = useState({ fullName: "", email: "", phone: "" });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        setLoadError("Ta session a expiré — reconnecte-toi puis réessaie.");
        setLoading(false);
        return;
      }

      setUserId(user.id);
      setAuthEmail(user.email ?? "");

      const [usersRes, vendeurRes] = await Promise.all([
        supabase
          .from("users")
          .select("full_name, phone, avatar_url, notif_push, notif_whatsapp, notif_email")
          .eq("id", user.id)
          .single(),
        supabase
          .from("vendeurs")
          .select("nom_complet, nom_boutique, statut, en_pause")
          .eq("id", user.id)
          .single(),
      ]);

      if (usersRes.error) throw usersRes.error;
      if (vendeurRes.error) throw vendeurRes.error;

      setUsersRow(usersRes.data as UsersRow);
      setVendeurRow(vendeurRes.data as VendeurRow);
      setForm({
        fullName: (usersRes.data as UsersRow)?.full_name?.trim() || (vendeurRes.data as VendeurRow)?.nom_complet || "",
        email: user.email ?? "",
        phone: (usersRes.data as UsersRow)?.phone ?? "",
      });
    } catch (err: any) {
      console.error("Chargement paramètres:", err);
      setLoadError(err?.message || "Impossible de charger tes paramètres — vérifie ta connexion et réessaie.");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const handleAvatarClick = () => fileInputRef.current?.click();

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${userId}/avatar-${Date.now()}.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const { error: updateError } = await supabase.from("users").update({ avatar_url: publicUrl }).eq("id", userId);
      if (updateError) throw updateError;

      setUsersRow((prev) => (prev ? { ...prev, avatar_url: publicUrl } : prev));
    } catch (err: any) {
      console.error("Upload avatar:", err);
      showToast("Impossible d'envoyer la photo — réessaie.", "error");
    } finally {
      setUploadingAvatar(false);
      e.target.value = "";
    }
  };

  // ---- Enregistrer profil (nom, téléphone, email, notifications) ----
  const handleSave = async () => {
    if (!userId || !usersRow) return;
    setSaveError(null);

    const errors: Record<string, string> = {};
    if (form.fullName.trim().length < 2) errors.fullName = "Le nom doit faire au moins 2 caractères.";
    const phoneCheck = validateBeninPhone(form.phone);
    if (!phoneCheck.isValid) errors.phone = phoneCheck.error || "Numéro invalide.";
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email);
    if (!emailValid) errors.email = "Adresse email invalide.";
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSaving(true);
    try {
      const { error: updateError } = await supabase
        .from("users")
        .update({
          full_name: form.fullName.trim(),
          phone: phoneCheck.formatted,
          notif_push: usersRow.notif_push,
          notif_whatsapp: usersRow.notif_whatsapp,
          notif_email: usersRow.notif_email,
        })
        .eq("id", userId);
      if (updateError) throw updateError;

      let emailChanged = false;
      if (form.email.trim() !== authEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: form.email.trim() });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      setUsersRow((prev) => (prev ? { ...prev, full_name: form.fullName.trim(), phone: phoneCheck.formatted } : prev));
      setSuccessMessage(emailChanged ? "Enregistré — vérifie ta boîte mail" : "Enregistré");
      setTimeout(() => setSuccessMessage(null), 2500);
    } catch (err: any) {
      console.error("Save profile:", err);
      setSaveError(translateAuthError(err));
    } finally {
      setSaving(false);
    }
  };

  // ---- Notifications (sauvegardées avec le reste du formulaire, comme chez le livreur) ----
  const setNotif = (key: "notif_push" | "notif_whatsapp" | "notif_email", value: boolean) => {
    setUsersRow((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  // ---- Mot de passe (action séparée, volontairement pas fusionnée au save principal) ----
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const validatePasswordStrength = (value: string): string | null => {
    if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre.";
    return null;
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    if (!passwordForm.next && !passwordForm.confirm) return;

    const strengthError = validatePasswordStrength(passwordForm.next);
    if (strengthError) {
      setPasswordError(strengthError);
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      setPasswordError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (error) throw error;

      setPasswordForm({ next: "", confirm: "" });
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err: any) {
      console.error("Change password:", err);
      setPasswordError(translateAuthError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/");
  };

  // ---- Zone sensible : pause / suppression ----
  const [showConfirmPause, setShowConfirmPause] = useState(false);
  const [isSavingPause, setIsSavingPause] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const isPaused = vendeurRow?.en_pause ?? false;

  const handleConfirmPause = async () => {
    if (!userId) return;
    setIsSavingPause(true);
    setPauseError(null);
    try {
      const { error } = await supabase.from("vendeurs").update({ en_pause: !isPaused }).eq("id", userId);
      if (error) throw error;
      setVendeurRow((prev) => (prev ? { ...prev, en_pause: !isPaused } : prev));
      setShowConfirmPause(false);
    } catch (err: any) {
      console.error("Toggle pause:", err);
      setPauseError(err?.message ? `Échec : ${err.message}` : "Impossible de mettre à jour le statut de la boutique.");
    } finally {
      setIsSavingPause(false);
    }
  };

  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSent, setDeleteSent] = useState(false);

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER" || !userId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.from("demandes_suppression").insert({ user_id: userId });
      if (error) throw error;
      setDeleteSent(true);
      setDeleteConfirmText("");
    } catch (err: any) {
      console.error("Demande suppression:", err);
      setDeleteError(err?.message ? `Échec de l'envoi : ${err.message}` : "Impossible d'envoyer la demande — réessaie.");
    } finally {
      setIsDeleting(false);
    }
  };

  // ============================================
  // RENDU
  // ============================================
  if (loading) {
    return (
      <DashboardLayout role="vendeur" title="Paramètres">
        <DashboardSkeleton />
      </DashboardLayout>
    );
  }

  if (loadError) {
    return (
      <DashboardLayout role="vendeur" title="Paramètres">
        <div className="max-w-2xl bg-red-50 border border-red-100 rounded-2xl p-4 text-sm font-medium text-red-600">
          {loadError}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="vendeur" title="Paramètres">
    <div className="max-w-2xl">
      {saveError && (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-4 mb-6 text-sm font-medium text-red-600">
          {saveError}
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
          {usersRow?.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={usersRow.avatar_url} alt="Photo de profil" className="w-full h-full object-cover" />
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
        <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
        <div className="min-w-0">
          <p className="font-bold text-gray-900 truncate">{form.fullName || "Ton nom"}</p>
          <p className="text-xs text-gray-400 font-medium mt-0.5">Touche la photo pour la changer</p>
        </div>
      </motion.div>

      {/* Profil */}
      <SettingsSection icon={User} title="Profil" delay={0.05}>
        <SettingsField label="Nom complet" error={fieldErrors.fullName}>
          <input
            type="text"
            value={form.fullName}
            onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
            className="settings-input"
            placeholder="Ton nom complet"
          />
        </SettingsField>
        <SettingsField label="Email" error={fieldErrors.email}>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            className="settings-input"
            placeholder="toi@exemple.com"
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
      </SettingsSection>

      {/* Boutique */}
      <SettingsSection icon={Store} title="Boutique" delay={0.1}>
        <Link
          href="/vendeur/boutique"
          className="w-full flex items-center justify-between py-2 group"
        >
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Gérer ma boutique</p>
            <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
              {vendeurRow?.nom_boutique || "Nom, adresse, horaires"}
            </p>
          </div>
          <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
        </Link>
      </SettingsSection>

      {/* Sécurité */}
      <SettingsSection icon={Lock} title="Sécurité" delay={0.15}>
        <SettingsField label="Nouveau mot de passe">
          <input
            type="password"
            value={passwordForm.next}
            onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
            className="settings-input"
            placeholder="8 caractères, 1 majuscule, 1 chiffre"
          />
        </SettingsField>
        <SettingsField label="Confirmer le nouveau mot de passe">
          <input
            type="password"
            value={passwordForm.confirm}
            onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
            className="settings-input"
          />
        </SettingsField>
        {passwordError && <p className="text-xs font-semibold text-red-500">{passwordError}</p>}
        <button
          onClick={handleChangePassword}
          disabled={isSavingPassword || (!passwordForm.next && !passwordForm.confirm)}
          className="h-11 px-5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {isSavingPassword ? (
            "Mise à jour..."
          ) : passwordSuccess ? (
            <>
              <Check size={16} /> Mot de passe modifié
            </>
          ) : (
            "Modifier le mot de passe"
          )}
        </button>
      </SettingsSection>

      {/* Notifications */}
      <SettingsSection icon={Bell} title="Notifications" delay={0.2}>
        <SettingsToggle
          label="Notifications push"
          checked={usersRow?.notif_push ?? false}
          onChange={(v) => setNotif("notif_push", v)}
        />
        <SettingsToggle
          label="Alertes WhatsApp"
          checked={usersRow?.notif_whatsapp ?? false}
          onChange={(v) => setNotif("notif_whatsapp", v)}
        />
        <SettingsToggle
          label="Notifications email"
          checked={usersRow?.notif_email ?? false}
          onChange={(v) => setNotif("notif_email", v)}
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
              icon={isPaused ? PlayCircle : PauseCircle}
              label={isPaused ? "Réactiver la boutique" : "Fermer temporairement la boutique"}
              tone="amber"
              onClick={() => setShowConfirmPause(true)}
            />
          ) : (
            <DangerZoneConfirm
              key="pause-confirm"
              tone="amber"
              description={
                isPaused
                  ? "Ta boutique redeviendra visible dans le catalogue et tes clients pourront de nouveau commander."
                  : "Ta boutique ne sera plus visible dans le catalogue tant qu'elle est en pause. Tu pourras la réactiver à tout moment depuis cette page."
              }
              error={pauseError}
              confirmLabel={isPaused ? "Réactiver" : "Mettre en pause"}
              loading={isSavingPause}
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
              description="Cette action envoie une demande de suppression définitive. Notre équipe la traitera sous 48h, après vérification de l'historique de commandes en cours."
              error={deleteError}
              confirmLabel="Envoyer la demande"
              confirmDisabled={deleteConfirmText !== "SUPPRIMER"}
              loading={isDeleting}
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
    </DashboardLayout>
  );
}
