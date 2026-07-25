"use client";

import { Info, Percent, Calculator, Eye } from "lucide-react";

const SECTIONS = [
  { id: "introduction", icon: Info, title: "Introduction" },
  { id: "taux", icon: Percent, title: "Un taux unique : 5%" },
  { id: "exemple", icon: Calculator, title: "Exemple chiffré" },
  { id: "transparence", icon: Eye, title: "Transparence" },
];

function SectionCard({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="text-sm sm:text-base text-gray-600 leading-relaxed space-y-4">{children}</div>
    </section>
  );
}

export function PolitiqueCommissionContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Politique de commission
        </h1>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
          Dernière mise à jour : Juillet 2026
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-1 px-1 no-scrollbar">
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="shrink-0 flex items-center gap-1.5 text-xs font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-100 rounded-full px-3.5 py-2 transition-colors"
          >
            <s.icon size={13} />
            {s.title}
          </a>
        ))}
      </div>

      <div className="space-y-5">
        <SectionCard id="introduction" icon={Info} title="Introduction">
          <p>
            Ayiba se rémunère uniquement par une commission prélevée sur les transactions qui passent par la
            plateforme. Aucun frais d'inscription, aucun abonnement, pour les vendeurs comme pour les
            livreurs.
          </p>
        </SectionCard>

        <SectionCard id="taux" icon={Percent} title="Un taux unique : 5%">
          <p>Le même taux de commission s'applique partout, sans exception :</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 bg-coral-50/50 rounded-2xl border border-coral-100/50">
              <p className="text-2xl font-bold text-coral-600 mb-1">5%</p>
              <p className="text-xs text-gray-500">sur le prix du produit, prélevés sur la part du vendeur</p>
            </div>
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50">
              <p className="text-2xl font-bold text-teal-600 mb-1">5%</p>
              <p className="text-xs text-gray-500">sur les frais de livraison, prélevés sur la part du livreur</p>
            </div>
          </div>
          <p>
            Le client, lui, ne paie jamais de commission : le prix affiché (produit + livraison) est le prix
            total, sans frais supplémentaire ajouté par Ayiba.
          </p>
        </SectionCard>

        <SectionCard id="exemple" icon={Calculator} title="Exemple chiffré">
          <p>Pour une commande de 10 000 FCFA avec 700 FCFA de frais de livraison :</p>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-1.5 font-mono text-xs sm:text-sm text-gray-700">
            <p>Total payé par le client : 10 700 FCFA</p>
            <p>Commission Ayiba : 500 + 35 = 535 FCFA</p>
            <p>Reçu par le vendeur : 9 500 FCFA</p>
            <p>Reçu par le livreur : 665 FCFA</p>
          </div>
        </SectionCard>

        <SectionCard id="transparence" icon={Eye} title="Transparence">
          <p>
            Le montant de la commission est calculé et enregistré sur chaque commande dès le paiement. Chaque
            vendeur et chaque livreur voit précisément ce qu'il touche sur chaque vente ou chaque course dans
            son tableau de bord.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
