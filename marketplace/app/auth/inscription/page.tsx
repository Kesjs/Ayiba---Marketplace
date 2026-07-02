"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { validateBeninPhone } from "@/lib/validation";

const supabase = createClient();

export default function InscriptionPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const searchParams = new URLSearchParams(
    typeof window !== "undefined" ? window.location.search : ""
  );
  const roleParam = searchParams.get("role") || "";

  const handleCancel = (e: React.MouseEvent) => {
    e.preventDefault();
    // Si l'historique existe, on recule (garde l'ancre exacte de la landing), sinon retour à l'accueil
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      router.push("/");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Validate phone format using shared function
    const validation = validateBeninPhone(phone);
    if (!validation.isValid) {
      setError(validation.error || "Numéro invalide");
      setLoading(false);
      return;
    }

    try {
      if (process.env.NODE_ENV === "development") {
        window.location.href = `/auth/verification?phone=${encodeURIComponent(
          validation.formatted
        )}&role=${roleParam}&dev=true`;
        return;
      }

      const response = await fetch('/api/auth/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: validation.formatted })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue lors de l'envoi du SMS.");
      }

      window.location.href = `/auth/verification?phone=${encodeURIComponent(
        validation.formatted
      )}&role=${roleParam}`;
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue lors de l'envoi du SMS.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header épuré avec Logo officiel */}
      <header className="sticky top-0 z-50 h-14 bg-white border-b border-gray-100 md:h-16">
        <div className="flex items-center justify-between h-full px-4 md:px-6 max-w-7xl mx-auto w-full">
          <a href="/" className="flex items-center">
            <LogoAyiba className="h-8 w-auto" />
          </a>
          {/* Bouton retour intelligent avec onClick */}
          <button 
  onClick={handleCancel} // ou handleBack selon la page
  className="px-4 h-9 inline-flex items-center justify-center text-sm font-medium text-coral border border-coral bg-transparent rounded-8 hover:bg-coral/5 transition-colors cursor-pointer"
>
  Retour
</button>
        </div>
      </header>

      {/* Conteneur Formulaire Mobile-First */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white p-6 rounded-12 shadow-sm border border-gray-100 md:p-8">
          <h1 className="text-xl font-medium text-gray-900 text-center mb-2 md:text-2xl">
            Inscription
          </h1>
          <p className="text-sm text-gray-500 text-center mb-8">
            Entre ton numéro de téléphone pour recevoir ton code OTP de vérification.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">
                Numéro de téléphone
              </label>
              <div className="flex rounded-8 overflow-hidden focus-within:ring-1 focus-within:ring-coral">
                <span className="inline-flex items-center gap-2 px-3 border border-r-0 border-gray-200 bg-gray-50 text-sm text-gray-500 font-medium">
                  <span className="text-lg">🇧🇯</span>
                  +229
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01 23 45 67 89"
                  className="flex-1 h-11 px-3 border border-gray-200 rounded-r-8 text-base text-gray-900 placeholder-gray-400 focus:outline-none focus:border-coral"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 rounded-8 border border-red-100">
                <p className="text-sm text-red-800 text-center font-medium">{error}</p>
              </div>
            )}

            <Button
              variant="primary"
              className="w-full h-11 bg-coral hover:bg-coral-dark text-white font-medium rounded-8 transition-colors flex items-center justify-center"
              disabled={loading}
            >
              {loading ? "Envoi du code..." : "Recevoir le code SMS"}
            </Button>
          </form>

          <p className="text-xs text-gray-400 text-center mt-8 px-4 leading-relaxed">
            En continuant, tu acceptes les{" "}
            <a href="/conditions" className="text-gray-500 underline hover:text-gray-900">
              Conditions d'utilisation
            </a>{" "}
            et la politique de sécurité d'Ayiba.
          </p>
        </div>
      </main>
    </div>
  );
}