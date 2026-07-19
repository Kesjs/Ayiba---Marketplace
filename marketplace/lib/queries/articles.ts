import { createClient } from "@/lib/supabase/client";

export interface ArticlePublic {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  prix_promo: number | null;
  stock: number;
  vendeur_id: string;
  photos: string[];
  categorie: { id: string; nom: string; slug: string } | null;
  vendeur: { nom_boutique: string | null; quartier: string | null; commune: string | null } | null;
}

/**
 * Articles publics visibles au catalogue. La RLS de la table `articles`
 * (policy "Articles publiés visibles par tous") ne renvoie déjà que les
 * articles au statut 'publie' d'un vendeur au statut 'valide' — le filtre
 * explicite ci-dessous est redondant avec la RLS mais garde l'intention
 * lisible côté front et évite de dépendre uniquement de la policy.
 */
export async function getArticlesPublics(options?: { categorieSlug?: string; recherche?: string }) {
  const supabase = createClient();

  let query = supabase
    .from("articles")
    .select(
      `id, nom, description, prix, prix_promo, stock, vendeur_id,
       article_images ( image_url, ordre ),
       categories ( id, nom, slug ),
       vendeurs ( nom_boutique, quartier, commune )`
    )
    .eq("statut", "publie")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  if (options?.categorieSlug) {
    // Filtre appliqué après coup (voir plus bas) car la relation categories
    // est imbriquée ; on garde la requête simple plutôt que d'enchaîner un
    // second aller-retour uniquement pour résoudre le slug en id.
  }

  if (options?.recherche) {
    query = query.ilike("nom", `%${options.recherche}%`);
  }

  const { data, error } = await query;
  if (error) throw error;

  const articles: ArticlePublic[] = (data || []).map((a: any) => {
    const images = (a.article_images || []).slice().sort(
      (x: any, y: any) => (x.ordre ?? 0) - (y.ordre ?? 0)
    );
    const cat = Array.isArray(a.categories) ? a.categories[0] : a.categories;
    const vendeur = Array.isArray(a.vendeurs) ? a.vendeurs[0] : a.vendeurs;
    return {
      id: a.id,
      nom: a.nom,
      description: a.description,
      prix: a.prix,
      prix_promo: a.prix_promo,
      stock: a.stock,
      vendeur_id: a.vendeur_id,
      photos: images.map((img: any) => img.image_url),
      categorie: cat ? { id: cat.id, nom: cat.nom, slug: cat.slug } : null,
      vendeur: vendeur ?? null,
    };
  });

  return options?.categorieSlug
    ? articles.filter((a) => a.categorie?.slug === options.categorieSlug)
    : articles;
}

export async function getCategoriesActives() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, nom, slug, icone, couleur")
    .eq("active", true)
    .order("ordre", { ascending: true });
  if (error) throw error;
  return data || [];
}
