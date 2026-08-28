import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Sauvegarde progressive (best-effort) du brouillon KYC vendeur, appelée à
 * chaque étape franchie et à chaque photo/document ajouté dans
 * VendeurKycWizard — pas seulement à la soumission finale.
 *
 * Avant ça, tout restait en localStorage jusqu'au clic final sur "Soumettre
 * pour vérification" : un vendeur qui remplissait le formulaire puis
 * fermait l'app (ou ne comprenait pas qu'il fallait valider une deuxième
 * fois après l'écran récap) perdait tout, et rien n'apparaissait en base —
 * ni pour lui au prochain retour, ni pour l'admin qui ne voyait qu'un
 * compte "Sans nom" sans aucune trace de progression.
 *
 * Toujours via service_role (comme /api/devenir-vendeur) plutôt qu'un
 * upsert direct depuis le navigateur : ça marche identiquement que le
 * compte soit déjà 'vendeur' (ligne vendeurs déjà créée à l'inscription) ou
 * encore 'client' en train de devenir vendeur (aucune ligne vendeurs
 * n'existe encore, et la policy RLS d'insert exige role='vendeur', donc un
 * upsert direct échouerait pour ce second cas).
 *
 * Ne touche jamais `statut`, `raison_rejet`, `reviewed_by`/`reviewed_at` :
 * ce brouillon ne vaut pas soumission. Le passage à statut='en_attente'
 * reste décidé uniquement par VendeurKycWizard.handleSubmit (upsert direct)
 * ou /api/devenir-vendeur (parcours client → vendeur), jamais ici. Ne
 * touche pas non plus users.role/account_roles : un client qui commence ce
 * KYC sans le terminer doit rester un simple client tant qu'il n'a pas
 * explicitement soumis.
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
    nomBoutique,
    description,
    quartier,
    commune,
    latitude,
    longitude,
    mobileMoneyNetwork,
    mobileMoneyNumber,
    photoProfilUrl,
    photoCniPath,
  } = body ?? {};

  // Brouillon = tout est optionnel, on enregistre juste ce qui existe déjà
  // à ce stade du wizard. Les champs non fournis sont explicitement omis du
  // payload (et non envoyés comme null) pour ne jamais écraser une valeur
  // déjà enregistrée lors d'une étape précédente par autre chose que ce que
  // le vendeur a réellement effacé.
  const fields: Record<string, unknown> = { id: user.id };
  if (nomComplet !== undefined) fields.nom_complet = nomComplet || null;
  if (nomBoutique !== undefined) fields.nom_boutique = nomBoutique || null;
  if (description !== undefined) fields.description = description || null;
  if (quartier !== undefined) fields.quartier = quartier || null;
  if (commune !== undefined) fields.commune = commune || null;
  if (latitude !== undefined) fields.latitude = latitude;
  if (longitude !== undefined) fields.longitude = longitude;
  if (mobileMoneyNetwork !== undefined) fields.mobile_money_network = mobileMoneyNetwork || null;
  if (mobileMoneyNumber !== undefined) fields.mobile_money_number = mobileMoneyNumber || null;
  if (photoProfilUrl !== undefined) fields.photo_profil_url = photoProfilUrl || null;
  if (photoCniPath !== undefined) fields.photo_cni_path = photoCniPath || null;

  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { error } = await admin.from("vendeurs").upsert(fields, { onConflict: "id" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
