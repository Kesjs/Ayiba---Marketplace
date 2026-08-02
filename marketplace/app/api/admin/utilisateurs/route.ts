import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";

const ROLES_VALIDES = ["client", "vendeur", "livreur", "admin"];

/**
 * Actions de modération sur un compte utilisateur : suspendre, réactiver,
 * changer de rôle. Avant ce fichier, ces actions étaient faites directement
 * depuis le navigateur admin avec la clé anonyme (supabase.from("users").update(...)),
 * ce qui reposait entièrement sur les policies RLS pour bloquer un appel
 * malveillant. Ici, le rôle admin de l'appelant est revérifié côté serveur
 * (voir requireAdmin) et l'écriture se fait avec la clé service_role.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { adminId, admin } = guard;

  const { action, userId, role } = await req.json();
  if (!action || !userId) {
    return NextResponse.json({ error: "action et userId requis" }, { status: 400 });
  }

  if (action === "suspendre") {
    const { error } = await admin.from("users").update({ statut: "suspendu" }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("admin_actions_log").insert({
      admin_id: adminId,
      action_type: "utilisateur_suspendu",
      cible_type: "user",
      cible_id: userId,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "reactiver") {
    const { error } = await admin.from("users").update({ statut: "actif" }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    await admin.from("admin_actions_log").insert({
      admin_id: adminId,
      action_type: "utilisateur_reactive",
      cible_type: "user",
      cible_id: userId,
    });
    return NextResponse.json({ success: true });
  }

  if (action === "changer-role") {
    if (!role || !ROLES_VALIDES.includes(role)) {
      return NextResponse.json({ error: "role invalide" }, { status: 400 });
    }
    // Empêche un admin de se rétrograder lui-même par erreur/malveillance
    // via cette route et de se retrouver bloqué hors de l'admin.
    if (userId === adminId && role !== "admin") {
      return NextResponse.json({ error: "Tu ne peux pas changer ton propre rôle." }, { status: 400 });
    }
    const { error } = await admin.from("users").update({ role }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Une inscription normale en tant que vendeur crée automatiquement la
    // ligne vendeurs (trigger handle_new_user, statut = null tant que le KYC
    // n'est pas soumis). Ce chemin admin contournait ce trigger et laissait
    // le compte dans un état incohérent (role='vendeur' sans ligne vendeurs)
    // — on répare ça ici, sans écraser une ligne déjà existante.
    // (Le cas livreur n'a pas cette réparation : livreurs.nom_complet est
    // NOT NULL, on n'a pas cette info au moment du changement de rôle — et
    // LivreurKycWizard tolère déjà une ligne totalement absente via
    // maybeSingle()+upsert, donc ce n'est pas un problème pratique.)
    if (role === "vendeur") {
      await admin.from("vendeurs").upsert({ id: userId, statut: null }, { onConflict: "id", ignoreDuplicates: true });
    }

    await admin.from("admin_actions_log").insert({
      admin_id: adminId,
      action_type: "role_modifie",
      cible_type: "user",
      cible_id: userId,
      details: { nouveau_role: role },
    });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "action inconnue" }, { status: 400 });
}
