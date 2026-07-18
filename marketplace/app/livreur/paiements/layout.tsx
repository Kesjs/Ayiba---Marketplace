import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function LivreurPaiementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: livreur } = await supabase
    .from("livreurs")
    .select("id")
    .eq("id", user!.id)
    .maybeSingle();

  if (!livreur) {
    redirect("/livreur/kyc");
  }

  return <>{children}</>;
}
