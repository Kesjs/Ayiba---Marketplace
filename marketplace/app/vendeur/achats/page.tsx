"use client";

import { useEffect, useMemo, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";

type Purchase = { id: string; numero: string; statut: string; montant_total: number; created_at: string; vendeur: { nom_boutique: string | null } | null; commande_articles: { quantite: number; article: { nom: string; article_images: { image_url: string }[] } | null }[] };
const finishedStatuses = ["livree", "annulee", "remboursee"];

export default function VendeurAchatsPage() {
  const { profile } = useUser();
  const supabase = useMemo(() => createClient(), []);
  const [tab, setTab] = useState<"active" | "finished">("active");
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      let query = supabase.from("commandes").select("id, numero, statut, montant_total, created_at, vendeur:vendeurs(nom_boutique), commande_articles(quantite, article:articles(nom, article_images(image_url)))").eq("client_id", profile.id).order("created_at", { ascending: false });
      query = tab === "active" ? query.not("statut", "in", `(${finishedStatuses.join(",")})`) : query.in("statut", finishedStatuses);
      const { data, error } = await query;
      if (!cancelled) {
        if (error) console.error("Impossible de charger les achats vendeur", error);
        setPurchases((data as Purchase[]) || []);
        setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
  }, [profile?.id, supabase, tab]);

  return <DashboardLayout role="vendeur" title="Commandes" userName={profile?.full_name ?? undefined}>
    <div className="max-w-5xl space-y-6">
      <div className="inline-flex rounded-xl bg-gray-100 p-1">{([ ["active", "En cours"], ["finished", "Terminées"] ] as const).map(([key, label]) => <button key={key} onClick={() => setTab(key)} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === key ? "bg-white text-coral-600 shadow-sm" : "text-gray-500"}`}>{label}</button>)}</div>
      {loading ? <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 rounded-2xl bg-gray-100 animate-pulse" />)}</div> : purchases.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 bg-white px-6 py-16 text-center"><p className="font-semibold text-gray-700">Aucun achat {tab === "active" ? "en cours" : "terminé"}</p><p className="mt-1 text-sm text-gray-400">Vos commandes personnelles apparaîtront ici.</p></div> : <div className="space-y-3">{purchases.map((purchase) => {
        const item = purchase.commande_articles?.[0]; const article = item?.article;
        return <article key={purchase.id} className="flex gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-gray-100">{article?.article_images?.[0]?.image_url && <img src={article.article_images[0].image_url} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><p className="font-semibold text-gray-900 truncate">{article?.nom || "Commande"}</p><p className="text-sm text-gray-500">{purchase.vendeur?.nom_boutique || "Vendeur"} · {item?.quantite || 0} article(s)</p><p className="mt-1 text-sm font-bold text-coral-500">{purchase.montant_total.toLocaleString()} FCFA</p></div><div className="flex flex-col items-end gap-2"><StatusBadge variant={finishedStatuses.includes(purchase.statut) ? (purchase.statut === "livree" ? "success" : "error") : "pending"}>{purchase.statut}</StatusBadge><span className="text-xs text-gray-400">{new Date(purchase.created_at).toLocaleDateString("fr-FR")}</span></div></article>;
      })}</div>}
    </div>
  </DashboardLayout>;
}
