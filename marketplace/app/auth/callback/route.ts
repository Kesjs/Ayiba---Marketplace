import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const type = searchParams.get("type");

  if (code) {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && user) {
      if (type === "recovery") {
        return NextResponse.redirect(`${origin}/auth/reset-password`);
      }

      // Si l'inscription attendait la confirmation par email, la ligne
      // `users` n'a pas pu être écrite depuis AuthModal (pas de session à
      // ce moment-là) — on la crée ici avec les métadonnées passées au
      // signUp (nom, téléphone, rôle), une seule fois. On vérifie d'abord
      // qu'elle n'existe pas déjà : ce callback est aussi emprunté à
      // chaque connexion Google, un upsert aveugle écraserait le rôle
      // (vendeur/livreur/admin) d'un compte existant à chaque login.
      const { data: existingRow } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      if (!existingRow) {
        const meta = user.user_metadata || {};
        await supabase.from("users").insert({
          id: user.id,
          phone: meta.phone || user.phone || "",
          full_name: meta.full_name || "Utilisateur",
          role: meta.role || "client",
        });
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      if (userData?.role === "vendeur" || userData?.role === "livreur") {
        const table = userData.role === "vendeur" ? "vendeurs" : "livreurs";
        const statutField = userData.role === "vendeur" ? "statut" : "statut_verification";

        const { data: profil } = await supabase
          .from(table)
          .select(statutField)
          .eq("id", user.id)
          .single();

        const estValide = profil && (profil as Record<string, string>)[statutField] === "valide";

        if (estValide) {
          return NextResponse.redirect(`${origin}/${userData.role}/dashboard`);
        }
        return NextResponse.redirect(`${origin}/${userData.role}/kyc`);
      }

      return NextResponse.redirect(`${origin}/catalogue`);
    }
  }

  return NextResponse.redirect(`${origin}/catalogue?error=Lien invalide ou expiré`);
}
