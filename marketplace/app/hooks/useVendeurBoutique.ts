"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useVendeurBoutique() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [boutique, setBoutique] = useState<any>(null);

  const loadBoutique = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error: vendeurError } = await supabase
        .from("vendeurs")
        .select("*")
        .eq("id", user.id)
        .single();

      if (vendeurError) throw vendeurError;

      setBoutique(data);
    } catch (err: any) {
      console.error("Boutique vendeur:", err);
      setError(err.message || "Impossible de charger la boutique");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadBoutique();
  }, [loadBoutique]);

  const updateBoutique = useCallback(
    async (champs: Partial<{
      nom_boutique: string;
      description: string;
      quartier: string;
      commune: string;
      mobile_money_network: string;
      mobile_money_number: string;
    }>) => {
      if (!boutique) return;
      setSaving(true);
      setSaved(false);
      setError(null);
      try {
        const { error: updateError } = await supabase
          .from("vendeurs")
          .update(champs)
          .eq("id", boutique.id);

        if (updateError) throw updateError;

        setBoutique((prev: any) => ({ ...prev, ...champs }));
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } catch (err: any) {
        console.error("Update boutique:", err);
        setError(err.message || "Impossible d'enregistrer les modifications");
      } finally {
        setSaving(false);
      }
    },
    [supabase, boutique]
  );

  return { loading, saving, saved, error, boutique, updateBoutique, refresh: loadBoutique };
}
