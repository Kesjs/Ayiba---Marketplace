"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function useVendeurPaiements() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);

  const [vendeur, setVendeur] = useState<any>(null);
  const [paiements, setPaiements] = useState<any[]>([]);
  const [retraits, setRetraits] = useState<any[]>([]);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");

      const { data: vendeurData, error: vendeurError } = await supabase
        .from("vendeurs")
        .select("*")
        .eq("id", user.id)
        .single();

      if (vendeurError) throw vendeurError;

      // On joint la commande liée pour connaître son statut de livraison —
      // c'est ce qui détermine si l'argent est en escrow ou disponible.
      const { data: paiementsData, error: paiementsError } = await supabase
        .from("paiements")
        .select("*, commande:commande_id(numero, statut)")
        .eq("vendeur_id", user.id)
        .order("created_at", { ascending: false });

      if (paiementsError) throw paiementsError;

      const { data: retraitsData, error: retraitsError } = await supabase
        .from("retraits")
        .select("*")
        .eq("vendeur_id", user.id)
        .order("created_at", { ascending: false });

      if (retraitsError) throw retraitsError;

      setVendeur(vendeurData);
      setPaiements(paiementsData || []);
      setRetraits(retraitsData || []);
    } catch (err: any) {
      console.error("Paiements vendeur:", err);
      setError(err.message || "Impossible de charger les paiements");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Un paiement "paye" ne veut pas dire "disponible" — il faut aussi
  // que la commande liée soit livrée (escrow libéré).
  const totalRecuLivre = paiements
    .filter((p) => p.statut === "paye" && p.commande?.statut === "livree")
    .reduce((sum, p) => sum + Number(p.montant_net ?? p.montant ?? 0), 0);

  // Argent payé par le client mais bloqué en escrow (livraison pas encore confirmée)
  const totalEnAttenteLivraison = paiements
    .filter(
      (p) =>
        p.statut === "paye" &&
        p.commande?.statut &&
        !["livree", "annulee", "remboursee"].includes(p.commande.statut)
    )
    .reduce((sum, p) => sum + Number(p.montant_net ?? p.montant ?? 0), 0);

  const totalRetire = retraits
    .filter((r) => r.statut === "valide" || r.statut === "paye")
    .reduce((sum, r) => sum + Number(r.montant || 0), 0);

  const totalEnAttenteRetrait = retraits
    .filter((r) => r.statut === "en_attente")
    .reduce((sum, r) => sum + Number(r.montant || 0), 0);

  const soldeDisponible = Math.max(0, totalRecuLivre - totalRetire - totalEnAttenteRetrait);
  const soldeEnAttenteLivraison = totalEnAttenteLivraison;

  const demanderRetrait = useCallback(
    async (montant: number) => {
      if (!vendeur) return { success: false, message: "Boutique introuvable" };
      if (montant <= 0) return { success: false, message: "Montant invalide" };
      if (montant > soldeDisponible)
        return { success: false, message: "Montant supérieur au solde disponible" };
      if (!vendeur.mobile_money_number || !vendeur.mobile_money_network)
        return { success: false, message: "Ajoute d'abord un numéro Mobile Money dans Ma boutique" };

      setRequesting(true);
      try {
        const { data, error: insertError } = await supabase
          .from("retraits")
          .insert({
            vendeur_id: vendeur.id,
            montant,
            numero_mobile_money: vendeur.mobile_money_number,
            reseau: vendeur.mobile_money_network,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setRetraits((prev) => [data, ...prev]);
        return { success: true, message: "Demande de retrait envoyée" };
      } catch (err: any) {
        console.error("Demande retrait:", err);
        return { success: false, message: err.message || "Erreur lors de la demande" };
      } finally {
        setRequesting(false);
      }
    },
    [supabase, vendeur, soldeDisponible]
  );

  return {
    loading,
    error,
    vendeur,
    paiements,
    retraits,
    soldeDisponible,
    soldeEnAttenteLivraison,
    requesting,
    demanderRetrait,
    refresh: loadData,
  };
}
