import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LivreurKycWizard } from "@/components/kyc/LivreurKycWizard";

export default async function LivreurKycPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (userRow?.role !== "livreur") {
    redirect("/");
  }

  return <LivreurKycWizard />;
}
