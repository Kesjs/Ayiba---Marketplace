"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface HistoriqueMission {
  id: string;
  numero: string;
  statut: string;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  nom_client: string | null;
  nb_articles: number;
  vendeur_nom_boutique: string | null;
  vendeur_quartier: string | null;
  created_at: string;
  updated_at: string;
}

interface RawRow {
  id: string;
  numero: string;
  statut: string;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  nom_client: string | null;
  created_at: string;
  updated_at: string;
  vendeur: { nom_boutique: string | null; quartier: string | null } | null;
  commande_articles: { quantite: number }[] | null;
}

const SELECT_HISTORIQUE = `
  id, numero, statut, frais_livraison, adresse_livraison, commune,
  nom_client, created_at, updated_at,
  vendeur:vendeurs ( nom_boutique, quartier ),
  commande_articles ( quantite )
`;

const PAGE_SIZE = 20;

function mapRow(row: RawRow): HistoriqueMission {
  return {
    id: row.id,
    numero: row.numero,
    statut: row.statut,
    frais_livraison: row.frais_livraison,
    adresse_livraison: row.adresse_livraison,
    commune: row.commune,
    nom_client: row.nom_client,
    nb_articles: (row.commande_articles ?? []).reduce((sum, a) => sum + (a.quantite ?? 0), 0),
    vendeur_nom_boutique: row.vendeur?.nom_boutique ?? null,
    vendeur_quartier: row.vendeur?.quartier ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useLivreurHistorique() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [missions, setMissions] = useState<HistoriqueMission[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);

  const loadPage = useCallback(
    async (pageIndex: number, append: boolean) => {
      try {
        if (append) setLoadingMore(true);
        else setLoading(true);
        setError(null);

        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) throw authError;
        if (!user) throw new Error("Utilisateur non connecté");

        const from = pageIndex * PAGE_SIZE;
        const to = from + PAGE_SIZE - 1;

        const { data, error: fetchError } = await supabase
          .from("commandes")
          .select(SELECT_HISTORIQUE)
          .eq("livreur_id", user.id)
          .in("statut", ["livree", "annulee", "remboursee"])
          .order("updated_at", { ascending: false })
          .range(from, to);

        if (fetchError) throw fetchError;

        const rows = (data ?? []) as unknown as RawRow[];
        const mapped = rows.map(mapRow);

        setMissions((prev) => (append ? [...prev, ...mapped] : mapped));
        setHasMore(mapped.length === PAGE_SIZE);
        setPage(pageIndex);
      } catch (err) {
        console.error("[useLivreurHistorique] loadPage error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du chargement de l'historique");
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [supabase]
  );

  useEffect(() => {
    loadPage(0, false);
  }, [loadPage]);

  const loadMore = useCallback(() => {
    if (loadingMore || !hasMore) return;
    loadPage(page + 1, true);
  }, [loadPage, page, hasMore, loadingMore]);

  const stats = useMemo(() => {
    const livrees = missions.filter((m) => m.statut === "livree");
    const gainsTotal = livrees.reduce((sum, m) => sum + (m.frais_livraison ?? 0), 0);
    return {
      totalLivrees: livrees.length,
      totalAnnulees: missions.length - livrees.length,
      gainsTotal,
    };
  }, [missions]);

  return {
    loading,
    loadingMore,
    error,
    missions,
    hasMore,
    loadMore,
    stats,
    refresh: () => loadPage(0, false),
  };
}
