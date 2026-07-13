"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ShieldAlert } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();

  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionValid, setSessionValid] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      setSessionValid(!!data.session);
      setCheckingSession(false);
    };
    checkSession();
  }, []);

  const getPasswordStrength = (value: string) => {
    if (value.length === 0) return null;
    if (value.length < 6) return { label: "Trop court", color: "bg-red-400", width: "25%" };
    if (value.length < 8) return { label: "Faible", color: "bg-amber-400", width: "50%" };
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { label: "Correct", color: "bg-amber-400", width: "70%" };
    return { label: "Solide", color: "bg-teal-500", width: "100%" };
  };
  const passwordStrength = getPasswordStrength(password);

  const handleSubmit = async () => {
    setError(null);

    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères");
    if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas");

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) return setError(updateError.message);
    setDone(true);
  };

  // Chargement pendant la vérification de session
  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-coral-500 rounded-full animate-spin" />
      </div>
    );
  }

  // Lien invalide ou expiré
  if (!sessionValid) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <ShieldAlert size={28} className="text-red-500" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Lien invalide ou expiré</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Ce lien de réinitialisation n'est plus valide. Demande un nouveau lien pour continuer.
          </p>
          <button
            onClick={() => router.push("/")}
            className="w-full bg-coral-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-coral-600 transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  // Succès
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-sm w-full bg-white rounded-2xl border border-teal-100 shadow-sm p-8 text-center">
          <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={28} className="text-teal-600" />
          </div>
          <h1 className="text-lg font-bold text-gray-900 mb-2">Mot de passe mis à jour !</h1>
          <p className="text-sm text-gray-500 leading-relaxed mb-6">
            Tu peux maintenant continuer sur Ayiba avec ton nouveau mot de passe.
          </p>
          <button
            onClick={() => router.push("/catalogue")}
            className="w-full bg-coral-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-coral-600 transition-colors"
          >
            Continuer
          </button>
        </div>
      </div>
    );
  }

  // Formulaire
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="max-w-sm w-full bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">
        <div className="w-14 h-14 bg-coral-50 rounded-2xl flex items-center justify-center mb-5">
          <Lock size={24} className="text-coral-500" />
        </div>

        <h1 className="text-lg font-bold text-gray-900 mb-1">Nouveau mot de passe</h1>
        <p className="text-sm text-gray-500 mb-6">Choisis un mot de passe sécurisé pour ton compte.</p>

        <div className="space-y-4">
          <div>
            <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Nouveau mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex-1 h-11 text-sm px-2 focus:outline-none"
              />
              <button type="button" onClick={() => setShowPassword((v) => !v)} className="text-gray-400 shrink-0">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>

            {passwordStrength && (
              <div className="mt-2">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">{passwordStrength.label}</span>
              </div>
            )}
          </div>

          <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors">
            <Lock size={16} className="text-gray-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Confirmer le mot de passe"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex-1 h-11 text-sm px-2 focus:outline-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || password.length < 6 || !confirmPassword}
            className="w-full bg-coral-500 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          </button>
        </div>
      </div>
    </div>
  );
}
