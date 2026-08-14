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
    <div className="flex flex-col h-dvh overflow-hidden">
      {livreur && (
        <LivreurStatusBanner statut={livreur.statut_verification} raisonRejet={livreur.raison_rejet} />
      )}
      {/* flex-1 + min-h-0 : le bandeau garde sa hauteur naturelle, le reste
          du contenu prend l'espace restant. overflow-y-auto ici (et pas sur
          le conteneur global) pour que les pages livreur normales (Missions,
          Profil...) puissent scroller si besoin, sans faire dépasser tout
          le layout de la hauteur du viewport. */}
      <div className="flex-1 min-h-0 overflow-y-auto">{children}</div>
    </div>
  );
}
