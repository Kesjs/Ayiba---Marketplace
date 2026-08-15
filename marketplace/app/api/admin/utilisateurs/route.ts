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
    // Passer un compte en "vendeur" par ce raccourci contourne complètement
    // le flux KYC (wizard, statut en_attente, modération) : on se retrouvait
    // avec des comptes vendeurs "fantômes" (statut=null, pas de boutique, pas
    // de mobile money) qui pouvaient quand même publier des articles. Ce
    // chemin est désormais bloqué : un compte doit passer par
    // /devenir-vendeur + le wizard KYC pour obtenir le rôle vendeur.
    if (role === "vendeur") {
      return NextResponse.json(
        { error: "Le rôle vendeur ne peut plus être attribué depuis l'admin. Le compte doit passer par le parcours KYC (/devenir-vendeur)." },
        { status: 400 }
      );
    }
    // L'outil admin modifie le rôle principal : garder account_roles cohérent
    // évite qu'un livreur attribué par l'admin soit ensuite bloqué par le
    // proxy multi-compte. L'attribution vendeur reste volontairement
    // interdite ci-dessus car elle exige un dossier KYC.
    const account_roles =
      role === "admin" ? ["admin"] :
      role === "livreur" ? ["client", "livreur"] : ["client"];
    const { error } = await admin.from("users").update({ role, account_roles }).eq("id", userId);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

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
