import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Force la déconnexion d'un utilisateur sur tous ses appareils (invalide toutes ses
 * sessions actives). Nécessite SUPABASE_SERVICE_ROLE_KEY côté serveur.
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

  // 2. Invalider toutes les sessions de l'utilisateur ciblé
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.auth.admin.signOut(userId, "global");
  if (error) {
    return NextResponse.json({ error: `Échec de la déconnexion : ${error.message}` }, { status: 500 });
  }

  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    action_type: "deconnexion_forcee",
    cible_type: "user",
    cible_id: userId,
  });

  return NextResponse.json({ success: true });
}
