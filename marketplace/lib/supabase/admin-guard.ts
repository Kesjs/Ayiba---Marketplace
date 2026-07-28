import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Vérifie, côté serveur, que l'appelant d'une route API admin est bien
 * authentifié ET a role = 'admin' dans public.users, puis renvoie un client
 * service_role (qui bypass RLS) pour effectuer l'opération privilégiée.
 *
 * À utiliser dans toute route sous /api/admin/* qui modifie des données
 * sensibles (role, statut, KYC...). Ne fait JAMAIS confiance à un rôle
 * envoyé par le client dans le body de la requête : le rôle de l'appelant
 * est toujours relu en base à partir de sa session (cookies), donc
 * impossible à falsifier depuis le navigateur.
 *
 * Usage :
 *   const guard = await requireAdmin(req);
 *   if ("error" in guard) return guard.error;
 *   const { adminId, admin } = guard;
 */
export async function requireAdmin(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return {
      error: NextResponse.json(
        { error: "Configuration serveur incomplète (SUPABASE_SERVICE_ROLE_KEY manquante)" },
        { status: 500 }
      ),
    } as const;
  }

  // 1. Qui appelle ? On lit la session via les cookies de la requête —
  //    impossible à usurper depuis le client.
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
    return { error: NextResponse.json({ error: "Non authentifié" }, { status: 401 }) } as const;
  }

  const { data: callerProfile } = await cookieClient
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single();

  if (callerProfile?.role !== "admin") {
    return { error: NextResponse.json({ error: "Réservé aux administrateurs" }, { status: 403 }) } as const;
  }

  // 2. Client privilégié pour effectuer l'opération (bypass RLS).
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);

  return { adminId: user.id, admin } as const;
}
