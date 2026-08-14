"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Wallet2, Smartphone, Banknote } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { STATUT_BADGE_VARIANT, LABELS_STATUT_COMMANDE, type StatutCommande } from "@/lib/constants/commandes";

interface CommandePaiement {
  id: string;
  numero: string;
  montant_total: number;
  mode_paiement: string | null;
  statut: StatutCommande;
  created_at: string;
  vendeur: { nom_boutique: string | null } | { nom_boutique: string | null }[] | null;
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

function ModeIcon({ mode }: { mode: string | null }) {
  if (mode === "mobile_money") return <Smartphone size={18} />;
  if (mode === "especes" || mode === "cash") return <Banknote size={18} />;
  return <Wallet2 size={18} />;
}

function labelMode(mode: string | null) {
  if (mode === "mobile_money") return "Mobile Money";
  if (mode === "especes" || mode === "cash") return "Espèces à la livraison";
  return mode || "Non renseigné";
}

export default function PaiementsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const { showToast } = useToast();

  const [commandes, setCommandes] = useState<CommandePaiement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchPaiements();
  }, [profile?.id]);

  const fetchPaiements = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("commandes")
        .select("id, numero, montant_total, mode_paiement, statut, created_at, vendeur:vendeurs(nom_boutique)")
        .eq("client_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCommandes((data as any) || []);
    } catch (error) {
      console.error("Error fetching paiements:", error);
      showToast("Erreur lors du chargement des paiements", "error");
    } finally {
      setLoading(false);
    }
  };

  const totalDepense = commandes
    .filter((c) => c.statut === "livree")
    .reduce((sum, c) => sum + Number(c.montant_total), 0);

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Historique des paiements</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {!userLoading && commandes.length > 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
              Total dépensé (commandes livrées)
            </p>
            <p className="text-2xl font-bold text-gray-900">{totalDepense.toLocaleString()} FCFA</p>
          </div>
        )}

        {loading || userLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-20 animate-pulse" />
            ))}
          </div>
        ) : commandes.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Wallet2 size={36} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Aucun paiement pour le moment</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {commandes.map((c) => {
              const vendeur = one(c.vendeur);
              return (
                <button
                  key={c.id}
                  onClick={() => router.push(`/commandes/${c.id}`)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                    <ModeIcon mode={c.mode_paiement} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {vendeur?.nom_boutique || "Boutique Ayiba"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {labelMode(c.mode_paiement)} · {new Date(c.created_at).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-gray-900 mb-1">
                      {Number(c.montant_total).toLocaleString()} FCFA
                    </p>
                    <StatusBadge variant={STATUT_BADGE_VARIANT[c.statut] || "neutral"}>
                      {LABELS_STATUT_COMMANDE[c.statut] || c.statut}
                    </StatusBadge>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
