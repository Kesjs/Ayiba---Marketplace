"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ChevronRight, Globe, ShieldCheck, Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";

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

function validatePasswordStrength(value: string): string | null {
  if (value.length < 8) return "Le mot de passe doit contenir au moins 8 caractères.";
  if (!/[A-Z]/.test(value)) return "Le mot de passe doit contenir au moins une majuscule.";
  if (!/[0-9]/.test(value)) return "Le mot de passe doit contenir au moins un chiffre.";
  return null;
}

export default function ParametresPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [passwordForm, setPasswordForm] = useState({ next: "", confirm: "" });
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);

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

      setShowPasswordForm(false);
      setPasswordForm({ next: "", confirm: "" });
      showToast("Mot de passe modifié avec succès.", "success");
    } catch (err: any) {
      setPasswordError(translateAuthError(err));
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Paramètres</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Sécurité */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Sécurité</h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            <button
              onClick={() => setShowPasswordForm((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <span className="flex-1 text-left text-sm font-semibold text-gray-800">
                Modifier le mot de passe
              </span>
              <ChevronRight
                size={16}
                className={`text-gray-300 transition-transform ${showPasswordForm ? "rotate-90" : ""}`}
              />
            </button>
            {showPasswordForm && (
              <div className="px-4 pb-4 space-y-3 border-t border-gray-50 pt-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Nouveau mot de passe</label>
                  <input
                    type="password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, next: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Confirmer le mot de passe</label>
                  <input
                    type="password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm((f) => ({ ...f, confirm: e.target.value }))}
                    className="w-full h-10 rounded-lg border border-gray-200 px-3 text-sm focus:outline-none focus:border-coral-400"
                  />
                </div>
                {passwordError && <p className="text-xs font-semibold text-red-500">{passwordError}</p>}
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleChangePassword}
                  disabled={isSavingPassword || (!passwordForm.next && !passwordForm.confirm)}
                >
                  {isSavingPassword ? "Modification..." : "Enregistrer"}
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Notifications */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Notifications</h2>
          <Link
            href="/profil/notifications"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <Bell size={16} />
            </div>
            <span className="flex-1 text-sm font-semibold text-gray-800">Préférences de notifications</span>
            <ChevronRight size={16} className="text-gray-300 shrink-0" />
          </Link>
        </div>

        {/* Langue */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Langue</h2>
          <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5">
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <Globe size={16} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Français</p>
              <p className="text-xs text-gray-400">Seule langue disponible pour le moment</p>
            </div>
          </div>
        </div>

        {/* Confidentialité */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Confidentialité
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            <Link
              href="/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-800">Conditions d'utilisation</span>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
            <Link
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <span className="text-sm text-gray-800">Politique de confidentialité</span>
              <ChevronRight size={16} className="text-gray-300" />
            </Link>
          </div>
        </div>

        <p className="text-xs text-gray-400 text-center">
          Pour gérer tes adresses ou supprimer ton compte, rends-toi sur ton{" "}
          <Link href="/profil" className="text-coral-400 font-medium">
            profil
          </Link>
          .
        </p>
      </div>
    </main>
  );
}
