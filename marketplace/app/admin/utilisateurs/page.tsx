"use client";

import { useMemo, useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAdminUsers } from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Skeleton } from "@/components/ui/Skeleton";
import { Search, Ban, RotateCcw, ChevronRight, Archive, Users } from "lucide-react";

const ROLE_LABELS: Record<string, string> = {
  client: "Client",
  vendeur: "Vendeur",
  livreur: "Livreur",
  admin: "Admin",
};

function AdminUtilisateursContent() {
  const { users, loading, suspendre, reactiver } = useAdminUsers();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("tous");
  // "tous" ici exclut déjà les comptes supprimés (voir vue "archives" plus bas)
  const [statutFilter, setStatutFilter] = useState<string>("tous");
  // Onglet séparé pour les comptes supprimés/anonymisés (RGPD-like) : ils
  // n'encombrent plus la vue principale mais restent consultables/restaurables.
  const [vue, setVue] = useState<"actifs" | "archives">("actifs");

  // Permet aux liens externes (ex: carte KPI "Utilisateurs actifs" du dashboard)
  // de présélectionner un filtre via ?statut=actif
  useEffect(() => {
    const statutParam = searchParams.get("statut");
    if (statutParam === "supprime") {
      setVue("archives");
    } else if (statutParam) {
      setVue("actifs");
      setStatutFilter(statutParam);
    }
  }, [searchParams]);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchQuery =
        !query ||
        u.full_name?.toLowerCase().includes(query.toLowerCase()) ||
        u.email?.toLowerCase().includes(query.toLowerCase()) ||
        u.phone?.includes(query);
      const matchRole = roleFilter === "tous" || u.role === roleFilter;
      if (vue === "archives") {
        return matchQuery && matchRole && u.statut === "supprime";
      }
      const matchStatut = statutFilter === "tous" || u.statut === statutFilter;
      return matchQuery && matchRole && matchStatut && u.statut !== "supprime";
    });
  }, [users, query, roleFilter, statutFilter, vue]);

  const nbArchives = useMemo(() => users.filter((u) => u.statut === "supprime").length, [users]);

  const updateStatutFilter = (value: string) => {
    setStatutFilter(value);
    const params = new URLSearchParams(searchParams.toString());
    if (value === "tous") params.delete("statut");
    else params.set("statut", value);
    router.replace(`/admin/utilisateurs${params.toString() ? `?${params.toString()}` : ""}`, { scroll: false });
  };

  const changerVue = (v: "actifs" | "archives") => {
    setVue(v);
    router.replace("/admin/utilisateurs", { scroll: false });
  };

  return (
    <DashboardLayout role="admin" title="Gestion des utilisateurs">
      <div className="flex items-center gap-2 mb-6 bg-gray-100/70 p-1 rounded-2xl w-fit">
        <button
          onClick={() => changerVue("actifs")}
          className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold transition-colors ${
            vue === "actifs" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Users size={16} /> Utilisateurs
        </button>
        <button
          onClick={() => changerVue("archives")}
          className={`flex items-center gap-2 px-4 h-10 rounded-xl text-sm font-bold transition-colors ${
            vue === "archives" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          <Archive size={16} /> Archives {nbArchives > 0 && `(${nbArchives})`}
        </button>
      </div>

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
        {vue === "actifs" && (
          <select
            value={statutFilter}
            onChange={(e) => updateStatutFilter(e.target.value)}
            className="h-12 px-4 bg-white border border-gray-100 rounded-2xl shadow-sm font-bold text-sm text-gray-600"
          >
            <option value="tous">Tous les statuts</option>
            <option value="actif">Actifs</option>
            <option value="suspendu">Suspendus</option>
          </select>
        )}
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
            <Link
              key={u.id}
              href={`/admin/utilisateurs/${u.id}`}
              className="p-5 flex items-center gap-4 flex-wrap hover:bg-gray-50/60 transition-colors cursor-pointer"
            >
              <div className="flex-1 min-w-[180px]">
                <p className="font-bold text-gray-900">{u.full_name || "Sans nom"}</p>
                <p className="text-xs text-gray-400">{u.email || u.phone}</p>
              </div>
              <span className="text-xs font-bold text-gray-500 bg-gray-50 px-3 py-1 rounded-full">
                {ROLE_LABELS[u.role] || u.role}
              </span>
              {u.kyc_statut && (
                <StatusBadge variant={u.kyc_statut === "valide" ? "success" : u.kyc_statut === "refuse" ? "error" : "pending"}>
                  KYC {u.kyc_statut === "en_attente" ? "en attente" : u.kyc_statut}
                </StatusBadge>
              )}
              <StatusBadge variant={u.statut === "actif" ? "success" : "error"}>
                {u.statut === "actif" ? "Actif" : u.statut === "suspendu" ? "Suspendu" : "Supprimé"}
              </StatusBadge>
              {u.role !== "admin" && vue === "archives" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    reactiver(u.id);
                  }}
                  className="p-2 rounded-lg transition-colors bg-teal-50 text-teal-600 hover:bg-teal-100"
                  title="Restaurer le compte"
                >
                  <RotateCcw size={16} />
                </button>
              )}
              {u.role !== "admin" && vue === "actifs" && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    u.statut === "actif" ? suspendre(u.id) : reactiver(u.id);
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    u.statut === "actif" ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-teal-50 text-teal-600 hover:bg-teal-100"
                  }`}
                  title={u.statut === "actif" ? "Suspendre" : "Réactiver"}
                >
                  {u.statut === "actif" ? <Ban size={16} /> : <RotateCcw size={16} />}
                </button>
              )}
              <ChevronRight size={18} className="text-gray-300 shrink-0" />
            </Link>
          ))}
          {filtered.length === 0 && <p className="p-10 text-center text-gray-400">Aucun utilisateur trouvé.</p>}
        </div>
      )}
    </DashboardLayout>
  );
}

export default function AdminUtilisateursPage() {
  return (
    <Suspense fallback={null}>
      <AdminUtilisateursContent />
    </Suspense>
  );
}
