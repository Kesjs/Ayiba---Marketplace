import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";

/**
 * Validation / refus du KYC vendeur ou livreur. Même logique que
 * /api/admin/utilisateurs : le rôle admin de l'appelant est revérifié côté
 * serveur et l'écriture passe par service_role, plutôt que de reposer sur
 * les policies RLS de la table vendeurs/livreurs appelées depuis le
 * navigateur avec la clé anonyme.
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { adminId, admin } = guard;

  const { type, action, id, raison } = await req.json();
  if (!type || !action || !id) {
    return NextResponse.json({ error: "type, action et id requis" }, { status: 400 });
  }
  if (type !== "vendeur" && type !== "livreur") {
    return NextResponse.json({ error: "type invalide" }, { status: 400 });
  }
  if (action !== "valider" && action !== "rejeter") {
    return NextResponse.json({ error: "action invalide" }, { status: 400 });
  }
  if (action === "rejeter" && !raison) {
    return NextResponse.json({ error: "raison requise pour un refus" }, { status: 400 });
  }

  const table = type === "vendeur" ? "vendeurs" : "livreurs";
  const colonneStatut = type === "vendeur" ? "statut" : "statut_verification";

  const valeurs =
    action === "valider"
      ? { [colonneStatut]: "valide", raison_rejet: null, reviewed_at: new Date().toISOString() }
      : { [colonneStatut]: "refuse", raison_rejet: raison, reviewed_at: new Date().toISOString() };

  const { error } = await admin.from(table).update(valeurs).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_actions_log").insert({
    admin_id: adminId,
    action_type: action === "valider" ? "kyc_valide" : "kyc_refuse",
    cible_type: type,
    cible_id: id,
    details: action === "rejeter" ? { raison } : null,
  });

  return NextResponse.json({ success: true });
}
