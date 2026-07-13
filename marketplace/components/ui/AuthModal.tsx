"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, Check, ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  intendedRole?: "vendeur" | "livreur" | null;
}

type Mode = "connexion" | "inscription" | "mot-de-passe-oublie";

export function AuthModal({ isOpen, onClose, intendedRole }: AuthModalProps) {
  const router = useRouter();
  const supabase = createClient();
  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isEmailValid = email.length > 0 && validateEmail(email);

  const getPasswordStrength = (value: string) => {
    if (value.length === 0) return null;
    if (value.length < 6) return { label: "Trop court", color: "bg-red-400", width: "25%" };
    if (value.length < 8) return { label: "Faible", color: "bg-amber-400", width: "50%" };
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { label: "Correct", color: "bg-amber-400", width: "70%" };
    return { label: "Solide", color: "bg-teal-500", width: "100%" };
  };
  const passwordStrength = mode === "inscription" ? getPasswordStrength(password) : null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async () => {
    setError(null);
    setMessage(null);

    if (mode === "mot-de-passe-oublie") {
      if (!validateEmail(email)) return setError("Adresse email invalide");
      setLoading(true);
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      setLoading(false);
      if (resetError) return setError(resetError.message);
      setMessage("Un lien de réinitialisation a été envoyé à ton adresse email.");
      return;
    }

    if (!validateEmail(email)) return setError("Adresse email invalide");
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères");

    setLoading(true);

    if (mode === "inscription") {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
          data: { role: intendedRole ?? "client" },
        },
      });
      setLoading(false);
      if (signUpError) return setError(signUpError.message);

      if (!data.session) {
        setMessage("Vérifie ta boîte mail pour confirmer ton compte et continuer.");
        return;
      }

      onClose();
      router.push(intendedRole ? `/${intendedRole}/kyc` : "/catalogue");
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (signInError) return setError(signInError.message);

      onClose();
      router.push(intendedRole ? `/${intendedRole}/dashboard` : "/catalogue");
      router.refresh();
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    setGoogleLoading(false);
    if (oauthError) setError(oauthError.message);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>

        {mode === "mot-de-passe-oublie" ? (
          <>
            <button onClick={() => switchMode("connexion")} className="flex items-center gap-1 text-sm text-gray-500 mb-3">
              <ArrowLeft size={14} /> Retour
            </button>
            <h2 className="text-[18px] font-medium text-gray-900 mb-1">Mot de passe oublié</h2>
            <p className="text-[14px] text-gray-600 mb-4">On t'envoie un lien pour le réinitialiser.</p>
          </>
        ) : (
          <>
            <h2 className="text-[18px] font-medium text-gray-900 mb-1">Bienvenue sur Ayiba</h2>
            <p className="text-[14px] text-gray-600 mb-4">
              {mode === "connexion" ? "Heureux de te revoir !" : "Rejoins-nous en quelques secondes"}
            </p>

            <div className="flex bg-gray-50 rounded-lg p-1 mb-5">
              <button onClick={() => switchMode("connexion")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === "connexion" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                Se connecter
              </button>
              <button onClick={() => switchMode("inscription")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === "inscription" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                S'inscrire
              </button>
            </div>

            <button onClick={handleGoogleAuth} disabled={googleLoading}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors">
              <svg width="18" height="18" viewBox="0 0 18 18">
                <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.56 2.7-3.87 2.7-6.62z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"/>
                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"/>
              </svg>
              {googleLoading ? "Connexion..." : "Continuer avec Google"}
            </button>

            <div className="flex items-center gap-3 my-4">
              <div className="flex-1 h-px bg-gray-100" />
              <span className="text-[11px] text-gray-400 uppercase tracking-wide">ou</span>
              <div className="flex-1 h-px bg-gray-100" />
            </div>
          </>
        )}

        <div className="mb-3">
          <div className={`flex items-center border rounded-lg px-3 transition-colors ${isEmailValid ? "border-teal-300" : "border-gray-200 focus-within:border-coral-400"}`}>
            <Mail size={16} className="text-gray-400 shrink-0" />
            <input type="email" placeholder="Adresse email" value={email}
              onChange={(e) => setEmail(e.target.value)} className="flex-1 h-11 text-sm px-2 focus:outline-none" />
            {isEmailValid && <Check size={16} className="text-teal-500 shrink-0" />}
          </div>
        </div>

        {mode !== "mot-de-passe-oublie" && (
          <div className="mb-1">
            <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors">
              <Lock size={16} className="text-gray-400 shrink-0" />
              <input type={showPassword ? "text" : "password"} placeholder="Mot de passe" value={password}
                onChange={(e) => setPassword(e.target.value)} className="flex-1 h-11 text-sm px-2 focus:outline-none" />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-400 shrink-0">
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
        )}

        {passwordStrength && (
          <div className="mb-2 mt-1.5">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">{passwordStrength.label}</span>
          </div>
        )}

        {mode === "connexion" && (
          <div className="flex justify-end mt-2 mb-2">
            <button onClick={() => switchMode("mot-de-passe-oublie")} className="text-[12px] text-coral-500">
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {error && <p className="text-[12px] text-red-400 mt-1 mb-2">{error}</p>}
        {message && <p className="text-[12px] text-teal-600 mt-1 mb-2">{message}</p>}

        <button onClick={handleSubmit} disabled={loading || !email || (mode !== "mot-de-passe-oublie" && !password)}
          className="w-full bg-coral-400 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed mt-3">
          {loading ? "Chargement..." :
            mode === "connexion" ? "Se connecter" :
            mode === "inscription" ? "Créer mon compte" :
            "Envoyer le lien"}
        </button>

        {mode !== "mot-de-passe-oublie" && (
          <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
            En continuant, tu acceptes nos{" "}
            <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500">conditions d'utilisation</a>{" "}
            et notre{" "}
            <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500">politique de confidentialité</a>.
          </p>
        )}
      </div>
    </div>
  );
}
