import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LivreurKycWizard } from "@/components/kyc/LivreurKycWizard";

export default async function DevenirLivreurClientPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { data: userRow } = await supabase
    .from("users")
    .select("role, account_roles")
    .eq("id", user.id)
    .single();
  const roles = userRow?.account_roles ?? [userRow?.role ?? "client"];

  if (userRow?.role === "admin") redirect("/admin/dashboard");
  if (roles.includes("livreur")) redirect("/livreur/missions");

  return <LivreurKycWizard />;
}
