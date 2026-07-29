import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/supabase/admin-guard";
import { PROCHAINS_STATUTS, type StatutCommande } from "@/lib/constants/commandes";

/**
 * Changement manuel du statut d'une commande par un admin (ex: débloquer un
 * litige "en_attente_verification", forcer une annulation/remboursement).
 * Même pattern que /api/admin/moderation-kyc : rôle revérifié côté serveur,
 * écriture en service_role (RLS de la table commandes n'autorise pas un
 * update de statut arbitraire depuis le client).
 *
 * On ne fait confiance qu'à PROCHAINS_STATUTS (lib/constants/commandes.ts)
 * pour les transitions valides, même côté admin — évite de mettre une
 * commande dans un état incohérent (ex: livree -> en_attente).
 */
export async function POST(req: NextRequest) {
  const guard = await requireAdmin(req);
  if ("error" in guard) return guard.error;
  const { adminId, admin } = guard;

  const { id, statut } = (await req.json()) as { id?: string; statut?: StatutCommande };
  if (!id || !statut) {
    return NextResponse.json({ error: "id et statut requis" }, { status: 400 });
  }

  const { data: commande, error: fetchError } = await admin
    .from("commandes")
    .select("id, statut")
    .eq("id", id)
    .single();

  if (fetchError || !commande) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const statutActuel = commande.statut as StatutCommande;
  const transitionsValides = PROCHAINS_STATUTS[statutActuel] || [];
  if (!transitionsValides.includes(statut)) {
    return NextResponse.json(
      { error: `Transition invalide : ${statutActuel} → ${statut}` },
      { status: 400 }
    );
  }

  const { error } = await admin.from("commandes").update({ statut }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await admin.from("admin_actions_log").insert({
    admin_id: adminId,
    action_type: "commande_changement_statut",
    cible_type: "commande",
    cible_id: id,
    details: { statut_avant: statutActuel, statut_apres: statut },
  });

  return NextResponse.json({ success: true });
}
