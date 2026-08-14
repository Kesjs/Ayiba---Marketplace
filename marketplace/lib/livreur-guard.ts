import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getRoleWithCache } from "@/lib/supabase/role-cache";

/**
 * Garde d'accès pour les pages livreur sensibles (missions, historique,
 * paiements, messages). Avant : chaque layout vérifiait seulement qu'une
 * ligne "livreurs" existait, ce qui laissait passer les comptes en_attente
 * ou refuse. Ici on exige explicitement statut_verification === "valide".
 *
 * Un livreur non connecté, sans dossier, en attente ou refusé est renvoyé
 * vers /livreur/kyc, qui affiche lui-même l'état du dossier (en cours de
 * vérification / refusé avec motif / formulaire à compléter).
 */
export async function requireValidLivreur() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // Utiliser le cache pour vérifier le rôle
  const userRole = await getRoleWithCache(user.id);
  if (userRole !== "livreur") {
    redirect("/connexion");
  }

  const { data: livreur } = await supabase
    .from("livreurs")
    .select("id, statut_verification")
    .eq("id", user.id)
    .maybeSingle();

  if (!livreur || livreur.statut_verification !== "valide") {
    redirect("/livreur/kyc");
  }

  return livreur;
}
