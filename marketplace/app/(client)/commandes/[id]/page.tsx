"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowLeft,
  Package,
  CheckCircle2,
  Truck,
  Store,
  MapPin,
  Phone,
  MessageSquare,
  ShieldAlert,
  ShieldCheck,
  ScanLine,
} from "lucide-react";
import { LABELS_STATUT_COMMANDE, STATUT_STYLE, type StatutCommande } from "@/lib/constants/commandes";
import { ConfirmationLivraisonModal } from "@/components/client/ConfirmationLivraisonModal";

interface CommandeDetail {
  id: string;
  numero: string;
  statut: StatutCommande;
  montant_total: number;
  frais_livraison: number | null;
  adresse_livraison: string | null;
  commune: string | null;
  created_at: string;
  vendeur: { nom_boutique: string | null; telephone: string | null } | null;
  livreur: { nom: string | null; telephone: string | null } | null;
}

const ETAPES: { statut: StatutCommande; label: string }[] = [
  { statut: "en_attente", label: "Commande créée" },
  { statut: "confirmee", label: "Paiement confirmé" },
  { statut: "preparee", label: "Vendeur prépare" },
  { statut: "expediee", label: "En livraison" },
  { statut: "livree", label: "Livrée" },
];

function indexEtape(statut: StatutCommande) {
  const i = ETAPES.findIndex((e) => e.statut === statut);
  return i === -1 ? 0 : i;
}

export default function CommandeDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const supabase = createClient();

  const [commande, setCommande] = useState<CommandeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [modalOuvert, setModalOuvert] = useState(false);

  const charger = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("commandes")
      .select(
        `id, numero, statut, montant_total, frais_livraison, adresse_livraison, commune, created_at,
         vendeur:vendeurs ( nom_boutique, telephone ),
         livreur:users!commandes_livreur_id_fkey ( nom, telephone )`
      )
      .eq("id", params.id)
      .single();

    if (!error && data) {
      setCommande(data as unknown as CommandeDetail);
    }
    setLoading(false);
  }, [supabase, params.id]);

  useEffect(() => {
    charger();
  }, [charger]);

  // Rafraîchit l'écran en temps réel pendant que le client tente de
  // confirmer (les tentatives/statut changent côté serveur via la fonction RPC).
  useEffect(() => {
    if (!params.id) return;
    const channel = supabase
      .channel(`commande-${params.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "commandes", filter: `id=eq.${params.id}` },
        () => charger()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, params.id, charger]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!commande) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-gray-500">Commande introuvable.</p>
        <button onClick={() => router.push("/commandes")} className="text-coral-500 text-sm font-bold">
          Retour aux commandes
        </button>
      </div>
    );
  }

  const etapeActuelle = indexEtape(commande.statut);
  const peutConfirmer = commande.statut === "expediee";
  const enLitige = commande.statut === "en_attente_verification";

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-sm font-bold text-gray-900">Commande {commande.numero}</p>
          <span
            className={`inline-block mt-0.5 text-[11px] font-bold px-2 py-0.5 rounded-full border ${STATUT_STYLE[commande.statut]}`}
          >
            {LABELS_STATUT_COMMANDE[commande.statut]}
          </span>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Timeline */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Suivi</h2>
          <div className="space-y-4">
            {ETAPES.map((etape, i) => {
              const atteinte = i <= etapeActuelle && !enLitige;
              return (
                <div key={etape.statut} className="flex items-center gap-3">
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                      atteinte ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-300"
                    }`}
                  >
                    {atteinte ? <CheckCircle2 size={14} /> : <span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />}
                  </div>
                  <span className={`text-sm font-medium ${atteinte ? "text-gray-900" : "text-gray-400"}`}>
                    {etape.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Litige / en attente de vérification */}
        {enLitige && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-5 flex gap-3">
            <ShieldAlert size={20} className="text-orange-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-orange-700 mb-1">En attente de vérification</p>
              <p className="text-xs text-orange-600 leading-relaxed">
                Ton colis reste à toi. Le paiement est bloqué le temps que notre équipe vérifie la
                livraison — nous te contacterons rapidement.
              </p>
            </div>
          </div>
        )}

        {/* Qui s'occupe de votre commande — bloc de réassurance (ajout retenu
            depuis la revue externe). Coût faible : ces données existent déjà
            via le KYC vendeur/livreur. */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">
            Qui s'occupe de votre commande ?
          </h2>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-teal-500 shrink-0" />
              <span className="text-gray-700">Boutique validée</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-teal-500 shrink-0" />
              <span className="text-gray-700">Livreur vérifié</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-teal-500 shrink-0" />
              <span className="text-gray-700">Paiement sécurisé</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm">
              <ShieldCheck size={16} className="text-teal-500 shrink-0" />
              <span className="text-gray-700">Fonds bloqués en escrow Ayiba</span>
            </div>
          </div>
        </div>

        {/* Infos */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Informations</h2>
          <div className="flex items-center gap-3 text-sm">
            <Package size={16} className="text-gray-400" />
            <span className="text-gray-700">
              {commande.montant_total.toLocaleString()} FCFA
              {commande.frais_livraison ? ` + ${commande.frais_livraison.toLocaleString()} FCFA livraison` : ""}
            </span>
          </div>
          {commande.adresse_livraison && (
            <div className="flex items-center gap-3 text-sm">
              <MapPin size={16} className="text-gray-400" />
              <span className="text-gray-700">{commande.adresse_livraison}</span>
            </div>
          )}
          {commande.vendeur?.nom_boutique && (
            <div className="flex items-center gap-3 text-sm">
              <Store size={16} className="text-gray-400" />
              <span className="text-gray-700">{commande.vendeur.nom_boutique}</span>
            </div>
          )}
          {commande.livreur?.nom && (
            <div className="flex items-center gap-3 text-sm">
              <Truck size={16} className="text-gray-400" />
              <span className="text-gray-700">{commande.livreur.nom}</span>
            </div>
          )}
        </div>

        {/* Communication */}
        {(commande.vendeur?.telephone || commande.livreur?.telephone) && (
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-700">
              <MessageSquare size={16} /> Discuter
            </button>
            <button className="flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-700">
              <Phone size={16} /> Appeler
            </button>
          </div>
        )}

        {/* Confirmation de livraison — un seul bouton, bascule QR -> code6
            automatique gérée entièrement dans ConfirmationLivraisonModal
            (Décision 4 du dashboard-client.md). */}
        {peutConfirmer && (
          <button
            onClick={() => setModalOuvert(true)}
            className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2"
          >
            <ScanLine size={20} />
            Confirmer la livraison
          </button>
        )}
      </div>

      <ConfirmationLivraisonModal
        commandeId={commande.id}
        isOpen={modalOuvert}
        onClose={() => setModalOuvert(false)}
        onConfirmee={() => {
          charger();
        }}
      />
    </main>
  );
}
