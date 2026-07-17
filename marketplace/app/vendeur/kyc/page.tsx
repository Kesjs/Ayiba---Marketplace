import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { VendeurKycWizard } from "@/components/kyc/VendeurKycWizard";

export default async function VendeurKycPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/");
  }

  const { data: userRow } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (userRow?.role !== "vendeur") {
    redirect("/");
  }

  return <VendeurKycWizard />;
}
