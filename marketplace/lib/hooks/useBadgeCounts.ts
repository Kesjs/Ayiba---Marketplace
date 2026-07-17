"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { STATUTS_COMMANDE } from "@/lib/constants/commandes";

type BadgeCounts = {
  messages: number;
  dashboard: number;
  missions: number;
  favoris: number;
  commandes: number;
  notifications: number;
};

type NotificationItem = {
  id: string;
  titre: string;
  createdAt: string;
  couleur?: "coral" | "teal" | "amber" | "gray";
  lien?: string | null;
};

type NotifRow = {
  id: string;
  titre: string;
  type: string | null;
  created_at: string;
  lien: string | null;
};

const emptyBadges: BadgeCounts = {
  messages: 0,
  dashboard: 0,
  missions: 0,
  favoris: 0,
  commandes: 0,
  notifications: 0,
};

// Adapte ce mapping si les valeurs de "type" en base sont différentes
function couleurPourType(type: string | null): NotificationItem["couleur"] {
  switch (type) {
    case "commande":
      return "coral";
    case "paiement":
      return "teal";
    case "message":
      return "amber";
    default:
      return "gray";
  }
}

function formatRelatif(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ === 1) return "Hier";
  if (diffJ < 7) return `Il y a ${diffJ} j`;
  return new Date(dateIso).toLocaleDateString("fr-FR");
}

export function useBadgeCounts(userId: string | undefined, role: string) {
  const [badges, setBadges] = useState<BadgeCounts>(emptyBadges);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);
  // Identifiant unique par instance du hook, stable entre les re-renders,
  // pour éviter que deux composants (BottomNav + DashboardLayout) créent
  // un channel Supabase avec le même nom.
  const instanceId = useRef(Math.random().toString(36).slice(2)).current;

  useEffect(() => {
    if (!userId) {
      setBadges(emptyBadges);
      setNotificationsList([]);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    async function fetchCounts() {
      const [{ count: notificationsCount }, { data: notifRows }] = await Promise.all([
        supabase
          .from("vue_notifications_dashboard")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("lu", false),
        supabase
          .from("vue_notifications_dashboard")
          .select("id, titre, type, created_at, lien")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      if (isMounted) {
        setBadges((prev) => ({ ...prev, notifications: notificationsCount ?? 0 }));
        setNotificationsList(
          ((notifRows ?? []) as NotifRow[]).map((n) => ({
            id: n.id,
            titre: n.titre,
            createdAt: formatRelatif(n.created_at),
            couleur: couleurPourType(n.type),
            lien: n.lien,
          }))
        );
      }

      if (role === "vendeur") {
        const [{ count: commandesCount }, { count: messagesCount }] = await Promise.all([
          supabase
            .from("commandes")
            .select("*", { count: "exact", head: true })
            .eq("vendeur_id", userId)
            .eq("statut", STATUTS_COMMANDE.EN_ATTENTE),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("destinataire_id", userId)
            .eq("lu", false),
        ]);

        if (isMounted) {
          setBadges((prev) => ({
            ...prev,
            commandes: commandesCount ?? 0,
            messages: messagesCount ?? 0,
            dashboard: 0,
          }));
        }
      }

      if (role === "livreur") {
        const [{ count: missionsCount }, { count: messagesCount }] = await Promise.all([
          supabase
            .from("commandes")
            .select("*", { count: "exact", head: true })
            .eq("livreur_id", userId)
            .eq("livreur_confirme", false)
            .not("statut", "in", "(livree,annulee,remboursee)"),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("destinataire_id", userId)
            .eq("lu", false),
        ]);

        if (isMounted) {
          setBadges((prev) => ({
            ...prev,
            missions: missionsCount ?? 0,
            messages: messagesCount ?? 0,
          }));
        }
      }

      if (role === "client") {
        const { count: favorisCount } = await supabase
          .from("favoris")
          .select("*", { count: "exact", head: true })
          .eq("client_id", userId);

        if (isMounted) {
          setBadges((prev) => ({ ...prev, favoris: favorisCount ?? 0 }));
        }
      }
    }

    fetchCounts();

    const channel = supabase
      .channel(`badge-counts-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commandes", filter: `vendeur_id=eq.${userId}` },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "commandes", filter: `livreur_id=eq.${userId}` },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `destinataire_id=eq.${userId}` },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favoris", filter: `client_id=eq.${userId}` },
        fetchCounts
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(channel);
    };
  }, [userId, role, instanceId]);

  return { ...badges, notificationsList };
}
