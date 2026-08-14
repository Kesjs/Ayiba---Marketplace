import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Invalide toutes les sessions actives de l'utilisateur courant SAUF celle
 * en cours (scope "others"), à appeler juste après un changement de mot de
 * passe réussi (reset ou depuis les paramètres). Objectif : si le compte a
 * été compromis, changer le mot de passe déconnecte immédiatement
 * l'attaquant partout ailleurs, comme chez Google/Stripe.
 *
 * Différence avec /api/admin/forcer-deconnexion : cette route est appelée
 * par l'utilisateur lui-même (pas un admin) et cible ses propres sessions
 * via son propre access_token, pas via un userId passé en paramètre.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json(
      { error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquante)" },
      { status: 500 }
    );
  }

  // 1. Récupérer la session de l'appelant depuis les cookies (pas de body
  // attendu : on ne fait jamais confiance à un userId fourni par le client).
  const cookieClient = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  });

  const {
    data: { session },
  } = await cookieClient.auth.getSession();

  if (!session?.access_token) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  // 2. Invalider toutes les AUTRES sessions liées à ce compte (la session
  // courante, identifiée par ce access_token, reste active).
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.auth.admin.signOut(session.access_token, "others");

  if (error) {
    return NextResponse.json(
      { error: `Échec de la déconnexion des autres sessions : ${error.message}` },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true });
}
