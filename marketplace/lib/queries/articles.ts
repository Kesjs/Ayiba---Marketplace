import { createClient } from "@/lib/supabase/client";

export interface ArticlePublic {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  prix_promo: number | null;
  date_fin_promo: string | null;
  stock: number;
  vendeur_id: string;
  photos: string[];
  created_at: string;
  categorie: { id: string; nom: string; slug: string } | null;
  vendeur: { id: string; nom_boutique: string | null; quartier: string | null; commune: string | null; full_name: string; avatar_url: string | null; } | null;
  caracteristiques: { label: string; value: string }[] | null;
}

/**
 * Articles publics visibles au catalogue. La RLS de la table `articles`
 * (policy "Articles publiés visibles par tous") ne renvoie déjà que les
 * articles au statut 'publie' d'un vendeur au statut 'valide' — le filtre
 * explicite ci-dessous est redondant avec la RLS mais garde l'intention
 * lisible côté front et évite de dépendre uniquement de la policy.
 */
export async function getArticlesPublics(options?: { categorieSlug?: string; recherche?: string; vendeurId?: string; excludeVendeurId?: string; excludeArticleId?: string }) {
  const supabase = createClient();

  let query = supabase
    .from("articles")
    .select(
      `id, nom, description, prix, prix_promo, date_fin_promo, stock, vendeur_id, created_at,
       article_images ( image_url, ordre ),
       categories ( id, nom, slug ),
       vendeurs ( id, nom_boutique, quartier, commune, users!vendeurs_id_fkey(full_name, avatar_url) )`
    )
    .eq("statut", "publie")
    .eq("actif", true)
    .order("created_at", { ascending: false });

  if (options?.categorieSlug) {
    // Filtre appliqué après coup (voir plus bas) car la relation categories
    // est imbriquée ; on garde la requête simple plutôt que d'enchaîner un
    // second aller-retour uniquement pour résoudre le slug en id.
  }

  if (options?.vendeurId) {
    query = query.eq("vendeur_id", options.vendeurId);
  }

  // Un vendeur connecté ne doit jamais voir ses propres articles dans les
  // vues d'achat (home, catalogue) : il ne peut de toute façon pas se les
  // acheter (contrainte DB commandes_client_different_vendeur), donc les
  // lui montrer là où il cherche à acheter n'aurait fait que créer de la
  // confusion. Ne s'applique pas à `vendeurId` ci-dessus, qui sert
  // justement à afficher volontairement la boutique d'un vendeur donné.
  if (options?.excludeVendeurId) {
    query = query.neq("vendeur_id", options.excludeVendeurId);
  }

  if (options?.recherche) {
    query = query.ilike("nom", `%${options.recherche}%`);
  }

  if (options?.excludeArticleId) {
    query = query.neq("id", options.excludeArticleId);
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
      date_fin_promo: a.date_fin_promo,
      stock: a.stock,
      vendeur_id: a.vendeur_id,
      created_at: a.created_at,
      photos: images.map((img: any) => img.image_url),
      categorie: cat ? { id: cat.id, nom: cat.nom, slug: cat.slug } : null,
      vendeur: vendeur ? {
        id: vendeur.id,
        nom_boutique: vendeur.nom_boutique,
        quartier: vendeur.quartier,
        commune: vendeur.commune,
        full_name: vendeur.users?.full_name || 'Vendeur Inconnu',
        avatar_url: vendeur.users?.avatar_url || null,
      } : null,
      caracteristiques: a.caracteristiques || [],
    };
  });

  return options?.categorieSlug
    ? articles.filter((a) => a.categorie?.slug === options.categorieSlug)
    : articles;
}

/**
 * Server-side paginated version. Returns one extra item to signal `hasMore`.
 * Note: does not return a total count to avoid expensive COUNT(*) with joins.
 */
