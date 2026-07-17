"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  User, Bell, Store, Smartphone, ChevronRight, Camera,
  X, Mail, Phone, Lock, Trash2, PauseCircle, PlayCircle, Loader2, AlertCircle, RefreshCw
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { validateBeninPhone } from "@/lib/validation";

// ============================================
// MODALE RÉUTILISABLE — bottom sheet mobile, dialog centré desktop
// ============================================
function SettingsModal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
          />
          <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
            <motion.div
              initial={{ y: 40, opacity: 0, scale: 0.98 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 40, opacity: 0, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl p-5 sm:p-6 shadow-2xl max-h-[85vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// ============================================
// TOGGLE — switch animé façon iOS
// ============================================
function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      aria-label={label}
      className={`relative w-12 h-7 rounded-full transition-colors duration-300 shrink-0 disabled:opacity-50 ${
        checked ? "bg-teal-500" : "bg-gray-200"
      }`}
      aria-pressed={checked}
    >
      <motion.div
        className="absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md"
        animate={{ left: checked ? "22px" : "2px" }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      />
    </button>
  );
}

// ============================================
// INPUT FIELD réutilisable pour les modales
// ============================================
function Field({
  label,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
}: {
  label: string;
  icon: any;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">{label}</label>
      <div className="relative">
        <Icon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full h-12 pl-11 pr-4 rounded-lg border text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 transition-all ${
            error
              ? "border-red-300 focus:ring-red-100 focus:border-red-400"
              : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
          }`}
        />
      </div>
      {error && <p className="text-xs text-red-500 mt-1.5">{error}</p>}
    </div>
  );
}

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

  // ---- Chargement des données réelles ----
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authEmail, setAuthEmail] = useState<string>("");
  const [usersRow, setUsersRow] = useState<UsersRow | null>(null);
  const [vendeurRow, setVendeurRow] = useState<VendeurRow | null>(null);

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

  // Nom affiché : full_name si renseigné, sinon fallback (affichage seul) sur le nom légal du KYC.
  // Jamais écrit en base tant que le vendeur n'a pas confirmé/modifié dans le formulaire.
  const displayName = usersRow?.full_name?.trim() || vendeurRow?.nom_complet || "";

  // ---- Modifier le profil ----
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editForm, setEditForm] = useState({ full_name: "", email: "", phone: "" });
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const openEditProfile = () => {
    setEditError(null);
    setEditFieldErrors({});
    setEditForm({
      full_name: usersRow?.full_name?.trim() || vendeurRow?.nom_complet || "",
      email: authEmail,
      phone: usersRow?.phone ?? "",
    });
    setShowEditProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!userId) return;
    setEditError(null);

    const errors: Record<string, string> = {};
    if (editForm.full_name.trim().length < 2) {
      errors.full_name = "Le nom doit faire au moins 2 caractères.";
    }
    const phoneCheck = validateBeninPhone(editForm.phone);
    if (!phoneCheck.isValid) {
      errors.phone = phoneCheck.error || "Numéro invalide.";
    }
    const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email);
    if (!emailValid) {
      errors.email = "Adresse email invalide.";
    }
    setEditFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setIsSavingProfile(true);
    try {
      // 1. Nom + téléphone dans public.users
      const { error: updateError } = await supabase
        .from("users")
        .update({ full_name: editForm.full_name.trim(), phone: phoneCheck.formatted })
        .eq("id", userId);
      if (updateError) throw updateError;

      setUsersRow((prev) => (prev ? { ...prev, full_name: editForm.full_name.trim(), phone: phoneCheck.formatted } : prev));

      // 2. Email — géré séparément par Supabase Auth (confirmation requise)
      let emailChanged = false;
      if (editForm.email.trim() !== authEmail) {
        const { error: emailError } = await supabase.auth.updateUser({ email: editForm.email.trim() });
        if (emailError) throw emailError;
        emailChanged = true;
      }

      setShowEditProfile(false);
      showToast(
        emailChanged
          ? "Profil mis à jour. Vérifie ta boîte mail pour confirmer ta nouvelle adresse."
          : "Profil mis à jour",
        "success"
      );
    } catch (err: any) {
      console.error("Save profile:", err);
      setEditError(translateAuthError(err) !== "Une erreur est survenue. Réessaie." ? translateAuthError(err) : `Échec de l'enregistrement : ${err.message || "réessaie."}`);
    } finally {
      setIsSavingProfile(false);
    }
  };

  // ---- Changer le mot de passe ----
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const validatePasswordStrength = (value: string): string | null => {
    if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
    if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule.";
    if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre.";
    return null;
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
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

      setShowChangePassword(false);
      setPasswordForm({ next: "", confirm: "" });
      showToast("Mot de passe modifié avec succès", "success");
    } catch (err: any) {
      console.error("Change password:", err);
      setPasswordError(translateAuthError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  // ---- Notifications ----
  const [savingNotif, setSavingNotif] = useState<string | null>(null);

  const handleToggleNotif = async (key: "notif_push" | "notif_whatsapp" | "notif_email") => {
    if (!userId || !usersRow) return;
    const previousValue = usersRow[key];
    const nextValue = !previousValue;

    setUsersRow((prev) => (prev ? { ...prev, [key]: nextValue } : prev));
    setSavingNotif(key);

    try {
      const { error } = await supabase.from("users").update({ [key]: nextValue }).eq("id", userId);
      if (error) throw error;
      showToast(
        `Notifications ${key === "notif_push" ? "push" : key === "notif_whatsapp" ? "WhatsApp" : "email"} ${nextValue ? "activées" : "désactivées"}`,
        "success"
      );
    } catch (err: any) {
      console.error("Toggle notif:", err);
      setUsersRow((prev) => (prev ? { ...prev, [key]: previousValue } : prev));
      showToast("Impossible d'enregistrer cette préférence — réessaie.", "error");
    } finally {
      setSavingNotif(null);
    }
  };

  // ---- Pause / réactivation boutique ----
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
      showToast(!isPaused ? "Votre boutique est maintenant en pause" : "Votre boutique est de nouveau active", "success");
    } catch (err: any) {
      console.error("Toggle pause:", err);
      setPauseError(err?.message ? `Échec : ${err.message}` : "Impossible de mettre à jour le statut de la boutique.");
    } finally {
      setIsSavingPause(false);
    }
  };

  // ---- Suppression de compte ----
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER" || !userId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.from("demandes_suppression").insert({ user_id: userId });
      if (error) throw error;

      setShowConfirmDelete(false);
      setDeleteConfirmText("");
      showToast("Demande de suppression envoyée — notre équipe te contactera sous 48h.", "success");
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
      <div className="max-w-4xl mx-auto space-y-8 md:space-y-10 animate-pulse">
        <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 h-32" />
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 h-48" />
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 h-48" />
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 leading-relaxed mb-3">{loadError}</p>
            <button
              onClick={loadAll}
              className="inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-800"
            >
              <RefreshCw size={13} />
              Réessayer
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-10">
      {/* Profile Header */}
      <div className="bg-white p-5 md:p-6 rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm flex flex-col md:flex-row items-center gap-5 md:gap-6">
        <div className="relative group shrink-0">
          <div className="w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gray-100 overflow-hidden border-4 border-white shadow-md">
            {usersRow?.avatar_url ? (
              <img src={usersRow.avatar_url} className="w-full h-full object-cover" alt="" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400 bg-gray-100">
                {(displayName || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          <button className="absolute -bottom-2 -right-2 w-9 h-9 md:w-10 md:h-10 bg-coral-500 text-white rounded-lg flex items-center justify-center shadow-lg border-2 border-white hover:scale-110 active:scale-95 transition-transform">
            <Camera size={16} />
          </button>
        </div>
        <div className="text-center md:text-left flex-1 min-w-0">
          <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 truncate">
            {displayName || "Nom non renseigné"}
          </h3>
          <p className="text-gray-500 font-medium text-sm mb-3 md:mb-4">Vendeuse sur Ayiba</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {vendeurRow?.statut === "valide" && (
              <span className="px-3 py-1 bg-teal-50 text-teal-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-teal-100">
                Boutique Vérifiée
              </span>
            )}
            {isPaused && (
              <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-bold uppercase tracking-widest border border-amber-100">
                En pause
              </span>
            )}
          </div>
        </div>
        <Button
          variant="secondary"
          className="rounded-xl h-11 md:h-12 px-6 w-full md:w-auto shrink-0"
          onClick={openEditProfile}
        >
          Modifier le profil
        </Button>
      </div>

      {/* Compte */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Compte</h4>
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <button
            onClick={openEditProfile}
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
                <User size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Informations personnelles</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">{authEmail}</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <button
            onClick={() => {
              setPasswordError(null);
              setPasswordForm({ next: "", confirm: "" });
              setShowChangePassword(true);
            }}
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
                <Lock size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Mot de passe</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5">••••••••</p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
          </button>

          <Link
            href="/vendeur/boutique"
            className="w-full flex items-center justify-between p-4 md:p-5 hover:bg-gray-50 transition-colors group text-left"
          >
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
                <Store size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">Ma boutique</p>
                <p className="text-xs text-gray-400 font-medium mt-0.5 truncate">
                  {vendeurRow?.nom_boutique || "Nom, adresse, horaires"}
                </p>
              </div>
            </div>
            <ChevronRight size={18} className="text-gray-300 group-hover:text-gray-500 group-hover:translate-x-1 transition-all shrink-0" />
          </Link>
        </div>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-4">Notifications</h4>
        <div className="bg-white rounded-2xl md:rounded-3xl border border-gray-100 shadow-sm overflow-hidden divide-y divide-gray-50">
          <div className="w-full flex items-center justify-between p-4 md:p-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Bell size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications push</p>
            </div>
            {savingNotif === "notif_push" ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Toggle
                checked={usersRow?.notif_push ?? false}
                onChange={() => handleToggleNotif("notif_push")}
                label="Notifications push"
              />
            )}
          </div>

          <div className="w-full flex items-center justify-between p-4 md:p-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Smartphone size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Alertes WhatsApp</p>
            </div>
            {savingNotif === "notif_whatsapp" ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Toggle
                checked={usersRow?.notif_whatsapp ?? false}
                onChange={() => handleToggleNotif("notif_whatsapp")}
                label="Alertes WhatsApp"
              />
            )}
          </div>

          <div className="w-full flex items-center justify-between p-4 md:p-5">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-10 h-10 rounded-lg bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
                <Mail size={20} />
              </div>
              <p className="text-sm font-bold text-gray-900">Notifications email</p>
            </div>
            {savingNotif === "notif_email" ? (
              <Loader2 size={18} className="animate-spin text-gray-400" />
            ) : (
              <Toggle
                checked={usersRow?.notif_email ?? false}
                onChange={() => handleToggleNotif("notif_email")}
                label="Notifications email"
              />
            )}
          </div>
        </div>
      </div>

      {/* Zone dangereuse */}
      <div className="pt-4 md:pt-6 border-t border-gray-100 space-y-3">
        <h4 className="text-xs font-bold text-red-400 uppercase tracking-widest ml-4">Zone sensible</h4>

        <button
          onClick={() => {
            setPauseError(null);
            setShowConfirmPause(true);
          }}
          className="w-full p-4 md:p-5 bg-amber-50 text-amber-700 rounded-2xl border border-amber-100 flex items-center justify-between hover:bg-amber-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white text-amber-600 flex items-center justify-center shadow-sm shrink-0">
              {isPaused ? <PlayCircle size={20} /> : <PauseCircle size={20} />}
            </div>
            <p className="font-bold text-sm text-left">
              {isPaused ? "Réactiver la boutique" : "Fermer temporairement la boutique"}
            </p>
          </div>
          <ChevronRight size={18} className="shrink-0" />
        </button>

        <button
          onClick={() => setShowConfirmDelete(true)}
          className="w-full p-4 md:p-5 bg-red-50 text-red-600 rounded-2xl border border-red-100 flex items-center justify-between hover:bg-red-100 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-white text-red-500 flex items-center justify-center shadow-sm shrink-0">
              <Trash2 size={20} />
            </div>
            <p className="font-bold text-sm text-left">Supprimer mon compte</p>
          </div>
          <ChevronRight size={18} className="shrink-0" />
        </button>
      </div>

      {/* MODALE — Modifier le profil */}
      <SettingsModal isOpen={showEditProfile} onClose={() => !isSavingProfile && setShowEditProfile(false)} title="Modifier mes informations">
        <div className="space-y-4">
          <Field
            label="Nom complet"
            icon={User}
            value={editForm.full_name}
            onChange={(v) => setEditForm((f) => ({ ...f, full_name: v }))}
            error={editFieldErrors.full_name}
          />
          <Field
            label="Email"
            icon={Mail}
            type="email"
            value={editForm.email}
            onChange={(v) => setEditForm((f) => ({ ...f, email: v }))}
            error={editFieldErrors.email}
          />
          <Field
            label="Téléphone"
            icon={Phone}
            value={editForm.phone}
            onChange={(v) => setEditForm((f) => ({ ...f, phone: v }))}
            error={editFieldErrors.phone}
          />

          {editError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{editError}</p>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-lg mt-2"
            onClick={handleSaveProfile}
            disabled={isSavingProfile}
          >
            {isSavingProfile ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Enregistrer"}
          </Button>
        </div>
      </SettingsModal>

      {/* MODALE — Changer le mot de passe */}
      <SettingsModal isOpen={showChangePassword} onClose={() => !isSavingPassword && setShowChangePassword(false)} title="Changer le mot de passe">
        <div className="space-y-4">
          <Field
            label="Nouveau mot de passe"
            icon={Lock}
            type="password"
            value={passwordForm.next}
            onChange={(v) => setPasswordForm((f) => ({ ...f, next: v }))}
            placeholder="8 caractères, 1 majuscule, 1 chiffre"
          />
          <Field
            label="Confirmer le nouveau mot de passe"
            icon={Lock}
            type="password"
            value={passwordForm.confirm}
            onChange={(v) => setPasswordForm((f) => ({ ...f, confirm: v }))}
          />

          {passwordError && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
              <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 leading-relaxed">{passwordError}</p>
            </div>
          )}

          <Button
            className="w-full h-12 rounded-lg mt-2"
            onClick={handleChangePassword}
            disabled={isSavingPassword}
          >
            {isSavingPassword ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Mettre à jour"}
          </Button>
        </div>
      </SettingsModal>

      {/* MODALE — Confirmer pause / réactivation boutique */}
      <SettingsModal isOpen={showConfirmPause} onClose={() => !isSavingPause && setShowConfirmPause(false)} title={isPaused ? "Réactiver la boutique" : "Fermer temporairement"}>
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          {isPaused
            ? "Votre boutique redeviendra visible dans le catalogue et vos clients pourront de nouveau commander."
            : "Votre boutique ne sera plus visible dans le catalogue tant qu'elle est en pause. Vous pourrez la réactiver à tout moment depuis cette page."}
        </p>

        {pauseError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{pauseError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => setShowConfirmPause(false)}
            disabled={isSavingPause}
            className="flex-1 h-12 rounded-lg border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmPause}
            disabled={isSavingPause}
            className="flex-1 h-12 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            {isSavingPause ? <Loader2 size={18} className="animate-spin" /> : isPaused ? "Réactiver" : "Mettre en pause"}
          </button>
        </div>
      </SettingsModal>

      {/* MODALE — Confirmer suppression compte */}
      <SettingsModal
        isOpen={showConfirmDelete}
        onClose={() => {
          if (isDeleting) return;
          setShowConfirmDelete(false);
          setDeleteConfirmText("");
          setDeleteError(null);
        }}
        title="Supprimer mon compte"
      >
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          Cette action envoie une <strong className="text-red-600">demande de suppression définitive</strong>. Notre équipe la traitera sous 48h, après vérification de l'historique de commandes en cours.
        </p>
        <p className="text-xs text-gray-500 font-medium mb-2">
          Tapez <strong className="text-gray-900">SUPPRIMER</strong> pour confirmer :
        </p>
        <input
          type="text"
          value={deleteConfirmText}
          onChange={(e) => setDeleteConfirmText(e.target.value)}
          className="w-full h-12 px-4 rounded-lg border border-gray-200 text-sm font-medium mb-4 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 transition-all"
          placeholder="SUPPRIMER"
        />

        {deleteError && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3 mb-4">
            <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
            <p className="text-xs text-red-700 leading-relaxed">{deleteError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={() => {
              setShowConfirmDelete(false);
              setDeleteConfirmText("");
              setDeleteError(null);
            }}
            disabled={isDeleting}
            className="flex-1 h-12 rounded-lg border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Annuler
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={deleteConfirmText !== "SUPPRIMER" || isDeleting}
            className="flex-1 h-12 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:cursor-not-allowed text-white font-bold text-sm transition-colors flex items-center justify-center"
          >
            {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Envoyer la demande"}
          </button>
        </div>
      </SettingsModal>
    </div>
  );
}
