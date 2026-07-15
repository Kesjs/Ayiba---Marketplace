"use client";

import { useState, useMemo } from "react";
import {
  Plus, Search, Trash2, Edit3, X, Loader2, PackageX
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import Image from "next/image";
import { MOCK_PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

// À remplacer par l'id du vendeur réellement connecté une fois la session branchée
const CURRENT_VENDEUR_ID = "v1";

function StatusBadge({ statut, stock }: { statut: string; stock: number }) {
  if (statut === "desactive") {
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-gray-500">
        <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
        Désactivé
      </span>
    );
  }
  if (statut === "rupture" || stock === 0) {
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

// Même famille visuelle que ProductCardModern (image nue, texte sans carte),
// mais avec actions vendeur (modifier/supprimer/statut) à la place cœur/panier.
function VendeurArticleCard({
  item,
  onEdit,
  onDelete,
}: {
  item: (typeof MOCK_PRODUCTS)[number];
  onEdit: () => void;
  onDelete: () => void;
}) {
  const categorieLabel = CATEGORIES.find((c) => c.id === item.categorie)?.label;

  return (
    <div className="flex flex-col w-full">
      {/* IMAGE — carrée, aucune bordure, aucune ombre, comme ProductCardModern */}
      <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden mb-2 group/image">
        <Image
          src={item.photos[0]}
          alt={item.nom}
          fill
          className={`object-cover transition-transform duration-500 group-hover/image:scale-105 ${
            item.statut !== "actif" ? "grayscale-[40%] opacity-70" : ""
          }`}
        />

        {/* Actions vendeur — même position/style que le cœur favoris */}
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

      {/* TEXTE — aucune carte, directement sur fond blanc, même structure que ProductCardModern */}
      <div className="flex flex-col gap-1 px-0.5">
        <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest truncate">
          {categorieLabel}
        </p>

        <p className="text-xs text-gray-600 font-medium truncate">{item.nom}</p>

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] text-gray-400">{item.stock} en stock</span>
        </div>

        {/* Ligne prix + statut à droite, à la place prix/panier */}
        <div className="flex items-center justify-between mt-0.5 gap-2">
          <p className="text-base font-black text-gray-900 whitespace-nowrap">
            {item.prix.toLocaleString("fr-FR")} <span className="text-[11px] font-bold">FCFA</span>
          </p>
          <StatusBadge statut={item.statut} stock={item.stock} />
        </div>
      </div>
    </div>
  );
}

export default function MesArticlesPage() {
  const { showToast } = useToast();

  const initialArticles = MOCK_PRODUCTS.filter((p) => p.vendeur_id === CURRENT_VENDEUR_ID);
  const [articles, setArticles] = useState(initialArticles);
  const [search, setSearch] = useState("");

  const [editingArticle, setEditingArticle] = useState<(typeof initialArticles)[number] | null>(null);
  const [editForm, setEditForm] = useState({ prix: "", stock: "" });
  const [isSaving, setIsSaving] = useState(false);

  const [deletingArticle, setDeletingArticle] = useState<(typeof initialArticles)[number] | null>(null);

  const filteredArticles = useMemo(() => {
    if (!search.trim()) return articles;
    return articles.filter((a) => a.nom.toLowerCase().includes(search.toLowerCase()));
  }, [articles, search]);

  const openEdit = (article: (typeof initialArticles)[number]) => {
    setEditingArticle(article);
    setEditForm({ prix: String(article.prix), stock: String(article.stock) });
  };

  const handleSaveEdit = async () => {
    if (!editingArticle) return;
    const prix = Number(editForm.prix);
    const stock = Number(editForm.stock);
    if (isNaN(prix) || prix <= 0) {
      showToast("Le prix doit être un nombre valide", "error");
      return;
    }
    if (isNaN(stock) || stock < 0) {
      showToast("Le stock doit être un nombre valide", "error");
      return;
    }

    setIsSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setArticles((prev) =>
      prev.map((a) =>
        a.id === editingArticle.id
          ? { ...a, prix, stock, statut: stock === 0 ? "rupture" : "actif" }
          : a
      )
    );
    setIsSaving(false);
    setEditingArticle(null);
    showToast("Article mis à jour", "success");
  };

  const handleConfirmDelete = () => {
    if (!deletingArticle) return;
    setArticles((prev) => prev.filter((a) => a.id !== deletingArticle.id));
    setDeletingArticle(null);
    showToast("Article supprimé", "success");
  };

  return (
    <>
      {/* Header — barre d'action stylée */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-4 sm:p-5 mb-8 flex flex-col sm:flex-row gap-3 sm:gap-4 sm:items-center sm:justify-between">
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
        <Link href="/vendeur/articles/nouveau" className="shrink-0">
          <Button className="h-12 px-6 rounded-2xl flex items-center gap-2 w-full sm:w-auto justify-center bg-coral-500 hover:bg-coral-600">
            <Plus size={20} />
            Ajouter un article
          </Button>
        </Link>
      </div>

      {articles.length > 0 && (
        <p className="text-xs font-semibold text-gray-400 mb-4 px-1">
          {filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""}
          {search && ` pour "${search}"`}
        </p>
      )}

      {/* Empty state */}
      {filteredArticles.length === 0 && (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
            <PackageX size={28} />
          </div>
          <p className="text-gray-700 font-semibold mb-1">
            {search ? "Aucun article ne correspond à ta recherche" : "Tu n'as pas encore d'article"}
          </p>
          <p className="text-sm text-gray-400 mb-6">
            {search ? "Essaie un autre mot-clé." : "Ajoute ton premier article pour commencer à vendre."}
          </p>
          {!search && (
            <Link href="/vendeur/articles/nouveau">
              <Button className="h-12 px-6 rounded-2xl inline-flex items-center gap-2 bg-coral-500 hover:bg-coral-600">
                <Plus size={18} />
                Ajouter un article
              </Button>
            </Link>
          )}
        </div>
      )}

      {/* Grille articles — même style que la home (ProductCardModern) */}
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
              onDelete={() => setDeletingArticle(item)}
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

      {/* MODALE — Modifier prix/stock */}
      <AnimatePresence>
        {editingArticle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setEditingArticle(null)}
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
                  <h3 className="text-lg font-bold text-gray-900 truncate pr-4">{editingArticle.nom}</h3>
                  <button
                    onClick={() => setEditingArticle(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Prix (FCFA)</label>
                    <input
                      type="number"
                      value={editForm.prix}
                      onChange={(e) => setEditForm((f) => ({ ...f, prix: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2 block">Stock disponible</label>
                    <input
                      type="number"
                      value={editForm.stock}
                      onChange={(e) => setEditForm((f) => ({ ...f, stock: e.target.value }))}
                      className="w-full h-12 px-4 rounded-xl border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-200 focus:border-coral-400 transition-all"
                    />
                    <p className="text-[11px] text-gray-400 mt-1.5">Mettre à 0 marque l'article comme "Rupture" automatiquement.</p>
                  </div>

                  <Button className="w-full h-12 rounded-xl mt-2 bg-coral-500 hover:bg-coral-600" onClick={handleSaveEdit} disabled={isSaving}>
                    {isSaving ? <Loader2 size={18} className="animate-spin mx-auto" /> : "Enregistrer"}
                  </Button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* MODALE — Confirmer suppression */}
      <AnimatePresence>
        {deletingArticle && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingArticle(null)}
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
                    onClick={() => setDeletingArticle(null)}
                    className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-6">
                  <strong className="text-gray-900">{deletingArticle.nom}</strong> sera définitivement retiré de votre boutique. Cette action est irréversible.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingArticle(null)}
                    className="flex-1 h-12 rounded-xl border-2 border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 h-12 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-sm transition-colors"
                  >
                    Supprimer
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
