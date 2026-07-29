"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminCategories } from "@/lib/hooks/useAdmin";
import { CATEGORY_ICON_OPTIONS, resolveCategoryIcon } from "@/lib/constants/category-icons";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Trash2, Plus, Pencil, Check } from "lucide-react";

const COULEURS = ["#F97362", "#2F8F82", "#3B7DD8", "#D89B3C", "#5B5FC7", "#C1443C"];

function IconPicker({ value, onChange, couleur }: { value: string; onChange: (name: string) => void; couleur: string }) {
  return (
    <div className="flex flex-wrap gap-2 max-w-full">
      {CATEGORY_ICON_OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const selected = value === opt.name;
        return (
          <button
            key={opt.name}
            type="button"
            title={opt.label}
            onClick={() => onChange(opt.name)}
            className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all shrink-0 ${
              selected ? "ring-2 ring-offset-1 ring-gray-900" : "hover:bg-gray-100"
            }`}
            style={{ backgroundColor: selected ? `${couleur}22` : undefined, color: selected ? couleur : "#9CA3AF" }}
          >
            <Icon size={17} />
          </button>
        );
      })}
    </div>
  );
}

export default function AdminCategoriesPage() {
  const { categories, loading, creer, toggleActive, supprimer, mettreAJourStyle } = useAdminCategories();
  const [nom, setNom] = useState("");
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [icone, setIcone] = useState(CATEGORY_ICON_OPTIONS[0].name);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCouleur, setEditCouleur] = useState("");
  const [editIcone, setEditIcone] = useState("");

  const handleCreate = async () => {
    if (!nom.trim()) return;
    setCreating(true);
    await creer(nom.trim(), couleur, icone);
    setNom("");
    setCreating(false);
  };

  const startEdit = (id: string, currentCouleur: string | null, currentIcone: string | null) => {
    setEditingId(id);
    setEditCouleur(currentCouleur || COULEURS[0]);
    setEditIcone(currentIcone || CATEGORY_ICON_OPTIONS[0].name);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await mettreAJourStyle(editingId, { couleur: editCouleur, icone: editIcone });
    setEditingId(null);
  };

  return (
    <DashboardLayout role="admin" title="Catégories du catalogue">
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-gray-900 mb-4">Nouvelle catégorie</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              placeholder="Nom de la catégorie"
              className="flex-1 h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20"
            />
            <div className="flex gap-2 items-center">
              {COULEURS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCouleur(c)}
                  className={`w-8 h-8 rounded-full transition-all ${couleur === c ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <Button variant="primary" onClick={handleCreate} disabled={!nom.trim() || creating}>
              <Plus size={16} /> Ajouter
            </Button>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Icône</p>
            <IconPicker value={icone} onChange={setIcone} couleur={couleur} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {categories.map((c) => {
            const Icon = resolveCategoryIcon(c.icone);
            const isEditing = editingId === c.id;
            return (
              <div key={c.id} className="p-5">
                <div className="flex items-center gap-4">
                  <div
                    className="w-10 h-10 rounded-2xl shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: `${c.couleur || "#ccc"}1a`, color: c.couleur || "#9CA3AF" }}
                  >
                    <Icon size={18} />
                  </div>
                  <p className="font-bold text-gray-900 flex-1">{c.nom}</p>
                  <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                    <input type="checkbox" checked={c.active} onChange={(e) => toggleActive(c.id, e.target.checked)} />
                    Active
                  </label>
                  <button
                    onClick={() => (isEditing ? setEditingId(null) : startEdit(c.id, c.couleur, c.icone))}
                    className="p-2 rounded-lg bg-gray-50 text-gray-500 hover:bg-gray-100"
                    title="Modifier l'icône et la couleur"
                  >
                    <Pencil size={16} />
                  </button>
                  <button onClick={() => supprimer(c.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    <Trash2 size={16} />
                  </button>
                </div>

                {isEditing && (
                  <div className="mt-4 pl-14 space-y-3">
                    <div className="flex gap-2 items-center">
                      {COULEURS.map((col) => (
                        <button
                          key={col}
                          type="button"
                          onClick={() => setEditCouleur(col)}
                          className={`w-7 h-7 rounded-full transition-all ${editCouleur === col ? "ring-2 ring-offset-2 ring-gray-900" : ""}`}
                          style={{ backgroundColor: col }}
                        />
                      ))}
                    </div>
                    <IconPicker value={editIcone} onChange={setEditIcone} couleur={editCouleur} />
                    <button
                      onClick={saveEdit}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gray-900 text-white text-xs font-bold"
                    >
                      <Check size={14} /> Enregistrer
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </DashboardLayout>
  );
}
