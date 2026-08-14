"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type StatutCommande =
  | "en_attente"
  | "confirmee"
  | "preparee"
  | "expediee"
  | "livree"
  | "annulee"
  | "remboursee";

export function useVendeurCommandes() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const loadCommandes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      const { data, error: commandesError } = await supabase
        .from("commandes")
        .select("*")
        .eq("vendeur_id", user.id)
        .order("created_at", { ascending: false });

      if (commandesError) throw commandesError;

      setCommandes(data || []);
    } catch (err: any) {
      console.error("Commandes vendeur:", err);
      setError(err.message || "Impossible de charger les commandes");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadCommandes();
  }, [loadCommandes]);

  const updateStatut = useCallback(
    async (commandeId: string, nouveauStatut: StatutCommande) => {
      setUpdatingId(commandeId);
      try {
        const { error: updateError } = await supabase
          .from("commandes")
          .update({ statut: nouveauStatut })
          .eq("id", commandeId);

        if (updateError) throw updateError;

        setCommandes((prev) =>
          prev.map((c) => (c.id === commandeId ? { ...c, statut: nouveauStatut } : c))
        );
      } catch (err: any) {
        console.error("Update statut commande:", err);
        setError(err.message || "Impossible de mettre à jour le statut");
      } finally {
        setUpdatingId(null);
      }
    },
    [supabase]
  );

  return { loading, error, commandes, updatingId, updateStatut, refresh: loadCommandes };
}
