"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// Statuts qui ferment une commande (elle ne compte plus comme "en cours") —
// même liste que dans useVendeurPaiements.ts, pour rester cohérent avec le
// reste de l'app. (Les anciennes valeurs "livre"/"annule" ne correspondaient
// à aucun statut réel de la base — d'où le bug où "En cours" affichait
// toujours le même total que "Commandes".)
const STATUTS_TERMINES = ["livree", "annulee", "remboursee"];

export function useClientDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

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

      const { data: statsData, error: statsError } = await supabase
        .from("commandes")
        .select("montant_total, statut")
        .eq("client_id", user.id);

      if (statsError) throw statsError;

      const totalCommandes = statsData?.length || 0;
      const totalDepenses =
        statsData?.reduce((sum: number, cmd: any) => sum + Number(cmd.montant_total || 0), 0) || 0;
      const commandesEnCours =
        statsData?.filter((cmd: any) => !STATUTS_TERMINES.includes(cmd.statut)).length || 0;

      setStats({
        total_commandes: totalCommandes,
        total_depenses: totalDepenses,
        commandes_en_cours: commandesEnCours,
      });
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
    refresh: loadDashboard,
  };
}
