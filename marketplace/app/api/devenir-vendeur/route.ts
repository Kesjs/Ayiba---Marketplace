import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { setCachedServerRole, invalidateUserRoleCache } from "@/lib/supabase/role-cache";

/**
 * Fait passer un compte CLIENT existant au rôle vendeur, en une seule
 * opération atomique côté serveur (service_role) : crée/complète sa ligne
 * vendeurs (statut en_attente) ET met à jour users.account_roles +
 * full_name/avatar. `role` reste le rôle principal historique.
 *
 * Volontairement pas un upsert direct depuis le navigateur comme au signup :
 * la policy RLS vendeurs_insert_own exige déjà role='vendeur' pour pouvoir
 * créer sa ligne vendeurs, ce qui est vrai à l'inscription classique
 * (handle_new_user() fixe le rôle avant même que le wizard ne s'affiche)
 * mais faux ici, puisque le compte est encore 'client' au moment de la
 * soumission. Cette route fait les deux changements ensemble.
 *
 * Le rôle de l'appelant n'est jamais pris dans le body de la requête : il
 * est relu en base à partir de la session (cookies), donc impossible à
 * falsifier depuis le navigateur. Le trigger protect_users_privileged_fields
 * sur public.users laisse passer ce changement de rôle car il est fait avec
 * la clé service_role.
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

  // 1. Qui appelle ? Session lue via les cookies de la requête — impossible
  //    à usurper depuis le client.
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

  // Utiliser le cache pour vérifier le rôle de l'appelant
  const { data: callerProfile } = await cookieClient
    .from("users")
    .select("role, account_roles")
    .eq("id", user.id)
    .single();
  if (!callerProfile || callerProfile.role === "admin" || !(callerProfile.account_roles ?? [callerProfile.role]).includes("client")) {
    return NextResponse.json(
      { error: "Seul un compte client peut ouvrir une boutique via ce parcours." },
      { status: 400 }
    );
  }

  const body = await req.json().catch(() => ({}));
  const {
    nomComplet,
    photoProfilUrl,
    photoCniPath,
    nomBoutique,
    description,
    quartier,
    commune,
    latitude,
    longitude,
    mobileMoneyNetwork,
    mobileMoneyNumber,
  } = body ?? {};

  if (
    !nomComplet ||
    !photoCniPath ||
    !nomBoutique ||
    !description ||
    !quartier ||
    !commune ||
    latitude == null ||
    longitude == null ||
    !mobileMoneyNetwork ||
    !mobileMoneyNumber
  ) {
    return NextResponse.json({ error: "Informations manquantes pour compléter le dossier." }, { status: 400 });
  }

  // 2. Client privilégié pour effectuer les deux écritures (bypass RLS).
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);

  const { error: vendeurError } = await admin.from("vendeurs").upsert({
    id: user.id,
    nom_complet: nomComplet,
    photo_profil_url: photoProfilUrl,
    photo_cni_path: photoCniPath,
    nom_boutique: nomBoutique,
    description,
    quartier,
    commune,
    latitude,
    longitude,
    mobile_money_network: mobileMoneyNetwork,
    mobile_money_number: mobileMoneyNumber,
    statut: "en_attente",
  });
  if (vendeurError) {
    return NextResponse.json({ error: vendeurError.message }, { status: 500 });
  }

  const { error: userError } = await admin
    .from("users")
    .update({
      // Conserver le rôle principal si le compte est déjà livreur : les deux
      // espaces restent alors accessibles grâce à account_roles.
      role: callerProfile.role === "livreur" ? "livreur" : "vendeur",
      account_roles: Array.from(new Set([...(callerProfile.account_roles ?? ["client"]), "client", "vendeur"])),
      full_name: nomComplet,
      ...(photoProfilUrl ? { avatar_url: photoProfilUrl } : {}),
    })
    .eq("id", user.id);
  if (userError) {
    return NextResponse.json({ error: userError.message }, { status: 500 });
  }

  // Invalidate cache et mettre à jour avec le nouveau rôle
  invalidateUserRoleCache(user.id);
  setCachedServerRole(user.id, callerProfile.role === "livreur" ? "livreur" : "vendeur");

  return NextResponse.json({ success: true });
}
