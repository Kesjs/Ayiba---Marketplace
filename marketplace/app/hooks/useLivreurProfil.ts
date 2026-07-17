"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StatutVerification } from "@/app/hooks/useLivreurDashboard";

export interface LivreurProfil {
  fullName: string | null;
  avatarUrl: string | null;
  quartier: string | null;
  commune: string | null;
  typeVehicule: string | null;
  plaqueImmatriculation: string | null;
  noteMoyenne: number;
  nbAvis: number;
  statutVerification: StatutVerification;
  membreDepuis: string;
  livraisonsTotal: number;
}

export function useLivreurProfil() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profil, setProfil] = useState<LivreurProfil | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Utilisateur non authentifié");

      const [{ data: userRow, error: userError }, { data: livreurRow, error: livreurError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("full_name, avatar_url, note_moyenne, nb_avis, created_at")
            .eq("id", user.id)
            .single(),
          supabase
            .from("livreurs")
            .select("quartier, commune, type_vehicule, plaque_immatriculation, statut_verification, photo_profil_url")
            .eq("id", user.id)
            .single(),
        ]);

      if (userError) throw userError;
      if (livreurError) throw livreurError;

      const { count: livraisonsTotal, error: countError } = await supabase
        .from("commandes")
        .select("id", { count: "exact", head: true })
        .eq("livreur_id", user.id)
        .eq("statut", "livree");

      if (countError) throw countError;

      setProfil({
        fullName: userRow?.full_name ?? null,
        avatarUrl: livreurRow?.photo_profil_url ?? userRow?.avatar_url ?? null,
        quartier: livreurRow?.quartier ?? null,
        commune: livreurRow?.commune ?? null,
        typeVehicule: livreurRow?.type_vehicule ?? null,
        plaqueImmatriculation: livreurRow?.plaque_immatriculation ?? null,
        noteMoyenne: userRow?.note_moyenne ?? 0,
        nbAvis: userRow?.nb_avis ?? 0,
        statutVerification: (livreurRow?.statut_verification as StatutVerification) ?? "en_attente",
        membreDepuis: userRow?.created_at ?? new Date().toISOString(),
        livraisonsTotal: livraisonsTotal ?? 0,
      });
    } catch (err) {
      console.error("[useLivreurProfil] load error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  return { loading, error, profil, reload: load };
}
