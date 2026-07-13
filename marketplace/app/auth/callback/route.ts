import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role === "vendeur" || userData?.role === "livreur") {
        return NextResponse.redirect(`${origin}/${userData.role}/kyc`);
      }
      return NextResponse.redirect(`${origin}/catalogue`);
    }
  }

  return NextResponse.redirect(`${origin}/catalogue?error=Lien invalide ou expiré`);
}
