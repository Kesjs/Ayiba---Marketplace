"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (password.length < 6) return setError("Le mot de passe doit contenir au moins 6 caractères");

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (updateError) return setError(updateError.message);
    setDone(true);
    setTimeout(() => router.push("/catalogue"), 1500);
  };

  if (done) {
    return <p className="max-w-sm mx-auto mt-20 text-center text-teal-600">Mot de passe mis à jour !</p>;
  }

  return (
    <div className="max-w-sm mx-auto mt-20 space-y-4 px-4">
      <h1 className="text-xl font-semibold">Nouveau mot de passe</h1>
      <input
        type="password"
        placeholder="Nouveau mot de passe"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full border rounded-lg px-3 py-2"
      />
      {error && <p className="text-sm text-red-400">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-coral-400 text-white rounded-lg py-2.5 disabled:opacity-50"
      >
        {loading ? "..." : "Mettre à jour"}
      </button>
    </div>
  );
}
