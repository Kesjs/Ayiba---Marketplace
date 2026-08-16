import { createClient } from "@/lib/supabase/client";
import { fetchVendeurStats } from "@/lib/catalogue";

export interface BoutiquePublique {
  id: string;
  nom: string;
  logo: string | null;
  quartier: string | null;
  commune: string | null;
  isVerified: boolean;
  productCount: number;
  description: string | null;
  /** Note moyenne calculée à partir des avis sur les articles publiés du
   *  vendeur (0 si aucun avis) — voir fetchVendeurStats, qui contourne la
   *  colonne users.note_moyenne non lisible côté client pour un autre
   *  utilisateur (RLS "Users can view own data"). */
  note: number;
  avisCount: number;
}

/**
 * Boutiques à mettre en avant sur la home (section "Explorer les boutiques").
 *
 * Deux allers-retours volontairement simples (articles puis vendeurs)
 * plutôt qu'un embed PostgREST avec count agrégé, dont le format exact
 * n'a pas été vérifié dans ce projet. La note (voir `note`/`avisCount`) est
 * calculée à partir des avis articles, pas d'un embed non plus, pour rester
 * sur ce même parti pris.
 */
export async function getBoutiquesPopulaires(limit = 10): Promise<BoutiquePublique[]> {
  const supabase = createClient();

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("id, vendeur_id")
    .eq("statut", "publie")
    .eq("actif", true);

  if (articlesError) throw articlesError;

  const countByVendeur = new Map<string, number>();
  const vendeurByArticle = new Map<string, string>();
  for (const a of articles || []) {
    if (!a.vendeur_id) continue;
    countByVendeur.set(a.vendeur_id, (countByVendeur.get(a.vendeur_id) || 0) + 1);
    vendeurByArticle.set(a.id, a.vendeur_id);
  }

  const vendeurIds = [...countByVendeur.keys()];
  if (vendeurIds.length === 0) return [];

  const articleIds = [...vendeurByArticle.keys()];
  const notesByVendeur = new Map<string, { sum: number; count: number }>();
  if (articleIds.length > 0) {
    const { data: avis, error: avisError } = await supabase
      .from("avis")
      .select("article_id, note")
      .in("article_id", articleIds);
    if (avisError) throw avisError;
    (avis || []).forEach((a: any) => {
      const vendeurId = vendeurByArticle.get(a.article_id);
      if (!vendeurId) return;
      const cur = notesByVendeur.get(vendeurId) || { sum: 0, count: 0 };
      cur.sum += a.note;
      cur.count += 1;
      notesByVendeur.set(vendeurId, cur);
    });
  }

  const { data: vendeurs, error: vendeursError } = await supabase
    .from("vendeurs")
    .select("id, nom_boutique, description, quartier, commune, photo_profil_url, statut")
    .in("id", vendeurIds)
    .eq("statut", "valide");

  if (vendeursError) throw vendeursError;

  return (vendeurs || [])
    .map((v: any) => {
      const notes = notesByVendeur.get(v.id);
      return {
        id: v.id,
        nom: v.nom_boutique || "Boutique Ayiba",
        logo: v.photo_profil_url,
        description: v.description || null,
        quartier: v.quartier,
        commune: v.commune,
        isVerified: v.statut === "valide",
        productCount: countByVendeur.get(v.id) || 0,
        note: notes && notes.count > 0 ? Math.round((notes.sum / notes.count) * 10) / 10 : 0,
        avisCount: notes?.count || 0,
      };
    })
    .sort((a: BoutiquePublique, b: BoutiquePublique) => b.productCount - a.productCount)
    .slice(0, limit);
}

/**
 * Boutique unique pour la page détail (/boutiques/[id]). Réutilise
 * fetchVendeurStats (déjà utilisé sur /produits/[id]) pour la note et le
 * nombre de produits, plutôt que de dupliquer ce calcul. Retourne null si la
 * boutique n'existe pas ou n'est pas validée (cohérent avec la RLS : un
 * vendeur non "valide" n'a pas d'articles publics de toute façon).
 */
export async function getBoutiqueParId(id: string): Promise<BoutiquePublique | null> {
  const supabase = createClient();

  const { data: vendeur, error: vendeurError } = await supabase
    .from("vendeurs")
    .select("id, nom_boutique, description, quartier, commune, photo_profil_url, statut")
    .eq("id", id)
    .eq("statut", "valide")
    .maybeSingle();

  if (vendeurError) throw vendeurError;
  if (!vendeur) return null;

  const stats = await fetchVendeurStats(supabase, id);

  return {
    id: vendeur.id,
    nom: vendeur.nom_boutique || "Boutique Ayiba",
    logo: vendeur.photo_profil_url,
    description: vendeur.description || null,
    quartier: vendeur.quartier,
    commune: vendeur.commune,
    isVerified: vendeur.statut === "valide",
    productCount: stats.productCount,
    note: stats.rating,
    avisCount: stats.reviewCount,
  };
}

