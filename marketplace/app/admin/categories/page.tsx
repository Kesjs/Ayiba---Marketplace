"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminCategories } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Trash2, Plus } from "lucide-react";

const COULEURS = ["#F97362", "#2F8F82", "#3B7DD8", "#D89B3C", "#5B5FC7", "#C1443C"];

export default function AdminCategoriesPage() {
  const { categories, loading, creer, toggleActive, supprimer } = useAdminCategories();
  const [nom, setNom] = useState("");
  const [couleur, setCouleur] = useState(COULEURS[0]);
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!nom.trim()) return;
    setCreating(true);
    await creer(nom.trim(), couleur);
    setNom("");
    setCreating(false);
  };

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Catégories du catalogue">
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-6 mb-8">
        <h3 className="font-bold text-gray-900 mb-4">Nouvelle catégorie</h3>
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
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {categories.map((c) => (
            <div key={c.id} className="p-5 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full shrink-0" style={{ backgroundColor: c.couleur || "#ccc" }} />
              <p className="font-bold text-gray-900 flex-1">{c.nom}</p>
              <label className="flex items-center gap-2 text-xs font-bold text-gray-500">
                <input type="checkbox" checked={c.active} onChange={(e) => toggleActive(c.id, e.target.checked)} />
                Active
              </label>
              <button onClick={() => supprimer(c.id)} className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
