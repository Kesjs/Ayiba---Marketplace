import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Équivalent de /api/vendeur-kyc-draft pour le parcours livreur : sauvegarde
 * best-effort à chaque étape franchie et à chaque photo/document ajouté
 * dans LivreurKycWizard, au lieu d'attendre exclusivement le clic final sur
 * "Soumettre pour vérification" (voir /api/devenir-livreur, inchangée, qui
 * reste le seul endroit où statut_verification passe à 'en_attente').
 *
 * Toujours via service_role, jamais d'upsert direct côté client : contrairement
 * au vendeur (qui a un chemin d'upsert direct pour les comptes déjà
 * role='vendeur'), le parcours livreur passe déjà uniquement par des routes
 * serveur (/api/devenir-livreur) — on garde cette convention ici aussi, ce
 * qui a l'avantage de fonctionner identiquement qu'une ligne `livreurs`
 * existe déjà ou pas encore (l'upsert la crée si besoin).
 *
 * Ne touche jamais statut_verification / raison_rejet / reviewed_by /
 * reviewed_at, ni users.role/account_roles : ce brouillon ne vaut pas
 * soumission.
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

  const { data: callerProfile } = await cookieClient
    .from("users")
    .select("role, account_roles")
    .eq("id", user.id)
    .single();

  if (!callerProfile || callerProfile.role === "admin") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  const {
    nomComplet,
    typeVehicule,
    plaqueImmatriculation,
    quartier,
    commune,
    latitude,
    longitude,
    mobileMoneyNetwork,
    mobileMoneyNumber,
    photoProfilUrl,
    photoCniPath,
    photoVehiculeUrl,
  } = body ?? {};

  if (typeVehicule !== undefined && typeVehicule !== null) {
    if (!["motocyclette", "velo", "tricycle", "a_pied"].includes(typeVehicule)) {
      return NextResponse.json({ error: "Type de véhicule invalide." }, { status: 400 });
    }
  }

  // Comme côté vendeur : champs omis du payload = jamais envoyés dans
  // l'upsert (pas de null qui écraserait une valeur déjà enregistrée à une
  // étape précédente).
  const fields: Record<string, unknown> = { id: user.id };
  if (nomComplet !== undefined) fields.nom_complet = nomComplet || null;
  if (typeVehicule !== undefined) fields.type_vehicule = typeVehicule || null;
  if (plaqueImmatriculation !== undefined) fields.plaque_immatriculation = plaqueImmatriculation || null;
  if (quartier !== undefined) fields.quartier = quartier || null;
  if (commune !== undefined) fields.commune = commune || null;
  if (latitude !== undefined) fields.latitude = latitude;
  if (longitude !== undefined) fields.longitude = longitude;
  if (mobileMoneyNetwork !== undefined) fields.mobile_money_network = mobileMoneyNetwork || null;
  if (mobileMoneyNumber !== undefined) fields.mobile_money_number = mobileMoneyNumber || null;
  if (photoProfilUrl !== undefined) fields.photo_profil_url = photoProfilUrl || null;
  if (photoCniPath !== undefined) fields.photo_cni_path = photoCniPath || null;
  if (photoVehiculeUrl !== undefined) fields.photo_vehicule_url = photoVehiculeUrl || null;

  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.from("livreurs").upsert(fields, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
