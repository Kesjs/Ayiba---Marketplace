import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { setCachedServerRole } from "@/lib/supabase/role-cache";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ? process.env.NEXT_PUBLIC_SITE_URL.trim().replace(/\/$/, '') : '';
  const targetOrigin = siteUrl.startsWith('http') ? siteUrl : origin;

  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  if (code || tokenHash) {
    const supabase = await createClient();

    // Le flux "recovery" (mot de passe oublié) utilise verifyOtp(token_hash)
    // plutôt que exchangeCodeForSession(code) : ce dernier dépend d'un
    // cookie code_verifier posé dans le navigateur qui a fait la demande.
    const { data, error } =
      tokenHash && type
        ? await supabase.auth.verifyOtp({ token_hash: tokenHash, type: type as EmailOtpType })
        : await supabase.auth.exchangeCodeForSession(code!);

    const user = data.user;

    if (!error && user) {
      if (type === "recovery" || next?.startsWith("/auth")) {
        return NextResponse.redirect(`${targetOrigin}/auth/reset-password`);
      }

      // Si l'inscription attendait la confirmation par email, la ligne
      // `users` n'a pas pu être écrite depuis AuthModal (pas de session à
      // ce moment-là) — on la crée ici avec les métadonnées passées au
      // signUp (nom, téléphone, rôle), une seule fois. On vérifie d'abord
      // qu'elle n'existe pas déjà, pour ne jamais écraser le rôle
      // (vendeur/livreur/admin) d'un compte existant.
      const { data: existingRow } = await supabase
        .from("users")
        .select("id")
        .eq("id", user.id)
        .maybeSingle();

      const isNewRow = !existingRow;

      if (isNewRow) {
        const meta = user.user_metadata || {};
        await supabase.from("users").insert({
          id: user.id,
          phone: meta.phone || user.phone || "",
          full_name: meta.full_name || "Utilisateur",
          role: meta.role || "client",
          account_roles:
            meta.role === "vendeur" ? ["client", "vendeur"] :
            meta.role === "livreur" ? ["client", "livreur"] : ["client"],
        });
      }

      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

      // Cache le rôle pour les prochains appels
      if (userData?.role) {
        setCachedServerRole(user.id, userData.role);
      }

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
          return NextResponse.redirect(`${targetOrigin}/${userData.role}/dashboard`);
        }
        return NextResponse.redirect(`${targetOrigin}/${userData.role}/kyc`);
      }

      const shouldWelcome = isNewRow && userData?.role === "client";
      return NextResponse.redirect(`${targetOrigin}/catalogue${shouldWelcome ? "?welcome=1" : ""}`);
    }
  }

  return NextResponse.redirect(`${targetOrigin}/catalogue?error=Lien invalide ou expiré`);
}
