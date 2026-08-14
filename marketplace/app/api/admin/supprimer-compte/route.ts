import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Traite une demande de suppression de compte (RGPD-like) :
 * 1. Vérifie que l'appelant est bien un admin authentifié (via ses cookies de session)
 * 2. Bannit le compte auth (empêche toute connexion future) sans casser l'intégrité
 *    référentielle (commandes, paiements, avis restent en base pour l'historique
 *    financier/légal — l'anonymisation remplace la suppression physique)
 * 3. Anonymise les données personnelles dans public.users
 * 4. Marque la demande comme traitée
 *
 * Nécessite la variable d'environnement serveur SUPABASE_SERVICE_ROLE_KEY
 * (jamais exposée au client — à ajouter dans Vercel > Settings > Environment Variables).
 */
export async function POST(req: NextRequest) {
  const { userId, demandeId } = await req.json();
  if (!userId || !demandeId) {
    return NextResponse.json({ error: "userId et demandeId requis" }, { status: 400 });
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

  // 2. Client service_role pour les opérations privilégiées
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);

  // Bannir le compte ~100 ans = suppression fonctionnelle sans violer les FK
  const { error: banError } = await admin.auth.admin.updateUserById(userId, {
    ban_duration: "876000h",
  });
  if (banError) {
    return NextResponse.json({ error: `Échec du bannissement : ${banError.message}` }, { status: 500 });
  }

  // 3. Anonymiser les données personnelles
  const { error: anonError } = await admin
    .from("users")
    .update({
      full_name: "Compte supprimé",
      phone: null,
      avatar_url: null,
      statut: "supprime",
    })
    .eq("id", userId);
  if (anonError) {
    return NextResponse.json({ error: `Échec de l'anonymisation : ${anonError.message}` }, { status: 500 });
  }

  // 4. Marquer la demande comme traitée + logger l'action admin
  await admin.from("demandes_suppression").update({ statut: "traitee" }).eq("id", demandeId);
  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    action_type: "compte_supprime",
    cible_type: "user",
    cible_id: userId,
  });

  return NextResponse.json({ success: true });
}
