"use client";

import { Info, ShieldCheck, AlertTriangle, Scale, Clock } from "lucide-react";

const SECTIONS = [
  { id: "introduction", icon: Info, title: "Introduction" },
  { id: "escrow", icon: ShieldCheck, title: "Paiement en séquestre" },
  { id: "cas", icon: AlertTriangle, title: "Cas de remboursement" },
  { id: "litige", icon: Scale, title: "Ouvrir un litige" },
  { id: "delais", icon: Clock, title: "Délais de traitement" },
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

export function PolitiqueRemboursementContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Politique de remboursement
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
            Ayiba protège chaque paiement grâce à un système de séquestre (escrow). Cette politique explique
            dans quels cas un remboursement est possible et comment il est traité.
          </p>
        </SectionCard>

        <SectionCard id="escrow" icon={ShieldCheck} title="Paiement en séquestre">
          <p>
            Dès que vous payez une commande, l'argent est bloqué par Ayiba — il n'est versé au vendeur et au
            livreur qu'après votre confirmation de réception. Tant que vous n'avez pas validé, votre argent
            reste protégé et peut être remboursé si besoin.
          </p>
        </SectionCard>

        <SectionCard id="cas" icon={AlertTriangle} title="Cas de remboursement">
          <p>Un remboursement (total ou partiel) peut être accordé dans les cas suivants :</p>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Produit endommagé ou non conforme à la commande</li>
            <li>Produit manquant ou quantité incorrecte</li>
            <li>Colis ouvert ou visiblement altéré à la livraison</li>
            <li>Livraison définitivement impossible (client injoignable après plusieurs tentatives, zone non desservie)</li>
          </ul>
          <p>
            Une fois la livraison confirmée par le client (QR Code ou code secret), la commande est considérée
            comme terminée et ne peut plus faire l'objet d'un remboursement automatique.
          </p>
        </SectionCard>

        <SectionCard id="litige" icon={Scale} title="Ouvrir un litige">
          <p>
            Avant de valider votre réception, vous pouvez signaler un problème directement depuis
            l'application. La commande passe alors en litige : l'argent reste bloqué en séquestre et notre
            équipe examine la situation avant de décider d'un remboursement, d'un retour au vendeur, ou d'une
            nouvelle livraison.
          </p>
        </SectionCard>

        <SectionCard id="delais" icon={Clock} title="Délais de traitement">
          <p>
            Les litiges sont examinés par notre équipe dans les meilleurs délais. Un remboursement validé est
            reversé sur votre moyen de paiement d'origine (Mobile Money) selon les délais habituels de
            l'opérateur.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
