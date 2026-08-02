"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  Plus, Search, Trash2, Edit3, Copy, X, Loader2, PackageX, AlertCircle, RefreshCw,
  LayoutGrid, List, Upload, Layers
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";
import { createClient } from "@/lib/supabase/client";
import { StatusBadge as SharedStatusBadge } from "@/components/ui/StatusBadge";
import { getCategoriesFormulaire, type CategorieArbre } from "@/lib/queries/articles";

const TYPES_VARIANTE = [
  { value: "couleur", label: "Couleur" },
  { value: "taille", label: "Taille" },
  { value: "modele", label: "Modèle / gamme" },
  { value: "format", label: "Format" },
] as const;
type TypeVariante = (typeof TYPES_VARIANTE)[number]["value"];
const MAX_VARIANTES = 20;

// Même logique que le formulaire d'ajout : pour le type "Taille", on propose
// la bonne liste déroulante (pointures ou S/M/L) selon le slug de la
// catégorie/sous-catégorie choisie, plutôt qu'un champ libre.
const TAILLES_VETEMENTS = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"];
const POINTURES_CHAUSSURES = Array.from({ length: 46 - 36 + 1 }, (_, i) => String(36 + i));

const SLUGS_CHAUSSURES = new Set(["mode-chaussures"]);
const SLUGS_VETEMENTS = new Set([
  "mode-vetements-homme",
  "mode-vetements-femme",
  "mode-vetements-enfant",
  "bebe-vetements",
]);

function optionsTaillePour(slug: string | null): string[] | null {
  if (!slug) return null;
  if (SLUGS_CHAUSSURES.has(slug)) return POINTURES_CHAUSSURES;
  if (SLUGS_VETEMENTS.has(slug)) return TAILLES_VETEMENTS;
  return null;
}

interface VarianteRow {
  id: string;
  type_variante: TypeVariante;
  nom_variante: string;
  prix: number | null;
  stock: number | null;
  photo_url: string | null;
  ordre: number | null;
}

interface EditPhotoEntry {
  file: File;
  preview: string;
}

interface EditVarianteEntry {
  key: string;
  dbId: string | null; // null = variante pas encore en base
  type_variante: TypeVariante;
  nom_variante: string;
  prix: string; // vide = hérite du prix de l'article
  stock: string;
  stockIllimite: boolean;
  photo_url: string | null; // photo déjà en base
  newPhoto: EditPhotoEntry | null; // remplace photo_url si présent
  photoRemoved: boolean; // retirer la photo existante sans la remplacer
  removed: boolean; // marquée pour suppression complète à l'enregistrement
}

function nouvelleEditVariante(): EditVarianteEntry {
  return {
    key: Math.random().toString(36).slice(2),
    dbId: null,
    type_variante: "couleur",
    nom_variante: "",
    prix: "",
    stock: "",
    stockIllimite: true,
    photo_url: null,
    newPhoto: null,
    photoRemoved: false,
    removed: false,
  };
}

interface ArticleImage {
  id: string;
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
  prix_promo: number | null;
  stock: number | null;
  statut: string;
  actif: boolean;
  categorie_id: string | null;
  created_at: string;
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

const MAX_PHOTOS = 5;
const MIN_DIMENSION = 600;

function checkImageDimensions(file: File): Promise<{ ok: boolean; width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: img.width >= MIN_DIMENSION && img.height >= MIN_DIMENSION, width: img.width, height: img.height });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({ ok: false, width: 0, height: 0 });
    };
    img.src = url;
  });
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

const NOUVEAU_SEUIL_JOURS = 7;

function estNouveau(createdAt: string): boolean {
  const jours = (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);
  return jours >= 0 && jours <= NOUVEAU_SEUIL_JOURS;
}

const ARTICLE_BADGE_DOTS: Record<string, string> = {
  neutral: "bg-gray-400",
  pending: "bg-amber-500",
  error: "bg-red-500",
  success: "bg-teal-500",
};

function StatusBadge({ statut, stock, actif }: { statut: string; stock: number | null; actif: boolean }) {
  let variant: "neutral" | "pending" | "error" | "success" = "success";
  let label = "En ligne";

  if (!actif) {
    variant = "neutral";
    label = "Désactivé";
  } else if (statut === "en_attente") {
    variant = "pending";
    label = "En vérification";
  } else if (statut === "rejete") {
    variant = "error";
    label = "Refusé";
  } else if (stock === 0) {
    variant = "error";
    label = "Rupture";
  }

  return (
    <SharedStatusBadge
      variant={variant}
      icon={<span className={`w-1.5 h-1.5 rounded-full ${ARTICLE_BADGE_DOTS[variant]}`} />}
    >
      {label}
    </SharedStatusBadge>
  );
}

