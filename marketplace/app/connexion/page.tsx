"use client";

import { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mail, Lock, Eye, EyeOff, Check, ArrowLeft, AlertCircle, RefreshCw, ExternalLink, Pencil, KeyRound, Store, Bike, User, Phone, ShoppingBag } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { validateBeninPhone, validatePasswordStrength } from "@/lib/validation";
import { useSmartGeolocation } from "@/lib/hooks/useSmartGeolocation";
import { getAppUrl } from "@/lib/url";
import LogoAyiba from "@/components/ui/LogoAyiba";

type Mode =
  | "connexion"
  | "inscription"
  | "mot-de-passe-oublie"
  | "verification-inscription"
  | "verification-reset";

const RESEND_COOLDOWN = 45;

const translateError = (err: any): string => {
  if (!err) return "Une erreur est survenue. Veuillez réessayer.";

  const message =
    typeof err === "string" ? err : err.message || err.msg || err.error_description || "";

  if (!message || message.trim() === "") {
    return "Une erreur est survenue. Veuillez réessayer.";
  }

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

  return "Une erreur est survenue. Veuillez réessayer.";
};

const getRoleConfig = (role: "vendeur" | "livreur" | null | undefined) => {
  if (role === "vendeur") {
    return {
      icon: Store,
      iconColor: "text-coral-500",
      bgColor: "bg-coral-50",
      bgBorder: "border-coral-100",
      roleTitle: "Espace Vendeur Ayiba",
      roleSubtitle: "Gérez votre boutique et développez vos ventes sans frais cachés.",
      buttonColor: "bg-coral-400 hover:bg-coral-600",
    };
  }
  if (role === "livreur") {
    return {
      icon: Bike,
      iconColor: "text-teal-600",
      bgColor: "bg-teal-50",
      bgBorder: "border-teal-100",
      roleTitle: "Espace Livreur Partenaire",
      roleSubtitle: "Livrez à votre rythme, paiements instantanés par Mobile Money.",
      buttonColor: "bg-teal-500 hover:bg-teal-600",
    };
  }
  return {
    icon: null,
    iconColor: "",
    bgColor: "bg-gray-50",
    bgBorder: "border-gray-100",
    roleTitle: null,
    roleSubtitle: null,
    buttonColor: "bg-coral-400 hover:bg-coral-600",
  };
};

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

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = useMemo(() => createClient(), []);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const { syncGeoToProfileIfNeeded } = useSmartGeolocation();

  // On récupère "role" et "redirect" depuis l'URL (qui remplacent les props AuthModal)
  const queryRole = searchParams.get("role") as "vendeur" | "livreur" | null;
  const intendedRole = queryRole === "vendeur" || queryRole === "livreur" ? queryRole : null;
  const redirectTo = searchParams.get("redirect");
  
  // S'il y a un redirect explicite ou un paramètre "signup=1", on bascule par défaut sur l'inscription
  const forceSignup = searchParams.get("signup") === "1" || searchParams.get("mode") === "inscription";
  
  const [mode, setMode] = useState<Mode>(forceSignup ? "inscription" : "connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nomComplet, setNomComplet] = useState("");
  const [telephone, setTelephone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [verifiedEmail, setVerifiedEmail] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resending, setResending] = useState(false);

  const roleConfig = getRoleConfig(intendedRole);
  const isClientSignup = mode === "inscription" && !intendedRole;

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => setResendCooldown((s) => s - 1), 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  useEffect(() => {
    const isVerificationStep = mode === "verification-inscription" || mode === "verification-reset";
    if (!isVerificationStep) {
      const t = setTimeout(() => emailInputRef.current?.focus(), 50);
      return () => clearTimeout(t);
    }
  }, [mode]);

  const validateEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  const isEmailValid = email.length > 0 && validateEmail(email);

  const getPasswordStrength = (value: string) => {
    if (value.length === 0) return null;
    if (value.length < 8) return { label: "Trop court", color: "bg-red-400", width: "25%" };
    if (!/[A-Z]/.test(value) || !/[0-9]/.test(value)) {
      return { label: "Ajoute une majuscule et un chiffre", color: "bg-amber-400", width: "60%" };
    }
    return { label: "Solide", color: "bg-teal-500", width: "100%" };
  };
  const passwordStrength = mode === "inscription" ? getPasswordStrength(password) : null;

  const resetFormFields = () => {
    setError(null);
    setPhoneError(null);
    setPassword("");
    setConfirmPassword("");
    setNomComplet("");
    setTelephone("");
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    resetFormFields();
  };

  const handleSubmit = async () => {
    setError(null);
    setPhoneError(null);

    try {
      if (mode === "mot-de-passe-oublie") {
        if (!validateEmail(email)) return setError("Adresse email invalide");
        setLoading(true);
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
        });
        setLoading(false);
        if (resetError) return setError(translateError(resetError));

        setVerifiedEmail(email);
        setMode("verification-reset");
        setResendCooldown(RESEND_COOLDOWN);
        return;
      }

      if (!validateEmail(email)) return setError("Adresse email invalide");

      if (mode === "inscription") {
        const strengthError = validatePasswordStrength(password);
        if (strengthError) return setError(strengthError);
        if (password !== confirmPassword) return setError("Les deux mots de passe ne correspondent pas");
      } else {
        if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères");
      }

      let telephoneFormatted = "";
      if (isClientSignup) {
        if (nomComplet.trim().length < 2) return setError("Merci d'indiquer ton nom complet");
        const phoneValidation = validateBeninPhone(telephone);
        if (!phoneValidation.isValid) return setPhoneError(phoneValidation.error || "Numéro de téléphone invalide");
        telephoneFormatted = phoneValidation.formatted;
      }

      setLoading(true);

      if (mode === "inscription") {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${getAppUrl()}/auth/callback`,
            data: {
              role: intendedRole ?? "client",
              ...(isClientSignup
                ? { full_name: nomComplet.trim(), phone: telephoneFormatted }
                : {}),
            },
          },
        });

        setLoading(false);

        if (signUpError) return setError(translateError(signUpError));

        if (data.user && data.user.identities && data.user.identities.length === 0) {
          setError("Un compte existe déjà avec cet email. Connecte-toi plutôt.");
          return;
        }

        if (!data.session) {
          setVerifiedEmail(email);
          setMode("verification-inscription");
          setResendCooldown(RESEND_COOLDOWN);
          return;
        }

        if (isClientSignup && data.user) {
          await supabase.from("users").upsert({
            id: data.user.id,
            phone: telephoneFormatted,
            full_name: nomComplet.trim(),
            role: "client",
          });
          syncGeoToProfileIfNeeded(data.user.id).catch(() => {});
        }

        router.push(intendedRole ? `/${intendedRole}/kyc` : redirectTo || "/catalogue?welcome=1");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
        setLoading(false);
        if (signInError) return setError(translateError(signInError));

        const { data: { user } } = await supabase.auth.getUser();

        if (user?.id) {
          syncGeoToProfileIfNeeded(user.id).catch(() => {});
        }

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", user?.id)
          .single();

        const resolvedRedirect =
          redirectTo && userData?.role === "vendeur" && redirectTo.startsWith("/messages")
            ? redirectTo.replace("/messages", "/vendeur/messages")
            : redirectTo && userData?.role !== "vendeur" && redirectTo.startsWith("/vendeur/messages")
            ? redirectTo.replace("/vendeur/messages", "/messages")
            : redirectTo;

        const destination = resolvedRedirect
          ? resolvedRedirect
          : userData?.role === "vendeur"
          ? "/vendeur/dashboard"
          : userData?.role === "livreur"
          ? "/livreur/missions"
          : userData?.role === "admin"
          ? "/admin/dashboard"
          : "/catalogue";

        window.location.href = destination;
      }
    } catch (err) {
      setLoading(false);
      setError(translateError(err));
    }
  };

  const handleResend = async () => {
    if (!verifiedEmail || resendCooldown > 0) return;
    setResending(true);
    setError(null);
    try {
      const { error: resendError } =
        mode === "verification-inscription"
          ? await supabase.auth.resend({
              type: "signup",
              email: verifiedEmail,
              options: { emailRedirectTo: `${getAppUrl()}/auth/callback` },
            })
          : await supabase.auth.resetPasswordForEmail(verifiedEmail, {
              redirectTo: `${getAppUrl()}/auth/callback?next=/auth/reset-password`,
            });

      if (resendError) return setError(translateError(resendError));
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err) {
      setError(translateError(err));
    } finally {
      setResending(false);
    }
  };

  const handleEditEmail = () => {
    setVerifiedEmail(null);
    setMode(mode === "verification-inscription" ? "inscription" : "mot-de-passe-oublie");
    resetFormFields();
    setResendCooldown(0);
  };

  const isVerificationStep = mode === "verification-inscription" || mode === "verification-reset";
  const mailProvider = verifiedEmail ? getMailProviderLink(verifiedEmail) : null;

  const isSubmitDisabled =
    loading ||
    !email ||
    (mode !== "mot-de-passe-oublie" && !password) ||
    (mode === "inscription" && !confirmPassword) ||
    (isClientSignup && (!nomComplet.trim() || !telephone.trim()));

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isSubmitDisabled) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {isVerificationStep ? (
        <div className="text-center">
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5 ${
              mode === "verification-inscription" ? "bg-teal-50" : "bg-coral-50"
            }`}
          >
            {mode === "verification-inscription" ? (
              <Mail size={28} className="text-teal-600" />
            ) : (
              <KeyRound size={28} className="text-coral-500" />
            )}
          </div>
          <h2 className="text-[18px] font-bold text-gray-900 mb-2">Vérifie ta boîte mail</h2>
          <p className="text-[14px] text-gray-600 leading-relaxed mb-1">
            Nous avons envoyé un lien de {mode === "verification-inscription" ? "confirmation" : "réinitialisation"} à
          </p>
          <p className="text-[14px] font-bold text-gray-900 mb-6 break-all">{verifiedEmail}</p>

          {mailProvider && (
            <a
              href={mailProvider.url}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-gray-800 mb-3 transition-colors"
            >
              Ouvrir {mailProvider.name} <ExternalLink size={14} />
            </a>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2.5 mb-3 text-left">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleResend}
            disabled={resendCooldown > 0 || resending}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 mb-4 transition-colors"
          >
            <RefreshCw size={14} className={resending ? "animate-spin" : ""} />
            {resendCooldown > 0 ? `Renvoyer (${resendCooldown}s)` : resending ? "Envoi..." : "Renvoyer l'email"}
          </button>

          <button
            onClick={handleEditEmail}
            className="inline-flex items-center gap-1.5 text-[13px] text-gray-500 hover:text-coral-500 transition-colors"
          >
            <Pencil size={12} /> Mauvaise adresse ? Modifier
          </button>
        </div>
      ) : (
        <>
          {roleConfig.roleTitle && intendedRole ? (
            <div
              className={`flex items-center gap-4 p-4 rounded-lg mb-5 ${roleConfig.bgColor} border ${roleConfig.bgBorder}`}
            >
              <div className="w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-white">
                {roleConfig.icon && <roleConfig.icon size={24} className={roleConfig.iconColor} />}
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold text-gray-900">{roleConfig.roleTitle}</h2>
                <p className="text-xs text-gray-600">{roleConfig.roleSubtitle}</p>
              </div>
            </div>
          ) : mode !== "mot-de-passe-oublie" ? (
            <>
              <h2 className="text-[22px] font-extrabold text-gray-900 mb-1.5">
                {mode === "connexion" ? "Bon retour parmi nous 👋" : "Bienvenue sur Ayiba 🎉"}
              </h2>
              <p className={`text-[14px] text-gray-600 leading-relaxed ${isClientSignup ? "mb-3" : "mb-6"}`}>
                {mode === "connexion" 
                  ? "Retrouvez vos boutiques préférées et accédez à vos commandes en un clic." 
                  : "Créez votre compte pour acheter des créations locales et suivre vos livraisons."}
              </p>
              {isClientSignup && (
                <div className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-100 rounded-full px-2.5 py-1 mb-5">
                  <ShoppingBag size={12} className="text-gray-400" />
                  <span className="text-[11px] font-medium text-gray-500">Création de compte client</span>
                </div>
              )}
            </>
          ) : null}

          {mode === "mot-de-passe-oublie" && (
            <>
              <button
                onClick={() => switchMode("connexion")}
                className="flex items-center gap-1 text-sm text-gray-500 mb-4 hover:text-coral-500 transition-colors"
              >
                <ArrowLeft size={14} /> Retour
              </button>
              <h2 className="text-[20px] font-bold text-gray-900 mb-2">Mot de passe oublié</h2>
              <p className="text-[14px] text-gray-600 mb-6">On t'envoie un lien pour le réinitialiser.</p>
            </>
          )}

          {mode !== "mot-de-passe-oublie" && (
            <div className="flex bg-gray-50 rounded-lg p-1 mb-6 border border-gray-100">
              <button
                onClick={() => switchMode("connexion")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  mode === "connexion" ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                Se connecter
              </button>
              <button
                onClick={() => switchMode("inscription")}
                className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                  mode === "inscription" ? "bg-white text-gray-900 shadow-sm border border-gray-200/50" : "text-gray-600 hover:text-gray-900"
                }`}
              >
                S'inscrire
              </button>
            </div>
          )}

          {isClientSignup && (
            <>
              <div className="mb-4">
                <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors bg-white">
                  <User size={16} className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={nomComplet}
                    onChange={(e) => setNomComplet(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-12 text-sm px-2 focus:outline-none bg-transparent"
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="mb-4">
                <div
                  className={`flex items-center border rounded-lg px-3 transition-colors bg-white ${
                    phoneError ? "border-red-300" : "border-gray-200 focus-within:border-coral-400"
                  }`}
                >
                  <Phone size={16} className="text-gray-400 shrink-0" />
                  <span className="text-sm text-gray-400 pl-2 pr-1 border-r border-gray-200 mr-2">+229</span>
                  <input
                    type="tel"
                    placeholder="97 00 11 22"
                    value={telephone}
                    onChange={(e) => {
                      setTelephone(e.target.value);
                      if (phoneError) setPhoneError(null);
                    }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-12 text-sm px-1 focus:outline-none bg-transparent"
                    autoComplete="tel"
                  />
                </div>
                {phoneError && (
                  <div className="flex items-start gap-2 mt-1.5">
                    <AlertCircle size={13} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-[12px] text-red-600 leading-relaxed">{phoneError}</p>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="mb-4">
            <div
              className={`flex items-center border rounded-lg px-3 transition-colors bg-white ${
                isEmailValid ? "border-teal-300" : "border-gray-200 focus-within:border-coral-400"
              }`}
            >
              <Mail size={16} className="text-gray-400 shrink-0" />
              <input
                ref={emailInputRef}
                type="email"
                placeholder="Adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={handleKeyDown}
                className="flex-1 h-12 text-sm px-2 focus:outline-none bg-transparent"
                autoComplete="email"
              />
              {isEmailValid && <Check size={16} className="text-teal-500 shrink-0" />}
            </div>
          </div>

          {mode !== "mot-de-passe-oublie" && (
            <div className="mb-1">
              <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors bg-white">
                <Lock size={16} className="text-gray-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Mot de passe"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-12 text-sm px-2 focus:outline-none bg-transparent"
                  autoComplete={mode === "inscription" ? "new-password" : "current-password"}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                  className="text-gray-400 shrink-0 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          )}

          {passwordStrength && (
            <div className="mb-4 mt-2">
              <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
                <div className={`h-full ${passwordStrength.color} transition-all duration-300`} style={{ width: passwordStrength.width }} />
              </div>
              <span className="text-[11px] text-gray-400 mt-1.5 block">{passwordStrength.label}</span>
            </div>
          )}

          {mode === "inscription" && (
            <div className="mb-2 mt-4">
              <div
                className={`flex items-center border rounded-lg px-3 transition-colors bg-white ${
                  confirmPassword.length > 0
                    ? password === confirmPassword
                      ? "border-teal-300"
                      : "border-red-300"
                    : "border-gray-200 focus-within:border-coral-400"
                }`}
              >
                <Lock size={16} className="text-gray-400 shrink-0" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Confirmer le mot de passe"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="flex-1 h-12 text-sm px-2 focus:outline-none bg-transparent"
                  autoComplete="new-password"
                />
                {confirmPassword.length > 0 && password === confirmPassword && (
                  <Check size={16} className="text-teal-500 shrink-0" />
                )}
              </div>
            </div>
          )}

          {mode === "connexion" && (
            <div className="flex justify-end mt-2 mb-3">
              <button onClick={() => switchMode("mot-de-passe-oublie")} className="text-[12.5px] font-medium text-coral-500 hover:text-coral-600 transition-colors">
                Mot de passe oublié ?
              </button>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg px-3 py-3 mt-3 mb-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
              <p className="text-[12.5px] text-red-700 leading-relaxed">{error}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitDisabled}
            className={`w-full text-white rounded-xl px-4 py-3.5 text-sm font-bold shadow-md disabled:opacity-50 disabled:cursor-not-allowed mt-4 transition-all duration-200 active:scale-[0.98] ${roleConfig.buttonColor} shadow-coral-500/20`}
          >
            {loading
              ? "Chargement..."
              : mode === "connexion"
              ? "Se connecter"
              : mode === "inscription"
              ? "Créer mon compte"
              : "Envoyer le lien"}
          </button>

          {mode !== "mot-de-passe-oublie" && (
            <p className="text-[11px] text-gray-400 mt-5 text-center leading-relaxed max-w-[280px] mx-auto">
              En continuant, vous acceptez nos{" "}
              <a href="/cgu" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500 transition-colors">
                conditions d'utilisation
              </a>{" "}
              et notre{" "}
              <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-gray-600 underline hover:text-coral-500 transition-colors">
                politique de confidentialité
              </a>
              .
            </p>
          )}
        </>
      )}
    </div>
  );
}

export default function ConnexionPage() {
  return (
    <div className="min-h-screen flex w-full bg-white">
      {/* Video Side (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-gray-900">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster="/images/hero/hero-artisan.webp"
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/0_Woman_Online_Shopping_1280x720.mp4" type="video/mp4" />
        </video>
        {/* L'utilisateur a demandé sans texte et pas d'overlay ou très léger,
            on ne met donc pas de texte par dessus. 
            On laisse la vidéo respirer. */}
      </div>

      {/* Form Side */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center px-4 sm:px-8 md:px-16 lg:px-24 py-12 lg:py-0 overflow-y-auto max-h-screen">
        <div className="w-full max-w-sm mx-auto mb-10 flex justify-center lg:justify-start">
          <a href="/" className="hover:opacity-80 transition-opacity">
            <LogoAyiba className="h-8 md:h-10 w-auto" />
          </a>
        </div>
        
        <Suspense fallback={<div className="w-full max-w-sm mx-auto h-[400px] bg-gray-50 animate-pulse rounded-2xl" />}>
          <AuthForm />
        </Suspense>
      </div>
    </div>
  );
}
