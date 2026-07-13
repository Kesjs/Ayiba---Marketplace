"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useVendeurDashboard() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [vendeur, setVendeur] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [chiffreAffaires, setChiffreAffaires] = useState<any>(null);
  const [commandes, setCommandes] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      /* Profil vendeur */
      const { data: vendeurData, error: vendeurError } = await supabase
        .from("vendeurs")
        .select("*")
        .eq("id", user.id)
        .single();

      if (vendeurError) throw vendeurError;

      /* Statistiques vendeur */
      const { data: statsData, error: statsError } = await supabase
        .from("vue_stats_vendeur")
        .select("*")
        .eq("vendeur_id", user.id)
        .single();

      if (statsError && statsError.code !== "PGRST116") throw statsError;

      /* Chiffre affaires */
      const { data: caData, error: caError } = await supabase
        .from("vue_chiffre_affaires")
        .select("*")
        .eq("vendeur_id", user.id)
        .single();

      if (caError && caError.code !== "PGRST116") throw caError;

      /* Commandes récentes */
      const { data: commandesData, error: commandesError } = await supabase
        .from("vue_commandes_recentes")
        .select("*")
        .eq("vendeur_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (commandesError) throw commandesError;

      /* Messages récents */
      const { data: messagesData, error: messagesError } = await supabase
        .from("messages")
        .select("*")
        .eq("destinataire_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (messagesError) throw messagesError;

      setVendeur(vendeurData);
      setStats(statsData || null);
      setChiffreAffaires(caData || null);
      setCommandes(commandesData || []);
      setMessages(messagesData || []);
    } catch (err: any) {
      console.error("Dashboard vendeur:", err);
      setError(err.message || "Impossible de charger le dashboard");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  return {
    loading,
    error,
    vendeur,
    stats,
    chiffreAffaires,
    commandes,
    messages,
    refresh: loadDashboard,
  };
}
