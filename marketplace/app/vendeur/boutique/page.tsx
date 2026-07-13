"use client";

import { useEffect, useState } from "react";
import { useVendeurBoutique } from "../../hooks/useVendeurBoutique";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Check } from "lucide-react";

const RESEAUX = [
  { value: "mtn", label: "MTN Mobile Money" },
  { value: "moov", label: "Moov Money" },
  { value: "celtiis", label: "Celtis Cash" },
];

export default function VendeurBoutiquePage() {
  const { loading, saving, saved, error, boutique, updateBoutique } = useVendeurBoutique();

  const [form, setForm] = useState({
    nom_boutique: "",
    description: "",
    quartier: "",
    commune: "",
    mobile_money_network: "",
    mobile_money_number: "",
  });

  useEffect(() => {
    if (boutique) {
      setForm({
        nom_boutique: boutique.nom_boutique || "",
        description: boutique.description || "",
        quartier: boutique.quartier || "",
        commune: boutique.commune || "",
        mobile_money_network: boutique.mobile_money_network || "",
        mobile_money_number: boutique.mobile_money_number || "",
      });
    }
  }, [boutique]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateBoutique(form);
  };

  return (
    <DashboardLayout role="vendeur" title="Ma boutique">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4">
          <p className="text-sm text-red-600 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <form onSubmit={handleSubmit} className="space-y-8 max-w-2xl">
          {/* Statut de validation */}
          {boutique?.statut !== "valide" && (
            <div
              className={`p-4 rounded-2xl border text-sm font-medium ${
                boutique?.statut === "refuse"
                  ? "bg-red-50 border-red-100 text-red-600"
                  : "bg-amber-50 border-amber-100 text-amber-700"
              }`}
            >
              {boutique?.statut === "refuse"
                ? "Ta boutique a été refusée. Vérifie tes informations et contacte le support."
                : "Ta boutique est en attente de validation par notre équipe."}
            </div>
          )}

          {/* Infos boutique */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold">Informations de la boutique</h3>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">
                Nom de la boutique
              </label>
              <input
                value={form.nom_boutique}
                onChange={(e) => handleChange("nom_boutique", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200"
                placeholder="Nom de ta boutique"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => handleChange("description", e.target.value)}
                rows={4}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200 resize-none"
                placeholder="Présente ta boutique en quelques mots"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Quartier</label>
                <input
                  value={form.quartier}
                  onChange={(e) => handleChange("quartier", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Commune</label>
                <input
                  value={form.commune}
                  onChange={(e) => handleChange("commune", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200"
                />
              </div>
            </div>
          </div>

          {/* Mobile Money */}
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h3 className="text-lg font-bold">Mobile Money</h3>
            <p className="text-sm text-gray-500 -mt-4">Utilisé pour recevoir tes paiements</p>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Opérateur</label>
              <div className="grid grid-cols-3 gap-2">
                {RESEAUX.map((r) => (
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => handleChange("mobile_money_network", r.value)}
                    className={`px-3 py-3 rounded-2xl text-xs font-bold border transition-colors ${
                      form.mobile_money_network === r.value
                        ? "bg-coral-500 text-white border-coral-500"
                        : "bg-gray-50 text-gray-600 border-gray-100 hover:bg-gray-100"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-2">Numéro</label>
              <input
                value={form.mobile_money_number}
                onChange={(e) => handleChange("mobile_money_number", e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200"
                placeholder="Ex: 97 00 00 00"
              />
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3.5 bg-coral-500 hover:bg-coral-600 text-white text-sm font-bold rounded-2xl transition-colors disabled:opacity-50"
            >
              {saving ? "Enregistrement..." : "Enregistrer"}
            </button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-teal-600">
                <Check size={16} /> Modifications enregistrées
              </span>
            )}
          </div>
        </form>
      )}
    </DashboardLayout>
  );
}