function VendeurArticleCard({
  item,
  onEdit,
  onDelete,
  onDuplicate,
}: {
  item: ArticleRow;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
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

        {item.actif && estNouveau(item.created_at) && (
          <span className="absolute top-2 left-2 bg-gray-950 text-white text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-full">
            Nouveau
          </span>
        )}

        {item.article_images.length > 1 && (
          <span className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm text-gray-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1">
            <i className="ti ti-photo text-[11px]" />
            {item.article_images.length}
          </span>
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
            onClick={onDuplicate}
            className="w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 transition-transform"
            aria-label="Dupliquer"
          >
            <Copy size={13} className="text-gray-600" />
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

        <p className="text-xs text-gray-600 font-medium line-clamp-2 min-h-[2.2em]">{item.nom}</p>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{item.stock === null ? "Illimité" : `${item.stock} en stock`}</span>
        </div>

        <div className="flex items-center justify-between mt-0.5 gap-2">
          <p className="text-base font-black text-gray-900 whitespace-nowrap">
            {item.prix_promo != null ? (
              <>
                {item.prix_promo.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>{" "}
                <span className="text-[11px] font-medium text-gray-400 line-through">
                  {item.prix.toLocaleString("fr-FR")}
                </span>
              </>
            ) : (
              <>
                {item.prix.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>
              </>
            )}
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
  onDuplicate,
}: {
  item: ArticleRow;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
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
        <div className="flex items-center gap-1.5">
          <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest truncate">
            {categorieLabel}
          </p>
          {item.actif && estNouveau(item.created_at) && (
            <span className="shrink-0 bg-gray-950 text-white text-[9px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full">
              Nouveau
            </span>
          )}
        </div>
        <p className="text-sm text-gray-800 font-semibold truncate">{item.nom}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-sm font-black text-gray-900 whitespace-nowrap">
            {item.prix_promo != null ? (
              <>
                {item.prix_promo.toLocaleString("fr-FR")} <span className="text-[10px] font-bold">FCFA</span>{" "}
                <span className="text-[10px] font-medium text-gray-400 line-through">
                  {item.prix.toLocaleString("fr-FR")}
                </span>
              </>
            ) : (
              <>
                {item.prix.toLocaleString("fr-FR")} <span className="text-[10px] font-bold">FCFA</span>
              </>
            )}
          </p>
          <span className="text-gray-300">·</span>
          <span className="text-[11px] text-gray-400">{item.stock === null ? "Illimité" : `${item.stock} en stock`}</span>
          {item.article_images.length > 1 && (
            <>
              <span className="text-gray-300">·</span>
              <span className="text-[11px] text-gray-400 flex items-center gap-0.5">
                <i className="ti ti-photo text-[11px]" />
                {item.article_images.length}
              </span>
            </>
          )}
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
          onClick={onDuplicate}
          className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors"
          aria-label="Dupliquer"
        >
          <Copy size={14} className="text-gray-600" />
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
  const router = useRouter();

  const [articles, setArticles] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statutFilter, setStatutFilter] = useState<StatutFilter>("tous");
  const [viewMode, setViewMode] = useState<ViewMode>("grille");

  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);

  const [editingArticle, setEditingArticle] = useState<ArticleRow | null>(null);
  const [editForm, setEditForm] = useState(emptyEditForm);
  const [editStockIllimite, setEditStockIllimite] = useState(false);
  const [editFieldErrors, setEditFieldErrors] = useState<Record<string, string>>({});
  const [editError, setEditError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Catégorie/sous-catégorie : formData ne stocke que l'id final (feuille),
  // parentCategorieId pilote l'affichage du second select.
  const [editParentCategorieId, setEditParentCategorieId] = useState("");
  const editCategorieParente = categories.find((c) => c.id === editParentCategorieId) || null;
  const editADesSousCategories = (editCategorieParente?.sousCategories.length ?? 0) > 0;

  // Slug de la catégorie retenue pour l'article en cours d'édition — sert à
  // proposer le bon référentiel de tailles (pointures vs S/M/L).
  const editSlugCategorieChoisie = editADesSousCategories
    ? editCategorieParente?.sousCategories.find((sc) => sc.id === editForm.categorieId)?.slug ?? null
    : editCategorieParente?.slug ?? null;
  const editOptionsTailleActuelles = optionsTaillePour(editSlugCategorieChoisie);

  // --- Promotion ---
  const [editEnPromo, setEditEnPromo] = useState(false);
  const [editModePromo, setEditModePromo] = useState<"nouveau_prix" | "pourcentage">("nouveau_prix");
  const [editPourcentagePromo, setEditPourcentagePromo] = useState("");
  const [editNouveauPrixPromo, setEditNouveauPrixPromo] = useState("");

  const editPrixNumerique = Number(editForm.prix) || 0;

  const editPromoCalcul = (() => {
    if (!editEnPromo || editPrixNumerique <= 0) return null;
    if (editModePromo === "pourcentage") {
      const pct = Number(editPourcentagePromo);
      if (!editPourcentagePromo || isNaN(pct) || pct <= 0 || pct >= 100) return null;
      const nouveauPrix = Math.round(editPrixNumerique * (1 - pct / 100));
      return { nouveauPrix, pourcentage: -Math.round(pct) };
    }
    const nouveauPrix = Number(editNouveauPrixPromo);
    if (!editNouveauPrixPromo || isNaN(nouveauPrix) || nouveauPrix <= 0 || nouveauPrix >= editPrixNumerique) return null;
    const pourcentage = -Math.round(((editPrixNumerique - nouveauPrix) / editPrixNumerique) * 100);
    return { nouveauPrix, pourcentage };
  })();

  const [editExistingPhotos, setEditExistingPhotos] = useState<ArticleImage[]>([]);
  const [editRemovedPhotoIds, setEditRemovedPhotoIds] = useState<string[]>([]);
  const [editNewPhotos, setEditNewPhotos] = useState<EditPhotoEntry[]>([]);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);
  const [editUploadingPhoto, setEditUploadingPhoto] = useState(false);
  const editFileInputRef = useRef<HTMLInputElement>(null);

  const [editVariantes, setEditVariantes] = useState<EditVarianteEntry[]>([]);
  const [editVariantesLoading, setEditVariantesLoading] = useState(false);
  const [editVarianteErrors, setEditVarianteErrors] = useState<Record<string, string>>({});

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
      .select("id, nom, description, prix, prix_promo, stock, statut, actif, categorie_id, created_at, categories(nom), article_images(id, image_url, ordre)")
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
    try {
      const data = await getCategoriesFormulaire();
      setCategories(data ?? []);
    } catch {
      setCategoriesError("Impossible de charger les catégories.");
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
      stock: article.stock != null ? String(article.stock) : "1",
    });
    setEditStockIllimite(article.stock === null);

    // Catégorie : retrouve le parent correspondant à la sous-catégorie (ou à
    // la catégorie elle-même si elle n'a pas de sous-catégories) pour que le
    // sélecteur affiche la bonne valeur dès l'ouverture.
    const parentDirect = categories.find((c) => c.id === article.categorie_id);
    const parentAvecSousCategorie = categories.find((c) =>
      c.sousCategories.some((sc) => sc.id === article.categorie_id)
    );
    setEditParentCategorieId(parentDirect?.id ?? parentAvecSousCategorie?.id ?? "");

    // Promo : un article déjà en promo se rouvre avec le nouveau prix
    // pré-rempli, modifiable directement (le vendeur peut aussi désactiver
    // la promo ou repasser en mode "%").
    setEditEnPromo(article.prix_promo != null);
    setEditModePromo("nouveau_prix");
    setEditNouveauPrixPromo(article.prix_promo != null ? String(article.prix_promo) : "");
    setEditPourcentagePromo("");

    // Nettoie d'éventuelles prévisualisations laissées par une précédente
    // ouverture du modal sans sauvegarde.
    editNewPhotos.forEach((p) => URL.revokeObjectURL(p.preview));
    setEditNewPhotos([]);
    setEditRemovedPhotoIds([]);
    setEditPhotoError(null);
    setEditExistingPhotos(
      [...(article.article_images ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0))
    );

    editVariantes.forEach((v) => v.newPhoto && URL.revokeObjectURL(v.newPhoto.preview));
    setEditVariantes([]);
    setEditVarianteErrors({});
    setEditVariantesLoading(true);
    const supabase = createClient();
    supabase
      .from("article_variantes")
      .select("id, type_variante, nom_variante, prix, stock, photo_url, ordre")
      .eq("article_id", article.id)
      .order("ordre", { ascending: true })
      .then(({ data }: { data: VarianteRow[] | null }) => {
        const rows = (data as VarianteRow[] | null) ?? [];
        setEditVariantes(
          rows.map((r) => ({
            key: r.id,
            dbId: r.id,
            type_variante: r.type_variante,
            nom_variante: r.nom_variante,
            prix: r.prix != null ? String(r.prix) : "",
            stock: r.stock != null ? String(r.stock) : "",
            stockIllimite: r.stock == null,
            photo_url: r.photo_url,
            newPhoto: null,
            photoRemoved: false,
            removed: false,
          }))
        );
        setEditVariantesLoading(false);
      });
  };

  // Filet de sécurité : si le modal s'ouvre avant que loadCategories() ait
  // fini (premier chargement de page), on retrouve le parent dès que
  // l'arbre de catégories arrive.
  useEffect(() => {
    if (!editingArticle || editParentCategorieId || categories.length === 0) return;
    const parentDirect = categories.find((c) => c.id === editingArticle.categorie_id);
    if (parentDirect) {
      setEditParentCategorieId(parentDirect.id);
      return;
    }
    const parentAvecSousCategorie = categories.find((c) =>
      c.sousCategories.some((sc) => sc.id === editingArticle.categorie_id)
    );
    if (parentAvecSousCategorie) setEditParentCategorieId(parentAvecSousCategorie.id);
  }, [categories, editingArticle, editParentCategorieId]);

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
    if (!editParentCategorieId) {
      errors.categorieId = "Choisis une catégorie.";
    } else if (editADesSousCategories && !editForm.categorieId) {
      errors.categorieId = "Choisis une sous-catégorie.";
    }

    const prixNum = Number(editForm.prix);
    if (!editForm.prix.trim() || isNaN(prixNum) || prixNum <= 0) {
      errors.prix = "Indique un prix valide, supérieur à 0.";
    } else if (prixNum > 5_000_000) {
      errors.prix = "Ce prix semble très élevé — vérifie qu'il est correct.";
    }

    if (!editStockIllimite) {
      const stockNum = Number(editForm.stock);
      if (editForm.stock.trim() === "" || isNaN(stockNum) || stockNum < 0) {
        errors.stock = "Le stock doit être un nombre entier positif ou nul.";
      }
    }

    if (editEnPromo && !editPromoCalcul) {
      errors.promo =
        editModePromo === "pourcentage"
          ? "Indique un pourcentage de réduction valide (entre 1 et 99)."
          : "Le nouveau prix doit être positif et inférieur au prix normal.";
    }

    setEditFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const isContentChange = (article: ArticleRow) =>
    editForm.nom.trim() !== article.nom ||
    editForm.description.trim() !== (article.description ?? "") ||
    editForm.categorieId !== (article.categorie_id ?? "");

  const isPhotosChanged = () => editRemovedPhotoIds.length > 0 || editNewPhotos.length > 0;

  const editRemainingSlots = () =>
    MAX_PHOTOS - (editExistingPhotos.length - editRemovedPhotoIds.length) - editNewPhotos.length;

  const handleEditFilesSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    setEditPhotoError(null);
    if (files.length === 0) return;

    const remaining = editRemainingSlots();
    if (files.length > remaining) {
      setEditPhotoError(
        remaining > 0
          ? `Tu peux ajouter ${remaining} photo${remaining > 1 ? "s" : ""} de plus maximum.`
          : `Tu as déjà atteint la limite de ${MAX_PHOTOS} photos — retire-en une avant d'en ajouter une autre.`
      );
    }

    setEditUploadingPhoto(true);
    const candidats = files.slice(0, Math.max(remaining, 0));

    for (const file of candidats) {
      if (!file.type.startsWith("image/")) {
        setEditPhotoError("Seules les images sont acceptées (JPG, PNG).");
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        setEditPhotoError(`"${file.name}" dépasse 5 Mo — compresse-la ou choisis-en une autre.`);
        continue;
      }
      const { ok, width, height } = await checkImageDimensions(file);
      if (!ok) {
        setEditPhotoError(
          `"${file.name}" est trop petite (${width}×${height}px) — utilise une photo d'au moins ${MIN_DIMENSION}×${MIN_DIMENSION}px.`
        );
        continue;
      }
      const preview = URL.createObjectURL(file);
      setEditNewPhotos((prev) => [...prev, { file, preview }]);
    }

    setEditUploadingPhoto(false);
    if (editFileInputRef.current) editFileInputRef.current.value = "";
  };

  const removeExistingEditPhoto = (id: string) => {
    setEditRemovedPhotoIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
  };

  const removeNewEditPhoto = (index: number) => {
    setEditNewPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const addEditVariante = () => {
    if (editVariantes.filter((v) => !v.removed).length >= MAX_VARIANTES) return;
    setEditVariantes((prev) => [...prev, nouvelleEditVariante()]);
  };

  const removeEditVariante = (key: string) => {
    setEditVariantes((prev) => {
      const target = prev.find((v) => v.key === key);
      if (!target) return prev;
      // Variante déjà en base : on la marque simplement pour suppression à
      // l'enregistrement (permet d'annuler en la retirant de la liste
      // affichée sans perdre la trace de la suppression à effectuer).
      if (target.dbId) {
        return prev.map((v) => (v.key === key ? { ...v, removed: true } : v));
      }
      if (target.newPhoto) URL.revokeObjectURL(target.newPhoto.preview);
      return prev.filter((v) => v.key !== key);
    });
    setEditVarianteErrors((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const updateEditVariante = (key: string, patch: Partial<EditVarianteEntry>) => {
    setEditVariantes((prev) => prev.map((v) => (v.key === key ? { ...v, ...patch } : v)));
    setEditVarianteErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const handleEditVariantePhoto = async (key: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setEditVarianteErrors((prev) => ({ ...prev, [key]: "Seules les images sont acceptées (JPG, PNG)." }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setEditVarianteErrors((prev) => ({ ...prev, [key]: "Cette photo dépasse 5 Mo." }));
      return;
    }
    const { ok, width, height } = await checkImageDimensions(file);
    if (!ok) {
      setEditVarianteErrors((prev) => ({
        ...prev,
        [key]: `Photo trop petite (${width}×${height}px) — au moins ${MIN_DIMENSION}×${MIN_DIMENSION}px.`,
      }));
      return;
    }
    const current = editVariantes.find((v) => v.key === key);
    if (current?.newPhoto) URL.revokeObjectURL(current.newPhoto.preview);
    updateEditVariante(key, { newPhoto: { file, preview: URL.createObjectURL(file) }, photoRemoved: false });
  };

  const validateEditVariantes = () => {
    const errors: Record<string, string> = {};
    for (const v of editVariantes) {
      if (v.removed) continue;
      if (v.nom_variante.trim().length < 1) {
        errors[v.key] = "Donne un nom à cette variante (ex: Noir, XL, 13 Pro Max).";
        continue;
      }
      if (v.prix.trim() !== "") {
        const prixNum = Number(v.prix);
        if (isNaN(prixNum) || prixNum <= 0) {
          errors[v.key] = "Le prix de la variante doit être un nombre positif, ou laissé vide pour hériter du prix de l'article.";
          continue;
        }
      }
      if (!v.stockIllimite && v.stock.trim() !== "") {
        const stockNum = Number(v.stock);
        if (isNaN(stockNum) || stockNum < 0) {
          errors[v.key] = "Le stock de la variante doit être un nombre positif.";
        }
      }
    }
    setEditVarianteErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;
    setEditError(null);
    setEditPhotoError(null);
    if (!validateEditForm()) return;
    if (!validateEditVariantes()) return;

    const survivingExisting = editExistingPhotos.filter(
      (p) => !editRemovedPhotoIds.includes(p.id)
    );
    if (survivingExisting.length + editNewPhotos.length === 0) {
      setEditPhotoError("Garde au moins une photo — un article sans photo ne peut pas être publié.");
      return;
    }

    const prix = Number(editForm.prix);
    const stock = editStockIllimite ? null : Number(editForm.stock);
    const contentChanged = isContentChange(editingArticle) || isPhotosChanged();

    setIsSaving(true);
    const supabase = createClient();
    const uploadedPaths: string[] = [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Ta session a expiré — reconnecte-toi puis réessaie.");
      }

      // 1. Upload des nouvelles photos d'abord — si l'une échoue, rien n'a
      // encore été modifié en base.
      const nouvellesPhotosUrls: { url: string }[] = [];
      for (let i = 0; i < editNewPhotos.length; i++) {
        const photo = editNewPhotos[i];
        const ext = photo.file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;

        const { error: uploadErr } = await supabase.storage
          .from("articles-photos")
          .upload(path, photo.file, { upsert: true });
        if (uploadErr) {
          throw new Error(`Échec de l'envoi de la photo ${i + 1} : ${uploadErr.message}`);
        }
        uploadedPaths.push(path);
        const { data: urlData } = supabase.storage.from("articles-photos").getPublicUrl(path);
        nouvellesPhotosUrls.push({ url: urlData.publicUrl });
      }

      // 2. Supprimer les photos retirées (fichier storage + ligne en base)
      if (editRemovedPhotoIds.length > 0) {
        const pathsToRemove = editExistingPhotos
          .filter((p) => editRemovedPhotoIds.includes(p.id))
          .map((p) => extractStoragePath(p.image_url))
          .filter((p): p is string => Boolean(p));

        if (pathsToRemove.length > 0) {
          const { error: storageError } = await supabase.storage
            .from("articles-photos")
            .remove(pathsToRemove);
          if (storageError) {
            console.warn("Nettoyage du storage échoué :", storageError.message);
          }
        }

        const { error: deleteImagesError } = await supabase
          .from("article_images")
          .delete()
          .in("id", editRemovedPhotoIds);
        if (deleteImagesError) {
          throw new Error(`Échec de la suppression des photos retirées : ${deleteImagesError.message}`);
        }
      }

      // 3. Réordonner les photos restantes puis insérer les nouvelles, pour
      // que l'ordre en base corresponde à ce qui était affiché dans le modal.
      for (let i = 0; i < survivingExisting.length; i++) {
        const photo = survivingExisting[i];
        if (photo.ordre !== i) {
          const { error: reorderError } = await supabase
            .from("article_images")
            .update({ ordre: i })
            .eq("id", photo.id);
          if (reorderError) {
            throw new Error(`Échec de la mise à jour de l'ordre des photos : ${reorderError.message}`);
          }
        }
      }

      if (nouvellesPhotosUrls.length > 0) {
        const { error: insertImagesError } = await supabase.from("article_images").insert(
          nouvellesPhotosUrls.map((p, i) => ({
            article_id: editingArticle.id,
            image_url: p.url,
            ordre: survivingExisting.length + i,
          }))
        );
        if (insertImagesError) {
          throw new Error(`Échec de l'ajout des nouvelles photos : ${insertImagesError.message}`);
        }
      }

      // 4. Mettre à jour les informations de l'article
      const payload: Record<string, any> = {
        nom: editForm.nom.trim(),
        description: editForm.description.trim(),
        categorie_id: editForm.categorieId,
        prix,
        prix_promo: editPromoCalcul ? editPromoCalcul.nouveauPrix : null,
        stock,
      };
      if (contentChanged) {
        payload.statut = "en_attente";
        payload.actif = false;
        payload.raison_rejet = null;
      }

      const { error: updateError } = await supabase
        .from("articles")
        .update(payload)
        .eq("id", editingArticle.id);
      if (updateError) {
        throw new Error(`Échec de l'enregistrement : ${updateError.message}`);
      }

      // 5. Variantes : suppression de celles marquées, upload des nouvelles
      // photos, mise à jour des variantes existantes, insertion des nouvelles.
      const aSupprimer = editVariantes.filter((v) => v.removed && v.dbId);
      if (aSupprimer.length > 0) {
        const pathsToRemove = aSupprimer
          .map((v) => (v.photo_url ? extractStoragePath(v.photo_url) : null))
          .filter((p): p is string => Boolean(p));
        if (pathsToRemove.length > 0) {
          await supabase.storage.from("articles-photos").remove(pathsToRemove).catch(() => {});
        }
        const { error: deleteVariantesError } = await supabase
          .from("article_variantes")
          .delete()
          .in("id", aSupprimer.map((v) => v.dbId as string));
        if (deleteVariantesError) {
          throw new Error(`Échec de la suppression de variantes : ${deleteVariantesError.message}`);
        }
      }

      const aConserver = editVariantes.filter((v) => !v.removed);
      for (let i = 0; i < aConserver.length; i++) {
        const v = aConserver[i];
        let photo_url = v.photo_url;

        if (v.newPhoto) {
          const ext = v.newPhoto.file.name.split(".").pop() || "jpg";
          const path = `${user.id}/variantes/${Date.now()}-${i}-${Math.random().toString(36).slice(2)}.${ext}`;
          const { error: uploadErr } = await supabase.storage
            .from("articles-photos")
            .upload(path, v.newPhoto.file, { upsert: true });
          if (uploadErr) {
            throw new Error(`Échec de l'envoi de la photo de la variante "${v.nom_variante}" : ${uploadErr.message}`);
          }
          uploadedPaths.push(path);
          if (v.photo_url) {
            const oldPath = extractStoragePath(v.photo_url);
            if (oldPath) await supabase.storage.from("articles-photos").remove([oldPath]).catch(() => {});
          }
          const { data: urlData } = supabase.storage.from("articles-photos").getPublicUrl(path);
          photo_url = urlData.publicUrl;
        } else if (v.photoRemoved && v.photo_url) {
          const oldPath = extractStoragePath(v.photo_url);
          if (oldPath) await supabase.storage.from("articles-photos").remove([oldPath]).catch(() => {});
          photo_url = null;
        }

        const variantePayload = {
          type_variante: v.type_variante,
          nom_variante: v.nom_variante.trim(),
          prix: v.prix.trim() === "" ? null : Number(v.prix),
          stock: v.stockIllimite || v.stock.trim() === "" ? null : Number(v.stock),
          photo_url,
          ordre: i,
        };

        if (v.dbId) {
          const { error: updateVarianteError } = await supabase
            .from("article_variantes")
            .update(variantePayload)
            .eq("id", v.dbId);
          if (updateVarianteError) {
            throw new Error(`Échec de la mise à jour de la variante "${v.nom_variante}" : ${updateVarianteError.message}`);
          }
        } else {
          const { error: insertVarianteError } = await supabase
            .from("article_variantes")
            .insert({ ...variantePayload, article_id: editingArticle.id });
          if (insertVarianteError) {
            throw new Error(`Échec de l'ajout de la variante "${v.nom_variante}" : ${insertVarianteError.message}`);
          }
        }
      }

      setEditingArticle(null);
      setEditNewPhotos([]);
      setEditRemovedPhotoIds([]);
      setEditVariantes([]);
      await loadArticles();
      showToast(
        contentChanged ? "Article mis à jour — renvoyé en vérification" : "Article mis à jour",
        "success"
      );
    } catch (err: any) {
      // Nettoie les photos déjà envoyées si une étape suivante a échoué,
      // pour éviter des fichiers orphelins dans le storage.
      if (uploadedPaths.length > 0) {
        await supabase.storage.from("articles-photos").remove(uploadedPaths).catch(() => {});
      }
      setEditError(err?.message || "Une erreur est survenue pendant l'enregistrement. Réessaie.");
    } finally {
      setIsSaving(false);
    }
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
  <DashboardLayout role="vendeur" title="Mes articles" backHref="/vendeur/dashboard" backLabel="Dashboard">
  <div className="w-full min-w-0 px-5 sm:px-6 md:px-8 lg:px-10 py-6 lg:py-10 max-w-7xl mx-auto">
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
                    onDuplicate={() => router.push(`/vendeur/articles/nouveau?dupliquer=${item.id}`)}
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
                    onDuplicate={() => router.push(`/vendeur/articles/nouveau?dupliquer=${item.id}`)}
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
                      name="editParentCategorieId"
                      value={editParentCategorieId}
                      onChange={(e) => {
                        const id = e.target.value;
                        setEditParentCategorieId(id);
                        const parent = categories.find((c) => c.id === id);
                        setEditForm((prev) => ({
                          ...prev,
                          categorieId: parent && parent.sousCategories.length === 0 ? id : "",
                        }));
                        setEditFieldErrors((prev) => ({ ...prev, categorieId: "" }));
                      }}
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
                    {categoriesError && <p className="text-xs text-red-500 mt-1.5">{categoriesError}</p>}
                  </div>

                  {editADesSousCategories && (
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Sous-catégorie</label>
                      <select
                        name="categorieId"
                        value={editForm.categorieId}
                        onChange={handleEditFieldChange}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                          editFieldErrors.categorieId ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                        }`}
                      >
                        <option value="">Sélectionner...</option>
                        {editCategorieParente?.sousCategories.map((sc) => (
                          <option key={sc.id} value={sc.id}>{sc.nom}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  {editFieldErrors.categorieId && <p className="text-xs text-red-500 -mt-2">{editFieldErrors.categorieId}</p>}

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
                        disabled={editStockIllimite}
                        className={`w-full h-12 px-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 transition-all ${
                          editStockIllimite ? "bg-gray-50 text-gray-400" : ""
                        } ${
                          editFieldErrors.stock ? "border-red-300 focus:ring-red-100 focus:border-red-400" : "border-gray-200 focus:ring-coral-200 focus:border-coral-400"
                        }`}
                      />
                      <label className="flex items-center gap-2 mt-2 text-[11px] text-gray-600 font-medium">
                        <input
                          type="checkbox"
                          checked={editStockIllimite}
                          onChange={(e) => setEditStockIllimite(e.target.checked)}
                          className="rounded border-gray-300 text-coral-500 focus:ring-coral-400"
                        />
                        Stock illimité
                      </label>
                      {editFieldErrors.stock && <p className="text-xs text-red-500 mt-1.5">{editFieldErrors.stock}</p>}
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-400 -mt-2">Mettre le stock à 0 marque l'article comme "Rupture" automatiquement.</p>

                  <div className="rounded-2xl border border-gray-100 p-4 bg-gray-50/60">
                    <label className="flex items-center gap-3 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={editEnPromo}
                        onChange={(e) => setEditEnPromo(e.target.checked)}
                        className="w-4 h-4 rounded border-gray-300 text-coral-500 focus:ring-coral-200"
                      />
                      <span className="text-sm font-semibold text-gray-800">Article en promotion</span>
                    </label>

                    {editEnPromo && (
                      <div className="mt-4 space-y-3">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => setEditModePromo("pourcentage")}
                            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                              editModePromo === "pourcentage" ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                            }`}
                          >
                            Je donne le %
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditModePromo("nouveau_prix")}
                            className={`flex-1 h-9 rounded-lg text-xs font-bold transition-colors ${
                              editModePromo === "nouveau_prix" ? "bg-coral-500 text-white" : "bg-white border border-gray-200 text-gray-600"
                            }`}
                          >
                            Je donne le nouveau prix
                          </button>
                        </div>

                        {editModePromo === "pourcentage" ? (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Pourcentage de réduction (%)</label>
                            <input
                              type="number"
                              min={1}
                              max={99}
                              placeholder="15"
                              value={editPourcentagePromo}
                              onChange={(e) => setEditPourcentagePromo(e.target.value)}
                              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                            />
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">Nouveau prix (FCFA)</label>
                            <input
                              type="number"
                              min={1}
                              placeholder="4250"
                              value={editNouveauPrixPromo}
                              onChange={(e) => setEditNouveauPrixPromo(e.target.value)}
                              className="w-full h-11 px-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                            />
                          </div>
                        )}

                        {editFieldErrors.promo && (
                          <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> {editFieldErrors.promo}</p>
                        )}

                        {editPromoCalcul && (
                          <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-xl px-3 py-2.5">
                            <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-red-500 text-white text-[11px] font-bold gap-1">
                              ★ {editPromoCalcul.pourcentage}%
                            </span>
                            <span className="text-sm text-gray-400 line-through">{editPrixNumerique.toLocaleString("fr-FR")} FCFA</span>
                            <span className="text-sm font-bold text-gray-900">{editPromoCalcul.nouveauPrix.toLocaleString("fr-FR")} FCFA</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">
                      Photos ({editExistingPhotos.length - editRemovedPhotoIds.length + editNewPhotos.length}/{MAX_PHOTOS})
                    </label>

                    <input
                      ref={editFileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleEditFilesSelected}
                      className="hidden"
                    />

                    <div className="grid grid-cols-3 gap-2">
                      {editExistingPhotos
                        .filter((p) => !editRemovedPhotoIds.includes(p.id))
                        .map((photo, i) => (
                          <div key={photo.id} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                            <img src={photo.image_url} alt="" className="w-full h-full object-cover" />
                            {i === 0 && (
                              <span className="absolute bottom-1.5 left-1.5 bg-white/90 backdrop-blur-sm text-[9px] font-bold text-gray-700 px-1.5 py-0.5 rounded-full">
                                Principale
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => removeExistingEditPhoto(photo.id)}
                              className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                              aria-label="Retirer la photo"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}

                      {editNewPhotos.map((photo, i) => (
                        <div key={photo.preview} className="relative aspect-square rounded-xl overflow-hidden border border-gray-100 group">
                          <img src={photo.preview} alt="" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => removeNewEditPhoto(i)}
                            className="absolute top-1.5 right-1.5 w-6 h-6 bg-black/60 backdrop-blur-sm text-white rounded-full flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                            aria-label="Retirer la photo"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ))}

                      {editRemainingSlots() > 0 && (
                        <button
                          type="button"
                          onClick={() => editFileInputRef.current?.click()}
                          disabled={editUploadingPhoto}
                          className="aspect-square rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1 hover:bg-gray-100 hover:border-coral-300 transition-colors disabled:opacity-50"
                        >
                          <Upload size={16} className="text-gray-400" />
                          <span className="text-[10px] font-medium text-gray-500">
                            {editUploadingPhoto ? "..." : "Ajouter"}
                          </span>
                        </button>
                      )}
                    </div>

                    {editPhotoError && (
                      <p className="text-xs text-red-500 mt-2">{editPhotoError}</p>
                    )}
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Layers size={12} /> Variantes (optionnel)
                    </label>

                    {editVariantesLoading ? (
                      <div className="flex items-center gap-2 text-xs text-gray-400 py-2">
                        <Loader2 size={14} className="animate-spin" /> Chargement des variantes...
                      </div>
                    ) : (
                      <div className="flex flex-col gap-3">
                        {editVariantes
                          .filter((v) => !v.removed)
                          .map((v) => (
                            <div key={v.key} className="rounded-xl border border-gray-100 bg-gray-50/60 p-3 flex flex-col gap-2.5">
                              <div className="flex items-start gap-2">
                                <div className="grid grid-cols-2 gap-2 flex-1">
                                  <select
                                    value={v.type_variante}
                                    onChange={(e) => updateEditVariante(v.key, { type_variante: e.target.value as TypeVariante })}
                                    className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                                  >
                                    {TYPES_VARIANTE.map((t) => (
                                      <option key={t.value} value={t.value}>{t.label}</option>
                                    ))}
                                  </select>
                                  {v.type_variante === "taille" && editOptionsTailleActuelles ? (
                                    <select
                                      value={v.nom_variante}
                                      onChange={(e) => updateEditVariante(v.key, { nom_variante: e.target.value })}
                                      className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                                    >
                                      <option value="">Choisir...</option>
                                      {editOptionsTailleActuelles.map((taille) => (
                                        <option key={taille} value={taille}>{taille}</option>
                                      ))}
                                    </select>
                                  ) : (
                                    <input
                                      type="text"
                                      placeholder="Ex: Noir, XL, 13 Pro Max"
                                      value={v.nom_variante}
                                      onChange={(e) => updateEditVariante(v.key, { nom_variante: e.target.value })}
                                      className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                                    />
                                  )}
                                </div>
                                <button
                                  type="button"
                                  onClick={() => removeEditVariante(v.key)}
                                  className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                                  aria-label="Retirer cette variante"
                                >
                                  <X size={14} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="number"
                                  placeholder={`Même prix (${editForm.prix || "—"})`}
                                  value={v.prix}
                                  onChange={(e) => updateEditVariante(v.key, { prix: e.target.value })}
                                  className="w-full h-9 px-2 rounded-lg border border-gray-200 text-xs focus:outline-none focus:ring-2 focus:border-coral-400 focus:ring-coral-100"
                                />
                                <div>
                                  <input
                                    type="number"
                                    min={0}
                                    placeholder="Illimité"
                                    value={v.stock}
                                    onChange={(e) => updateEditVariante(v.key, { stock: e.target.value })}
                                    disabled={v.stockIllimite}
                                    className={`w-full h-9 px-2 rounded-lg border text-xs focus:outline-none focus:ring-2 transition-shadow ${
                                      v.stockIllimite ? "bg-gray-100 text-gray-400" : "border-gray-200 focus:border-coral-400 focus:ring-coral-100"
                                    }`}
                                  />
                                  <label className="flex items-center gap-1.5 mt-1 text-[10px] text-gray-500 font-medium">
                                    <input
                                      type="checkbox"
                                      checked={v.stockIllimite}
                                      onChange={(e) => updateEditVariante(v.key, { stockIllimite: e.target.checked })}
                                      className="rounded border-gray-300 text-coral-500 focus:ring-coral-400"
                                    />
                                    Illimité
                                  </label>
                                </div>
                              </div>

                              <div className="flex items-center gap-2">
                                {v.newPhoto ? (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                    <img src={v.newPhoto.preview} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => updateEditVariante(v.key, { newPhoto: null })}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center"
                                      aria-label="Retirer la nouvelle photo"
                                    >
                                      <X size={9} />
                                    </button>
                                  </div>
                                ) : v.photo_url && !v.photoRemoved ? (
                                  <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-gray-200 shrink-0">
                                    <img src={v.photo_url} alt="" className="w-full h-full object-cover" />
                                    <button
                                      type="button"
                                      onClick={() => updateEditVariante(v.key, { photoRemoved: true })}
                                      className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full flex items-center justify-center"
                                      aria-label="Retirer la photo"
                                    >
                                      <X size={9} />
                                    </button>
                                  </div>
                                ) : (
                                  <label className="w-12 h-12 rounded-lg border-2 border-dashed border-gray-200 bg-white flex items-center justify-center text-gray-400 cursor-pointer hover:border-coral-300 hover:text-coral-400 transition-colors shrink-0">
                                    <Upload size={13} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={(e) => handleEditVariantePhoto(v.key, e.target.files?.[0] ?? null)}
                                    />
                                  </label>
                                )}
                                <p className="text-[10px] text-gray-400 leading-relaxed">Photo (optionnel)</p>
                              </div>

                              {editVarianteErrors[v.key] && (
                                <p className="text-[11px] text-red-500 flex items-center gap-1">
                                  <AlertCircle size={11} /> {editVarianteErrors[v.key]}
                                </p>
                              )}
                            </div>
                          ))}

                        <button
                          type="button"
                          onClick={addEditVariante}
                          disabled={editVariantes.filter((v) => !v.removed).length >= MAX_VARIANTES}
                          className="flex items-center justify-center gap-1.5 h-10 rounded-xl border-2 border-dashed border-gray-200 text-xs font-medium text-gray-500 hover:bg-gray-50 hover:border-coral-300 hover:text-coral-500 transition-colors disabled:opacity-50"
                        >
                          <Plus size={14} />
                          Ajouter une variante
                        </button>
                      </div>
                    )}
                  </div>

                  {editingArticle && (isContentChange(editingArticle) || isPhotosChanged()) && (
                    <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-xl p-3">
                      <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-700 leading-relaxed">
                        Le nom, la description, la catégorie ou les photos ont changé : l'article sera
                        renvoyé en vérification et masqué des acheteurs jusqu'à validation.
                      </p>
                    </div>
                  )}

                  {editingArticle &&
                    editExistingPhotos.filter((p) => !editRemovedPhotoIds.includes(p.id)).length +
                      editNewPhotos.length ===
                      0 && (
                      <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                        <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                        <p className="text-xs text-red-700 leading-relaxed">
                          Garde au moins une photo — remets-en une avant de pouvoir enregistrer.
                        </p>
                      </div>
                    )}

                  {editError && (
                    <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-xl p-3">
                      <AlertCircle size={15} className="text-red-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-red-700 leading-relaxed">{editError}</p>
                    </div>
                  )}

                  <Button
                    className="w-full h-12 rounded-xl mt-2 bg-coral-500 hover:bg-coral-600"
                    onClick={handleSaveEdit}
                    disabled={
                      isSaving ||
                      (!!editingArticle &&
                        editExistingPhotos.filter((p) => !editRemovedPhotoIds.includes(p.id)).length +
                          editNewPhotos.length ===
                          0)
                    }
                  >
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
  </DashboardLayout>
  );
}
