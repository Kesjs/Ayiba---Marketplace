"use client";

import { useState, useMemo } from "react";
import {
  Plus, Search, Trash2, Edit3, X, Loader2, PackageX, PauseCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { MOCK_PRODUCTS, CATEGORIES } from "@/lib/mock-data";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/context/ToastContext";

// À remplacer par l'id du vendeur réellement connecté une fois la session branchée
const CURRENT_VENDEUR_ID = "v1";

function StatusBadge({ statut, stock }: { statut: string; stock: number }) {
  if (statut === "desactive") {
    return (
      <div className="flex items-center gap-1 bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md text-[10px] font-bold">
        Désactivé
      </div>
    );
  }
  if (statut === "rupture" || stock === 0) {
    return (
      <div className="flex items-center gap-1 bg-red-50 text-red-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
        Rupture
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 bg-teal-50 text-teal-600 px-2 py-0.5 rounded-md text-[10px] font-bold">
      En ligne
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
      {/* Action Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between mb-8 md:mb-10">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher parmi mes articles..."
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium text-sm"
          />
        </div>
        <Link href="/vendeur/articles/nouveau">
          <Button className="h-12 px-6 rounded-2xl flex items-center gap-2 w-full md:w-auto justify-center">
            <Plus size={20} />
            Ajouter un article
          </Button>
        </Link>
      </div>

      {/* Empty state réel */}
      {filteredArticles.length === 0 && (
        <div className="bg-white rounded-[32px] border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4 text-gray-300">
            <PackageX size={28} />
          </div>
          <p className="text-gray-500 font-medium">
            {search ? "Aucun article ne correspond à votre recherche." : "Vous n'avez pas encore d'article."}
          </p>
        </div>
      )}

      {/* Articles Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
        {filteredArticles.map((item) => (
          <div
            key={item.id}
            className="bg-white rounded-[28px] md:rounded-[32px] border border-gray-50 shadow-sm overflow-hidden group hover:shadow-xl hover:shadow-gray-200/20 transition-all duration-300"
          >
            <div className="relative aspect-square overflow-hidden">
              <img
                src={item.photos[0]}
                alt={item.nom}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  item.statut !== "actif" ? "grayscale-[40%] opacity-70" : ""
                }`}
              />
              <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => openEdit(item)}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-gray-600 hover:text-coral-500 shadow-sm"
                >
                  <Edit3 size={16} />
                </button>
                <button
                  onClick={() => setDeletingArticle(item)}
                  className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-lg flex items-center justify-center text-red-500 hover:bg-red-50 shadow-sm"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
            <div className="p-5 md:p-6">
              <p className="text-[10px] font-bold text-coral-500 uppercase tracking-widest mb-1">
                {CATEGORIES.find((c) => c.id === item.categorie)?.label}
              </p>
              <h3 className="font-bold text-gray-900 truncate mb-1">{item.nom}</h3>
              <p className="text-xs text-gray-400 font-medium mb-3">
                {item.stock} en stock
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-bold text-gray-900">{item.prix.toLocaleString("fr-FR")} F</p>
                <StatusBadge statut={item.statut} stock={item.stock} />
              </div>
            </div>
          </div>
        ))}

        <Link
          href="/vendeur/articles/nouveau"
          className="aspect-square rounded-[28px] md:rounded-[32px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center gap-3 hover:bg-gray-50 hover:border-coral-200 transition-all group"
        >
          <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300 group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors">
            <Plus size={24} />
          </div>
          <span className="text-sm font-bold text-gray-400 group-hover:text-coral-500">Nouvel article</span>
        </Link>
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

                  <Button className="w-full h-12 rounded-xl mt-2" onClick={handleSaveEdit} disabled={isSaving}>
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
