"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Plus, Search, Trash2, Edit3, X, Loader2, PackageX, AlertCircle, RefreshCw,
  LayoutGrid, List
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";

interface ArticleImage {
  image_url: string;
  ordre: number | null;
}

interface CategorieRef {
  nom: string;
}

interface ArticleRow {
  id: string;
  nom: string;
  description: string | null;
  prix: number;
  stock: number;
  statut: string;
  actif: boolean;
  categorie_id: string | null;
  categories: CategorieRef | CategorieRef[] | null;
  article_images: ArticleImage[];
}

interface Categorie {
  id: string;
  nom: string;
}

type StatutFilter = "tous" | "publie" | "en_attente" | "rejete" | "rupture";
type ViewMode = "grille" | "liste";

const STATUT_TABS: { key: StatutFilter; label: string }[] = [
  { key: "tous", label: "Tous" },
  { key: "publie", label: "En ligne" },
  { key: "en_attente", label: "En vérification" },
  { key: "rejete", label: "Refusés" },
  { key: "rupture", label: "Rupture" },
];

function extractStoragePath(url: string): string | null {
  const marker = "/articles-photos/";
  const idx = url.indexOf(marker);
  if (idx === -1) return null;
  return url.slice(idx + marker.length);
}

function getCategorieLabel(cat: ArticleRow["categories"]): string {
  if (!cat) return "Sans catégorie";
  if (Array.isArray(cat)) return cat[0]?.nom ?? "Sans catégorie";
  return cat.nom ?? "Sans catégorie";
}

function getPrincipalePhoto(images: ArticleImage[]): string | null {
  if (!images || images.length === 0) return null;
  const sorted = [...images].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));
  return sorted[0].image_url;
}

function getStatutCategorie(item: ArticleRow): StatutFilter | "desactive" {
  if (!item.actif) return "desactive";
  if (item.statut === "en_attente") return "en_attente";
  if (item.statut === "rejete") return "rejete";
  if (item.stock === 0) return "rupture";
  return "publie";
}

function StatusBadge({ statut, stock, actif }: { statut: string; stock: number; actif: boolean }) {
  if (!actif) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Désactivé
      </span>
    );
  }
  if (statut === "en_attente") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        En vérification
      </span>
    );
  }
  if (statut === "rejete") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Refusé
      </span>
    );
  }
  if (stock === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-600">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
        Rupture
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-teal-600">
      <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
      En ligne
    </span>
  );
}

