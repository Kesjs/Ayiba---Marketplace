"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LABELS_STATUT_COMMANDE, STATUT_BADGE_VARIANT } from "@/lib/constants/commandes";
import { Search, ChevronRight } from "lucide-react";

const supabase = createClient();

interface CommandeAdmin {
  id: string;
  numero: string;
  nom_client: string | null;
  montant_total: number;
  statut: string;
  created_at: string;
  vendeur: { id: string; nom_boutique: string | null } | { id: string; nom_boutique: string | null }[] | null;
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");
  const [vendeurFilter, setVendeurFilter] = useState("tous");
  const [dateDebut, setDateDebut] = useState("");
  const [dateFin, setDateFin] = useState("");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("commandes")
        .select("id, numero, nom_client, montant_total, statut, created_at, vendeur:vendeurs ( id, nom_boutique )")
        .order("created_at", { ascending: false })
        .limit(200);
      setCommandes((data as unknown as CommandeAdmin[]) || []);
      setLoading(false);
    })();
  }, []);

  const vendeursDisponibles = useMemo(() => {
    const map = new Map<string, string>();
    commandes.forEach((c) => {
      const v = one(c.vendeur);
      if (v) map.set(v.id, v.nom_boutique || "Boutique sans nom");
    });
    return Array.from(map.entries());
  }, [commandes]);

  const filtered = useMemo(() => {
    return commandes.filter((c) => {
      const matchQuery =
        !query || c.numero?.toLowerCase().includes(query.toLowerCase()) || c.nom_client?.toLowerCase().includes(query.toLowerCase());
      const matchStatut = statutFilter === "tous" || c.statut === statutFilter;
      const vendeur = one(c.vendeur);
      const matchVendeur = vendeurFilter === "tous" || vendeur?.id === vendeurFilter;
      const dateCommande = new Date(c.created_at);
      const matchDebut = !dateDebut || dateCommande >= new Date(dateDebut);
      const matchFin = !dateFin || dateCommande <= new Date(dateFin + "T23:59:59");
      return matchQuery && matchStatut && matchVendeur && matchDebut && matchFin;
    });
  }, [commandes, query, statutFilter, vendeurFilter, dateDebut, dateFin]);

  return (
    <DashboardLayout role="admin" title="Toutes les commandes">
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un numéro ou un client..."
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/10"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-4 flex-wrap">
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm text-gray-600"
          >
            <option value="tous">Tous les statuts</option>
            {Object.entries(LABELS_STATUT_COMMANDE).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>

          <select
            value={vendeurFilter}
            onChange={(e) => setVendeurFilter(e.target.value)}
            className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm text-gray-600"
          >
            <option value="tous">Toutes les boutiques</option>
            {vendeursDisponibles.map(([id, nom]) => (
              <option key={id} value={id}>
                {nom}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateDebut}
              onChange={(e) => setDateDebut(e.target.value)}
              className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-gray-600"
            />
            <span className="text-gray-400 text-sm">→</span>
            <input
              type="date"
              value={dateFin}
              onChange={(e) => setDateFin(e.target.value)}
              className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm text-gray-600"
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map((c) => {
            const vendeur = one(c.vendeur);
            return (
              <Link
                key={c.id}
                href={`/admin/commandes/${c.id}`}
                className="p-5 flex items-center gap-4 flex-wrap hover:bg-gray-50/50 transition-colors"
              >
                <div className="flex-1 min-w-[160px]">
                  <p className="font-bold text-gray-900">#{c.numero}</p>
                  <p className="text-xs text-gray-400">
                    {c.nom_client || "Client"} · {vendeur?.nom_boutique || "—"} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <p className="font-bold text-gray-700">{formatFCFA(c.montant_total)}</p>
                <StatusBadge variant={STATUT_BADGE_VARIANT[c.statut as keyof typeof STATUT_BADGE_VARIANT] || "neutral"}>
                  {LABELS_STATUT_COMMANDE[c.statut as keyof typeof LABELS_STATUT_COMMANDE] || c.statut}
                </StatusBadge>
                <ChevronRight size={18} className="text-gray-300" />
              </Link>
            );
          })}
          {filtered.length === 0 && <p className="p-10 text-center text-gray-400">Aucune commande trouvée.</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
