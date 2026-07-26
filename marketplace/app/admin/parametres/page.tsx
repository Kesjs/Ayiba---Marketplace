"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminParametres } from "@/lib/hooks/useAdmin";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { Wallet, Route, ShieldAlert, Save, Check } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] as const },
  }),
};

export default function AdminParametresPage() {
  const { params, loading, mettreAJour } = useAdminParametres();
  const [commission, setCommission] = useState("10");
  const [fraisBase, setFraisBase] = useState("300");
  const [prixParKm, setPrixParKm] = useState("100");
  const [maintenance, setMaintenance] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    if (!loading) {
      if (params.commission_pourcentage !== undefined) setCommission(String(params.commission_pourcentage));
      if (params.frais_base_livraison !== undefined) setFraisBase(String(params.frais_base_livraison));
      if (params.prix_par_km !== undefined) setPrixParKm(String(params.prix_par_km));
      if (params.mode_maintenance !== undefined) setMaintenance(params.mode_maintenance === true || params.mode_maintenance === "true");
    }
  }, [loading, params]);

  const handleSave = async () => {
    setSaving(true);
    await mettreAJour("commission_pourcentage", Number(commission));
    await mettreAJour("frais_base_livraison", Number(fraisBase));
    await mettreAJour("prix_par_km", Number(prixParKm));
    await mettreAJour("mode_maintenance", maintenance);
    setSaving(false);
    setJustSaved(true);
    setTimeout(() => setJustSaved(false), 2200);
  };

  // Simulation live de l'exemple de calcul affiché sous les 2 champs de
  // livraison, pour que l'admin visualise l'impact immédiat de ses réglages.
  const exempleDistance = 5;
  const exempleFrais =
    (Number(fraisBase) || 0) + exempleDistance * (Number(prixParKm) || 0);

  if (loading) {
    return (
      <DashboardLayout role="admin" userName="Admin Ayiba" title="Paramètres système">
        <Skeleton className="h-96 rounded-[32px]" />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Paramètres système">
      <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm p-8 max-w-xl space-y-8">
        <motion.div custom={0} initial="hidden" animate="show" variants={fadeUp}>
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
            <Wallet size={16} className="text-coral-500" />
            Commission plateforme (%)
          </label>
          <input
            type="number"
            value={commission}
            onChange={(e) => setCommission(e.target.value)}
            className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/20 transition-shadow"
          />
          <p className="text-xs text-gray-400 mt-1">Prélevée sur chaque commande livrée.</p>
        </motion.div>

        <motion.div custom={1} initial="hidden" animate="show" variants={fadeUp}>
          <label className="text-sm font-bold text-gray-700 flex items-center gap-2 mb-2">
            <Route size={16} className="text-teal-500" />
            Frais de livraison
          </label>
          <p className="text-xs text-gray-400 mb-3">
            Frais = frais de base + (distance × prix par km), calculé automatiquement à partir des coordonnées GPS.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Frais de base (FCFA)</span>
              <input
                type="number"
                value={fraisBase}
                onChange={(e) => setFraisBase(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
              />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-gray-500 block mb-1.5">Prix par km (FCFA)</span>
              <input
                type="number"
                value={prixParKm}
                onChange={(e) => setPrixParKm(e.target.value)}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-100 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 transition-shadow"
              />
            </div>
          </div>

          <motion.div
            key={exempleFrais}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.25 }}
            className="mt-3 flex items-center gap-2 text-xs text-gray-500 bg-teal-50/60 rounded-xl px-3 py-2"
          >
            <Route size={14} className="text-teal-500 shrink-0" />
            Exemple à {exempleDistance} km : <span className="font-bold text-gray-800">{exempleFrais.toLocaleString("fr-FR")} FCFA</span>
          </motion.div>
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="show"
          variants={fadeUp}
          className="flex items-center justify-between p-4 bg-red-50 rounded-2xl"
        >
          <div className="flex items-center gap-3">
            <ShieldAlert size={18} className="text-red-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-red-700">Mode maintenance</p>
              <p className="text-xs text-red-500">Bloque l'accès au site pour tous les non-admins</p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={maintenance}
            onChange={(e) => setMaintenance(e.target.checked)}
            className="w-5 h-5 accent-red-500"
          />
        </motion.div>

        <motion.div custom={3} initial="hidden" animate="show" variants={fadeUp}>
          <Button variant="primary" onClick={handleSave} disabled={saving} className="w-full">
            {saving ? (
              <Save size={16} className="animate-pulse" />
            ) : justSaved ? (
              <Check size={16} />
            ) : (
              <Save size={16} />
            )}
            {saving ? "Enregistrement..." : justSaved ? "Enregistré" : "Enregistrer les paramètres"}
          </Button>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
