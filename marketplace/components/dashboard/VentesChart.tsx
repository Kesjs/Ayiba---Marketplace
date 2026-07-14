"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";

interface PaiementRow {
  montant_net: number | null;
  statut: string | null;
  created_at: string;
}

interface VentesChartProps {
  paiements: PaiementRow[];
  objectifMensuel?: number; // temporaire, en attendant un vrai champ en base
}

type Periode = "7j" | "30j" | "12mois";

const COULEUR_CA = "#B94B27";   // coral-500
const COULEUR_OBJECTIF = "#9E9D95"; // gray-300

export function VentesChart({ paiements, objectifMensuel = 500000 }: VentesChartProps) {
  const [periode, setPeriode] = useState<Periode>("30j");

  const payes = useMemo(
    () => paiements.filter((p) => p.statut === "paye"),
    [paiements]
  );

  const data = useMemo(() => {
    const now = new Date();

    if (periode === "7j") {
      return Array.from({ length: 7 }).map((_, i) => {
        const jour = new Date(now);
        jour.setDate(now.getDate() - (6 - i));
        const total = payes
          .filter((p) => sameDay(new Date(p.created_at), jour))
          .reduce((sum, p) => sum + Number(p.montant_net || 0), 0);
        return { label: jour.toLocaleDateString("fr-FR", { weekday: "short" }), valeur: total };
      });
    }

    if (periode === "12mois") {
      return Array.from({ length: 12 }).map((_, i) => {
        const mois = new Date(now.getFullYear(), now.getMonth() - (11 - i), 1);
        const total = payes
          .filter(
            (p) =>
              new Date(p.created_at).getMonth() === mois.getMonth() &&
              new Date(p.created_at).getFullYear() === mois.getFullYear()
          )
          .reduce((sum, p) => sum + Number(p.montant_net || 0), 0);
        return { label: mois.toLocaleDateString("fr-FR", { month: "short" }), valeur: total };
      });
    }

    // "30j" = cumulé depuis le 1er du mois en cours, pour comparer à l'objectif
    const debutMois = new Date(now.getFullYear(), now.getMonth(), 1);
    const joursDansLeMois = now.getDate();
    let cumule = 0;

    return Array.from({ length: joursDansLeMois }).map((_, i) => {
      const jour = new Date(debutMois);
      jour.setDate(i + 1);
      const totalJour = payes
        .filter((p) => sameDay(new Date(p.created_at), jour))
        .reduce((sum, p) => sum + Number(p.montant_net || 0), 0);
      cumule += totalJour;
      return { label: `${i + 1}`, valeur: cumule };
    });
  }, [payes, periode]);

  return (
    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 md:p-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h3 className="text-lg md:text-xl font-bold">Chiffre d'affaires</h3>

        <div className="flex bg-gray-50 rounded-full p-1">
          {(["7j", "30j", "12mois"] as Periode[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriode(p)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                periode === p ? "bg-white text-coral-600 shadow-sm" : "text-gray-500"
              }`}
            >
              {p === "7j" ? "7 jours" : p === "30j" ? "Ce mois" : "12 mois"}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="caGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={COULEUR_CA} stopOpacity={0.25} />
                <stop offset="100%" stopColor={COULEUR_CA} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1EFE8" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 11, fill: "#888780" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 11, fill: "#888780" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />
            <Tooltip
              formatter={(value: number) => [`${value.toLocaleString("fr-FR")} F`, "CA"]}
              contentStyle={{ borderRadius: 12, border: "1px solid #F1EFE8", fontSize: 12 }}
            />
            {periode === "30j" && (
              <ReferenceLine
                y={objectifMensuel}
                stroke={COULEUR_OBJECTIF}
                strokeDasharray="6 4"
                label={{
                  value: `Objectif ${objectifMensuel.toLocaleString("fr-FR")} F`,
                  position: "insideTopRight",
                  fontSize: 11,
                  fill: "#74736D",
                }}
              />
            )}
            <Area
              type="monotone"
              dataKey="valeur"
              stroke={COULEUR_CA}
              strokeWidth={2}
              fill="url(#caGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}
