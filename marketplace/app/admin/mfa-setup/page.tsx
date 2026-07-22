"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function MfaVerifyPage() {
  const router = useRouter();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data: factors } = await supabase.auth.mfa.listFactors();
      const totp = factors?.totp?.[0];
      if (!totp) {
        // Aucun facteur vérifié : direction l'inscription obligatoire.
        router.replace("/admin/mfa-setup");
        return;
      }
      setFactorId(totp.id);
      setChecking(false);
    })();
  }, [router]);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError("");
    setLoading(true);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    setLoading(false);
    if (error) {
      setError("Code invalide ou expiré, réessaie.");
      setCode("");
      return;
    }
    router.replace("/admin/dashboard");
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A1A]">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-medium text-white text-center mb-2">
            Vérification en deux étapes
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Ouvre ton application d'authentification et entre le code affiché.
          </p>

          {checking ? (
            <p className="text-sm text-gray-400 text-center">Chargement...</p>
          ) : (
            <form onSubmit={handleVerify} className="flex flex-col gap-4">
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                autoFocus
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                placeholder="123456"
                className="w-full h-12 px-3 bg-gray-800 border border-gray-700 rounded text-center text-lg tracking-[0.5em] text-white placeholder-gray-600 focus:outline-none focus:border-coral-400"
                required
              />

              {error && <p className="text-sm text-red-400 text-center">{error}</p>}

              <button
                type="submit"
                disabled={loading || code.length !== 6}
                className="w-full h-10 bg-coral-400 hover:bg-coral-600 text-white font-medium rounded transition-colors disabled:opacity-50"
              >
                {loading ? "Vérification..." : "Se connecter"}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
