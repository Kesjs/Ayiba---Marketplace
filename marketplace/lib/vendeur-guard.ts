import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * Garde d'accès pour les pages vendeur qui n'ont de sens que pour un dossier
 * validé (dashboard, boutique, articles, commandes, paiements, messages...).
 * Sur le modèle de requireValidLivreur() (lib/livreur-guard.ts) : avant, ces
 * pages étaient accessibles dès qu'une ligne "vendeurs" existait, quel que
 * soit son statut — un compte tout juste inscrit (statut null, jamais
 * soumis) ou en attente/refusé y atterrissait sans qu'aucune redirection ne
 * l'en empêche, avec juste une bannière ou une carte "à faire" pour
 * signaler le problème. Ici on exige explicitement statut === "valide" et
 * on renvoie vers /vendeur/kyc sinon, qui affiche lui-même l'état exact du
 * dossier (formulaire à compléter / en cours de vérification / refusé avec
 * motif).
 *
 * Ne s'applique volontairement pas à /vendeur/kyc lui-même (boucle infinie
 * sinon) : cette page reste protégée uniquement par le check auth du layout
 * racine app/vendeur/layout.tsx.
 */
export async function requireValidVendeur() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  // `role` est le rôle principal historique : un livreur peut aussi être
  // vendeur. La garde doit donc lire les droits cumulés, pas le seul rôle
  // principal.
  const { data: userProfile } = await supabase
    .from("users")
    .select("role, account_roles")
    .eq("id", user.id)
    .single();
  const roles = userProfile?.account_roles ?? [userProfile?.role ?? "client"];
  if (!roles.includes("vendeur")) {
    redirect("/connexion");
  }

  const { data: vendeur } = await supabase
    .from("vendeurs")
    .select("id, statut")
    .eq("id", user.id)
    .maybeSingle();

  if (!vendeur || vendeur.statut !== "valide") {
    redirect("/vendeur/kyc");
  }

  return vendeur;
}
