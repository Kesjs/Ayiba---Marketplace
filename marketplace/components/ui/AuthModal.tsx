"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { validateBeninPhone } from "@/lib/validation";
import { X, Phone, ShieldCheck, Store, Bike, User, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

const supabase = createClient();

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  intendedRole?: "vendeur" | "livreur" | null;
}

export function AuthModal({ isOpen, onClose, intendedRole }: AuthModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [countdown, setCountdown] = useState(30);

  const handleSendOtp = async () => {
    setError(null);
    setLoading(true);

    // Validate phone format using shared function
    const validation = validateBeninPhone(phone);
    if (!validation.isValid) {
      setError(validation.error || "Numéro invalide");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: validation.formatted })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('déjà') || data.error?.includes('already')) {
          setError("Ce numéro est déjà associé à un compte");
        } else {
          setError(data.error || "Erreur lors de l'envoi du code");
        }
        setLoading(false);
        return;
      }

      setStep("otp");
      setCountdown(30);
      setCanResend(false);

      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            setCanResend(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    setError(null);
    setLoading(true);

    try {
      const otpCode = otp.join("");
      const validation = validateBeninPhone(phone);
      
      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: validation.formatted, token: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error?.includes('expiré') || data.error?.includes('expired')) {
          setError("Ce code a expiré. Veuillez le renvoyer.");
        } else if (data.error?.includes('incorrect') || data.error?.includes('invalid')) {
          setError("Code incorrect");
        } else {
          setError(data.error || "Erreur de vérification");
        }
        setLoading(false);
        return;
      }

      // Check if user exists and their role
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", data.user?.id)
        .single();

      if (userData?.role) {
        // Existing user with a role
        if (intendedRole && userData.role !== intendedRole) {
          // User wants to become a different role (e.g., client -> vendeur)
          setError(`Vous avez déjà un compte ${userData.role}. Pour devenir ${intendedRole}, veuillez créer un nouveau compte.`);
          setLoading(false);
          return;
        }
        // Redirect to existing dashboard
        const redirectPath =
          userData.role === "client"
            ? "/catalogue"
            : userData.role === "vendeur"
            ? "/vendeur/dashboard"
            : userData.role === "livreur"
            ? "/livreur/missions"
            : "/admin/dashboard";
        router.push(redirectPath);
      } else if (intendedRole) {
        // New user with intended role - create user with role
        await supabase.from("users").insert({
          id: data.user?.id,
          phone: data.user?.phone || "",
          role: intendedRole,
        });
        const kycPath = intendedRole === "vendeur" ? "/vendeur/kyc" : "/livreur/kyc";
        router.push(kycPath);
      } else {
        // New user - redirect to role selection
        router.push("/auth/choix-role");
      }
    } catch (err) {
      setError("Erreur de vérification");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length > 1) return;
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = pastedData.split("").slice(0, 6);
    setOtp([...newOtp, ...Array(6 - newOtp.length).fill("")]);
  };

  const handleResendOtp = async () => {
    setCountdown(30);
    setCanResend(false);
    await handleSendOtp();
  };

  const handleDemoLogin = async (role: "admin" | "vendeur" | "livreur" | "client") => {
    setError(null);
    setLoading(true);
    
    // Pour la démo, on simule une connexion réussie
    // Dans un vrai projet, on appellerait une route qui génère une session
    setTimeout(() => {
      onClose();
      const redirectPaths: Record<string, string> = {
        admin: "/admin/dashboard",
        vendeur: "/vendeur/dashboard",
        livreur: "/livreur/missions",
        client: "/catalogue"
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
        className="bg-white rounded-lg p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {step === "phone" ? (
          <>
            <h2 className="text-[18px] font-medium text-gray-900 mb-2">
              Bienvenue sur Ayiba
            </h2>
            <p className="text-[14px] text-gray-600 mb-4">
              Entre ton numéro pour continuer
            </p>

            <div className="flex border border-gray-100 rounded focus-within:border-coral-400">
              <div className="bg-gray-50 border-r border-gray-100 px-3 text-sm text-gray-600 flex items-center gap-2">
                <span className="text-lg">🇧🇯</span>
                +229
              </div>
              <input
                type="tel"
                placeholder="97 00 00 00"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 8))}
                className="flex-1 h-10 text-sm px-3 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-[12px] text-red-400 mt-2">{error}</p>
            )}

            <button
              onClick={handleSendOtp}
              disabled={loading || phone.length < 8}
              className="w-full bg-coral-400 text-white rounded px-4 py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              {loading ? "Envoi..." : "Recevoir le code"}
            </button>

            <p className="text-[11px] text-gray-400 mt-3 text-center">
              En continuant tu acceptes nos conditions d'utilisation
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
          </>
        ) : (
          <>
            <h2 className="text-[18px] font-medium text-gray-900 mb-2">
              Code de confirmation
            </h2>
            <p className="text-[14px] text-gray-600 mb-4">
              Code envoyé au +229 {phone.slice(0, 2)} XX XX XX
            </p>

            <div className="flex gap-2 mb-4">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onPaste={handleOtpPaste}
                  className="w-10 h-12 text-center text-lg font-medium border border-gray-100 rounded focus:border-coral-400 focus:outline-none"
                />
              ))}
            </div>

            {error && (
              <p className="text-[12px] text-red-400 mb-4">{error}</p>
            )}

            <button
              onClick={handleVerifyOtp}
              disabled={loading || otp.join("").length < 6}
              className="w-full bg-coral-400 text-white rounded px-4 py-2.5 text-sm font-medium hover:bg-coral-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Vérification..." : "Valider"}
            </button>

            <button
              onClick={handleResendOtp}
              disabled={!canResend}
              className="w-full text-[13px] text-coral-400 mt-3 disabled:text-gray-400 disabled:cursor-not-allowed"
            >
              {canResend
                ? "Code non reçu ? Renvoyer"
                : `Renvoyer dans ${countdown}s`}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
