import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendeurStatusBanner } from "@/components/vendeur/VendeurStatusBanner";

export default async function VendeurProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
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

  // Aucune ligne vendeurs pour ce user → jamais passé par le KYC (ou l'a quitté avant la fin)
  if (!vendeur) {
    redirect("/vendeur/kyc");
  }

  return (
    <>
      <VendeurStatusBanner statut={vendeur.statut} raisonRejet={vendeur.raison_rejet} />
      {children}
    </>
  );
}