export async function getArticlesPublicsPaged(options?: {
  page?: number;
  pageSize?: number;
  categorieSlug?: string;
  recherche?: string;
  vendeurId?: string;
  excludeVendeurId?: string;
  excludeArticleId?: string;
  sortBy?: string;
  ascending?: boolean;
}) {
  const supabase = createClient();
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.max(1, options?.pageSize ?? 20);
  const start = (page - 1) * pageSize;
  const end = start + pageSize; // request one extra to detect hasMore
  // Resolve category slug to id if provided (avoids post-join filtering)
  let categorieId: string | undefined = undefined;
  if (options?.categorieSlug) {
    const { data: catData, error: catErr } = await supabase.from("categories").select("id").eq("slug", options.categorieSlug).limit(1).maybeSingle();
    if (catErr) throw catErr;
    if (catData && (catData as any).id) categorieId = (catData as any).id;
  }

  // Build search/or conditions for tokenized recherche
  let searchOr: string | undefined = undefined;
  if (options?.recherche) {
    const tokens = (options.recherche || "").trim().split(/\s+/).filter(Boolean);
    if (tokens.length > 0) {
      const conds = tokens.flatMap((t) => [
        `nom.ilike.%${t}%`,
        `description.ilike.%${t}%`,
      ]);
      searchOr = conds.join(",");
    }
  }

  // Compute total count with same filters (without joins for performance)
  let totalCount: number | null = null;
  {
    let countQuery: any = supabase.from("articles").select("id", { count: "exact" });
    countQuery = countQuery.eq("statut", "publie").eq("actif", true);
    if (options?.vendeurId) countQuery = countQuery.eq("vendeur_id", options.vendeurId);
    if (options?.excludeVendeurId) countQuery = countQuery.neq("vendeur_id", options.excludeVendeurId);
    if (options?.excludeArticleId) countQuery = countQuery.neq("id", options.excludeArticleId);
    if (categorieId) countQuery = countQuery.eq("categorie_id", categorieId);
    if (searchOr) countQuery = countQuery.or(searchOr);
    const { count, error: countErr } = await countQuery;
    if (countErr) throw countErr;
    totalCount = count ?? null;
  }

  let query: any = supabase
    .from("articles")
    .select(
      `id, nom, description, prix, prix_promo, stock, vendeur_id, vues, created_at,
       article_images ( image_url, ordre ),
       categories ( id, nom, slug ),
       vendeurs ( id, nom_boutique, quartier, commune, users!vendeurs_id_fkey(full_name, avatar_url) )`
    )
    .eq("statut", "publie")
    .eq("actif", true)
    .range(start, end);

  // Sorting
  const sortMap: Record<string, { field: string; asc: boolean }> = {
    recent: { field: "created_at", asc: false },
    "price-asc": { field: "prix", asc: true },
    "price-desc": { field: "prix", asc: false },
    popular: { field: "vues", asc: false },
  };
  const sortKey = options?.sortBy ?? "recent";
  const sortDef = sortMap[sortKey] ?? { field: "created_at", asc: !!options?.ascending };
  query = query.order(sortDef.field, { ascending: sortDef.asc });

  if (options?.vendeurId) query = query.eq("vendeur_id", options.vendeurId);
  if (options?.excludeVendeurId) query = query.neq("vendeur_id", options.excludeVendeurId);
  if (options?.excludeArticleId) query = query.neq("id", options.excludeArticleId);
  if (categorieId) query = query.eq("categorie_id", categorieId);
  if (searchOr) query = query.or(searchOr);

  const { data, error } = await query;
  if (error) throw error;

  const raw = data || [];
  const items = (raw || []).map((a: any) => {
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
      created_at: a.created_at,
      photos: images.map((img: any) => img.image_url),
      categorie: cat ? { id: cat.id, nom: cat.nom, slug: cat.slug } : null,
      vendeur: vendeur ? {
        id: vendeur.id,
        nom_boutique: vendeur.nom_boutique,
        quartier: vendeur.quartier,
        commune: vendeur.commune,
        full_name: vendeur.users?.full_name || 'Vendeur Inconnu',
        avatar_url: vendeur.users?.avatar_url || null,
      } : null,
      caracteristiques: a.caracteristiques || [],
    };
  });

  const hasMore = (items.length > pageSize);
  const paged = items.slice(0, pageSize);

  // final result already filtered by categorie_id when applicable
  return { articles: paged, hasMore, totalCount };
}

/**
 * Catégories utilisées pour les onglets de la home et les filtres du
 * catalogue. On n'y affiche que les catégories "feuilles" (celles qu'un
 * article peut réellement porter) : une catégorie parente qui a des
 * sous-catégories (ex: "Maison", "Électronique"...) n'est plus assignable
 * directement à un article et ne doit donc plus apparaître comme filtre,
 * sous peine de mener vers une liste vide.
 */
export interface CategorieActive {
  id: string;
  nom: string;
  slug: string;
  icone: string | null;
  couleur: string | null;
  parent_id: string | null;
}

export async function getCategoriesActives(): Promise<CategorieActive[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("categories")
    .select("id, nom, slug, icone, couleur, parent_id")
    .eq("active", true)
    .order("ordre", { ascending: true });
  if (error) throw error;

  const toutes: CategorieActive[] = data || [];
  const idsAvecEnfants = new Set(
    toutes.filter((c: CategorieActive) => c.parent_id).map((c: CategorieActive) => c.parent_id)
  );
  return toutes.filter((c: CategorieActive) => !idsAvecEnfants.has(c.id));
}

export interface CategorieArbre {
  id: string;
  nom: string;
  slug: string;
  sousCategories: { id: string; nom: string; slug: string; icone: string | null }[];
}

/**
 * Arbre complet des catégories (parents + sous-catégories) pour le
 * formulaire "Ajouter/Modifier un article" : contrairement à
 * getCategoriesActives, les catégories parentes doivent apparaître ici,
 * sinon impossible d'accéder à leurs sous-catégories.
 *
 * Volontairement PAS de filtre `active` ici : le champ `active` sert
 * uniquement à la page d'accueil publique (catégories mises en avant côté
 * client). Un vendeur doit toujours pouvoir classer son article dans
 * n'importe quelle catégorie/sous-catégorie existante, active ou non.
 *
 * `slug` est renvoyé en plus de `nom` pour permettre au formulaire de
 * déduire le type de taille pertinent (pointures pour les chaussures,
 * S/M/L pour les vêtements) sans dépendre du libellé affiché.
 */
export async function getCategoriesFormulaire(options?: { activesUniquement?: boolean }): Promise<CategorieArbre[]> {
  const supabase = createClient();
  let query = supabase
    .from("categories")
    .select("id, nom, slug, parent_id, icone, active")
    .order("ordre", { ascending: true });
  if (options?.activesUniquement) {
    query = query.eq("active", true);
  }
  const { data, error } = await query;
  if (error) throw error;

  interface CategorieBrute {
    id: string;
    nom: string;
    slug: string;
    parent_id: string | null;
    icone: string | null;
  }

  const toutes: CategorieBrute[] = data || [];
  const parents = toutes.filter((c: CategorieBrute) => !c.parent_id);
  return parents.map((p: CategorieBrute) => ({
    id: p.id,
    nom: p.nom,
    slug: p.slug,
    sousCategories: toutes
      .filter((c: CategorieBrute) => c.parent_id === p.id)
      .map((c: CategorieBrute) => ({ id: c.id, nom: c.nom, slug: c.slug, icone: c.icone })),
  }));
}
