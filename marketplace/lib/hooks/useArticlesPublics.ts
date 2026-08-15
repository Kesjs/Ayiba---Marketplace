import { useEffect, useState } from "react";
import { getArticlesPublicsPaged, getCategoriesActives, type ArticlePublic } from "@/lib/queries/articles";

type UseOptions = {
  initialCategorySlug?: string | null;
  pageSize?: number;
  initialSearch?: string | null;
  initialSortBy?: string | null;
  excludeVendeurId?: string;
  // Quand false, met le fetch en pause (reste en `loading`) sans le lancer.
  // Utile quand `excludeVendeurId` dépend d'un profil encore en cours de
  // résolution : partir tout de suite ferait un premier appel sans
  // exclusion, puis un second juste après avec — d'où un clignotement des
  // résultats. Défaut à true pour ne rien changer aux usages existants.
  enabled?: boolean;
};

export function useArticlesPublics({ initialCategorySlug = null, pageSize = 12, initialSearch = null, initialSortBy = null, excludeVendeurId, enabled = true }: UseOptions = {}) {
  const [articles, setArticles] = useState<ArticlePublic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [categorySlug, setCategorySlug] = useState<string | null>(initialCategorySlug);
  const [categories, setCategories] = useState<{ id: string; nom: string; slug: string }[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [search, setSearch] = useState<string | null>(initialSearch ?? null);
  const [debouncedSearch, setDebouncedSearch] = useState<string | null>(initialSearch ?? null);
  const [sortBy, setSortBy] = useState<string | null>(initialSortBy ?? "recent");

  // Debounce search input to avoid spamming the server while typing
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    setLoading(true);
    getArticlesPublicsPaged({ page, pageSize, categorieSlug: categorySlug ?? undefined, recherche: debouncedSearch ?? undefined, sortBy: sortBy ?? undefined, excludeVendeurId })
      .then((res) => {
        if (!mounted) return;
        setArticles(res.articles || []);
        setHasMore(!!res.hasMore);
        setTotalCount(res.totalCount ?? null);
      })
      .catch((err) => {
        if (!mounted) return;
        setError(err as Error);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [enabled, page, pageSize, categorySlug, debouncedSearch, sortBy, excludeVendeurId]);

  useEffect(() => {
    getCategoriesActives().then(setCategories).catch((err) => setError(err as Error));
  }, []);

  useEffect(() => {
    // reset to first page when category changes
    setPage(1);
  }, [categorySlug]);

  useEffect(() => {
    // reset page when search or sort changes
    setPage(1);
  }, [debouncedSearch, sortBy]);

  const reload = async () => {
    setLoading(true);
    try {
      const res = await getArticlesPublicsPaged({ page, pageSize, categorieSlug: categorySlug ?? undefined, recherche: debouncedSearch ?? undefined, sortBy: sortBy ?? undefined, excludeVendeurId });
      setArticles(res.articles || []);
      setHasMore(!!res.hasMore);
      setTotalCount(res.totalCount ?? null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };

  return {
    articles,
    loading,
    error,
    hasMore,
    totalCount,
    page,
    setPage,
    categories,
    categorySlug,
    setCategorySlug,
    search,
    setSearch,
    sortBy,
    setSortBy,
    reload,
  };
}

export default useArticlesPublics;
