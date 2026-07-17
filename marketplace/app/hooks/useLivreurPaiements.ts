"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface GainLivraison {
  id: string;
  numero: string;
  frais_livraison: number;
  commune: string | null;
  updated_at: string;
}

interface RawGainRow {
  id: string;
  numero: string;
  frais_livraison: number | null;
  commune: string | null;
  updated_at: string;
}

export function useLivreurPaiements() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const [livreur, setLivreur] = useState<any>(null);
  const [gains, setGains] = useState<GainLivraison[]>([]);
  const [retraits, setRetraits] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: livreurData, error: livreurError } = await supabase
        .from("livreurs")
        .select("*")
        .eq("id", user.id)
        .single();

      if (livreurError) throw livreurError;

      // Le gain du livreur, c'est le frais_livraison de chaque commande qu'il a
      // effectivement livrée — pas de table "paiements" séparée côté livreur,
      // contrairement au vendeur qui a une commission par transaction.
      const { data: gainsData, error: gainsError } = await supabase
        .from("commandes")
        .select("id, numero, frais_livraison, commune, updated_at")
        .eq("livreur_id", user.id)
        .eq("statut", "livree")
        .order("updated_at", { ascending: false })
        .limit(200);

      if (gainsError) throw gainsError;

      const { data: retraitsData, error: retraitsError } = await supabase
        .from("retraits")
        .select("*")
        .eq("livreur_id", user.id)
        .order("created_at", { ascending: false });

      if (retraitsError) throw retraitsError;

      setLivreur(livreurData);
      setGains(
        ((gainsData ?? []) as RawGainRow[]).map((r) => ({
          id: r.id,
          numero: r.numero,
          frais_livraison: r.frais_livraison ?? 0,
          commune: r.commune,
          updated_at: r.updated_at,
        }))
      );
      setRetraits(retraitsData || []);
    } catch (err: any) {
      console.error("Paiements livreur:", err);
      setError(err.message || "Impossible de charger les paiements");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalGagne = gains.reduce((sum, g) => sum + g.frais_livraison, 0);

  const totalRetire = retraits
    .filter((r) => r.statut === "valide" || r.statut === "paye")
    .reduce((sum, r) => sum + Number(r.montant || 0), 0);

  const totalEnAttenteRetrait = retraits
    .filter((r) => r.statut === "en_attente")
    .reduce((sum, r) => sum + Number(r.montant || 0), 0);

  const soldeDisponible = Math.max(0, totalGagne - totalRetire - totalEnAttenteRetrait);

  // Gains du jour, pour cohérence avec la tuile déjà affichée sur la page Missions
  const gainsJour = gains
    .filter((g) => {
      const d = new Date(g.updated_at);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    })
    .reduce((sum, g) => sum + g.frais_livraison, 0);

  const demanderRetrait = useCallback(
    async (montant: number) => {
      if (!livreur) return { success: false, message: "Profil livreur introuvable" };
      if (montant <= 0) return { success: false, message: "Montant invalide" };
      if (montant > soldeDisponible)
        return { success: false, message: "Montant supérieur au solde disponible" };
      if (!livreur.mobile_money_number || !livreur.mobile_money_network)
        return { success: false, message: "Ajoute d'abord un numéro Mobile Money dans Paramètres" };

      setRequesting(true);
      try {
        const { data, error: insertError } = await supabase
          .from("retraits")
          .insert({
            livreur_id: livreur.id,
            montant,
            numero_mobile_money: livreur.mobile_money_number,
            reseau: livreur.mobile_money_network,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setRetraits((prev) => [data, ...prev]);
        return { success: true, message: "Demande de retrait envoyée" };
      } catch (err: any) {
        console.error("Demande retrait livreur:", err);
        return { success: false, message: err.message || "Erreur lors de la demande" };
      } finally {
        setRequesting(false);
      }
    },
    [supabase, livreur, soldeDisponible]
  );

  return {
    loading,
    error,
    livreur,
    gains,
    retraits,
    soldeDisponible,
    gainsJour,
    requesting,
    demanderRetrait,
    refresh: loadData,
  };
}
