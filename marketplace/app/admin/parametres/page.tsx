"use client";

import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminParametres } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";

export default function AdminParametresPage() {
  const { params, loading, mettreAJour } = useAdminParametres();
  const [commission, setCommission] = useState("10");
  const [fraisLivraison, setFraisLivraison] = useState("500");
  const [maintenance, setMaintenance] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (params.commission_pourcentage !== undefined) setCommission(String(params.commission_pourcentage));
      if (params.frais_livraison_defaut !== undefined) setFraisLivraison(String(params.frais_livraison_defaut));
      if (params.mode_maintenance !== undefined) setMaintenance(params.mode_maintenance === true || params.mode_maintenance === "true");
    }
  }, [loading, params]);

  const handleSave = async () => {
    setSaving(true);
    await mettreAJour("commission_pourcentage", Number(commission));
    await mettreAJour("frais_livraison_defaut", Number(fraisLivraison));
    await mettreAJour("mode_maintenance", maintenance);
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin Ayiba" title="Paramètres système">
        <Skeleton className="h-64 rounded-[32px]" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Paramètres système">
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8 max-w-xl space-y-6">
        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Commission plateforme (%)</label>
          <input
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20"
          />
          <p className="text-xs text-gray-400 mt-1">Prélevée sur chaque commande livrée.</p>
        </div>

        <div>
          <label className="text-sm font-bold text-gray-700 block mb-2">Frais de livraison par défaut (FCFA)</label>
          <input
            type="number"
            value={fraisLivraison}
            onChange={(e) => setFraisLivraison(e.target.value)}
            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-red-50 rounded-2xl">
          <div>
            <p className="text-sm font-bold text-red-700">Mode maintenance</p>
            <p className="text-xs text-red-500">Bloque l'accès au site pour tous les non-admins</p>
          </div>
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="w-5 h-5"
          />
        </div>

        <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
          {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
        </Button>
      </div>
    </DashboardLayout>
  );
}
