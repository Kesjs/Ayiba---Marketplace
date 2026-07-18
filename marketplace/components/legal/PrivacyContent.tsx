"use client";

import { Database, Eye, Lock, Share2, UserCheck } from "lucide-react";

const SECTIONS = [
  { id: "collecte", icon: Database, title: "Collecte des données" },
  { id: "utilisation", icon: Eye, title: "Utilisation des informations" },
  { id: "protection", icon: Lock, title: "Protection et sécurité" },
  { id: "partage", icon: Share2, title: "Partage avec des tiers" },
  { id: "droits", icon: UserCheck, title: "Vos droits" },
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

export function PrivacyContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Politique de Confidentialité
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
        <SectionCard id="collecte" icon={Database} title="Collecte des données">
          <p>
            Pour garantir la sécurité des transactions sur Ayiba, nous collectons uniquement les informations
            nécessaires : numéro de téléphone, nom complet, et données de localisation pour la livraison. Vos
            documents d'identité (vendeurs/livreurs) sont stockés de manière sécurisée et servent uniquement à
            la validation manuelle de votre profil.
          </p>
        </SectionCard>

        <SectionCard id="utilisation" icon={Eye} title="Utilisation des informations">
          <p>
            Vos données sont utilisées pour traiter vos commandes, sécuriser les paiements via FedaPay (MTN, Moov,
            Celtiis) et permettre aux livreurs de vous contacter pour la remise de vos colis. Nous n'utilisons pas
            vos données à des fins publicitaires intrusives.
          </p>
        </SectionCard>

        <SectionCard id="protection" icon={Lock} title="Protection et sécurité">
          <p>
            La protection de votre vie privée est au cœur de notre modèle de confiance. Les transactions sont
            chiffrées, et l'accès aux informations est strictement cloisonné entre les rôles (le livreur ne voit
            pas votre paiement, le vendeur ne voit pas votre code OTP).
          </p>
        </SectionCard>

        <SectionCard id="partage" icon={Share2} title="Partage avec des tiers">
          <p>
            Nous ne vendons ni ne louons jamais vos données personnelles. Le partage se limite strictement aux
            partenaires logistiques et financiers nécessaires à la réalisation de votre achat ou de votre mission
            de livraison.
          </p>
        </SectionCard>

        <SectionCard id="droits" icon={UserCheck} title="Vos droits">
          <p>
            Conformément à la législation béninoise, vous disposez d'un droit d'accès, de rectification et de
            suppression de vos données. Vous pouvez exercer ces droits à tout moment depuis votre dashboard ou en
            contactant notre support.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
