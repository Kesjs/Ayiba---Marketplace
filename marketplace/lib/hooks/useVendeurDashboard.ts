import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface VendeurInfo {
  nom_complet: string | null;
  statut: string | null;
}

export interface VendeurStats {
  nombre_commandes: number;
  nombre_articles: number;
  articles_vendus: number;
  commandes_en_attente: number;
  messages_non_lus: number;
}

export interface ChiffreAffaires {
  montant_total: number;
}

export interface Evolution {
  ca_periode_actuelle: number;
  ca_periode_precedente: number;
  commandes_periode_actuelle: number;
  commandes_periode_precedente: number;
  articles_actifs_actuel: number;
  articles_actifs_precedent: number;
  articles_vendus_periode_actuelle: number;
  articles_vendus_periode_precedente: number;
}

export interface DashboardCommande {
  id: string;
  numero: string;
  nom_client: string | null;
  montant_total: number;
  statut: string;
  statut_brut: string;
  created_at: string;
}

export interface DashboardMessage {
  id: string;
  contenu: string;
  created_at: string;
  lu: boolean | null;
}

export interface PaiementRow {
  montant_net: number | null;
  statut: string | null;
  created_at: string;
}

const STATUT_LABELS: Record<string, string> = {
  en_attente: "En attente",
  confirmee: "Confirmé",
  preparee: "Préparée",
  expediee: "Expédiée",
  livree: "Livrée",
  annulee: "Annulée",
  remboursee: "Remboursée",
};

// Toutes les stats agrégées (CA, commandes, évolution) sont calculées côté base
// par les vues vue_stats_vendeur / vue_stats_vendeur_evolution / vue_chiffre_affaires
// / vue_commandes_recentes — une seule source de vérité, réutilisable aussi par
// un futur dashboard admin. Ce hook ne fait plus que lire ces vues + les listes
// détaillées (paiements pour le graphique, messages récents) qu'aucune vue ne fournit.
export function useVendeurDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendeur, setVendeur] = useState<VendeurInfo | null>(null);
  const [stats, setStats] = useState<VendeurStats | null>(null);
  const [chiffreAffaires, setChiffreAffaires] = useState<ChiffreAffaires | null>(null);
  const [evolution, setEvolution] = useState<Evolution | null>(null);
  const [commandes, setCommandes] = useState<DashboardCommande[]>([]);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);
  const [paiements, setPaiements] = useState<PaiementRow[]>([]);

  const fetchDashboard = useCallback(async () => {
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

    try {
      const [
        { data: statsData, error: statsError },
        { data: caData },
        { data: evolutionData },
        { data: commandesData },
        { data: messagesData },
        { data: paiementsData },
      ] = await Promise.all([
        supabase
          .from("vue_stats_vendeur")
          .select(
            "nom_complet, statut, nombre_commandes, nombre_articles, articles_vendus, commandes_en_attente, messages_non_lus, chiffre_affaires"
          )
          .eq("vendeur_id", user.id)
          .maybeSingle(),
        supabase.from("vue_chiffre_affaires").select("montant_total").eq("vendeur_id", user.id).maybeSingle(),
        supabase.from("vue_stats_vendeur_evolution").select("*").eq("vendeur_id", user.id).maybeSingle(),
        supabase
          .from("vue_commandes_recentes")
          .select("id, numero, nom_client, montant_total, statut, created_at")
          .eq("vendeur_id", user.id)
          .limit(5),
        supabase
          .from("messages")
          .select("id, contenu, created_at, lu")
          .eq("destinataire_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
        supabase
          .from("paiements")
          .select("montant_net, statut, created_at")
          .eq("vendeur_id", user.id),
      ]);

      if (statsError) throw statsError;

      setVendeur(statsData ? { nom_complet: statsData.nom_complet, statut: statsData.statut } : null);
      setStats(
        statsData
          ? {
              nombre_commandes: statsData.nombre_commandes,
              nombre_articles: statsData.nombre_articles,
              articles_vendus: statsData.articles_vendus,
              commandes_en_attente: statsData.commandes_en_attente,
              messages_non_lus: statsData.messages_non_lus,
            }
          : null
      );
      setChiffreAffaires({ montant_total: caData?.montant_total ?? statsData?.chiffre_affaires ?? 0 });
      setEvolution((evolutionData as Evolution) ?? null);
      setCommandes(
        ((commandesData || []) as (DashboardCommande & { statut: string })[]).map((c) => ({
          ...c,
          statut_brut: c.statut,
          statut: STATUT_LABELS[c.statut] || c.statut,
        }))
      );
      setMessages((messagesData || []) as DashboardMessage[]);
      setPaiements((paiementsData || []) as PaiementRow[]);
    } catch (err) {
      console.error("Erreur lors du chargement du tableau de bord:", err);
      setError("Impossible de charger le tableau de bord");
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  return {
    loading,
    error,
    vendeur,
    stats,
    chiffreAffaires,
    evolution,
    commandes,
    messages,
    paiements,
    refresh: fetchDashboard,
  };
}
