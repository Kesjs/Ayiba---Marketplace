import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient as createServiceClient } from "@supabase/supabase-js";

/**
 * Génère une URL signée temporaire (5 min) pour afficher un document KYC
 * (photo de pièce d'identité) stocké dans le bucket privé "kyc-documents".
 *
 * Le bucket est privé par design (RLS : chaque vendeur ne peut lire que son
 * propre dossier). Cette route permet à un admin authentifié de consulter
 * ponctuellement le document sans changer les policies RLS existantes.
 *
 * Nécessite SUPABASE_SERVICE_ROLE_KEY côté serveur (jamais exposée au client).
 */
export async function POST(req: NextRequest) {
  const { path } = await req.json();
  if (!path) {
    return NextResponse.json({ error: "path requis" }, { status: 400 });
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

  // 2. Générer l'URL signée avec le client service_role (bypass RLS storage)
  const admin = createServiceClient(supabaseUrl, serviceRoleKey);
  const { data, error } = await admin.storage.from("kyc-documents").createSignedUrl(path, 300);

  if (error || !data) {
    return NextResponse.json({ error: error?.message || "Document introuvable" }, { status: 404 });
  }

  // Journal d'audit : consultation d'une pièce d'identité
  await admin.from("admin_actions_log").insert({
    admin_id: user.id,
    action_type: "consultation_document_kyc",
    cible_type: "vendeur",
    cible_id: path.split("/")[0] || null,
  });

  return NextResponse.json({ url: data.signedUrl });
}
