import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LivreurStatusBanner } from "@/components/livreur/LivreurStatusBanner";

export default async function LivreurLayout({
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

  const { data: livreur } = await supabase
    .from("livreurs")
    .select("statut_verification, raison_rejet")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <>
      {livreur && (
        <LivreurStatusBanner statut={livreur.statut_verification} raisonRejet={livreur.raison_rejet} />
      )}
      {children}
    </>
  );
}
