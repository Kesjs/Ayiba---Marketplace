import { unstable_cache } from "next/cache";
import { createPublicServerClient } from "@/lib/supabase/public-server";

const SEVEN_DAYS_AGO = () => new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
const THIRTY_DAYS_AGO = () => new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

export interface BentoTopCategory {
  nom: string;
  slug: string;
  nbNouveauxArticles: number;
  nbVendeurs: number;
}

export interface BentoNewSeller {
  nomBoutique: string;
  slugOuId: string;
  nbArticles: number;
}

export interface BentoTopProduct {
  nom: string;
  id: string;
  image: string | null;
  nbFavoris: number;
}

export interface BentoCategoryCard {
  nom: string;
  slug: string;
  image: string | null;
  nbArticles: number;
}

export interface BentoData {
  topCategory: BentoTopCategory | null;
  newSeller: BentoNewSeller | null;
  topProduct: BentoTopProduct | null;
  categories: BentoCategoryCard[];
}

/**
 * Calcule les 4 blocs du bento à partir de données réelles. Enveloppé dans
 * unstable_cache (voir export plus bas) pour ne pas recalculer à chaque
 * visite — cache partagé entre tous les visiteurs, revalidé toutes les
 * heures (voir tag "bento-home" et route /api/bento).
 */
async function computeBentoData(): Promise<BentoData> {
  const supabase = createPublicServerClient();
  if (!supabase) {
    return { topCategory: null, newSeller: null, topProduct: null, categories: [] };
  }

  // --- 1. Grande carte : catégorie la plus active sur 7 jours ---
  const { data: recentArticles } = await supabase
    .from("articles")
    .select("categorie_id, vendeur_id, categories(nom, slug)")
    .eq("statut", "publie")
    .eq("actif", true)
    .gte("created_at", SEVEN_DAYS_AGO());

  let topCategory: BentoTopCategory | null = null;
  if (recentArticles && recentArticles.length > 0) {
    const counts = new Map<string, { nom: string; slug: string; count: number; vendeurs: Set<string> }>();
    for (const a of recentArticles as any[]) {
      const cat = Array.isArray(a.categories) ? a.categories[0] : a.categories;
      if (!cat) continue;
      const key = cat.slug;
      if (!counts.has(key)) counts.set(key, { nom: cat.nom, slug: cat.slug, count: 0, vendeurs: new Set() });
      const entry = counts.get(key)!;
      entry.count += 1;
      if (a.vendeur_id) entry.vendeurs.add(a.vendeur_id);
    }
    const sorted = [...counts.values()].sort((a, b) => b.count - a.count);
    if (sorted[0]) {
      topCategory = {
        nom: sorted[0].nom,
        slug: sorted[0].slug,
        nbNouveauxArticles: sorted[0].count,
        nbVendeurs: sorted[0].vendeurs.size,
      };
    }
  }

  // Fallback : si rien de récent, prendre la catégorie avec le plus d'articles au total
  if (!topCategory) {
    const { data: allCats } = await supabase
      .from("categories")
      .select("nom, slug, articles(count)")
      .order("nom");
    const withCounts = (allCats as any[] | null)
      ?.map((c) => ({ nom: c.nom, slug: c.slug, count: c.articles?.[0]?.count ?? 0 }))
      .sort((a, b) => b.count - a.count);
    if (withCounts && withCounts[0] && withCounts[0].count > 0) {
      topCategory = { nom: withCounts[0].nom, slug: withCounts[0].slug, nbNouveauxArticles: withCounts[0].count, nbVendeurs: 0 };
    }
  }

  // --- 2. Carte "nouvelle boutique" : vendeur récent avec >= 3 articles publiés ---
  const { data: recentSellers } = await supabase
    .from("vendeurs")
    .select("id, nom_boutique, created_at, articles(count)")
    .eq("statut", "valide")
    .gte("created_at", THIRTY_DAYS_AGO())
    .order("created_at", { ascending: false })
    .limit(10);

  const newSeller: BentoNewSeller | null = (() => {
    const candidate = (recentSellers as any[] | null)?.find((v) => (v.articles?.[0]?.count ?? 0) >= 3);
    if (!candidate) return null;
    return { nomBoutique: candidate.nom_boutique, slugOuId: candidate.id, nbArticles: candidate.articles[0].count };
  })();

  // --- 3. Carte "le plus populaire" : produit le plus favorisé sur 7 jours ---
  const { data: recentFavoris } = await supabase
    .from("favoris")
    .select("article_id")
    .gte("created_at", SEVEN_DAYS_AGO());

  let topProduct: BentoTopProduct | null = null;
  if (recentFavoris && recentFavoris.length > 0) {
    const favCounts = new Map<string, number>();
    for (const f of recentFavoris as any[]) {
      favCounts.set(f.article_id, (favCounts.get(f.article_id) ?? 0) + 1);
    }
    const topId = [...favCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    if (topId) {
      const { data: article } = await supabase
        .from("articles")
        .select("id, nom, photos")
        .eq("id", topId)
        .maybeSingle();
      if (article) {
        topProduct = { id: article.id, nom: article.nom, image: article.photos?.[0] ?? null, nbFavoris: favCounts.get(topId)! };
      }
    }
  }
  // Fallback : produit le plus récent en stock si peu/pas de favoris
  if (!topProduct) {
    const { data: recentArticle } = await supabase
      .from("articles")
      .select("id, nom, photos")
      .eq("statut", "publie")
      .eq("actif", true)
      .gt("stock", 0)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (recentArticle) {
      topProduct = { id: recentArticle.id, nom: recentArticle.nom, image: recentArticle.photos?.[0] ?? null, nbFavoris: 0 };
    }
  }

  // --- 4. Grille catégories : top N par nombre d'articles en stock ---
  const { data: categoriesData } = await supabase
    .from("categories")
    .select("nom, slug, image, articles(count)")
    .order("nom");

  const categories: BentoCategoryCard[] = ((categoriesData as any[] | null) ?? [])
    .map((c) => ({ nom: c.nom, slug: c.slug, image: c.image ?? null, nbArticles: c.articles?.[0]?.count ?? 0 }))
    .filter((c) => c.nbArticles > 0)
    .sort((a, b) => b.nbArticles - a.nbArticles)
    .slice(0, 6);

  return { topCategory, newSeller, topProduct, categories };
}

/**
 * Version cachée — revalidée toutes les heures (3600s), partagée par tous
 * les visiteurs. Le tag "bento-home" permet une invalidation manuelle
 * (ex: après publication d'un nouvel article) via revalidateTag si besoin
 * plus tard, sans attendre l'heure complète.
 */
export const getBentoData = unstable_cache(computeBentoData, ["bento-home"], {
  revalidate: 3600,
  tags: ["bento-home"],
});