function VendeurArticleCard({
  item,
  onEdit,
  onDelete,
}: {
  item: ArticleRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categorieLabel = getCategorieLabel(item.categories);
  const photo = getPrincipalePhoto(item.article_images);

  return (
    <div className="flex flex-col w-full">
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 group/image">
        {photo ? (
          <Image
            src={photo}
            alt={item.nom}
            fill
            className={`object-cover transition-transform duration-500 group-hover/image:scale-105 ${
              !item.actif ? "grayscale-[40%] opacity-70" : ""
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <PackageX size={24} />
          </div>
        )}

        <div className="absolute top-2 right-2 flex flex-col gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Modifier"
          >
            <Edit3 size={13} className="text-gray-600" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Supprimer"
          >
            <Trash2 size={13} className="text-red-500" />
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest truncate">
          {categorieLabel}
        </p>

        <p className="text-xs text-gray-600 font-medium truncate">{item.nom}</p>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{item.stock} en stock</span>
        </div>

        <div className="flex items-center justify-between mt-0.5 gap-2">
          <p className="text-base font-black text-gray-900 whitespace-nowrap">
            {item.prix.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>
          </p>
          <StatusBadge statut={item.statut} stock={item.stock} actif={item.actif} />
        </div>
      </div>
    </div>
  );
}

function VendeurArticleRow({
  item,
  onEdit,
  onDelete,
}: {
  item: ArticleRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categorieLabel = getCategorieLabel(item.categories);
  const photo = getPrincipalePhoto(item.article_images);

  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
      <div className="relative w-14 h-14 shrink-0 bg-gray-50 rounded-xl overflow-hidden">
        {photo ? (
          <Image
            src={photo}
            alt={item.nom}
            fill
            className={`object-cover ${!item.actif ? "grayscale-[40%] opacity-70" : ""}`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <PackageX size={18} />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest truncate">
          {categorieLabel}
        </p>
        <p className="text-sm text-gray-800 font-semibold truncate">{item.nom}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-black text-gray-900 whitespace-nowrap">
            {item.prix.toLocaleString("fr-FR")} <span className="text-[10px] font-bold">FCFA</span>
          </p>
          <span className="text-gray-300">·</span>
          <span className="text-[11px] text-gray-400">{item.stock} en stock</span>
        </div>
        <div className="mt-1">
          <StatusBadge statut={item.statut} stock={item.stock} actif={item.actif} />
        </div>
      </div>

      <div className="flex flex-col gap-1.5 shrink-0">
        <button
          type="button"
          onClick={onEdit}
          className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="Modifier"
        >
          <Edit3 size={14} className="text-gray-600" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="Supprimer"
        >
          <Trash2 size={14} className="text-red-500" />
        </button>
      </div>
    </div>
  );
}

const emptyEditForm = {
  nom: "",
  description: "",
  categorieId: "",
  prix: "",
  stock: "",
};

export default function MesArticlesPage() {
  const { showToast } = useToast();

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("tous");
  const [viewMode, setViewMode] = useState<ViewMode>("grille");

  const [categories, setCategories] = useState<Categorie[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [deletingArticle, setDeletingArticle] = useState<ArticleRow | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadArticles = async () => {
    setLoading(true);
    setLoadError(null);
    const supabase = createClient();

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      setLoadError("Ta session a expiré — reconnecte-toi puis réessaie.");
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("articles")
      .select("id, nom, description, prix, stock, statut, actif, categorie_id, categories(nom), article_images(image_url, ordre)")
      .eq("vendeur_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      setLoadError("Impossible de charger tes articles — vérifie ta connexion et réessaie.");
      setLoading(false);
      return;
    }

    setArticles((data as unknown as ArticleRow[]) ?? []);
    setLoading(false);
  };

  const loadCategories = async () => {
    setLoadingCategories(true);
    setCategoriesError(null);
    const supabase = createClient();
    const { data, error } = await supabase
      .from("categories")
      .select("id, nom")
      .eq("active", true)
      .order("ordre", { ascending: true });

    if (error) {
      setCategoriesError("Impossible de charger les catégories.");
    } else {
      setCategories(data ?? []);
    }
    setLoadingCategories(false);
  };

  useEffect(() => {
    loadArticles();
    loadCategories();
  }, []);

  const searchedArticles = useMemo(() => {
    if (!search.trim()) return articles;
    return articles.filter((a) => a.nom.toLowerCase().includes(search.toLowerCase()));
  }, [articles, search]);

  const statutCounts = useMemo(() => {
    const counts: Record<StatutFilter, number> = {
      tous: searchedArticles.length,
      publie: 0,
      en_attente: 0,
      rejete: 0,
      rupture: 0,
    };
    for (const a of searchedArticles) {
      const cat = getStatutCategorie(a);
      if (cat !== "desactive") counts[cat] += 1;
    }
    return counts;
  }, [searchedArticles]);

  const filteredArticles = useMemo(() => {
    if (statutFilter === "tous") return searchedArticles;
    return searchedArticles.filter((a) => getStatutCategorie(a) === statutFilter);
  }, [searchedArticles, statutFilter]);

  const openEdit = (article: ArticleRow) => {
    setEditError(null);
    setEditFieldErrors({});
    setEditingArticle(article);
    setEditForm({
      nom: article.nom,
      description: article.description ?? "",
      categorieId: article.categorie_id ?? "",
      prix: String(article.prix),
      stock: String(article.stock),
    });
  };

  const handleEditFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({ ...prev, [name]: value }));
    setEditFieldErrors((prev) => ({ ...prev, [name]: "" }));
    setEditError(null);
  };

  const validateEditForm = () => {
    const errors: Record<string, string> = {};

    if (editForm.nom.trim().length < 3) {
      errors.nom = "Le nom doit faire au moins 3 caractères.";
    }
    if (editForm.description.trim().length < 10) {
      errors.description = "Décris ton article en au moins 10 caractères.";
    }
    if (!editForm.categorieId) {
      errors.categorieId = "Choisis une catégorie.";
    }

    const prixNum = Number(editForm.prix);
    if (!editForm.prix.trim() || isNaN(prixNum) || prixNum <= 0) {
      errors.prix = "Indique un prix valide, supérieur à 0.";
    } else if (prixNum > 5_000_000) {
      errors.prix = "Ce prix semble très élevé — vérifie qu'il est correct.";
    }

    const stockNum = Number(editForm.stock);
    if (editForm.stock.trim() === "" || isNaN(stockNum) || stockNum < 0) {
      errors.stock = "Le stock doit être un nombre entier positif ou nul.";
    }

    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isContentChange = (article: ArticleRow) =>
    editForm.nom.trim() !== article.nom ||
    editForm.description.trim() !== (article.description ?? "") ||
    editForm.categorieId !== (article.categorie_id ?? "");

  const handleSaveEdit = async () => {
    if (!editingArticle) return;
    setEditError(null);
    if (!validateEditForm()) return;

    const prix = Number(editForm.prix);
    const stock = Number(editForm.stock);
    const contentChanged = isContentChange(editingArticle);

    const payload: Record<string, any> = {
      nom: editForm.nom.trim(),
      description: editForm.description.trim(),
      categorie_id: editForm.categorieId,
      prix,
      stock,
    };
    if (contentChanged) {
      payload.statut = "en_attente";
      payload.actif = false;
      payload.raison_rejet = null;
    }

    setIsSaving(true);
    const supabase = createClient();
    const { error } = await supabase
      .from("articles")
      .update(payload)
      .eq("id", editingArticle.id);
    setIsSaving(false);

    if (error) {
      setEditError(`Échec de l'enregistrement : ${error.message}`);
      return;
    }

    const nouvelleCategorie = categories.find((c) => c.id === editForm.categorieId);

    setArticles((prev) =>
      prev.map((a) =>
        a.id === editingArticle.id
          ? {
              ...a,
              nom: editForm.nom.trim(),
              description: editForm.description.trim(),
              categorie_id: editForm.categorieId,
              categories: nouvelleCategorie ? { nom: nouvelleCategorie.nom } : a.categories,
              prix,
              stock,
              ...(contentChanged ? { statut: "en_attente", actif: false } : {}),
            }
          : a
      )
    );
    setEditingArticle(null);
    showToast(
      contentChanged ? "Article mis à jour — renvoyé en vérification" : "Article mis à jour",
      "success"
    );
  };

  const handleConfirmDelete = async () => {
    if (!deletingArticle) return;
    setDeleteError(null);
    setIsDeleting(true);
    const supabase = createClient();

    try {
      const paths = (deletingArticle.article_images ?? [])
        .map((img) => extractStoragePath(img.image_url))
        .filter((p): p is string => Boolean(p));

      if (paths.length > 0) {
        const { error: storageError } = await supabase.storage
          .from("articles-photos")
          .remove(paths);
        if (storageError) {
          console.warn("Nettoyage du storage échoué :", storageError.message);
        }
      }

      const { error } = await supabase.from("articles").delete().eq("id", deletingArticle.id);
      if (error) throw error;

      setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id));
      setDeletingArticle(null);
      showToast("Article supprimé", "success");
    } catch (err: any) {
      setDeleteError(
        err?.message
          ? `Échec de la suppression : ${err.message}`
          : "Une erreur est survenue pendant la suppression. Réessaie."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="px-5 sm:px-6 md:px-8 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-4 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher parmi mes articles..."
            className="w-full h-12 pl-12 pr-4 bg-gray-50 border border-transparent rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-400 focus:bg-white transition-all text-sm font-medium"
          />
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center bg-gray-50 rounded-xl p-1">
            <button
              type="button"
              onClick={() => setViewMode("grille")}
              aria-label="Vue grille"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "grille" ? "bg-white shadow-sm text-coral-500" : "text-gray-400"
              }`}
            >
              <LayoutGrid size={16} />
            </button>
            <button
              type="button"
              onClick={() => setViewMode("liste")}
              aria-label="Vue liste"
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors ${
                viewMode === "liste" ? "bg-white shadow-sm text-coral-500" : "text-gray-400"
              }`}
            >
              <List size={16} />
            </button>
          </div>

          <Link href="/vendeur/articles/nouveau">
            <Button className="h-12 px-6 rounded-2xl flex items-center gap-2 justify-center bg-coral-500 hover:bg-coral-600">
              <Plus size={20} />
              Ajouter
            </Button>
          </Link>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-1 -mx-1 px-1">
        {STATUT_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setStatutFilter(tab.key)}
            className={`shrink-0 flex items-center gap-1.5 h-9 px-4 rounded-full text-xs font-bold transition-colors ${
              statutFilter === tab.key
                ? "bg-coral-500 text-white"
                : "bg-white border border-gray-100 text-gray-500 hover:bg-gray-50"
            }`}
          >
            {tab.label}
            <span
              className={`text-[10px] font-bold rounded-full px-1.5 ${
                statutFilter === tab.key ? "bg-white/25" : "bg-gray-100"
              }`}
            >
              {statutCounts[tab.key]}
            </span>
          </button>
        ))}
      </div>

      {loadError && (
        <div className="bg-red-50 border border-red-100 rounded-3xl p-6 mb-8 flex items-start gap-3">
          <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-red-700 leading-relaxed mb-3">{loadError}</p>
            <button
              onClick={loadArticles}
              className="inline-flex items-center gap-2 text-xs font-bold text-red-700 hover:text-red-800"
            >
              <RefreshCw size={13} />
              Réessayer
            </button>
          </div>
        </div>
      )}

      {loading && !loadError && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2">
              <div className="aspect-square rounded-xl bg-gray-100 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-1/2 rounded bg-gray-100 animate-pulse" />
            </div>
          ))}
        </div>
      )}

      {!loading && !loadError && (
        <>
          {articles.length > 0 && (
            <p className="text-xs font-semibold text-gray-400 mb-4 px-1">
              {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""}
              {search && ` pour "${search}"`}
            </p>
          )}

          {filteredArticles.length === 0 && (
            <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
                <PackageX size={28} />
              </div>
              <p className="text-gray-700 font-semibold mb-1">
                {search || statutFilter !== "tous"
                  ? "Aucun article ne correspond à ces critères"
                  : "Tu n'as pas encore d'article"}
              </p>
              <p className="text-sm text-gray-400 mb-6">
                {search || statutFilter !== "tous"
                  ? "Essaie un autre mot-clé ou un autre filtre."
                  : "Ajoute ton premier article pour commencer à vendre."}
              </p>
              {!search && statutFilter === "tous" && (
                <Link href="/vendeur/articles/nouveau">
                  <Button className="h-12 px-6 rounded-2xl inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600">
                    <Plus size={18} />
                    Ajouter un article
                  </Button>
                </Link>
              )}
            </div>
          )}

          {viewMode === "grille" ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {filteredArticles.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 8) * 0.03, duration: 0.3 }}
                >
                  <VendeurArticleCard
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => {
                      setDeleteError(null);
                      setDeletingArticle(item);
                    }}
                  />
                </motion.div>
              ))}

              {filteredArticles.length > 0 && (
                <Link
                  href="/vendeur/articles/nouveau"
                  className="aspect-square rounded-xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-2 sm:gap-3 hover:bg-gray-50 hover:border-coral-300 transition-all group"
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors">
                    <Plus size={22} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-gray-400 group-hover:text-coral-500 text-center px-2">
                    Nouvel article
                  </span>
                </Link>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {filteredArticles.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 10) * 0.02, duration: 0.25 }}
                >
                  <VendeurArticleRow
                    item={item}
                    onEdit={() => openEdit(item)}
                    onDelete={() => {
                      setDeleteError(null);
                      setDeletingArticle(item);
                    }}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <AnimatePresence>
        {editingArticle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isSaving && setEditingArticle(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl max-h-[85vh] overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">Modifier l'article</h3>
                  <button
                    onClick={() => !isSaving && setEditingArticle(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Nom de l'article</label>
                    <input
                      type="text"
                      name="nom"
                      value={editForm.nom}
                      onChange={handleEditFieldChange}
                      className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        editFieldErrors.nom ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                      }`}
                    />
                    {editFieldErrors.nom && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.nom}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Description</label>
                    <textarea
                      name="description"
                      rows={3}
                      value={editForm.description}
                      onChange={handleEditFieldChange}
                      className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 resize-none transition-all ${
                        editFieldErrors.description ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                      }`}
                    />
                    {editFieldErrors.description && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.description}</p>}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Catégorie</label>
                    <select
                      name="categorieId"
                      value={editForm.categorieId}
                      onChange={handleEditFieldChange}
                      disabled={loadingCategories}
                      className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                        editFieldErrors.categorieId ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                      }`}
                    >
                      <option value="">{loadingCategories ? "Chargement..." : "Sélectionner..."}</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.nom}</option>
                      ))}
                    </select>
                    {editFieldErrors.categorieId && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.categorieId}</p>}
                    {categoriesError && <p className="text-xs text-red-500 mt-1.5">{categoriesError}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Prix (FCFA)</label>
                      <input
                        type="number"
                        name="prix"
                        value={editForm.prix}
                        onChange={handleEditFieldChange}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                          editFieldErrors.prix ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                        }`}
                      />
                      {editFieldErrors.prix && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.prix}</p>}
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Stock</label>
                      <input
                        type="number"
                        name="stock"
                        value={editForm.stock}
                        onChange={handleEditFieldChange}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                          editFieldErrors.stock ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                        }`}
                      />
                      {editFieldErrors.stock && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.stock}</p>}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 -mt-2">Mettre le stock à 0 marque l'article comme "Rupture" automatiquement.</p>

                  {editingArticle && isContentChange(editingArticle) && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Le nom, la description ou la catégorie ont changé : l'article sera renvoyé en
                        vérification et masqué des acheteurs jusqu'à validation.
                      </p>
                    </div>
                  )}

                  {editError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-relaxed">{editError}</p>
                    </div>
                  )}

                  <Button className="w-full h-12 rounded-xl mt-2 bg-coral-500 hover:bg-coral-600" onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Enregistrer"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {deletingArticle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => !isDeleting && setDeletingArticle(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-[60]"
            />
            <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center pointer-events-none">
              <motion.div
                initial={{ y: 40, opacity: 0, scale: 0.98 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 40, opacity: 0, scale: 0.98 }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="pointer-events-auto w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-6 sm:p-8 shadow-2xl"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-900">Supprimer l'article ?</h3>
                  <button
                    onClick={() => !isDeleting && setDeletingArticle(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  <strong className="text-gray-900">{deletingArticle.nom}</strong> sera définitivement retiré de votre boutique, avec ses photos. Cette action est irréversible.
                </p>

                {deleteError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3 mb-4">
                    <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-700 leading-relaxed">{deleteError}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => !isDeleting && setDeletingArticle(null)}
                    disabled={isDeleting}
                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    disabled={isDeleting}
                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors disabled:opacity-50 flex items-center justify-center"
                  >
                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : "Supprimer"}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
