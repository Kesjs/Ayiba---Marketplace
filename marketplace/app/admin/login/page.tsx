"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Vérifie le rôle admin
      if (data.user) {
        const { data: userData } = await supabase
          .from("users")
          .select("role")
          .eq("id", data.user.id)
          .single();

        if (userData?.role !== "admin") {
          await supabase.auth.signOut();
          throw new Error("Accès non autorisé");
        }

        // La 2FA est obligatoire pour tout compte admin.
        const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

        if (aal?.currentLevel === "aal2") {
          window.location.href = "/admin/dashboard";
        } else if (aal?.nextLevel === "aal2") {
          // Un facteur TOTP est déjà inscrit, il reste à vérifier le code.
          window.location.href = "/admin/mfa-verify";
        } else {
          // Aucun facteur inscrit : inscription 2FA obligatoire avant tout accès.
          window.location.href = "/admin/mfa-setup";
        }
      }
    } catch (err: any) {
      setError(err.message || "Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#1A1A1A]">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <h1 className="text-2xl font-medium text-white text-center mb-2">
            Administration
          </h1>
          <p className="text-sm text-gray-400 text-center mb-8">
            Connexion sécurisée
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-6">
            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@ayiba.bj"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-coral-400"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3 bg-gray-800 border border-gray-700 rounded text-sm text-white placeholder-gray-500 focus:outline-none focus:border-coral-400"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-red-400 text-center">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-10 bg-coral-400 hover:bg-coral-600 text-white font-medium rounded transition-colors disabled:opacity-50"
            >
              {loading ? "Connexion..." : "Se connecter"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
