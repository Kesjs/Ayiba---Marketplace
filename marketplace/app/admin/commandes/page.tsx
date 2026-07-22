"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { Skeleton } from "@/components/ui/Skeleton";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LABELS_STATUT_COMMANDE, STATUT_BADGE_VARIANT } from "@/lib/constants/commandes";
import { Search } from "lucide-react";

const supabase = createClient();

interface CommandeAdmin {
  id: string;
  numero: string;
  nom_client: string | null;
  montant_total: number;
  statut: string;
  created_at: string;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

export default function AdminCommandesPage() {
  const [commandes, setCommandes] = useState<CommandeAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statutFilter, setStatutFilter] = useState("tous");

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("commandes")
        .select("id, numero, nom_client, montant_total, statut, created_at")
        .order("created_at", { ascending: false })
        .limit(200);
      setCommandes(data || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    return commandes.filter((c) => {
      const matchQuery = !query || c.numero?.toLowerCase().includes(query.toLowerCase()) || c.nom_client?.toLowerCase().includes(query.toLowerCase());
      const matchStatut = statutFilter === "tous" || c.statut === statutFilter;
      return matchQuery && matchStatut;
    });
  }, [commandes, query, statutFilter]);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Toutes les commandes">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un numéro ou un client..."
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-coral-500/10"
          />
        </div>
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
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map((c) => (
            <div key={c.id} className="p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[160px]">
                <p className="font-bold text-gray-900">#{c.numero}</p>
                <p className="text-xs text-gray-400">{c.nom_client || "Client"} · {new Date(c.created_at).toLocaleDateString("fr-FR")}</p>
              </div>
              <p className="font-bold text-gray-700">{formatFCFA(c.montant_total)}</p>
              <StatusBadge variant={STATUT_BADGE_VARIANT[c.statut as keyof typeof STATUT_BADGE_VARIANT] || "neutral"}>
                {LABELS_STATUT_COMMANDE[c.statut as keyof typeof LABELS_STATUT_COMMANDE] || c.statut}
              </StatusBadge>
            </div>
          ))}
          {filtered.length === 0 && <p className="p-10 text-center text-gray-400">Aucune commande trouvée.</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
