"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Star, Package, Bike } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";

interface AvisRow {
  id: string;
  note: number;
  commentaire: string | null;
  created_at: string;
  article_id: string | null;
  livreur_id: string | null;
  article: { nom: string } | { nom: string }[] | null;
  livreur: { nom_complet: string } | { nom_complet: string }[] | null;
}

function one<T>(rel: T | T[] | null): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

function Stars({ note }: { note: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={14}
          className={n <= note ? "fill-amber-400 text-amber-400" : "text-gray-200"}
        />
      ))}
    </div>
  );
}

export default function AvisPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const { showToast } = useToast();

  const [avis, setAvis] = useState<AvisRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile) fetchAvis();
  }, [profile?.id]);

  const fetchAvis = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("avis")
        .select("id, note, commentaire, created_at, article_id, livreur_id, article:articles(nom), livreur:livreurs(nom_complet)")
        .eq("utilisateur_id", profile.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvis((data as any) || []);
    } catch (error) {
      console.error("Error fetching avis:", error);
      showToast("Erreur lors du chargement des évaluations", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Mes évaluations</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {loading || userLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-24 animate-pulse" />
            ))}
          </div>
        ) : avis.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center py-16">
            <Star size={36} className="text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 mb-1">Aucune évaluation pour le moment</p>
            <p className="text-xs text-gray-400 max-w-xs">
              Tes avis sur les produits et livreurs apparaîtront ici après une commande livrée.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {avis.map((a) => {
              const article = one(a.article);
              const livreur = one(a.livreur);
              const cible = article?.nom || livreur?.nom_complet || "Ayiba";
              return (
                <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
                        {a.livreur_id ? <Bike size={16} /> : <Package size={16} />}
                      </div>
                      <p className="text-sm font-semibold text-gray-800 truncate">{cible}</p>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0">
                      {new Date(a.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <Stars note={a.note} />
                  {a.commentaire && (
                    <p className="text-sm text-gray-600 mt-2 leading-relaxed">{a.commentaire}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
