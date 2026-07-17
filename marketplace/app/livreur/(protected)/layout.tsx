import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LivreurStatusBanner } from "@/components/livreur/LivreurStatusBanner";

export default async function LivreurProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role, statut")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "livreur") {
    redirect("/");
  }

  if (userRow.statut === "suspendu") {
    redirect("/compte-suspendu");
  }

  const { data: livreur } = await supabase
    .from("livreurs")
    .select("statut_verification, raison_rejet")
    .eq("id", user.id)
    .maybeSingle();

  if (!livreur) {
    redirect("/livreur/kyc");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <LivreurStatusBanner
        statut={livreur.statut_verification}
        raisonRejet={livreur.raison_rejet}
      />
      {children}
    </div>
  );
}
