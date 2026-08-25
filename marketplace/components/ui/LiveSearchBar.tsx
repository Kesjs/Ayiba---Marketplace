"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, History, TrendingUp, Sparkles, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ARTICLE_CARD_SELECT, ArticleCardRow, mapArticleRow, fetchArticleRatings, ArticleCard, getProductUrl } from "@/lib/catalogue";

const LOCAL_STORAGE_KEY = "ayiba_recent_searches";
const MAX_RECENT_SEARCHES = 5;

interface LiveSearchBarProps {
  className?: string;
  placeholder?: string;
  onSearchSubmit?: () => void;
  autoFocus?: boolean;
}

interface CategoryItem {
  id: string;
  nom: string;
}

export function LiveSearchBar({ className = "", placeholder, onSearchSubmit, autoFocus = false }: LiveSearchBarProps) {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [liveProducts, setLiveProducts] = useState<ArticleCard[]>([]);
  const [liveCategories, setLiveCategories] = useState<CategoryItem[]>([]);
  const [dbCategories, setDbCategories] = useState<string[]>([]);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {}

    async function loadCategories() {
      const { data } = await supabase.from("categories").select("id, nom").limit(10);
      if (data && data.length > 0) {
        setDbCategories((data as { id: string; nom: string }[]).map((c) => c.nom));
      }
    }
    loadCategories();
  }, [supabase]);

  useEffect(() => {
    if (dbCategories.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % dbCategories.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [dbCategories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    if (!debouncedQuery || debouncedQuery.length < 2) {
      setLiveProducts([]);
      setLiveCategories([]);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    async function executeLiveSearch() {
      try {
        const term = debouncedQuery;

        interface CatDbRow {
          id: string;
          nom: string;
          parent_id: string | null;
        }

        const { data: catData } = await supabase
          .from("categories")
          .select("id, nom, parent_id")
          .ilike("nom", `%${term}%`)
          .limit(4);

        const matchedCats = (catData || []) as CatDbRow[];
        let catIds: string[] = [];
        if (matchedCats.length > 0) {
          const directIds = matchedCats.map((c: CatDbRow) => c.id);
          const { data: subData } = await supabase
            .from("categories")
            .select("id, nom, parent_id")
            .in("parent_id", directIds);
          const subCats = (subData || []) as CatDbRow[];
          catIds = Array.from(new Set([...directIds, ...subCats.map((s: CatDbRow) => s.id)]));
        }

        // 2. Recherche produits par nom, description, tags SEO ou catégorie
        let queryBuilder = supabase
          .from("articles")
          .select(ARTICLE_CARD_SELECT)
          .eq("statut", "publie")
          .eq("actif", true);

        if (catIds.length > 0) {
          queryBuilder = queryBuilder.or(
            `nom.ilike.%${term}%,description.ilike.%${term}%,tags_seo.ilike.%${term}%,categorie_id.in.(${catIds.join(",")})`
          );
        } else {
          queryBuilder = queryBuilder.or(
            `nom.ilike.%${term}%,description.ilike.%${term}%,tags_seo.ilike.%${term}%`
          );
        }

        const { data: productsData } = await queryBuilder.limit(4);

        if (!isMounted) return;

        if (matchedCats && matchedCats.length > 0) {
          setLiveCategories(matchedCats as CategoryItem[]);
        } else {
          setLiveCategories([]);
        }

        if (productsData && productsData.length > 0) {
          const rows = productsData as unknown as ArticleCardRow[];
          const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id));
          setLiveProducts(rows.map((r) => mapArticleRow(r, ratings)));
        } else {
          setLiveProducts([]);
        }
      } catch (err) {
        console.error("Live search error:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    executeLiveSearch();

    return () => {
      isMounted = false;
    };
  }, [debouncedQuery, supabase]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Raccourci clavier "/" et "Cmd/Ctrl + K" pour activer la recherche instantanément
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const activeTag = document.activeElement?.tagName;
      const isEditable =
        activeTag === "INPUT" ||
        activeTag === "TEXTAREA" ||
        (document.activeElement as HTMLElement)?.isContentEditable;

      if (
        (e.key === "/" && !isEditable) ||
        ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k")
      ) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }

      if (e.key === "Escape" && document.activeElement === inputRef.current) {
        inputRef.current?.blur();
        setIsOpen(false);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const saveSearchTerm = (term: string) => {
    if (!term.trim()) return;
    const cleanTerm = term.trim();
    const updated = [cleanTerm, ...recentSearches.filter((s) => s.toLowerCase() !== cleanTerm.toLowerCase())].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const removeRecentSearch = (e: React.MouseEvent, termToRemove: string) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== termToRemove);
    setRecentSearches(updated);
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {}
  };

  const handleLaunchSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    saveSearchTerm(searchTerm);
    setIsOpen(false);
    onSearchSubmit?.();
    router.push(`/recherche?q=${encodeURIComponent(searchTerm.trim())}`);
  };

  const handleSelectCategory = (catName: string) => {
    saveSearchTerm(catName);
    setIsOpen(false);
    onSearchSubmit?.();
    router.push(`/catalogue?categorie=${encodeURIComponent(catName)}`);
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleLaunchSearch(query);
  };

  const currentPlaceholder =
    placeholder ||
    (dbCategories.length > 0
      ? `Rechercher "${dbCategories[placeholderIndex]}"...`
      : "Rechercher un produit, un artisan, une catégorie...");

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleSubmitForm} className="relative flex items-center w-full group">
        <div className={`absolute left-4 transition-colors pointer-events-none ${isOpen ? "text-coral-500" : "text-gray-400"}`}>
          <Search size={18} />
        </div>

        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          placeholder={currentPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          className="w-full bg-[#F1EFE8]/70 hover:bg-[#F1EFE8] focus:bg-white border border-gray-200/60 focus:border-coral-400 py-2.5 pl-11 pr-24 text-[13px] md:text-[14px] font-medium outline-none focus:ring-4 focus:ring-coral-500/10 rounded-2xl shadow-2xs focus:shadow-xl transition-all duration-300 placeholder:text-gray-400 text-gray-900"
        />

        <div className="absolute right-2 flex items-center gap-1.5">
          {!query && (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-gray-400 bg-white border border-gray-200 rounded-md shadow-2xs">
              /
            </kbd>
          )}

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                inputRef.current?.focus();
              }}
              className="p-1 hover:bg-gray-200/80 rounded-full text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
              aria-label="Effacer"
            >
              <X size={14} />
            </button>
          )}

          <button
            type="submit"
            className="bg-coral-500 hover:bg-coral-600 active:scale-95 text-white font-extrabold px-3.5 py-1.5 text-xs rounded-xl transition-all duration-200 shadow-md shadow-coral-500/20 flex items-center gap-1 cursor-pointer"
          >
            <span>Chercher</span>
          </button>
        </div>
      </form>

      {/* PANNEAU AUTOCOMPLETE */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-200/80 shadow-2xl rounded-3xl overflow-hidden z-50 p-4 max-h-[85vh] overflow-y-auto"
          >
            {!debouncedQuery || debouncedQuery.length < 2 ? (
              <div className="space-y-4 p-1">
                {recentSearches.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between px-2 mb-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                        <History size={13} className="text-gray-400" /> Recherches récentes
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => handleLaunchSearch(term)}
                          className="group flex items-center gap-1.5 px-3 py-1.5 bg-[#F1EFE8] hover:bg-coral-50 text-gray-800 hover:text-coral-600 text-xs font-semibold rounded-xl transition-colors border border-gray-200/60 hover:border-coral-200 cursor-pointer"
                        >
                          <span>{term}</span>
                          <span
                            onClick={(e) => removeRecentSearch(e, term)}
                            className="p-0.5 rounded-full hover:bg-coral-200/50 text-gray-400 group-hover:text-coral-600 transition-colors"
                          >
                            <X size={11} />
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-2 mb-2">
                    <TrendingUp size={13} className="text-coral-500" /> Catégories populaires
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(dbCategories.length > 0 ? dbCategories.slice(0, 6) : ["Mode & Vêtements", "Téléphones & High-Tech", "Beauté & Soins", "Maison & Déco"]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleSelectCategory(cat)}
                          className="flex items-center gap-2 p-2 hover:bg-coral-50/70 text-left text-xs font-bold text-gray-800 hover:text-coral-600 transition-colors rounded-xl group cursor-pointer"
                        >
                          <div className="w-6 h-6 rounded-lg bg-coral-100/60 flex items-center justify-center text-coral-600 group-hover:scale-110 transition-transform">
                            <Tag size={12} />
                          </div>
                          <span className="truncate">{cat}</span>
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400 gap-2 font-medium">
                    <Sparkles size={16} className="animate-spin text-coral-500" />
                    <span>Recherche en cours...</span>
                  </div>
                ) : (
                  <>
                    {liveCategories.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1 block">
                          Catégories
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {liveCategories.map((c) => (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleSelectCategory(c.nom)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-coral-50 text-coral-600 font-extrabold text-xs rounded-xl hover:bg-coral-100 transition-colors cursor-pointer"
                            >
                              <Tag size={12} />
                              <span>{c.nom}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {liveProducts.length > 0 ? (
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-2 mb-1 block">
                          Produits correspondants
                        </span>
                        <div className="space-y-1">
                          {liveProducts.map((product) => (
                            <div
                              key={product.id}
                              onClick={() => {
                                saveSearchTerm(product.nom);
                                setIsOpen(false);
                                onSearchSubmit?.();
                                router.push(getProductUrl(product));
                              }}
                              className="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-coral-50/60 transition-colors cursor-pointer group"
                            >
                              <img
                                src={product.photos[0] || "/images/hero-illustration.png"}
                                alt={product.nom}
                                className="w-11 h-11 object-cover rounded-xl border border-gray-200/60 group-hover:scale-105 transition-transform"
                              />
                              <div className="flex flex-col text-left flex-1 min-w-0">
                                <span className="text-xs font-bold text-gray-900 truncate group-hover:text-coral-600 transition-colors">
                                  {product.nom}
                                </span>
                                <span className="text-[11px] text-gray-500 font-medium">
                                  {product.categorieLabel || "Divers"}
                                </span>
                              </div>
                              <span className="text-xs font-extrabold text-coral-600 shrink-0">
                                {product.prix.toLocaleString("fr-FR")} F
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-gray-400">
                        Aucun produit trouvé pour « {debouncedQuery} »
                      </div>
                    )}

                    <div className="pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => handleLaunchSearch(debouncedQuery)}
                        className="w-full py-2.5 text-center text-xs font-extrabold text-coral-600 hover:bg-coral-50 rounded-xl transition-colors cursor-pointer"
                      >
                        Voir tous les résultats pour « {debouncedQuery} » →
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
