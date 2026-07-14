import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface VendeurInfo {
  nom_complet: string | null;
}

export interface VendeurStats {
  nombre_commandes: number;
  nombre_articles: number;
  articles_vendus: number;
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
  created_at: string;
}

export interface DashboardMessage {
  id: string;
  contenu: string;
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

const PERIOD_DAYS = 30;

export function useVendeurDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vendeur, setVendeur] = useState<VendeurInfo | null>(null);
  const [stats, setStats] = useState<VendeurStats | null>(null);
  const [chiffreAffaires, setChiffreAffaires] = useState<ChiffreAffaires | null>(null);
  const [evolution, setEvolution] = useState<Evolution | null>(null);
  const [commandes, setCommandes] = useState<DashboardCommande[]>([]);
  const [messages, setMessages] = useState<DashboardMessage[]>([]);

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
      const now = new Date();
      const debutActuel = new Date(now.getTime() - PERIOD_DAYS * 24 * 60 * 60 * 1000);
      const debutPrecedent = new Date(now.getTime() - 2 * PERIOD_DAYS * 24 * 60 * 60 * 1000);

      const [
        { data: vendeurData },
        { data: articlesData },
        { data: commandesData },
        { data: paiementsData },
        { data: messagesData },
      ] = await Promise.all([
        supabase.from("vendeurs").select("nom_complet").eq("id", user.id).single(),
        supabase.from("articles").select("id, actif, created_at").eq("vendeur_id", user.id),
        supabase
          .from("commandes")
          .select("id, numero, nom_client, montant_total, statut, created_at")
          .eq("vendeur_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("paiements")
          .select("montant_net, statut, created_at")
          .eq("vendeur_id", user.id),
        supabase
          .from("messages")
          .select("id, contenu, created_at")
          .eq("destinataire_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      const commandesList = commandesData || [];
      const commandeIds = commandesList.map((c) => c.id);

      let articlesVendusTotal = 0;
      let articlesVendusActuel = 0;
      let articlesVendusPrecedent = 0;

      if (commandeIds.length > 0) {
        const { data: lignesData } = await supabase
          .from("commande_articles")
          .select("quantite, commande_id")
          .in("commande_id", commandeIds);

        const commandeDateMap = new Map(
          commandesList.map((c) => [c.id, new Date(c.created_at)])
        );

        (lignesData || []).forEach((ligne) => {
          articlesVendusTotal += ligne.quantite;
          const date = commandeDateMap.get(ligne.commande_id);
          if (date && date >= debutActuel) {
            articlesVendusActuel += ligne.quantite;
          } else if (date && date >= debutPrecedent && date < debutActuel) {
            articlesVendusPrecedent += ligne.quantite;
          }
        });
      }

      const caPaye = (paiementsData || []).filter((p) => p.statut === "paye");
      const montantTotal = caPaye.reduce((sum, p) => sum + Number(p.montant_net || 0), 0);
      const caActuel = caPaye
        .filter((p) => new Date(p.created_at) >= debutActuel)
        .reduce((sum, p) => sum + Number(p.montant_net || 0), 0);
      const caPrecedent = caPaye
        .filter(
          (p) => new Date(p.created_at) >= debutPrecedent && new Date(p.created_at) < debutActuel
        )
        .reduce((sum, p) => sum + Number(p.montant_net || 0), 0);

      const commandesActuel = commandesList.filter(
        (c) => new Date(c.created_at) >= debutActuel
      ).length;
      const commandesPrecedent = commandesList.filter(
        (c) => new Date(c.created_at) >= debutPrecedent && new Date(c.created_at) < debutActuel
      ).length;

      const articlesActifs = (articlesData || []).filter((a) => a.actif);
      const articlesActifsActuel = articlesActifs.filter(
        (a) => new Date(a.created_at) >= debutActuel
      ).length;
      const articlesActifsPrecedent = articlesActifs.filter(
        (a) => new Date(a.created_at) >= debutPrecedent && new Date(a.created_at) < debutActuel
      ).length;

      setVendeur(vendeurData);
      setStats({
        nombre_commandes: commandesList.length,
        nombre_articles: articlesActifs.length,
        articles_vendus: articlesVendusTotal,
      });
      setChiffreAffaires({ montant_total: montantTotal });
      setEvolution({
        ca_periode_actuelle: caActuel,
        ca_periode_precedente: caPrecedent,
        commandes_periode_actuelle: commandesActuel,
        commandes_periode_precedente: commandesPrecedent,
        articles_actifs_actuel: articlesActifsActuel,
        articles_actifs_precedent: articlesActifsPrecedent,
        articles_vendus_periode_actuelle: articlesVendusActuel,
        articles_vendus_periode_precedente: articlesVendusPrecedent,
      });
      setCommandes(
        commandesList.slice(0, 5).map((c) => ({
          ...c,
          statut: STATUT_LABELS[c.statut] || c.statut,
        }))
      );
      setMessages(messagesData || []);
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
    refresh: fetchDashboard,
  };
}
