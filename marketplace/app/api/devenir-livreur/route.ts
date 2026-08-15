import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { invalidateUserRoleCache, setCachedServerRole } from "@/lib/supabase/role-cache";

/** Ajoute le rôle livreur à un compte client/vendeur sans retirer ses rôles. */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète." }, { status: 500 });
  }

  const cookieClient = createServerClient(supabaseUrl, anonKey, {
    cookies: { getAll: () => req.cookies.getAll(), setAll: () => {} },
  });
  const { data: { user } } = await cookieClient.auth.getUser();
  if (!user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const { data: profile } = await cookieClient
    .from("users")
    .select("role, account_roles")
    .eq("id", user.id)
    .single();
  const currentRoles = profile?.account_roles ?? [profile?.role ?? "client"];
  if (!profile || profile.role === "admin" || !currentRoles.includes("client")) {
    return NextResponse.json({ error: "Ce compte ne peut pas devenir livreur via ce parcours." }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const required = [
    "nomComplet", "photoCniPath", "typeVehicule", "quartier", "commune",
    "mobileMoneyNetwork", "mobileMoneyNumber",
  ];
  if (required.some((field) => !body?.[field]) || body.latitude == null || body.longitude == null) {
    return NextResponse.json({ error: "Informations manquantes pour compléter le dossier." }, { status: 400 });
  }
  if (!['motocyclette', 'velo', 'tricycle', 'a_pied'].includes(body.typeVehicule)) {
    return NextResponse.json({ error: "Type de véhicule invalide." }, { status: 400 });
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error: livreurError } = await admin.from("livreurs").upsert({
    id: user.id,
    nom_complet: body.nomComplet,
    photo_profil_url: body.photoProfilUrl ?? null,
    photo_cni_path: body.photoCniPath,
    type_vehicule: body.typeVehicule,
    photo_vehicule_url: body.photoVehiculeUrl ?? null,
    plaque_immatriculation: body.plaqueImmatriculation ?? null,
    quartier: body.quartier,
    commune: body.commune,
    latitude: body.latitude,
    longitude: body.longitude,
    mobile_money_network: body.mobileMoneyNetwork,
    mobile_money_number: body.mobileMoneyNumber,
    statut_verification: "en_attente",
  });
  if (livreurError) return NextResponse.json({ error: livreurError.message }, { status: 500 });

  // Pour compatibilité, seul un client pur prend "livreur" comme rôle
  // principal. Un vendeur conserve son rôle principal historique.
  const nextRole = profile.role === "vendeur" ? "vendeur" : "livreur";
  const { error: userError } = await admin.from("users").update({
    role: nextRole,
    account_roles: Array.from(new Set([...currentRoles, "client", "livreur"])),
    full_name: body.nomComplet,
    ...(body.photoProfilUrl ? { avatar_url: body.photoProfilUrl } : {}),
  }).eq("id", user.id);
  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 });

  invalidateUserRoleCache(user.id);
  setCachedServerRole(user.id, nextRole);
  return NextResponse.json({ success: true });
}
