import { createClient } from "@/lib/supabase/client";

export interface TemoignagePublic {
  id: string;
  note: number;
  commentaire: string;
  nomAffiche: string;
  avatarUrl: string | null;
}

/**
 * Vrais avis clients à afficher sur la home, section "Témoignages".
 *
 * Source : la table `avis` (avis laissés par un client sur un article ou
 * un livreur après une commande — cf. LaisserAvisCard). Aucune donnée
 * inventée : si moins de 3 avis remplissent les critères, l'appelant doit
 * afficher un état honnête ("Soyez parmi les premiers...") plutôt que
 * forcer l'affichage de la grille.
 *
 * Filtre volontairement simple, sans modération manuelle :
 * - note >= 4 (on ne met pas en avant une note basse sur la home)
 * - commentaire renseigné et assez long pour être lisible (>= 15
 *   caractères), pour éviter les avis du type "bien" ou "ok"
 * Pas de champ de consentement dédié dans `avis` aujourd'hui : le
 * commentaire est déjà visible publiquement sur la fiche produit ou le
 * profil du livreur concerné, donc le réutiliser ici n'expose rien de
 * plus. Le nom est tronqué en "Prénom N." (jamais le nom complet) pour
 * rester cohérent avec ce que la home affichait déjà avant.
 */
export async function getTemoignagesPublics(limit = 6): Promise<TemoignagePublic[]> {
  const supabase = createClient();

  const { data: avisRows, error } = await supabase
    .from("avis")
    .select("id, note, commentaire, utilisateur_id, created_at")
    .gte("note", 4)
    .not("commentaire", "is", null)
    .order("created_at", { ascending: false })
    .limit(50); // on sur-fetch un peu puis on filtre la longueur en mémoire, plus simple qu'un filtre SQL sur length()

  if (error) throw error;
  if (!avisRows || avisRows.length === 0) return [];

  const avisRetenus = avisRows
    .filter((a) => (a.commentaire?.trim().length ?? 0) >= 15)
    .slice(0, limit);

  if (avisRetenus.length === 0) return [];

  const userIds = [...new Set(avisRetenus.map((a) => a.utilisateur_id))];
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, full_name, avatar_url")
    .in("id", userIds);

  if (usersError) throw usersError;

  const userMap = new Map((users || []).map((u) => [u.id, u]));

  return avisRetenus.map((a) => {
    const user = userMap.get(a.utilisateur_id);
    return {
      id: a.id,
      note: a.note,
      commentaire: a.commentaire as string,
      nomAffiche: formatNomAffiche(user?.full_name),
      avatarUrl: user?.avatar_url ?? null,
    };
  });
}

function formatNomAffiche(fullName: string | null | undefined): string {
  if (!fullName?.trim()) return "Client Ayiba";
  const parts = fullName.trim().split(/\s+/);
  const prenom = parts[0];
  const initiale = parts.length > 1 ? `${parts[parts.length - 1][0]}.` : "";
  return initiale ? `${prenom} ${initiale}` : prenom;
}
