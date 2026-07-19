import { createClient } from "@/lib/supabase/client";

export interface BoutiquePublique {
  id: string;
  nom: string;
  logo: string | null;
  quartier: string | null;
  commune: string | null;
  isVerified: boolean;
  productCount: number;
}

/**
 * Boutiques à mettre en avant sur la home (section "Explorer les boutiques").
 *
 * Il n'existe pas de note/avis boutique en base pour l'instant (même
 * décision que pour les articles : reviewCount à 0 plutôt qu'une note
 * inventée) — on ne renvoie donc pas de `rating`. Le tri se fait sur le
 * nombre d'articles publiés, qui est une donnée réelle disponible tout de
 * suite, contrairement à un vrai score de popularité (vues, ventes...) qui
 * resterait à construire séparément.
 *
 * Deux allers-retours volontairement simples (articles puis vendeurs)
 * plutôt qu'un embed PostgREST avec count agrégé, dont le format exact
 * n'a pas été vérifié dans ce projet.
 */
export async function getBoutiquesPopulaires(limit = 10): Promise<BoutiquePublique[]> {
  const supabase = createClient();

  const { data: articles, error: articlesError } = await supabase
    .from("articles")
    .select("vendeur_id")
    .eq("statut", "publie")
    .eq("actif", true);

  if (articlesError) throw articlesError;

  const countByVendeur = new Map<string, number>();
  for (const a of articles || []) {
    if (!a.vendeur_id) continue;
    countByVendeur.set(a.vendeur_id, (countByVendeur.get(a.vendeur_id) || 0) + 1);
  }

  const vendeurIds = [...countByVendeur.keys()];
  if (vendeurIds.length === 0) return [];

  const { data: vendeurs, error: vendeursError } = await supabase
    .from("vendeurs")
    .select("id, nom_boutique, quartier, commune, photo_profil_url, statut")
    .in("id", vendeurIds)
    .eq("statut", "valide");

  if (vendeursError) throw vendeursError;

  return (vendeurs || [])
    .map((v: any) => ({
      id: v.id,
      nom: v.nom_boutique || "Boutique Ayiba",
      logo: v.photo_profil_url,
      quartier: v.quartier,
      commune: v.commune,
      isVerified: v.statut === "valide",
      productCount: countByVendeur.get(v.id) || 0,
    }))
    .sort((a: BoutiquePublique, b: BoutiquePublique) => b.productCount - a.productCount)
    .slice(0, limit);
}
