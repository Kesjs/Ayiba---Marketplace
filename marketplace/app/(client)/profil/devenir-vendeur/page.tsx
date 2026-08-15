import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendeurKycWizard } from "@/components/kyc/VendeurKycWizard";

/**
 * Pendant de app/vendeur/kyc/page.tsx, mais pour un CLIENT déjà connecté qui
 * veut ouvrir une boutique — /devenir-vendeur (racine) est réservée aux
 * visiteurs non connectés (choix fait à l'inscription) et redirige tout
 * utilisateur déjà loggé, donc un client existant n'avait jusqu'ici aucune
 * porte d'entrée vers le KYC vendeur.
 *
 * Le wizard lui-même (VendeurKycWizard) détecte qu'il est ouvert par un
 * compte encore 'client' et passe par /api/devenir-vendeur à la soumission
 * plutôt que par un upsert direct (la policy RLS d'insert sur vendeurs exige
 * role='vendeur', ce qui n'est vrai qu'après cette soumission ici).
 */
export default async function DevenirVendeurClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role, account_roles")
    .eq("id", user!.id)
    .single();

  const roles = userRow?.account_roles ?? [userRow?.role ?? "client"];

  // Un compte ayant déjà le droit vendeur peut reprendre son espace. Un
  // livreur sans boutique, en revanche, peut maintenant ouvrir la sienne.
  if (roles.includes("vendeur")) {
    redirect("/vendeur/dashboard");
  }
  if (userRow?.role === "admin") {
    redirect("/admin/dashboard");
  }

  return <VendeurKycWizard />;
}
