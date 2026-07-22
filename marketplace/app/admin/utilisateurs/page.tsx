"use client";

import { useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminUsers } from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, Ban, RotateCcw } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendeur: "Vendeur",
  livreur: "Livreur",
  admin: "Admin",
};

export default function AdminUtilisateursPage() {
  const { users, loading, suspendre, reactiver } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("tous");

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !query ||
        u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase()) ||
        u.phone?.includes(query);
      const matchRole = roleFilter === "tous" || u.role === roleFilter;
      return matchQuery && matchRole;
    });
  }, [users, query, roleFilter]);

  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Gestion des utilisateurs">
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un nom, un email, un téléphone..."
            className="w-full h-12 pl-12 pr-4 bg-white border border-gray-100 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-coral-500/10 focus:border-coral-500 transition-all font-medium text-sm"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm text-gray-600"
        >
          <option value="tous">Tous les rôles</option>
          <option value="client">Clients</option>
          <option value="vendeur">Vendeurs</option>
          <option value="livreur">Livreurs</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
          {filtered.map((u) => (
            <div key={u.id} className="p-5 flex items-center gap-4 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <p className="font-bold text-gray-900">{u.full_name || "Sans nom"}</p>
                <p className="text-xs text-gray-400">{u.email || u.phone}</p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {ROLE_LABELS[u.role] || u.role}
              </span>
              <StatusBadge variant={u.statut === "actif" ? "success" : "error"}>
                {u.statut === "actif" ? "Actif" : "Suspendu"}
              </StatusBadge>
              {u.role !== "admin" && (
                <button
                  onClick={() => (u.statut === "actif" ? suspendre(u.id) : reactiver(u.id))}
                  className={`p-2 rounded-lg transition-colors ${
                    u.statut === "actif" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                  }`}
                  title={u.statut === "actif" ? "Suspendre" : "Réactiver"}
                >
                  {u.statut === "actif" ? <Ban size={16} /> : <RotateCcw size={16} />}
                </button>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="p-10 text-center text-gray-400">Aucun utilisateur trouvé.</p>}
        </div>
      )}
    </DashboardLayout>
  );
}
