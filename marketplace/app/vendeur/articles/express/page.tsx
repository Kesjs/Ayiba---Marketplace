"use client";

import {
  useState,
  useRef,
  useEffect,
  useCallback,
} from "react";
import {
  ArrowLeft,
  Upload,
  X,
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  Check,
  LayoutGrid,
  SlidersHorizontal,
  Wand2,
  Image as ImageIcon,
  AlertCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/lib/supabase/client";
import { getCategoriesFormulaire, type CategorieArbre } from "@/lib/queries/articles";
import { compressImage } from "@/lib/imageCompressor";
import { determinerStatutInitial } from "@/lib/articles/moderation";
import { useToast } from "@/context/ToastContext";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PhotoEntry {
  id: string;
  file: File;
  preview: string;
}

interface ExpressCard {
  id: string;
  photos: PhotoEntry[];
  nom: string;
  prix: string;
  prixPromo: string;
  categorieId: string;
  stock: string;
  description: string;
  tags: string[];
  aiLoading: boolean;
}

function createEmptyCard(categorieId = ""): ExpressCard {
  return {
    id: crypto.randomUUID(),
    photos: [],
    nom: "",
    prix: "",
    prixPromo: "",
    categorieId,
    stock: "1",
    description: "",
    tags: [],
    aiLoading: false,
  };
}

function isCardComplete(card: ExpressCard): boolean {
  return !!(
    card.nom.trim() &&
    card.prix &&
    !isNaN(Number(card.prix)) &&
    Number(card.prix) > 0 &&
    card.photos.length > 0
  );
}

// ─── Sous-composant : Carte Produit ──────────────────────────────────────────

interface ExpressCardProps {
  card: ExpressCard;
  index: number;
  flatCategories: { id: string; nom: string }[];
  onUpdate: (id: string, field: keyof ExpressCard, value: any) => void;
  onRemove: (id: string) => void;
  onAddPhotos: (id: string, files: FileList) => void;
  onRemovePhoto: (cardId: string, photoId: string) => void;
  onGenerateDescription: (id: string) => void;
}

function ProductCard({
  card,
  index,
  flatCategories,
  onUpdate,
  onRemove,
  onAddPhotos,
  onRemovePhoto,
  onGenerateDescription,
}: ExpressCardProps) {
  const photoInputRef = useRef<HTMLInputElement>(null);
  const complete = isCardComplete(card);

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={[
        "bg-white rounded-3xl border flex flex-col overflow-hidden shadow-sm transition-shadow hover:shadow-md",
        complete
          ? "border-emerald-200 ring-1 ring-emerald-300/30"
          : "border-gray-100",
      ].join(" ")}
    >
      {/* En-tête de la carte */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/60">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-coral-500 text-white flex items-center justify-center text-[11px] font-black leading-none">
            {index + 1}
          </span>
          <span className="text-xs font-bold text-gray-700">
            Article {index + 1}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {complete ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
              <Check size={11} strokeWidth={3} />
              Prêt
            </span>
          ) : (
            <span className="text-[11px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
              Incomplet
            </span>
          )}
          <button
            type="button"
            onClick={() => onRemove(card.id)}
            className="p-1.5 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            aria-label="Supprimer cette carte"
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* Corps de la carte */}
      <div className="p-4 space-y-4 flex-1">

        {/* Zone photos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Photos ({card.photos.length})
            </span>
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-coral-600 hover:text-coral-700 transition-colors"
            >
              <Plus size={11} strokeWidth={2.5} />
              Ajouter
            </button>
          </div>

          <input
            ref={photoInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length) {
                onAddPhotos(card.id, e.target.files);
                e.target.value = "";
              }
            }}
          />

          {card.photos.length === 0 ? (
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full h-32 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 flex flex-col items-center justify-center gap-1.5 text-gray-400 hover:border-coral-400 hover:text-coral-500 transition-colors group"
            >
              <ImageIcon size={22} className="group-hover:scale-110 transition-transform" />
              <span className="text-xs font-semibold">Sélectionner une photo</span>
            </button>
          ) : (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
              {card.photos.map((p, pIdx) => (
                <div
                  key={p.id}
                  className="relative shrink-0 w-[88px] h-[88px] rounded-xl overflow-hidden border border-gray-200 group"
                >
                  <img
                    src={p.preview}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => onRemovePhoto(card.id, p.id)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={11} />
                  </button>
                  {pIdx === 0 && (
                    <span className="absolute bottom-1 left-1 text-[9px] font-bold bg-black/60 text-white px-1.5 py-0.5 rounded">
                      Principale
                    </span>
                  )}
                </div>
              ))}
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                className="shrink-0 w-[88px] h-[88px] rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center text-gray-400 hover:border-coral-400 hover:text-coral-500 transition-colors"
              >
                <Plus size={18} />
              </button>
            </div>
          )}
        </div>

        {/* Nom */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Nom de l'article <span className="text-coral-500">*</span>
          </label>
          <input
            type="text"
            value={card.nom}
            onChange={(e) => onUpdate(card.id, "nom", e.target.value)}
            placeholder="Ex. Polo coton blanc taille M"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:text-gray-400 placeholder:font-normal outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
          />
        </div>

        {/* Prix */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Prix FCFA <span className="text-coral-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              value={card.prix}
              onChange={(e) => onUpdate(card.id, "prix", e.target.value)}
              placeholder="Ex. 15 000"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-bold text-gray-900 placeholder:font-normal placeholder:text-gray-400 outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              Prix promo <span className="text-gray-400 font-normal">(opt.)</span>
            </label>
            <input
              type="number"
              min="1"
              value={card.prixPromo}
              onChange={(e) => onUpdate(card.id, "prixPromo", e.target.value)}
              placeholder="Ex. 12 000"
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-900 placeholder:font-normal placeholder:text-gray-400 outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
            />
          </div>
        </div>

        {/* Catégorie */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1.5">
            Catégorie
          </label>
          <select
            value={card.categorieId}
            onChange={(e) => onUpdate(card.id, "categorieId", e.target.value)}
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
          >
            <option value="">Choisir une catégorie</option>
            {flatCategories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </div>

        {/* Description */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-bold text-gray-700">
              Description & Catégorie <span className="text-gray-400 font-normal">(opt.)</span>
            </label>
            <button
              type="button"
              onClick={() => onGenerateDescription(card.id)}
              disabled={card.aiLoading || !card.nom.trim()}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-600 hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {card.aiLoading ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {card.aiLoading ? "Génération..." : "Magie IA"}
            </button>
          </div>
          <textarea
            rows={3}
            value={card.description}
            onChange={(e) => onUpdate(card.id, "description", e.target.value)}
            placeholder="Description courte de l'article (renseignée automatiquement si laissée vide)"
            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 text-xs text-gray-800 placeholder:text-gray-400 outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all resize-none"
          />
        </div>
      </div>
    </motion.article>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function AjoutExpressPage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();
  const bulkInputRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<CategorieArbre[]>([]);
  const [globalCatId, setGlobalCatId] = useState("");
  const [cards, setCards] = useState<ExpressCard[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Chargement catégories
  useEffect(() => {
    getCategoriesFormulaire()
      .then((data) => setCategories(data ?? []))
      .catch(() => {});
  }, []);

  // Liste plate des catégories (sous-catégories prioritaires)
  const flatCategories = categories.flatMap((cat) =>
    cat.sousCategories?.length
      ? cat.sousCategories.map((sub) => ({
          id: sub.id,
          nom: `${cat.nom} — ${sub.nom}`,
        }))
      : [{ id: cat.id, nom: cat.nom }]
  );

  // ── Handlers ──

  const handleBulkUpload = (files: FileList) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    const newCards: ExpressCard[] = arr.map((file) => ({
      ...createEmptyCard(globalCatId),
      photos: [
        {
          id: crypto.randomUUID(),
          file,
          preview: URL.createObjectURL(file),
        },
      ],
    }));
    setCards((prev) => [...prev, ...newCards]);
    showToast(
      `${arr.length} photo${arr.length > 1 ? "s" : ""} importée${arr.length > 1 ? "s" : ""} en cartes produits.`,
      "success"
    );
  };

  const handleAddEmptyCard = () => {
    setCards((prev) => [...prev, createEmptyCard(globalCatId)]);
  };

  const handleRemoveCard = useCallback((id: string) => {
    setCards((prev) => prev.filter((c) => c.id !== id));
  }, []);

  const handleUpdateCard = useCallback(
    (id: string, field: keyof ExpressCard, value: any) => {
      setCards((prev) =>
        prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
      );
    },
    []
  );

  const handleAddPhotosToCard = useCallback(
    (cardId: string, files: FileList) => {
      const added: PhotoEntry[] = Array.from(files).map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        preview: URL.createObjectURL(f),
      }));
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId ? { ...c, photos: [...c.photos, ...added] } : c
        )
      );
    },
    []
  );

  const handleRemovePhotoFromCard = useCallback(
    (cardId: string, photoId: string) => {
      setCards((prev) =>
        prev.map((c) =>
          c.id === cardId
            ? { ...c, photos: c.photos.filter((p) => p.id !== photoId) }
            : c
        )
      );
    },
    []
  );

  const handleApplyGlobalCategory = (catId: string) => {
    setGlobalCatId(catId);
    if (cards.length > 0) {
      setCards((prev) => prev.map((c) => ({ ...c, categorieId: catId })));
      const label =
        flatCategories.find((c) => c.id === catId)?.nom ?? "Catégorie";
      showToast(`"${label}" appliquée à toutes les cartes.`, "info");
    }
  };

  const handleGenerateDescription = useCallback(
    async (cardId: string) => {
      const card = cards.find((c) => c.id === cardId);
      if (!card || !card.nom.trim()) return;

      handleUpdateCard(cardId, "aiLoading", true);
      try {
        let imageBase64 = undefined;
        if (card.photos && card.photos.length > 0 && card.photos[0].file) {
          const file = card.photos[0].file;
          imageBase64 = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }

        const res = await fetch("/api/ai/enrichir", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            nom: card.nom,
            categories: flatCategories,
            image: imageBase64,
          }),
        });

        const data = await res.json();
        if (data.description) {
          handleUpdateCard(cardId, "description", data.description);
        }
        if (data.categorie_id) {
          handleUpdateCard(cardId, "categorieId", data.categorie_id);
        }
        if (data.tags && Array.isArray(data.tags)) {
          handleUpdateCard(cardId, "tags", data.tags);
        }
        
        showToast("Carte enrichie par l'IA ✨", "success");
      } catch {
        showToast("Impossible de générer les infos, réessayez.", "error");
      } finally {
        handleUpdateCard(cardId, "aiLoading", false);
      }
    },
    [cards, flatCategories, handleUpdateCard, showToast]
  );

  // ── Publication par lot ──

  const handlePublishAll = async () => {
    if (cards.length === 0) {
      showToast("Ajoutez au moins une carte produit avant de publier.", "error");
      return;
    }

    const incomplete = cards.filter((c) => !isCardComplete(c));
    if (incomplete.length > 0) {
      showToast(
        `${incomplete.length} carte${incomplete.length > 1 ? "s" : ""} incomplète${incomplete.length > 1 ? "s" : ""} — vérifiez le nom, le prix et la photo.`,
        "error"
      );
      return;
    }

    setSubmitting(true);
    setProgress({ current: 0, total: cards.length });

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        showToast("Session expirée. Veuillez vous reconnecter.", "error");
        return;
      }
      const vendeurId = userData.user.id;

      const { data: profilData } = await supabase
        .from("profils")
        .select("statut")
        .eq("id", vendeurId)
        .single();
      const vendeurStatut = profilData?.statut ?? "nouveau";

      let successCount = 0;

      for (let i = 0; i < cards.length; i++) {
        const card = cards[i];
        setProgress({ current: i + 1, total: cards.length });

        // Upload photos
        const photoUrls: string[] = [];
        for (const p of card.photos) {
          try {
            const compressed = await compressImage(p.file);
            const ext =
              compressed instanceof File ? compressed.name.split(".").pop() : "jpg";
            const path = `${vendeurId}/${Date.now()}_${crypto.randomUUID().slice(0, 6)}.${ext}`;
            const { error: upErr } = await supabase.storage
              .from("articles")
              .upload(path, compressed, {
                contentType: "image/webp",
                upsert: true,
              });
            if (!upErr) {
              const { data: pubData } = supabase.storage
                .from("articles")
                .getPublicUrl(path);
              if (pubData?.publicUrl) photoUrls.push(pubData.publicUrl);
            }
          } catch {
            /* upload silencieux */
          }
        }

        // Générer description si vide (Fallback de sécurité si l'utilisateur n'a pas cliqué sur Magie IA)
        let description = card.description.trim();
        let finalTags = card.tags;
        let finalCat = card.categorieId;

        if (!description) {
          try {
            const res = await fetch("/api/ai/enrichir", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                nom: card.nom,
                categories: flatCategories,
              }),
            });
            const data = await res.json();
            description = data.description ?? `${card.nom} disponible sur Ayiba.`;
            if (data.categorie_id && !finalCat) finalCat = data.categorie_id;
            if (data.tags) finalTags = data.tags;
          } catch {
            description = `${card.nom} disponible sur Ayiba.`;
          }
        }

        // Modération initiale
        const { statut, raison } = determinerStatutInitial({
          nom: card.nom,
          description,
          prix: Number(card.prix),
          vendeurStatut,
          articlesRecents: i,
        });

        // Insertion Supabase
        const { error: insertErr } = await supabase.from("articles").insert({
          vendeur_id: vendeurId,
          nom: card.nom.trim(),
          prix: Number(card.prix),
          prix_promo: card.prixPromo ? Number(card.prixPromo) : null,
          description,
          categorie_id: finalCat || null,
          photos: photoUrls,
          stock: parseInt(card.stock || "1", 10),
          statut,
          raison_refus: raison ?? null,
          tags: finalTags, // Tags invisibles SEO injectés ici !
        });

        if (!insertErr) successCount++;
        else console.error("[Express] Erreur insertion:", insertErr);
      }

      const msg =
        successCount === cards.length
          ? `${successCount} article${successCount > 1 ? "s" : ""} publié${successCount > 1 ? "s" : ""} avec succès.`
          : `${successCount} sur ${cards.length} articles publiés. Vérifiez votre catalogue.`;

      showToast(msg, successCount > 0 ? "success" : "error");
      if (successCount > 0) router.push("/vendeur/articles");
    } catch (err) {
      console.error("[Express] Erreur globale:", err);
      showToast("Une erreur est survenue lors de la publication.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Données de synthèse ──
  const readyCount = cards.filter(isCardComplete).length;

  return (
    <div className="min-h-screen bg-gray-50/40 pb-32">

      {/* ── Header fixe ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <Link
              href="/vendeur/articles"
              className="shrink-0 p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors"
            >
              <ArrowLeft size={20} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-base font-extrabold text-gray-900 truncate">
                  Ajout Express
                </h1>
                <span className="shrink-0 inline-flex items-center gap-1 bg-coral-50 text-coral-600 text-[11px] font-bold px-2 py-0.5 rounded-full">
                  <Zap size={10} strokeWidth={3} />
                  Rapide
                </span>
              </div>
              <p className="text-[11px] text-gray-400 hidden sm:block truncate">
                Importez plusieurs photos et publiez tout votre lot en un seul clic
              </p>
            </div>
          </div>

          <Link
            href="/vendeur/articles/nouveau"
            className="shrink-0 inline-flex items-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 px-3.5 py-2 rounded-xl transition-colors"
          >
            <SlidersHorizontal size={14} />
            <span className="hidden sm:inline">Formulaire détaillé</span>
            <span className="sm:hidden">Détaillé</span>
          </Link>
        </div>
      </header>

      {/* ── Zone d'actions globales ───────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            {/* Import en masse */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Upload size={16} className="text-coral-500 shrink-0" />
                <h2 className="text-sm font-bold text-gray-900">
                  Importer des photos en masse
                </h2>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Sélectionnez jusqu'à 20 photos depuis votre appareil. Chaque photo génère automatiquement une carte produit.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <input
                ref={bulkInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) {
                    handleBulkUpload(e.target.files);
                    e.target.value = "";
                  }
                }}
              />
              <Button
                type="button"
                onClick={() => bulkInputRef.current?.click()}
                className="inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-5 py-2.5 rounded-2xl shadow-sm transition-colors"
              >
                <Upload size={15} />
                Importer des photos
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleAddEmptyCard}
                className="inline-flex items-center gap-1.5 font-bold text-sm px-4 py-2.5 rounded-2xl transition-colors"
              >
                <Plus size={15} />
                <span className="hidden sm:inline">Carte vierge</span>
              </Button>
            </div>
          </div>

          {/* Catégorie globale */}
          <div className="mt-5 pt-5 border-t border-gray-100 flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex-1">
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Catégorie commune pour tout le lot
              </label>
              <select
                value={globalCatId}
                onChange={(e) => handleApplyGlobalCategory(e.target.value)}
                className="w-full sm:max-w-xs bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm font-medium text-gray-800 outline-none focus:bg-white focus:border-coral-400 focus:ring-2 focus:ring-coral-100 transition-all"
              >
                <option value="">Choisir une catégorie (optionnel)</option>
                {flatCategories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </div>

            {cards.length > 0 && (
              <div className="flex items-center gap-3 text-xs font-semibold sm:pt-5">
                <span className="text-gray-500">
                  <span className="text-gray-900 font-bold">{cards.length}</span> carte{cards.length > 1 ? "s" : ""}
                </span>
                <span className="w-1 h-1 rounded-full bg-gray-300" />
                <span className="text-emerald-600">
                  <span className="font-bold">{readyCount}</span> prête{readyCount > 1 ? "s" : ""} à publier
                </span>
              </div>
            )}
          </div>
        </section>

        {/* ── Grille de cartes ─────────────────────────────────────────────── */}
        {cards.length === 0 ? (
          <div className="bg-white rounded-3xl border border-dashed border-gray-300 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 text-gray-300 flex items-center justify-center mx-auto mb-4">
              <LayoutGrid size={30} />
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">
              Votre grille est vide
            </h3>
            <p className="text-xs text-gray-400 max-w-xs mx-auto mb-5">
              Importez vos photos ou ajoutez une carte vierge pour commencer à remplir votre catalogue rapidement.
            </p>
            <Button
              type="button"
              onClick={() => bulkInputRef.current?.click()}
              className="inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-sm"
            >
              <Upload size={16} />
              Importer mes photos
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            <AnimatePresence initial={false}>
              {cards.map((card, i) => (
                <ProductCard
                  key={card.id}
                  card={card}
                  index={i}
                  flatCategories={flatCategories}
                  onUpdate={handleUpdateCard}
                  onRemove={handleRemoveCard}
                  onAddPhotos={handleAddPhotosToCard}
                  onRemovePhoto={handleRemovePhotoFromCard}
                  onGenerateDescription={handleGenerateDescription}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* ── Barre flottante de publication ───────────────────────────────── */}
      <AnimatePresence>
        {cards.length > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 shadow-xl"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between gap-4">
              <div className="hidden sm:block">
                <p className="text-sm font-bold text-gray-900">
                  {readyCount} sur {cards.length} article{cards.length > 1 ? "s" : ""} prêt{readyCount > 1 ? "s" : ""}
                </p>
                <p className="text-xs text-gray-400">
                  Les articles publiés apparaîtront immédiatement dans votre boutique.
                </p>
              </div>

              {submitting && (
                <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-teal-600">
                  <Loader2 size={14} className="animate-spin" />
                  Publication {progress.current}/{progress.total}...
                </div>
              )}

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAddEmptyCard}
                  className="shrink-0 inline-flex items-center gap-1.5 font-bold text-sm px-4 py-2.5 rounded-2xl"
                >
                  <Plus size={15} />
                  Carte
                </Button>

                <Button
                  type="button"
                  onClick={handlePublishAll}
                  disabled={submitting}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-coral-500 hover:bg-coral-600 disabled:bg-coral-400 text-white font-bold text-sm px-6 py-3 rounded-2xl shadow-md shadow-coral-500/20 transition-colors"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Publication {progress.current}/{progress.total}...
                    </>
                  ) : (
                    <>
                      <Wand2 size={16} />
                      Publier {cards.length} article{cards.length > 1 ? "s" : ""} en 1 clic
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
