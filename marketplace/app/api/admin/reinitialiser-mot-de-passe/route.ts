import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Génère un mot de passe temporaire pour un utilisateur et l'applique directement
 * sur son compte auth (pas de flux self-service de réinitialisation par email pour
 * l'instant côté produit). Le mot de passe est renvoyé une seule fois à l'admin, à
 * communiquer manuellement à l'utilisateur (WhatsApp/téléphone). Il n'est jamais stocké.
 */
export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "userId requis" }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquante)" },
      { status: 500 }
    );
  }

  // 1. Vérifier que l'appelant est un admin authentifié
  const cookieClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  });
  const {
    data: { user },
  } = await cookieClient.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const { data: callerProfile } = await cookieClient.from("users").select("role").eq("id", user.id).single();
  if (callerProfile?.role !== "admin") {
    return NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 });
  }

  // 2. Générer un mot de passe temporaire lisible (facile à dicter par téléphone)
  const tempPassword = crypto.randomBytes(6).toString("base64url").slice(0, 8);

  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.auth.admin.updateUserById(userId, { password: tempPassword });
  if (error) {
    return NextResponse.json({ error: `Échec de la réinitialisation : ${error.message}` }, { status: 500 });
  }

  // 3. Invalider les sessions existantes pour forcer une reconnexion avec le nouveau mot de passe
  await admin.auth.admin.signOut(userId, "global");

  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    action_type: "mot_de_passe_reinitialise",
    cible_type: "user",
    cible_id: userId,
  });

  return NextResponse.json({ success: true, tempPassword });
}
