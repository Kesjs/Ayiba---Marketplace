"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, Eye, EyeOff, Check, ArrowLeft, AlertCircle, RefreshCw, ExternalLink, Pencil, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  intendedRole?: "vendeur" | "livreur" | null;
}

type Mode = "connexion" | "inscription" | "mot-de-passe-oublie";

// Traduction robuste des erreurs Supabase
const translateError = (err: any): string => {
  if (!err) return "Une erreur est survenue. Veuillez réessayer.";

  const message = typeof err === "string" 
    ? err 
    : err.message || JSON.stringify(err);

  const lowerMsg = message.toLowerCase();

  if (lowerMsg.includes("user already registered") || lowerMsg.includes("already exists")) {
    return "Un compte existe déjà avec cet email. Connecte-toi ou réinitialise ton mot de passe.";
  }
  if (lowerMsg.includes("invalid login credentials") || lowerMsg.includes("invalid credentials")) {
    return "Email ou mot de passe incorrect.";
  }
  if (lowerMsg.includes("email not confirmed")) {
    return "Tu dois confirmer ton adresse email avant de te connecter.";
  }
  if (lowerMsg.includes("password") && (lowerMsg.includes("too short") || lowerMsg.includes("6"))) {
    return "Le mot de passe doit contenir au moins 6 caractères.";
  }
  if (lowerMsg.includes("rate limit") || lowerMsg.includes("too many requests")) {
    return "Trop de tentatives. Veuillez réessayer dans quelques instants.";
  }
  if (lowerMsg.includes("invalid email")) {
    return "Adresse email invalide.";
  }
  if (lowerMsg.includes("fetch") || lowerMsg.includes("network") || lowerMsg.includes("failed to fetch")) {
    return "Problème de connexion. Vérifie ta connexion internet et réessaie.";
  }

  return message || "Une erreur est survenue. Veuillez réessayer.";
};

// Règles de robustesse du mot de passe à l'inscription
const validatePasswordStrength = (value: string): { valid: boolean; message: string | null } => {
  if (value.length < 8) return { valid: false, message: "Le mot de passe doit contenir au moins 8 caractères." };
  if (!/[A-Z]/.test(value)) return { valid: false, message: "Le mot de passe doit contenir au moins une majuscule." };
  if (!/[0-9]/.test(value)) return { valid: false, message: "Le mot de passe doit contenir au moins un chiffre." };
  return { valid: true, message: null };
};

const RESEND_COOLDOWN = 45;

