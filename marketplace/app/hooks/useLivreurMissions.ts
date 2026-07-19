"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MissionCommande {
  id: string;
  numero: string;
  statut: string;
  montant_total: number;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  nom_client: string | null;
  telephone_client: string | null;
  livreur_confirme: boolean;
  nb_articles: number;
  vendeur_nom_boutique: string | null;
  vendeur_quartier: string | null;
  created_at: string;
  updated_at: string;
}

interface LivreurStats {
  gains_jour: number;
  livraisons_jour: number;
}

// Codes affichés une seule fois au livreur juste après génération (prise en
// charge ou régénération). Jamais persistés ailleurs qu'en mémoire ici —
// si l'app est fermée avant confirmation, il faut regenererCodes() pour
// en obtenir de nouveaux à afficher.
export interface CodesLivraison {
  commandeId: string;
  qrToken: string;
  code6: string;
}

interface RawCommandeRow {
  id: string;
  numero: string;
  statut: string;
  montant_total: number;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  nom_client: string | null;
  telephone_client: string | null;
  livreur_confirme: boolean;
  created_at: string;
  updated_at: string;
  vendeur: { nom_boutique: string | null; quartier: string | null } | null;
  commande_articles: { quantite: number }[] | null;
}

const SELECT_MISSION = `
  id, numero, statut, montant_total, frais_livraison, adresse_livraison, commune,
  nom_client, telephone_client, livreur_confirme, created_at, updated_at,
  vendeur:vendeurs ( nom_boutique, quartier ),
  commande_articles ( quantite )
`;

function mapRow(row: RawCommandeRow): MissionCommande {
  return {
    id: row.id,
    numero: row.numero,
    statut: row.statut,
    montant_total: row.montant_total,
    frais_livraison: row.frais_livraison,
    adresse_livraison: row.adresse_livraison,
    commune: row.commune,
    nom_client: row.nom_client,
    telephone_client: row.telephone_client,
    livreur_confirme: row.livreur_confirme,
    nb_articles: (row.commande_articles ?? []).reduce((sum, a) => sum + (a.quantite ?? 0), 0),
    vendeur_nom_boutique: row.vendeur?.nom_boutique ?? null,
    vendeur_quartier: row.vendeur?.quartier ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function useLivreurMissions() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<LivreurStats | null>(null);
  const [noteMoyenne, setNoteMoyenne] = useState<number | null>(null);
  const [aConfirmer, setAConfirmer] = useState<MissionCommande[]>([]);
  const [enCours, setEnCours] = useState<MissionCommande[]>([]);

  // Codes en clair du moment — n'existe qu'en mémoire, jamais en base ni en storage.
  const [codesActifs, setCodesActifs] = useState<CodesLivraison | null>(null);

  const loadMissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        throw new Error("Utilisateur non authentifié");
      }

      const { data: missionsData, error: missionsError } = await supabase
        .from("commandes")
        .select(SELECT_MISSION)
        .eq("livreur_id", user.id)
        .not("statut", "in", "(livree,annulee,remboursee)")
        .order("created_at", { ascending: false });

      if (missionsError) throw missionsError;

      const rows = (missionsData ?? []) as unknown as RawCommandeRow[];
      const mapped = rows.map(mapRow);

      setAConfirmer(mapped.filter((m) => !m.livreur_confirme));
      setEnCours(mapped.filter((m) => m.livreur_confirme && m.statut === "expediee"));

      const debutJournee = new Date();
      debutJournee.setHours(0, 0, 0, 0);

      const { data: livreesData, error: livreesError } = await supabase
        .from("commandes")
        .select("frais_livraison")
        .eq("livreur_id", user.id)
        .eq("statut", "livree")
        .gte("updated_at", debutJournee.toISOString());

      if (livreesError) throw livreesError;

      const gains_jour = (livreesData ?? []).reduce(
        (sum: number, c: { frais_livraison: number | null }) => sum + (c.frais_livraison ?? 0),
        0
      );
      setStats({ gains_jour, livraisons_jour: (livreesData ?? []).length });

      const { data: userData, error: userError } = await supabase
        .from("users")
        .select("note_moyenne")
        .eq("id", user.id)
        .single();

      if (userError) throw userError;
      setNoteMoyenne(userData?.note_moyenne ?? null);
    } catch (err) {
      console.error("[useLivreurMissions] loadMissions error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement des missions");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadMissions();
  }, [loadMissions]);

  const refuserMission = useCallback(
    async (id: string) => {
      try {
        const { error: updateError } = await supabase
          .from("commandes")
          .update({ livreur_id: null, livreur_confirme: false, statut: "preparee" })
          .eq("id", id);

        if (updateError) throw updateError;
        await loadMissions();
      } catch (err) {
        console.error("[useLivreurMissions] refuserMission error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du refus");
      }
    },
    [supabase, loadMissions]
  );

  // Remplace l'ancien "confirmerMission" (accepter la mission) ET l'ancien
  // "marquerLivree" (qui ne vérifiait rien). Récupérer le colis = déclencher
  // la génération des codes QR + 6 chiffres côté serveur. Le livreur n'a plus
  // de bouton "Confirmer la livraison" : seul le client peut faire passer la
  // commande à "livree", via verifierCodeLivraison (côté client, autre hook).
  const recupererColis = useCallback(
    async (id: string) => {
      try {
        const { data, error: rpcError } = await supabase.rpc("livreur_recuperer_colis", {
          p_commande_id: id,
        });

        if (rpcError) throw rpcError;

        const row = Array.isArray(data) ? data[0] : data;
        if (row?.qr_token && row?.code6) {
          setCodesActifs({ commandeId: id, qrToken: row.qr_token, code6: row.code6 });
        }

        await loadMissions();
      } catch (err) {
        console.error("[useLivreurMissions] recupererColis error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors de la récupération du colis");
      }
    },
    [supabase, loadMissions]
  );

  // À utiliser si l'app a été fermée/rechargée après recupererColis : les
  // codes en clair précédents sont perdus (normal, ils ne sont jamais stockés),
  // il faut en régénérer de nouveaux pour pouvoir les réafficher au client.
  const regenererCodes = useCallback(
    async (id: string) => {
      try {
        const { data, error: rpcError } = await supabase.rpc("livreur_regenerer_codes", {
          p_commande_id: id,
        });

        if (rpcError) throw rpcError;

        const row = Array.isArray(data) ? data[0] : data;
        if (row?.qr_token && row?.code6) {
          setCodesActifs({ commandeId: id, qrToken: row.qr_token, code6: row.code6 });
        }
      } catch (err) {
        console.error("[useLivreurMissions] regenererCodes error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors de la régénération des codes");
      }
    },
    [supabase]
  );

  // "Client indisponible pour confirmer" : le colis a quand même été remis
  // (voir principe directeur). Bascule directement en attente de vérification.
  const signalerClientIndisponible = useCallback(
    async (id: string, photoUrl?: string) => {
      try {
        const { error: rpcError } = await supabase.rpc("livreur_signaler_client_indisponible", {
          p_commande_id: id,
          p_photo_url: photoUrl ?? null,
        });

        if (rpcError) throw rpcError;
        setCodesActifs(null);
        await loadMissions();
      } catch (err) {
        console.error("[useLivreurMissions] signalerClientIndisponible error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors du signalement");
      }
    },
    [supabase, loadMissions]
  );

  return {
    loading,
    error,
    stats,
    noteMoyenne,
    aConfirmer,
    enCours,
    codesActifs,
    loadMissions,
    recupererColis,
    regenererCodes,
    refuserMission,
    signalerClientIndisponible,
  };
}
