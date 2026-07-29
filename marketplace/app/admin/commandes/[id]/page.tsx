"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  LABELS_STATUT_COMMANDE,
  STATUT_BADGE_VARIANT,
  PROCHAINS_STATUTS,
  type StatutCommande,
} from "@/lib/constants/commandes";
import { ArrowLeft, Package, MapPin, Store, Truck, User, CreditCard } from "lucide-react";

const supabase = createClient();

function formatFCFA(n: number | null) {
  if (n === null || n === undefined) return "—";
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

interface CommandeDetailAdmin {
  id: string;
  numero: string;
  statut: StatutCommande;
  montant_total: number;
  frais_livraison: number | null;
  commission: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  nom_client: string | null;
  telephone_client: string | null;
  created_at: string;
  vendeur: { id: string; nom_boutique: string | null; telephone: string | null } | null;
  livreur: { id: string; nom: string | null; telephone: string | null } | null;
  commande_articles: {
    id: string;
    quantite: number;
    prix_unitaire: number;
    total: number;
    article: { nom: string } | { nom: string }[] | null;
  }[];
  paiements: {
    id: string;
    montant: number;
    commission: number | null;
    methode: string | null;
    reference: string | null;
    statut: string;
    created_at: string;
  }[];
}

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

export default function AdminCommandeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();

  const [commande, setCommande] = useState<CommandeDetailAdmin | null>(null);
  const [loading, setLoading] = useState(true);
  const [erreur, setErreur] = useState<string | null>(null);
  const [changementEnCours, setChangementEnCours] = useState<StatutCommande | null>(null);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("commandes")
      .select(
        `id, numero, statut, montant_total, frais_livraison, commission, adresse_livraison, commune,
         nom_client, telephone_client, created_at,
         vendeur:vendeurs ( id, nom_boutique, telephone ),
         livreur:users!commandes_livreur_id_fkey ( id, nom, telephone ),
         commande_articles ( id, quantite, prix_unitaire, total, article:articles ( nom ) ),
         paiements ( id, montant, commission, methode, reference, statut, created_at )`
      )
      .eq("id", params.id)
      .single();

    if (!error && data) {
      setCommande(data as unknown as CommandeDetailAdmin);
    }
    setLoading(false);
  }, [params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  async function changerStatut(nouveauStatut: StatutCommande) {
    if (!commande) return;
    setChangementEnCours(nouveauStatut);
    setErreur(null);
    try {
      const res = await fetch("/api/admin/commandes/changer-statut", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: commande.id, statut: nouveauStatut }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Échec du changement de statut");
      await charger();
    } catch (err) {
      setErreur(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setChangementEnCours(null);
    }
  }

  if (loading) {
    return (
      <DashboardLayout role="admin" title="Détail commande">
        <div className="h-64 flex items-center justify-center text-gray-400">Chargement...</div>
      </DashboardLayout>
    );
  }

  if (!commande) {
    return (
      <DashboardLayout role="admin" title="Détail commande">
        <p className="text-gray-500">Commande introuvable.</p>
      </DashboardLayout>
    );
  }

  const vendeur = one(commande.vendeur);
  const livreur = one(commande.livreur);
  const transitionsDisponibles = PROCHAINS_STATUTS[commande.statut] || [];

  return (
    <DashboardLayout role="admin" title={`Commande #${commande.numero}`}>
      <button
        onClick={() => router.push("/admin/commandes")}
        className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-gray-900 mb-6"
      >
        <ArrowLeft size={16} /> Retour à la liste
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête statut */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm flex items-center justify-between flex-wrap gap-4">
            <div>
              <p className="text-xs text-gray-400 font-medium">
                {new Date(commande.created_at).toLocaleString("fr-FR")}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatFCFA(commande.montant_total)}</p>
            </div>
            <StatusBadge variant={STATUT_BADGE_VARIANT[commande.statut] || "neutral"}>
              {LABELS_STATUT_COMMANDE[commande.statut] || commande.statut}
            </StatusBadge>
          </div>

          {/* Articles */}
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <Package size={18} className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Articles</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {commande.commande_articles?.map((ca) => {
                const article = one(ca.article);
                return (
                  <div key={ca.id} className="p-5 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900">{article?.nom || "Produit"}</p>
                      <p className="text-xs text-gray-400">
                        {ca.quantite} × {formatFCFA(ca.prix_unitaire)}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-gray-700">{formatFCFA(ca.total)}</p>
                  </div>
                );
              })}
              {(!commande.commande_articles || commande.commande_articles.length === 0) && (
                <p className="p-6 text-sm text-gray-400">Aucun article.</p>
              )}
            </div>
          </div>

          {/* Paiement */}
          <div className="bg-white rounded-[32px] border border-gray-50 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex items-center gap-2">
              <CreditCard size={18} className="text-gray-400" />
              <h3 className="font-bold text-gray-900">Paiement</h3>
            </div>
            <div className="divide-y divide-gray-50">
              {commande.paiements?.map((p) => (
                <div key={p.id} className="p-5 flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {p.methode || "Mobile Money"} {p.reference ? `— ${p.reference}` : ""}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(p.created_at).toLocaleString("fr-FR")}
                      {p.commission ? ` · commission ${formatFCFA(p.commission)}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-gray-700">{formatFCFA(p.montant)}</p>
                    <StatusBadge
                      variant={
                        p.statut === "paye"
                          ? "success"
                          : p.statut === "echoue"
                          ? "error"
                          : p.statut === "rembourse"
                          ? "neutral"
                          : "pending"
                      }
                    >
                      {p.statut}
                    </StatusBadge>
                  </div>
                </div>
              ))}
              {(!commande.paiements || commande.paiements.length === 0) && (
                <p className="p-6 text-sm text-gray-400">Aucun paiement enregistré.</p>
              )}
            </div>
          </div>

          {/* Action admin : changer le statut */}
          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-1">Changer le statut</h3>
            <p className="text-xs text-gray-400 mb-4">
              Seules les transitions valides depuis "{LABELS_STATUT_COMMANDE[commande.statut]}" sont proposées.
            </p>
            {erreur && <p className="text-xs text-red-600 font-medium mb-3">{erreur}</p>}
            {transitionsDisponibles.length === 0 ? (
              <p className="text-sm text-gray-400">Statut final, aucune transition possible.</p>
            ) : (
              <div className="flex flex-wrap gap-3">
                {transitionsDisponibles.map((s) => (
                  <button
                    key={s}
                    disabled={changementEnCours !== null}
                    onClick={() => changerStatut(s)}
                    className="h-11 px-5 rounded-2xl text-sm font-bold border border-gray-200 bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    {changementEnCours === s ? "..." : `→ ${LABELS_STATUT_COMMANDE[s]}`}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar infos */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm space-y-4">
            <div className="flex items-start gap-3">
              <User size={16} className="text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-400 font-medium">Client</p>
                <p className="text-sm font-bold text-gray-900">{commande.nom_client || "—"}</p>
                {commande.telephone_client && <p className="text-xs text-gray-500">{commande.telephone_client}</p>}
              </div>
            </div>
            {commande.adresse_livraison && (
              <div className="flex items-start gap-3">
                <MapPin size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Livraison</p>
                  <p className="text-sm font-bold text-gray-900">{commande.adresse_livraison}</p>
                  {commande.commune && <p className="text-xs text-gray-500">{commande.commune}</p>}
                </div>
              </div>
            )}
            {vendeur && (
              <div className="flex items-start gap-3">
                <Store size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Boutique</p>
                  <Link href={`/admin/vendeurs`} className="text-sm font-bold text-gray-900 hover:text-coral-500">
                    {vendeur.nom_boutique || "—"}
                  </Link>
                  {vendeur.telephone && <p className="text-xs text-gray-500">{vendeur.telephone}</p>}
                </div>
              </div>
            )}
            {livreur && (
              <div className="flex items-start gap-3">
                <Truck size={16} className="text-gray-400 mt-0.5" />
                <div>
                  <p className="text-xs text-gray-400 font-medium">Livreur</p>
                  <p className="text-sm font-bold text-gray-900">{livreur.nom || "—"}</p>
                  {livreur.telephone && <p className="text-xs text-gray-500">{livreur.telephone}</p>}
                </div>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-[32px] border border-gray-50 shadow-sm space-y-2">
            <p className="text-xs text-gray-400 font-medium">Détail montant</p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="font-bold text-gray-900">
                {formatFCFA(commande.montant_total - (commande.frais_livraison || 0))}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Livraison</span>
              <span className="font-bold text-gray-900">{formatFCFA(commande.frais_livraison)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Commission Ayiba</span>
              <span className="font-bold text-gray-900">{formatFCFA(commande.commission)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t border-gray-50">
              <span className="text-gray-700 font-bold">Total</span>
              <span className="font-bold text-gray-900">{formatFCFA(commande.montant_total)}</span>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
