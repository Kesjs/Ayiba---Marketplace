"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Statut de vérification KYC du livreur connecté, utilisé pour verrouiller
 * l'accès aux onglets Missions/Paiements/Messages dans la BottomNav tant que
 * le dossier n'est pas validé (même logique que requireValidLivreur côté
 * serveur, côté client pour l'affichage).
 */
export function useLivreurVerificationStatut(enabled: boolean) {
  const [statut, setStatut] = useState<string | null>(null);
  const [loading, setLoading] = useState(enabled);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const supabase = createClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("livreurs")
        .select("statut_verification")
        .eq("id", user.id)
        .maybeSingle();

      if (!cancelled) {
        setStatut(data?.statut_verification ?? null);
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled]);

  return { statut, loading, isValide: statut === "valide" };
}
