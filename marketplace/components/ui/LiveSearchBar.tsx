"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, X, History, TrendingUp, Sparkles, ChevronRight, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { ARTICLE_CARD_SELECT, ArticleCardRow, mapArticleRow, fetchArticleRatings, ArticleCard } from "@/lib/catalogue";

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

  // 1. Charger les recherches récentes depuis localStorage + catégories dynamiques
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved));
      }
    } catch {
      // Ignorer si localStorage indisponible
    }

    // Charger les catégories dynamiques pour le placeholder et les suggestions
    async function loadCategories() {
      const { data } = await supabase.from("categories").select("id, nom").limit(10);
      if (data && data.length > 0) {
        setDbCategories((data as { id: string; nom: string }[]).map((c) => c.nom));
      }
    }
    loadCategories();
  }, [supabase]);

  // 2. Défiler le placeholder de manière dynamique avec les vraies catégories
  useEffect(() => {
    if (dbCategories.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((prev) => (prev + 1) % dbCategories.length);
    }, 3500);
    return () => clearInterval(interval);
  }, [dbCategories]);

  // 3. Debounce de la saisie utilisateur (200ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  // 4. Recherche en direct sur Supabase
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
        const [productsRes, categoriesRes] = await Promise.all([
          supabase
            .from("articles")
            .select(ARTICLE_CARD_SELECT)
            .eq("statut", "publie")
            .eq("actif", true)
            .or(`nom.ilike.%${debouncedQuery}%,description.ilike.%${debouncedQuery}%`)
            .limit(4),
          supabase
            .from("categories")
            .select("id, nom")
            .ilike("nom", `%${debouncedQuery}%`)
            .limit(3),
        ]);

        if (!isMounted) return;

        if (productsRes.data) {
          const rows = productsRes.data as unknown as ArticleCardRow[];
          const ratings = await fetchArticleRatings(supabase, rows.map((r) => r.id));
          setLiveProducts(rows.map((r) => mapArticleRow(r, ratings)));
        } else {
          setLiveProducts([]);
        }

        if (categoriesRes.data) {
          setLiveCategories(categoriesRes.data as CategoryItem[]);
        } else {
          setLiveCategories([]);
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

  // 5. Fermer au clic extérieur
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Enregistrer une recherche dans le localStorage
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

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();
    handleLaunchSearch(query);
  };

  const currentPlaceholder =
    placeholder ||
    (dbCategories.length > 0
      ? `Rechercher "${dbCategories[placeholderIndex]}"...`
      : "Rechercher un produit, une marque, une catégorie...");

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
          className="w-full bg-gray-100/70 hover:bg-gray-100 focus:bg-white border border-transparent focus:border-coral-400/80 rounded-2xl py-2.5 pl-11 pr-24 text-[13px] md:text-[14px] font-medium outline-none focus:ring-4 focus:ring-coral-500/10 shadow-xs focus:shadow-lg transition-all duration-300 placeholder:text-gray-400 text-gray-900"
        />

        <div className="absolute right-2 flex items-center gap-1">
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
            className="bg-coral-500 hover:bg-coral-600 text-white font-bold px-3.5 py-1.5 rounded-xl text-xs transition-all duration-200 shadow-sm shadow-coral-500/20 active:scale-95 flex items-center gap-1 cursor-pointer"
          >
            <span>Chercher</span>
          </button>
        </div>
      </form>

      {/* PANNEAU DEROULANT AUTOCOMPLETE "SOFT" */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="absolute left-0 right-0 top-full mt-2 bg-white/95 backdrop-blur-xl border border-gray-100 shadow-2xl rounded-3xl overflow-hidden z-50 p-3 max-h-[85vh] overflow-y-auto"
          >
            {/* ETAT 1 : L'utilisateur n'a rien tapé ou < 2 caractères */}
            {!debouncedQuery || debouncedQuery.length < 2 ? (
              <div className="space-y-4 p-1">
                {/* Recherches récentes */}
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
                          className="group flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50 hover:bg-coral-50 text-gray-700 hover:text-coral-600 text-xs font-medium transition-colors border border-gray-100 hover:border-coral-100 cursor-pointer"
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

                {/* Catégories populaires */}
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5 px-2 mb-2">
                    <TrendingUp size={13} className="text-coral-500" /> Catégories en tendance
                  </span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {(dbCategories.length > 0 ? dbCategories.slice(0, 6) : ["Mode & Vêtements", "Téléphones & High-Tech", "Beauté & Soins", "Maison & Déco"]).map(
                      (cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => handleLaunchSearch(cat)}
                          className="flex items-center gap-2 p-2 rounded-xl hover:bg-coral-50/60 text-left text-xs font-semibold text-gray-700 hover:text-coral-600 transition-colors group cursor-pointer"
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
              /* ETAT 2 : Recherche active en direct */
              <div className="space-y-3 p-1">
                {loading ? (
                  <div className="flex items-center justify-center py-6 text-xs text-gray-400 gap-2">
                    <Sparkles size={16} className="animate-spin text-coral-500" />
                    <span>Recherche en cours...</span>
                  </div>
                ) : (
                  <>
                    {/* Catégories trouvées */}
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
                              onClick={() => handleLaunchSearch(c.nom)}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-coral-50 text-coral-600 font-semibold text-xs hover:bg-coral-100 transition-colors cursor-pointer"
                            >
                              <Tag size={12} />
                              <span>{c.nom}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Produits trouvés en direct */}
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
                                router.push(`/produits/${product.id}`);
                              }}
                              className="flex items-center gap-3 p-2 rounded-2xl hover:bg-coral-50/50 transition-colors cursor-pointer group"
                            >
                              <img
                                src={product.photos[0] || "/images/hero-illustration.png"}
                                alt={product.nom}
                                className="w-11 h-11 object-cover rounded-xl border border-gray-100 group-hover:scale-105 transition-transform"
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
                      <div className="text-center py-6 text-gray-500 text-xs">
                        Aucun produit ne correspond à "<span className="font-semibold text-gray-800">{query}</span>"
                      </div>
                    )}

                    {/* Lien voir tous les résultats */}
                    <button
                      type="button"
                      onClick={() => handleLaunchSearch(query)}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 mt-2 bg-coral-50 hover:bg-coral-100 text-coral-600 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
                    >
                      <span>Voir tous les résultats pour "{query}"</span>
                      <ChevronRight size={14} />
                    </button>
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
