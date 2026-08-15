"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useClientDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [stats, setStats] = useState<any>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [favoris, setFavoris] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      /* Statistiques client */
      const { data: statsData, error: statsError } = await supabase
        .from("commandes")
        .select("montant_total, statut")
        .eq("client_id", user.id);

      if (statsError) throw statsError;

      const totalCommandes = statsData?.length || 0;
      const totalDepenses = statsData?.reduce((sum: number, cmd: any) => sum + Number(cmd.montant_total || 0), 0) || 0;
      const commandesEnCours = statsData?.filter((cmd: any) => 
        cmd.statut !== "livre" && cmd.statut !== "annule"
      ).length || 0;

      setStats({
        total_commandes: totalCommandes,
        total_depenses: totalDepenses,
        commandes_en_cours: commandesEnCours,
      });

      /* Commandes récentes */
      const { data: commandesData, error: commandesError } = await supabase
        .from("vue_commandes_client")
        .select("*")
        .eq("client_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (commandesError) throw commandesError;
      setCommandes(commandesData || []);

      /* Favoris récents */
      const { data: favorisData, error: favorisError } = await supabase
        .from("favoris")
        .select(`
          *,
          articles (
            id,
            nom,
            prix,
            images,
            vendeurs (
              nom_boutique
            )
          )
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(4);

      if (favorisError) throw favorisError;
      setFavoris(favorisData || []);
    } catch (err: any) {
      console.error("Dashboard client:", err);
      setError(err.message || "Impossible de charger le dashboard");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    loading,
    error,
    stats,
    commandes,
    favoris,
    refresh: loadDashboard,
  };
}
