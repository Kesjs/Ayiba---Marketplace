"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function MfaSetupPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [checkError, setCheckError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const [factorId, setFactorId] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [otpauthUrl, setOtpauthUrl] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");

  // Étape 1 : si un facteur TOTP vérifié existe déjà, pas besoin de setup —
  // direction la vérification. Sinon on démarre l'enrôlement.
  useEffect(() => {
    let cancelled = false;
    setChecking(true);
    setCheckError("");

    const timeout = setTimeout(() => {
      if (!cancelled) {
        setCheckError(
          "La préparation de la configuration prend trop de temps. Vérifie ta connexion et réessaie."
        );
        setChecking(false);
      }
    }, 10000);

    (async () => {
      try {
        const { data: factors, error: listError } = await supabase.auth.mfa.listFactors();
        if (cancelled) return;
        if (listError) throw listError;

        const verifiedTotp = factors?.totp?.find((f) => f.status === "verified");
        if (verifiedTotp) {
          router.replace("/admin/mfa-verify");
          return;
        }

        // Nettoie un éventuel facteur "unverified" laissé par une tentative
        // précédente avant d'en enrôler un nouveau.
        const staleTotp = factors?.totp?.[0];
        if (staleTotp) {
          await supabase.auth.mfa.unenroll({ factorId: staleTotp.id }).catch(() => {});
        }

        const { data: enrollData, error: enrollError } = await supabase.auth.mfa.enroll({
          factorType: "totp",
        });
        if (cancelled) return;
        if (enrollError) throw enrollError;

        setFactorId(enrollData.id);
        setOtpauthUrl(enrollData.totp.uri);
        setSecret(enrollData.totp.secret);
        setChecking(false);
      } catch (err) {
        if (cancelled) return;
        console.error("[MfaSetupPage] préparation de l'enrôlement échouée:", err);
        setCheckError(
          "Impossible de préparer la configuration MFA. Vérifie ta connexion et réessaie."
        );
        setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [router, retryCount]);

  // Étape 2 : génère le QR code une fois l'URL otpauth disponible.
  useEffect(() => {
    if (!otpauthUrl) return;
    let cancelled = false;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(otpauthUrl, { margin: 1, width: 220 }).then((url: string) => {
          if (!cancelled) setQrDataUrl(url);
        })
      )
      .catch((err) => console.error("[MfaSetupPage] génération QR échouée:", err));
    return () => {
      cancelled = true;
    };
  }, [otpauthUrl]);

  const handleCopySecret = async () => {
    if (!secret) return;
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("[MfaSetupPage] copie du secret échouée:", err);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setVerifyError("");
    setVerifying(true);
    try {
      const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
      if (error) throw error;
      router.replace("/admin/dashboard");
    } catch (err) {
      console.error("[MfaSetupPage] vérification du code échouée:", err);
      setVerifyError("Code invalide ou expiré, réessaie.");
      setCode("");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A1A]">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-medium text-white text-center mb-2">
            Configuration de la vérification en deux étapes
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Utilise une application d'authentification (Google Authenticator, Authy...) pour
            protéger ton compte admin.
          </p>

          {checking ? (
            <p className="text-sm text-gray-400 text-center">Chargement...</p>
          ) : checkError ? (
            <div className="flex flex-col items-center gap-4">
              <p className="text-sm text-red-400 text-center">{checkError}</p>
              <button
                type="button"
                onClick={() => setRetryCount((c) => c + 1)}
                className="h-10 px-6 bg-coral-400 hover:bg-coral-600 text-white font-medium rounded transition-colors"
              >
                Réessayer
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Option A : scanner un QR code (utile depuis un autre appareil) */}
              <div className="flex flex-col items-center gap-3 p-5 bg-gray-800/50 rounded-2xl border border-gray-700">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                  1. Scanne ce QR code
                </p>
                <div className="w-[200px] h-[200px] bg-white rounded-xl flex items-center justify-center overflow-hidden">
                  {qrDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={qrDataUrl}
                      alt="QR code de configuration MFA"
                      width={200}
                      height={200}
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Génération du QR...</span>
                  )}
                </div>
              </div>

              {/* Option B : ouvrir directement dans l'appli (même téléphone) */}
              {otpauthUrl && (
                <a
                  href={otpauthUrl}
                  className="w-full h-11 flex items-center justify-center bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded transition-colors"
                >
                  Ouvrir dans mon appli d'authentification
                </a>
              )}

              {/* Option C : saisie manuelle de la clé (même téléphone, sans lien) */}
              {secret && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center">
                    Ou entre cette clé manuellement
                  </p>
                  <div className="flex items-stretch gap-2">
                    <code className="flex-1 h-11 px-3 flex items-center bg-gray-800 border border-gray-700 rounded text-sm text-white tracking-wider overflow-x-auto">
                      {secret}
                    </code>
                    <button
                      type="button"
                      onClick={handleCopySecret}
                      className="h-11 px-4 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white text-sm font-medium rounded transition-colors whitespace-nowrap"
                    >
                      {copied ? "Copié !" : "Copier"}
                    </button>
                  </div>
                </div>
              )}

              {/* Confirmation : code généré par l'appli */}
              <form onSubmit={handleVerify} className="flex flex-col gap-4 pt-2 border-t border-gray-800">
                <p className="text-xs font-bold uppercase tracking-widest text-gray-400 text-center pt-4">
                  2. Entre le code affiché pour confirmer
                </p>
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

                {verifyError && <p className="text-sm text-red-400 text-center">{verifyError}</p>}

                <button
                  type="submit"
                  disabled={verifying || code.length !== 6}
                  className="w-full h-10 bg-coral-400 hover:bg-coral-600 text-white font-medium rounded transition-colors disabled:opacity-50"
                >
                  {verifying ? "Vérification..." : "Activer la vérification en deux étapes"}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
