"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, LogOut, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validatePasswordStrength } from "@/lib/validation";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/lib/hooks/useUser";
import { Button } from "@/components/ui/Button";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import {
  SettingsField,
  DangerZoneCard,
  DangerZoneRow,
  DangerZoneModal,
} from "@/components/settings/SettingsForm";

// Recentrée sur la sécurité uniquement — c'est la seule chose que
// pointait Centre de confiance ("Changer le mot de passe" → cette page).
// Notifications et Langue ont leur propre entrée ailleurs dans Compte (ou,
// pour Langue, ne justifiaient pas un item séparé vu qu'une seule langue
// est disponible). CGU/Confidentialité ont migré vers Centre d'aide.
// Déconnexion et suppression de compte, qui vivaient avant dans /profil
// (devenue une page d'identité pure), trouvent ici leur place naturelle,
// à côté du reste des actions de sécurité — même pattern "zone sensible"
// que /vendeur/parametres.

function translateAuthError(err: any): string {
  const message = (err?.message || "").toLowerCase();
  if (!message) return "Une erreur est survenue. Réessaie.";
  if (message.includes("password") && message.includes("weak")) {
    return "Ce mot de passe est trop faible.";
  }
  if (message.includes("same password") || message.includes("different from")) {
    return "Le nouveau mot de passe doit être différent de l'ancien.";
  }
  if (message.includes("rate limit") || message.includes("too many")) {
    return "Trop de tentatives. Réessaie dans quelques instants.";
  }
  return "Une erreur est survenue. Réessaie.";
}

export default function ParametresPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const { profile } = useUser();

  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

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
      showToast("Mot de passe modifié avec succès.", "success");
      setTimeout(() => setPasswordSuccess(false), 2500);
    } catch (err: any) {
      setPasswordError(translateAuthError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    router.push("/");
  };

  // Suppression : demande envoyée à l'équipe (table demandes_suppression),
  // traitée sous 48h — même flux que vendeur/livreur, plutôt qu'un DELETE
  // direct sur la ligne users (ce que faisait l'ancien code de /profil).
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSent, setDeleteSent] = useState(false);

  const handleConfirmDelete = async () => {
    if (deleteConfirmText !== "SUPPRIMER" || !profile) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const { error } = await supabase.from("demandes_suppression").insert({ user_id: profile.id });
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

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.push("/menu/confiance")} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Sécurité</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Mot de passe */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Mot de passe</h2>
          <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
            <SettingsField label="Nouveau mot de passe">
              <input
                type="password"
                value={passwordForm.next}
                onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                className="settings-input"
                placeholder="8 caractères, 1 majuscule, 1 chiffre"
              />
            </SettingsField>
            <SettingsField label="Confirmer le mot de passe">
              <input
                type="password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                className="settings-input"
              />
            </SettingsField>
            {passwordError && <p className="text-xs font-semibold text-red-500">{passwordError}</p>}
            <Button
              variant="primary"
              className="w-full"
              onClick={handleChangePassword}
              disabled={isSavingPassword || (!passwordForm.next && !passwordForm.confirm)}
            >
              {isSavingPassword ? (
                "Modification..."
              ) : passwordSuccess ? (
                <span className="flex items-center justify-center gap-2">
                  <Check size={16} /> Mot de passe modifié
                </span>
              ) : (
                "Enregistrer"
              )}
            </Button>
          </div>
        </div>

        {/* Déconnexion */}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full h-12 rounded-xl border border-red-100 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut size={16} /> Déconnexion
        </button>

        {/* Zone sensible */}
        {deleteSent ? (
          <div className="w-full p-4 rounded-2xl border border-teal-100 bg-teal-50 text-teal-800 text-sm font-semibold flex items-center gap-3">
            <Check size={18} />
            Demande envoyée — notre équipe te contactera sous 48h.
          </div>
        ) : (
          <DangerZoneCard
            title="Zone sensible"
            subtitle="Cette action concerne directement l'accès à ton compte."
          >
            <DangerZoneRow
              icon={Trash2}
              title="Supprimer mon compte"
              description="Demande de suppression définitive, traitée sous 48h par notre équipe."
              actionLabel="Supprimer"
              tone="red"
              onClick={() => setShowConfirmDelete(true)}
            />
          </DangerZoneCard>
        )}
      </div>

      <DangerZoneModal
        open={showConfirmDelete}
        tone="red"
        title="Supprimer mon compte"
        description="Cette action envoie une demande de suppression définitive. Notre équipe la traitera sous 48h, après vérification de l'historique de commandes en cours."
        error={deleteError}
        confirmLabel="Envoyer la demande"
        confirmDisabled={deleteConfirmText !== "SUPPRIMER"}
        loading={isDeleting}
        onClose={() => {
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
      </DangerZoneModal>

      <LogoutConfirmModal open={showLogoutModal} onConfirm={confirmLogout} onCancel={() => setShowLogoutModal(false)} />
    </main>
  );
}
