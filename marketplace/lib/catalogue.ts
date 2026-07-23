import { createClient } from "@/lib/supabase/client";
import { CATEGORIES } from "@/lib/mock-data";

type SupabaseClient = ReturnType<typeof createClient>;

// Sélection commune utilisée par explorer/, recherche/ et produits/[id]
// pour charger un article "carte produit" en un seul aller-retour.
export const ARTICLE_CARD_SELECT = `
  id, nom, description, prix, prix_promo, categorie_id, vendeur_id, vues, created_at,
  categories ( nom, slug ),
  article_images ( image_url, ordre ),
  vendeurs ( nom_boutique )
`;

interface CategorieRef {
  nom: string;
  slug: string;
}

interface VendeurRef {
  nom_boutique: string | null;
}

export interface ArticleImageRow {
  image_url: string;
  ordre: number | null;
}

export interface ArticleCardRow {
  id: string;
  nom: string;
  description: string | null;
  prix: number | string;
  prix_promo: number | string | null;
  categorie_id: string | null;
  vendeur_id: string;
  vues: number | null;
  created_at: string;
  categories: CategorieRef | CategorieRef[] | null;
  article_images: ArticleImageRow[] | null;
  vendeurs: VendeurRef | VendeurRef[] | null;
}

export interface ArticleCard {
  id: string;
  nom: string;
  description: string;
  prix: number;
  ancien_prix: number | null;
  categorieId: string;
  categorieLabel: string;
  vendeur_id: string;
  vendeurNom: string;
  photos: string[];
  rating: number;
  reviewCount: number;
}

export const PLACEHOLDER_IMAGE = "/file.svg";

// PostgREST renvoie les relations "belongs-to" tantôt en objet, tantôt en
// tableau à un élément selon le contexte de la requête — ce helper uniformise.
function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export function getPhotos(images: ArticleImageRow[] | null | undefined): string[] {
  const sorted = [...(images || [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  const urls = sorted.map((img) => img.image_url);
  return urls.length > 0 ? urls : [PLACEHOLDER_IMAGE];
}

export function getCategorieLabel(slug: string | undefined, fallback: string): string {
  return CATEGORIES.find((c) => c.id === slug)?.label || fallback;
}

export interface RatingInfo {
  rating: number;
  count: number;
}

// Récupère les avis (note) de plusieurs articles en un seul appel et
// renvoie une map article_id -> { rating moyenne, count }.
export async function fetchArticleRatings(
  supabase: SupabaseClient,
  articleIds: string[]
): Promise<Map<string, RatingInfo>> {
  const map = new Map<string, RatingInfo>();
  if (articleIds.length === 0) return map;

  const { data, error } = await supabase
    .from("avis")
    .select("article_id, note")
    .in("article_id", articleIds);

  if (error) {
    console.error("Error fetching avis:", error);
    return map;
  }

  const totals = new Map<string, { sum: number; count: number }>();
  (data || []).forEach((a: any) => {
    if (!a.article_id) return;
    const cur = totals.get(a.article_id) || { sum: 0, count: 0 };
    cur.sum += a.note;
    cur.count += 1;
    totals.set(a.article_id, cur);
  });

  totals.forEach((v, k) => {
    map.set(k, { rating: Math.round((v.sum / v.count) * 10) / 10, count: v.count });
  });

  return map;
}

export function mapArticleRow(row: ArticleCardRow, ratings: Map<string, RatingInfo>): ArticleCard {
  const cat = one(row.categories);
  const vendeur = one(row.vendeurs);
  const r = ratings.get(row.id);
  const prix = Number(row.prix);
  const prixPromo = row.prix_promo != null ? Number(row.prix_promo) : null;

  return {
    id: row.id,
    nom: row.nom,
    description: row.description || "Produit de qualité disponible sur Ayiba.",
    // prix_promo, quand il est défini, est le prix affiché ; prix devient le prix barré.
    prix: prixPromo ?? prix,
    ancien_prix: prixPromo != null ? prix : null,
    categorieId: cat?.slug || "",
    categorieLabel: getCategorieLabel(cat?.slug, cat?.nom || "Divers"),
    vendeur_id: row.vendeur_id,
    vendeurNom: vendeur?.nom_boutique || "Boutique Ayiba",
    photos: getPhotos(row.article_images),
    rating: r?.rating || 0,
    reviewCount: r?.count || 0,
  };
}

export interface VendeurStats {
  rating: number;
  reviewCount: number;
  productCount: number;
}

// Calcule la note moyenne d'un vendeur à partir des avis laissés sur ses
// articles publiés (la colonne users.note_moyenne n'est pas lisible côté
// client pour un autre utilisateur — RLS "Users can view own data").
export async function fetchVendeurStats(supabase: SupabaseClient, vendeurId: string): Promise<VendeurStats> {
  const { data: articles, error } = await supabase
    .from("articles")
    .select("id")
    .eq("vendeur_id", vendeurId)
    .eq("statut", "publie")
    .eq("actif", true);

  if (error || !articles || articles.length === 0) {
    return { rating: 0, reviewCount: 0, productCount: 0 };
  }

  const articleIds = articles.map((a: any) => a.id);
  const ratings = await fetchArticleRatings(supabase, articleIds);

  let sum = 0;
  let count = 0;
  ratings.forEach((r) => {
    sum += r.rating * r.count;
    count += r.count;
  });

  return {
    rating: count > 0 ? Math.round((sum / count) * 10) / 10 : 0,
    reviewCount: count,
    productCount: articleIds.length,
  };
}

export async function fetchFavoriteIds(supabase: SupabaseClient, userId: string): Promise<Set<string>> {
  const { data, error } = await supabase.from("favoris").select("article_id").eq("client_id", userId);
  if (error) {
    console.error("Error fetching favoris:", error);
    return new Set();
  }
  return new Set((data || []).map((f: any) => f.article_id));
}

export async function toggleFavorite(
  supabase: SupabaseClient,
  userId: string,
  articleId: string,
  isFavorite: boolean
): Promise<boolean> {
  if (isFavorite) {
    const { error } = await supabase
      .from("favoris")
      .delete()
      .eq("client_id", userId)
      .eq("article_id", articleId);
    if (error) {
      console.error("Error removing favori:", error);
      throw error;
    }
    return false;
  }

  const { error } = await supabase.from("favoris").insert({ client_id: userId, article_id: articleId });
  if (error) {
    console.error("Error adding favori:", error);
    throw error;
  }
  return true;
}
