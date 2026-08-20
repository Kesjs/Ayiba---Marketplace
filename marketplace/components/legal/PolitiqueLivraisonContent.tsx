"use client";

import { Info, Calculator, MapPin, Clock, PackageX, ShieldCheck } from "lucide-react";

const SECTIONS = [
  { id: "introduction", icon: Info, title: "Introduction" },
  { id: "calcul", icon: Calculator, title: "Calcul des frais" },
  { id: "zones", icon: MapPin, title: "Zones couvertes" },
  { id: "delais", icon: Clock, title: "Délais de livraison" },
  { id: "echec", icon: PackageX, title: "Livraison échouée" },
  { id: "securite", icon: ShieldCheck, title: "Vérification à la remise" },
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

export function PolitiqueLivraisonContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Politique de livraison
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
            Chaque commande passée sur Ayiba est livrée par un livreur partenaire, indépendant du vendeur.
            Cette politique explique comment les frais de livraison sont calculés et ce qui se passe à chaque
            étape, de la commande jusqu'à la remise du colis.
          </p>
        </SectionCard>

        <SectionCard id="calcul" icon={Calculator} title="Calcul des frais">
          <p>
            Les frais de livraison combinent un montant fixe de base et un montant par kilomètre, calculé
            entre l'adresse du vendeur et celle de la livraison :
          </p>
          <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 font-mono text-xs sm:text-sm text-gray-700">
            frais de livraison = frais de base + (distance × prix par km)
          </div>
          <p>
            Le détail complet — prix du produit, frais de livraison, total — est toujours affiché avant que
            vous confirmiez le paiement. Aucun frais caché n'est ajouté après coup.
          </p>
        </SectionCard>

        <SectionCard id="zones" icon={MapPin} title="Zones couvertes">
          <p>
            Ayiba livre actuellement à Cotonou et Calavi. La couverture s'élargit progressivement à mesure
            que de nouveaux livreurs rejoignent la plateforme dans d'autres communes.
          </p>
        </SectionCard>

        <SectionCard id="delais" icon={Clock} title="Délais & Suivi GPS en direct">
          <p>
            Le délai estimé dépend de la distance entre le vendeur et votre adresse. Une
            fois votre commande prise en charge, vous suivez la position du livreur en temps réel sur la carte interactive avec heure d'arrivée estimée.
          </p>
        </SectionCard>

        <SectionCard id="echec" icon={PackageX} title="Livraison échouée">
          <p>
            Si vous êtes injoignable ou absent au moment de la livraison, le livreur attend un court délai
            avant de considérer la tentative comme échouée. Votre paiement reste bloqué en séquestre — aucun
            argent n'est débité tant que la livraison n'est pas confirmée. Une nouvelle tentative ou un
            remboursement est ensuite organisé.
          </p>
        </SectionCard>

        <SectionCard id="securite" icon={ShieldCheck} title="Vérification à la remise">
          <p>
            À la remise, vous validez la réception via un QR Code affiché sur votre application, ou un code
            secret à 6 chiffres en cas de secours. Vérifiez toujours votre colis avant de valider : une fois
            confirmée, la livraison ne peut plus être signalée en litige.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
