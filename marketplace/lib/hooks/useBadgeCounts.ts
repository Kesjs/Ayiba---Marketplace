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

// ⚠️ À confirmer : valeur exacte du statut "à traiter" dans `commandes`.
// Ajuste cette constante dès que tu as vérifié en base (probablement
// 'en_attente', mais peut aussi être 'nouvelle' ou 'pending').
const STATUT_COMMANDE_A_TRAITER = "en_attente";

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
            .eq("statut", STATUT_COMMANDE_A_TRAITER),
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
            dashboard: 0, // pas de badge sur le dashboard : ce n'est pas une file d'attente
          }));
        }
      }

      if (role === "livreur") {
        // Pas de table de missions pour l'instant côté data.
        // On laisse à 0 tant que le système d'attribution de livraisons
        // n'est pas développé (pas de requête inutile en attendant).
        if (isMounted) {
          setBadges((prev) => ({ ...prev, missions: 0 }));
        }
      }

      if (role === "client") {
        const { count: favorisCount } = await supabase
          .from("favoris")
          .select("*", { count: "exact", head: true })
          .eq("client_id", userId); // corrigé : client_id, pas user_id

        if (isMounted) {
          setBadges((prev) => ({ ...prev, favoris: favorisCount ?? 0 }));
        }
      }
    }

    fetchCounts();

    // Abonnement temps réel — uniquement sur les tables réellement utilisées
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
