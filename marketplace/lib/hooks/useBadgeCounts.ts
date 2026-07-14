"use client";

import { useEffect, useState } from "react";
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

const emptyBadges: BadgeCounts = {
  messages: 0,
  dashboard: 0,
  missions: 0,
  favoris: 0,
  commandes: 0,
  notifications: 0,
};

export function useBadgeCounts(userId: string | undefined, role: string) {
  const [badges, setBadges] = useState<BadgeCounts>(emptyBadges);

  useEffect(() => {
    if (!userId) {
      setBadges(emptyBadges);
      return;
    }

    const supabase = createClient();
    let isMounted = true;

    async function fetchCounts() {
      const { count: notificationsCount } = await supabase
        .from("vue_notifications_dashboard")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("lu", false);

      if (isMounted) {
        setBadges((prev) => ({ ...prev, notifications: notificationsCount ?? 0 }));
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
        if (isMounted) {
          setBadges((prev) => ({ ...prev, missions: 0 }));
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
      .channel(`badge-counts-${userId}`)
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
  }, [userId, role]);

  return badges;
}
