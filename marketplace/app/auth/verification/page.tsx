"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import LogoAyiba from "@/components/ui/LogoAyiba"; // Import du vrai logo
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole } from "@/lib/auth-utils";

const supabase = createClient();

export default function VerificationPage() {
  const router = useRouter();
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phone, setPhone] = useState("");
  const [roleParam, setRoleParam] = useState("");
  
  // Gestion du timer pour éviter le spam du bouton de renvoi
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(
      typeof window !== "undefined" ? window.location.search : ""
    );
    setPhone(searchParams.get("phone") || "");
    setRoleParam(searchParams.get("role") || "");
  }, []);

  // Effet pour le compte à rebours du SMS
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [countdown]);

  const handleOtpChange = (index: number, value: string) => {
    // On ne garde que les chiffres pour éviter les lettres ou espaces cachés
    const cleanedValue = value.replace(/\D/g, "");
    if (cleanedValue.length > 1) return;

    const newOtp = [...otp];
    newOtp[index] = cleanedValue;
    setOtp(newOtp);

    // Auto-focus sur la case suivante
    if (cleanedValue && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Retour arrière intelligent : efface et focus la case précédente
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`) as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
      }
    }
  };

  // Amélioration du bouton retour vers la page d'inscription (sans vider le flux)
  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault();
    router.push(`/auth/inscription?role=${roleParam}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const otpCode = otp.join("");
      if (otpCode.length !== 6) {
        throw new Error("Le code doit contenir 6 chiffres");
      }

      const searchParams = new URLSearchParams(
        typeof window !== "undefined" ? window.location.search : ""
      );
      
      // DEV MODE: Only allow bypass if NODE_ENV is development AND dev param is true
      // This prevents URL param bypass in production
      const isDev = process.env.NODE_ENV === "development" && searchParams.get("dev") === "true";

      if (isDev) {
        window.location.href = `/auth/choix-role?role=${roleParam}`;
        return;
      }

      const response = await fetch('/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, token: otpCode })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Le code entré est incorrect ou a expiré.");
      }

      if (data.user) {
        console.log("OTP verified successfully");
        console.log("User ID:", data.user.id);

        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        console.log("User data from DB:", userData);

        if (userData?.role) {
          console.log("User has role:", userData.role);
          const redirectPath = getRedirectPathForRole(userData.role);
          console.log("Redirecting to:", redirectPath);
          window.location.href = redirectPath;
        } else {
          console.log("User has no role, redirecting to choix-role");
          window.location.href = `/auth/choix-role?role=${roleParam}`;
        }
      }
    } catch (err: any) {
      setError(err.message || "Le code entré est incorrect ou a expiré.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setLoading(true);

    try {
      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors du renvoi.");
      }
      
      // On réinitialise le timer après un renvoi réussi
      setCountdown(60);
      setCanResend(false);
      setOtp(["", "", "", "", "", ""]); // On vide les cases
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors du renvoi.");
    } finally {
      setLoading(false);
    }
  };

  function handleback(event: React.MouseEvent<HTMLButtonElement>): void {
    throw new Error("Function not implemented.");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header épuré identique à l'inscription */}
      <header className="sticky top-0 z-50 h-14 bg-white border-b border-gray-100 md:h-16">
        <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-7xl mx-auto w-full">
          <a href="/" className="flex items-center">
            <LogoAyiba className="h-8 w-auto" />
          </a>
         <button 
  onClick={handleback} // ou handleBack selon la page
  className="px-4 h-9 inline-flex items-center justify-center text-sm font-medium text-coral border border-coral bg-transparent rounded-8 hover:bg-coral/5 transition-colors cursor-pointer"
>
  Retour
</button>
        </div>
      </header>

      {/* Conteneur Formulaire */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-6 rounded-12 shadow-sm border border-gray-100 md:p-8">
          <h1 className="text-xl font-medium text-gray-900 text-center mb-2 md:text-2xl">
            Vérification
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8 leading-relaxed">
            Entre le code de sécurité à 6 chiffres envoyé au <span className="font-semibold text-gray-800">{phone}</span>.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            {/* Grille des inputs OTP */}
            <div className="flex justify-center gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="w-11 h-12 text-center text-xl font-bold border border-gray-200 rounded-8 text-gray-900 focus:outline-none focus:border-coral focus:ring-1 focus:ring-coral transition-all"
                  required
                />
              ))}
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-8 border border-red-100">
                <p className="text-sm text-red-800 text-center font-medium">{error}</p>
              </div>
            )}

            {/* Bouton de validation */}
            <Button
              variant="primary"
              className="w-full h-11 bg-coral hover:bg-coral-dark text-white font-medium rounded-8 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Vérification..." : "Confirmer le code"}
            </Button>

            {/* Bouton de renvoi avec gestion d'état intelligent */}
            <div className="text-center">
              {canResend ? (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={loading}
                  className="text-sm font-medium text-coral hover:text-coral-dark transition-colors cursor-pointer"
                >
                  Renvoyer le code par SMS
                </button>
              ) : (
                <p className="text-sm text-gray-400">
                  Renvoyer le code dans <span className="font-medium text-gray-600">{countdown}s</span>
                </p>
              )}
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}