"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type BadgeCounts = {
  messages: number;
  dashboard: number;
  missions: number;
  favoris: number;
  commandes: number;
};

const emptyBadges: BadgeCounts = {
  messages: 0,
  dashboard: 0,
  missions: 0,
  favoris: 0,
  commandes: 0,
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
      if (role === "vendeur") {
        const [{ count: commandesCount }, { count: messagesCount }] = await Promise.all([
          supabase
            .from("commandes")
            .select("*", { count: "exact", head: true })
            .eq("vendeur_id", userId)
            .eq("statut", "en_attente"),
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
            dashboard: 0, // le dashboard n'est pas une file d'attente, pas de badge par défaut
          }));
        }
      }

      if (role === "livreur") {
        const { count: missionsCount } = await supabase
          .from("missions")
          .select("*", { count: "exact", head: true })
          .eq("livreur_id", userId)
          .eq("statut", "disponible");

        if (isMounted) {
          setBadges((prev) => ({ ...prev, missions: missionsCount ?? 0 }));
        }
      }

      if (role === "client") {
        const { count: favorisCount } = await supabase
          .from("favoris")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId);

        if (isMounted) {
          setBadges((prev) => ({ ...prev, favoris: favorisCount ?? 0 }));
        }
      }
    }

    fetchCounts();

    // Abonnement temps réel : recalcule sur tout INSERT/UPDATE/DELETE pertinent
    const channel = supabase
      .channel(`badge-counts-${userId}`)
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
        { event: "*", schema: "public", table: "missions", filter: `livreur_id=eq.${userId}` },
        fetchCounts
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "favoris", filter: `user_id=eq.${userId}` },
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
