"use client";

import {
  Info, UserPlus, Users, ShieldCheck, PackageCheck, Scale, Store, Bike,
} from "lucide-react";

const SECTIONS = [
  { id: "introduction", icon: Info, title: "Introduction" },
  { id: "inscription", icon: UserPlus, title: "Inscription et compte" },
  { id: "roles", icon: Users, title: "Rôles et responsabilités" },
  { id: "paiement", icon: ShieldCheck, title: "Paiement sécurisé (escrow)" },
  { id: "livraison", icon: PackageCheck, title: "Livraison et code OTP" },
  { id: "litiges", icon: Scale, title: "Litiges" },
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

export function CGUContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Conditions Générales d'Utilisation
        </h1>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
          Dernière mise à jour : Juillet 2026
        </span>
      </div>

      {/* Sommaire — chips de navigation rapide */}
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
            Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Ayiba,
            une marketplace de proximité permettant aux vendeurs, livreurs et clients d'interagir pour l'achat et
            la livraison de produits au Bénin. En utilisant Ayiba, vous acceptez intégralement ces conditions.
          </p>
        </SectionCard>

        <SectionCard id="inscription" icon={UserPlus} title="Inscription et compte">
          <p>
            L'inscription sur Ayiba nécessite un numéro de téléphone valide (MTN, Moov ou Celtiis).
            Chaque utilisateur est responsable de la sécurité de son compte. Les comptes vendeurs et livreurs
            font l'objet d'une validation manuelle rigoureuse par nos équipes avant activation.
          </p>
        </SectionCard>

        <SectionCard id="roles" icon={Users} title="Rôles et responsabilités">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-gray-500 mb-3">
                <Users size={15} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Clients</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Passent commande et paient en ligne via Mobile Money. L'argent est sécurisé en escrow jusqu'à la livraison.
              </p>
            </div>
            <div className="p-5 bg-coral-50/50 rounded-2xl border border-coral-100/50">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-coral-500 mb-3">
                <Store size={15} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Vendeurs</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Publient des produits authentiques. Une commission de 5% est appliquée sur les ventes réussies.
              </p>
            </div>
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50">
              <div className="w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center text-teal-600 mb-3">
                <Bike size={15} />
              </div>
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Livreurs</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Assurent le transport sécurisé. Perçoivent 100% des frais de livraison au lancement de la plateforme.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="paiement" icon={ShieldCheck} title="Paiement sécurisé (escrow)">
          <p>
            Ayiba utilise un système de paiement sécurisé. Les fonds du client sont bloqués par la plateforme et ne
            sont libérés au vendeur qu'après confirmation de la livraison par le client via un code OTP unique,
            assurant une protection totale contre les arnaques.
          </p>
        </SectionCard>

        <SectionCard id="livraison" icon={PackageCheck} title="Livraison et code OTP">
          <p>
            La livraison est validée par un code secret (OTP) généré par le client. Le livreur doit saisir ce code
            sur son application pour prouver la remise effective du colis. Sans ce code, la transaction n'est pas
            considérée comme terminée.
          </p>
        </SectionCard>

        <SectionCard id="litiges" icon={Scale} title="Litiges">
          <p>
            En cas de problème, un système de litige permet à nos équipes d'intervenir. L'argent reste bloqué en
            séquestre jusqu'à la résolution amiable ou arbitrée du conflit entre les parties.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
