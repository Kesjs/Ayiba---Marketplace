import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendeurKycWizard } from "@/components/kyc/VendeurKycWizard";

export default async function VendeurKycPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/connexion");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role, account_roles")
    .eq("id", user!.id)
    .single();

  if (!(userRow?.account_roles ?? [userRow?.role]).includes("vendeur")) {
    redirect("/");
  }

  return <VendeurKycWizard />;
}
