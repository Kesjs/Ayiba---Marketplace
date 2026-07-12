"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Mail, Lock, ShieldCheck, Store, Bike, User, Eye, EyeOff, Check } from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  intendedRole?: "vendeur" | "livreur" | null;
}

export function AuthModal({ isOpen, onClose, intendedRole }: AuthModalProps) {
  const router = useRouter();
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
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

  // SIMULATION — à remplacer par supabase.auth.signInWithPassword / signUp
  const handleSubmit = async () => {
    setError(null);

    if (!validateEmail(email)) {
      setError("Adresse email invalide");
      return;
    }
    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      onClose();

      if (mode === "inscription") {
        router.push(intendedRole ? `/${intendedRole}/kyc` : "/auth/choix-role");
      } else {
        router.push(intendedRole ? `/${intendedRole}/dashboard` : "/catalogue");
      }
    }, 1000);
  };

  // SIMULATION — à remplacer par supabase.auth.signInWithOAuth({ provider: 'google' })
  const handleGoogleAuth = async () => {
    setError(null);
    setGoogleLoading(true);

    setTimeout(() => {
      setGoogleLoading(false);
      onClose();
      router.push(intendedRole ? `/${intendedRole}/kyc` : "/catalogue");
    }, 1000);
  };

  const handleDemoLogin = async (role: "admin" | "vendeur" | "livreur" | "client") => {
    setError(null);
    setLoading(true);

    setTimeout(() => {
      onClose();
      const redirectPaths: Record<string, string> = {
        admin: "/admin/dashboard",
        vendeur: "/vendeur/dashboard",
        livreur: "/livreur/missions",
        client: "/catalogue",
      };
      router.push(redirectPaths[role]);
      setLoading(false);
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg p-6 max-w-sm w-full relative max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={18} />
        </button>

        <h2 className="text-[18px] font-medium text-gray-900 mb-1">
          Bienvenue sur Ayiba
        </h2>
        <p className="text-[14px] text-gray-600 mb-4">
          {mode === "connexion" ? "Heureux de te revoir !" : "Rejoins-nous en quelques secondes"}
        </p>

        {/* Toggle Connexion / Inscription */}
        <div className="flex bg-gray-50 rounded-lg p-1 mb-5">
          <button
            onClick={() => { setMode("connexion"); setError(null); }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === "connexion" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            Se connecter
          </button>
          <button
            onClick={() => { setMode("inscription"); setError(null); }}
            className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
              mode === "inscription" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
            }`}
          >
            S'inscrire
          </button>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleAuth}
          disabled={googleLoading}
          className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
        >
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

        {/* Email */}
        <div className="mb-3">
          <div className={`flex items-center border rounded-lg px-3 transition-colors ${
            isEmailValid ? "border-teal-300" : "border-gray-200 focus-within:border-coral-400"
          }`}>
            <Mail size={16} className="text-gray-400 shrink-0" />
            <input
              type="email"
              placeholder="Adresse email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 h-11 text-sm px-2 focus:outline-none"
            />
            {isEmailValid && <Check size={16} className="text-teal-500 shrink-0" />}
          </div>
        </div>

        {/* Mot de passe */}
        <div className="mb-1">
          <div className="flex items-center border border-gray-200 rounded-lg px-3 focus-within:border-coral-400 transition-colors">
            <Lock size={16} className="text-gray-400 shrink-0" />
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="flex-1 h-11 text-sm px-2 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 shrink-0"
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Indicateur de force du mot de passe (inscription uniquement) */}
        {passwordStrength && (
          <div className="mb-2 mt-1.5">
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${passwordStrength.color} transition-all duration-300`}
                style={{ width: passwordStrength.width }}
              />
            </div>
            <span className="text-[11px] text-gray-400 mt-1 block">{passwordStrength.label}</span>
          </div>
        )}

        {/* Se souvenir de moi + mot de passe oublié (connexion uniquement) */}
        {mode === "connexion" && (
          <div className="flex items-center justify-between mt-2 mb-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 text-coral-500 focus:ring-coral-400"
              />
              <span className="text-[12px] text-gray-600">Se souvenir de moi</span>
            </label>
            <button className="text-[12px] text-coral-500">
              Mot de passe oublié ?
            </button>
          </div>
        )}

        {error && (
          <p className="text-[12px] text-red-400 mt-1 mb-2">{error}</p>
        )}

        <button
          onClick={handleSubmit}
          disabled={loading || !email || !password}
          className="w-full bg-coral-400 text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed mt-3"
        >
          {loading ? "Chargement..." : mode === "connexion" ? "Se connecter" : "Créer mon compte"}
        </button>

        <p className="text-[11px] text-gray-400 mt-3 text-center">
          En continuant, tu acceptes nos conditions d'utilisation.
        </p>

        {/* Section Démo */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-[12px] font-bold text-gray-400 uppercase tracking-widest mb-4 text-center">
            Accès Rapide (Démo)
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleDemoLogin("admin")}
              className="flex items-center gap-2 p-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-colors"
            >
              <ShieldCheck size={16} className="text-amber-400" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>
            <button
              onClick={() => handleDemoLogin("vendeur")}
              className="flex items-center gap-2 p-3 bg-coral-50 text-coral-600 rounded-xl hover:bg-coral-100 transition-colors"
            >
              <Store size={16} />
              <span className="text-[11px] font-bold">Vendeur</span>
            </button>
            <button
              onClick={() => handleDemoLogin("livreur")}
              className="flex items-center gap-2 p-3 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-100 transition-colors"
            >
              <Bike size={16} />
              <span className="text-[11px] font-bold">Livreur</span>
            </button>
            <button
              onClick={() => handleDemoLogin("client")}
              className="flex items-center gap-2 p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
            >
              <User size={16} />
              <span className="text-[11px] font-bold">Client</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
