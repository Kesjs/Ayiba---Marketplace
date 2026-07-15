import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { StatutCommande } from "@/lib/constants/commandes";

export type { StatutCommande }; // ré-exporté pour ne rien casser côté imports existants

export interface VendeurCommande {
  id: string;
  numero: string;
  client_id: string; // nécessaire pour relier une commande à une conversation
  nom_client: string | null;
  telephone_client: string | null;
  adresse_livraison: string | null;
  commune: string | null;
  note_client: string | null;
  montant_total: number;
  statut: StatutCommande;
  created_at: string;
}

export function useVendeurCommandes() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandes, setCommandes] = useState<VendeurCommande[]>([]);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchCommandes = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Utilisateur non connecté");
      setLoading(false);
      return;
    }

    const { data, error: fetchError } = await supabase
      .from("commandes")
      .select(
        "id, numero, client_id, nom_client, telephone_client, adresse_livraison, commune, note_client, montant_total, statut, created_at"
      )
      .eq("vendeur_id", user.id)
      .order("created_at", { ascending: false });

    if (fetchError) {
      console.error("Erreur lors du chargement des commandes:", fetchError);
      setError("Impossible de charger les commandes");
    } else {
      setCommandes((data as VendeurCommande[]) || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCommandes();
  }, [fetchCommandes]);

  const updateStatut = useCallback(
    async (commandeId: string, statut: StatutCommande) => {
      setUpdatingId(commandeId);
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("commandes")
        .update({ statut, updated_at: new Date().toISOString() })
        .eq("id", commandeId);

      if (updateError) {
        console.error("Erreur lors de la mise à jour du statut:", updateError);
        setError("Impossible de mettre à jour le statut");
      } else {
        setCommandes((prev) =>
          prev.map((c) => (c.id === commandeId ? { ...c, statut } : c))
        );
      }
      setUpdatingId(null);
    },
    []
  );

  return {
    loading,
    error,
    commandes,
    updatingId,
    updateStatut,
    refresh: fetchCommandes,
  };
}