export function AuthModal({ isOpen, onClose, intendedRole }: AuthModalProps) {
  const router = useRouter();
  // Client Supabase mémoïsé : une seule instance tant que le composant vit,
  // au lieu d'en recréer une à chaque re-render.
  const supabase = useMemo(() => createClient(), []);

  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [pendingConfirmationEmail, setPendingConfirmationEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const [pendingResetEmail, setPendingResetEmail] = useState<string | null>(null);
  const [resetCooldown, setResetCooldown] = useState(0);
  const [resettingResend, setResettingResend] = useState(false);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    if (resetCooldown <= 0) return;
    const timer = setInterval(() => setResetCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resetCooldown]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isEmailValid = email.length > 0 && validateEmail(email);

  const getPasswordStrength = (value: string) => {
    if (value.length === 0) return null;
    if (value.length < 8) return { label: "Trop court", color: "bg-red-400", width: "25%" };
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) return { label: "Ajoute une majuscule et un chiffre", color: "bg-amber-400", width: "60%" };
    return { label: "Solide", color: "bg-teal-500", width: "100%" };
  };

  const passwordStrength = mode === "inscription" ? getPasswordStrength(password) : null;

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    // On efface les mots de passe en changeant de contexte, pour éviter
    // toute confusion (ex: taper un mdp en inscription puis basculer en connexion).
    setPassword("");
    setConfirmPassword("");
  };

  const handleSubmit = async () => {
    setError(null);

    try {
      if (mode === "mot-de-passe-oublie") {
        if (!validateEmail(email)) return setError("Adresse email invalide");
        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback`,
        });
        setLoading(false);
        if (resetError) return setError(translateError(resetError));

        setPendingResetEmail(email);
        setResetCooldown(RESEND_COOLDOWN);
        return;
      }

      if (!validateEmail(email)) return setError("Adresse email invalide");

      if (mode === "inscription") {
        const { valid, message } = validatePasswordStrength(password);
        if (!valid) return setError(message!);
        if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas");
      } else {
        if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères");
      }

      setLoading(true);

      if (mode === "inscription") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`,
            // Le rôle choisi ici est repris par le trigger Postgres
            // on_auth_user_created pour créer la ligne correspondante
            // dans public.users (client / vendeur / livreur).
            data: { role: intendedRole ?? "client" },
          },
        });
        setLoading(false);

        if (signUpError) {
          setError(translateError(signUpError));
          return;
        }

        // Supabase renvoie un "faux succès" (sans erreur, sans email envoyé)
        // quand l'email existe déjà et est confirmé. Le seul signal fiable
        // est un tableau d'identités vide.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("Un compte existe déjà avec cet email. Connecte-toi plutôt.");
          return;
        }

        if (!data.session) {
          setPendingConfirmationEmail(email);
          setResendCooldown(RESEND_COOLDOWN);
          return;
        }

        onClose();
        router.push(intendedRole ? `/${intendedRole}/kyc` : "/catalogue");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (signInError) {
          setError(translateError(signInError));
          return;
        }

        onClose();
        router.push(intendedRole ? `/${intendedRole}/dashboard` : "/catalogue");
        router.refresh();
      }
    } catch (err) {
      setLoading(false);
      setError(translateError(err));
    }
  };

  const handleResendConfirmation = async () => {
    if (!pendingConfirmationEmail || resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resend({
        type: "signup",
        email: pendingConfirmationEmail,
        options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
      });
      if (resendError) {
        setError(translateError(resendError));
        return;
      }
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setResending(false);
    }
  };

  const handleResendReset = async () => {
    if (!pendingResetEmail || resetCooldown > 0) return;
    setResettingResend(true);
    setError(null);
    try {
      const { error: resendError } = await supabase.auth.resetPasswordForEmail(pendingResetEmail, {
        redirectTo: `${window.location.origin}/auth/callback`,
      });
      if (resendError) {
        setError(translateError(resendError));
        return;
      }
      setResetCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setResettingResend(false);
    }
  };

  const handleEditEmail = () => {
    setPendingConfirmationEmail(null);
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setResendCooldown(0);
  };

  const handleEditResetEmail = () => {
    setPendingResetEmail(null);
    setError(null);
    setResetCooldown(0);
  };

  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (oauthError) setError(translateError(oauthError));
      // Pas de setGoogleLoading(false) ici en cas de succès : la page va
      // rediriger vers Google, donc le state du composant n'a plus d'importance.
    } catch (err) {
      setError(translateError(err));
      setGoogleLoading(false);
    }
  };

  // Réinitialise complètement le modal à la fermeture, pour qu'une réouverture
  // reparte toujours d'un état propre (pas d'ancien email/erreur qui traîne).
  const handleClose = () => {
    setMode("connexion");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
    setError(null);
    setPendingConfirmationEmail(null);
    setPendingResetEmail(null);
    setResendCooldown(0);
    setResetCooldown(0);
    onClose();
  };

  if (!isOpen) return null;

  const mailProviderConfirmation = pendingConfirmationEmail ? getMailProviderLink(pendingConfirmationEmail) : null;
  const mailProviderReset = pendingResetEmail ? getMailProviderLink(pendingResetEmail) : null;

  const isSubmitDisabled =
    loading ||
    !email ||
    (mode !== "mot-de-passe-oublie" && !password) ||
    (mode === "inscription" && !confirmPassword);

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={handleClose}>
      <div className="bg-white rounded-lg p-6 max-w-sm w-full relative max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={18} />
        </button>

        {pendingConfirmationEmail ? (
          // Vérifie ta boîte mail - Inscription
          <div className="text-center pt-4">
            <div className="w-16 h-16 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <Mail size={28} className="text-teal-600" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Vérifie ta boîte mail</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-1">Nous avons envoyé un lien de confirmation à</p>
            <p className="text-[14px] font-bold text-gray-900 mb-6 break-all">{pendingConfirmationEmail}</p>

            {mailProviderConfirmation && (
              <a href={mailProviderConfirmation.url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 mb-3">
                Ouvrir {mailProviderConfirmation.name} <ExternalLink size={14} />
              </a>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-3 text-left">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button onClick={handleResendConfirmation} disabled={resendCooldown > 0 || resending}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 mb-4">
              <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
              {resendCooldown > 0 ? `Renvoyer l'email (${resendCooldown}s)` : resending ? "Envoi..." : "Renvoyer l'email"}
            </button>

            <button onClick={handleEditEmail} className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-coral-500">
              <Pencil size={12} /> Mauvaise adresse ? Modifier
            </button>
          </div>
        ) : pendingResetEmail ? (
          // Vérifie ta boîte mail - Réinitialisation
          <div className="text-center pt-4">
            <div className="w-16 h-16 bg-coral-50 rounded-full flex items-center justify-center mx-auto mb-5">
              <KeyRound size={28} className="text-coral-500" />
            </div>
            <h2 className="text-[18px] font-bold text-gray-900 mb-2">Vérifie ta boîte mail</h2>
            <p className="text-[14px] text-gray-600 leading-relaxed mb-1">Nous avons envoyé un lien de réinitialisation à</p>
            <p className="text-[14px] font-bold text-gray-900 mb-6 break-all">{pendingResetEmail}</p>

            {mailProviderReset && (
              <a href={mailProviderReset.url} target="_blank" rel="noopener noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 mb-3">
                Ouvrir {mailProviderReset.name} <ExternalLink size={14} />
              </a>
            )}

            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-3 text-left">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button onClick={handleResendReset} disabled={resetCooldown > 0 || resettingResend}
              className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 mb-4">
              <RefreshCw size={14} className={resettingResend ? "animate-spin" : ""} />
              {resetCooldown > 0 ? `Renvoyer le lien (${resetCooldown}s)` : resettingResend ? "Envoi..." : "Renvoyer le lien"}
            </button>

            <button onClick={handleEditResetEmail} className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-coral-500">
              <Pencil size={12} /> Mauvaise adresse ? Modifier
            </button>
          </div>
        ) : (
          // Formulaire principal
          <>
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
                  <button onClick={() => switchMode("connexion")} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === "connexion" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
                    Se connecter
                  </button>
                  <button onClick={() => switchMode("inscription")} className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${mode === "inscription" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"}`}>
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

            {/* Email */}
            <div className="mb-3">
              <div className={`flex items-center border rounded-lg px-3 transition-colors ${isEmailValid ? "border-teal-300" : "border-gray-200 focus-within:border-coral-400"}`}>
                <Mail size={16} className="text-gray-400 shrink-0" />
                <input type="email" placeholder="Adresse email" value={email}
                  onChange={(e) => setEmail(e.target.value)} className="flex-1 h-11 text-sm px-2 focus:outline-none" />
                {isEmailValid && <Check size={16} className="text-teal-500 shrink-0" />}
              </div>
            </div>

            {/* Mot de passe */}
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
              <div className="mb-3 mt-1.5">
                <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full ${passwordStrength.color}`} style={{ width: passwordStrength.width }} />
                </div>
                <span className="text-[11px] text-gray-400 mt-1 block">{passwordStrength.label}</span>
              </div>
            )}

            {/* Confirmation mot de passe */}
            {mode === "inscription" && (
              <div className="mb-1">
                <div className={`flex items-center border rounded-lg px-3 transition-colors ${
                  confirmPassword.length > 0 ? (password === confirmPassword ? "border-teal-300" : "border-red-300") : "border-gray-200 focus-within:border-coral-400"
                }`}>
                  <Lock size={16} className="text-gray-400 shrink-0" />
                  <input type={showPassword ? "text" : "password"} placeholder="Confirmer le mot de passe"
                    value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                    className="flex-1 h-11 text-sm px-2 focus:outline-none" />
                  {confirmPassword.length > 0 && password === confirmPassword && <Check size={16} className="text-teal-500 shrink-0" />}
                </div>
              </div>
            )}

            {mode === "connexion" && (
              <div className="flex justify-end mt-2 mb-2">
                <button onClick={() => switchMode("mot-de-passe-oublie")} className="text-[12px] text-coral-500">
                  Mot de passe oublié ?
                </button>
              </div>
            )}

            {/* Affichage des erreurs */}
            {error && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mt-2 mb-2">
                <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
              </div>
            )}

            <button onClick={handleSubmit} disabled={isSubmitDisabled}
              className="w-full bg-coral-400 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed mt-3">
              {loading ? "Chargement..." :
                mode === "connexion" ? "Se connecter" :
                mode === "inscription" ? "Créer mon compte" : "Envoyer le lien"}
            </button>

            {mode !== "mot-de-passe-oublie" && (
              <p className="text-[11px] text-gray-400 mt-3 text-center leading-relaxed">
                En continuant, vous acceptez nos{" "}
                <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500">conditions d'utilisation</a>{" "}
                et notre{" "}
                <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500">politique de confidentialité</a>.
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Fonction utilitaire pour les liens mail
function getMailProviderLink(email: string): { name: string; url: string } | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (domain.includes("gmail")) return { name: "Gmail", url: "https://mail.google.com" };
  if (domain.includes("outlook") || domain.includes("hotmail") || domain.includes("live")) {
    return { name: "Outlook", url: "https://outlook.live.com/mail" };
  }
  if (domain.includes("yahoo")) return { name: "Yahoo Mail", url: "https://mail.yahoo.com" };
  return null;
}
