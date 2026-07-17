import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendeurStatusBannerGate } from "@/components/vendeur/VendeurStatusBannerGate";

export default async function VendeurLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: vendeur } = await supabase
    .from("vendeurs")
    .select("statut, raison_rejet")
    .eq("id", user!.id)
    .maybeSingle();

  // Aucune ligne vendeurs pour ce user → jamais passé par le KYC (ou l'a quitté avant la fin).
  // On ne redirige pas ici (ce layout englobe aussi /vendeur/kyc, une redirection créerait
  // une boucle infinie) : on affiche simplement les pages sans bannière, chaque page gère
  // elle-même son propre accès si besoin.
  return (
    <>
      {vendeur && (
        <VendeurStatusBannerGate statut={vendeur.statut} raisonRejet={vendeur.raison_rejet} />
      )}
      {children}
    </>
  );
}
