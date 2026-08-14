"use client";

import { Heart, Target, ShieldCheck, MapPin } from "lucide-react";

const SECTIONS = [
  { id: "mission", icon: Target, title: "Notre mission" },
  { id: "valeurs", icon: Heart, title: "Nos valeurs" },
  { id: "confiance", icon: ShieldCheck, title: "Un marché de confiance" },
  { id: "zones", icon: MapPin, title: "Où nous sommes" },
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

export function AProposContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          À propos d'Ayiba
        </h1>
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 bg-gray-50 border border-gray-100 rounded-full px-3 py-1.5">
          La marketplace de proximité béninoise
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
        <SectionCard id="mission" icon={Target} title="Notre mission">
          <p>
            Ayiba digitalise le marché de quartier, sans le dénaturer. Notre mission est de donner aux
            vendeurs et artisans locaux un accès à plus de clients, et aux clients un moyen simple et sûr de
            commander près de chez eux, livré par des livreurs de leur propre zone.
          </p>
        </SectionCard>

        <SectionCard id="valeurs" icon={Heart} title="Nos valeurs">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-5 bg-gray-50 rounded-2xl border border-gray-100">
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Proximité</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Des vendeurs et livreurs de votre quartier, pas des entrepôts anonymes.
              </p>
            </div>
            <div className="p-5 bg-coral-50/50 rounded-2xl border border-coral-100/50">
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Simplicité</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Une application aussi facile à utiliser que WhatsApp, sans jargon technique.
              </p>
            </div>
            <div className="p-5 bg-teal-50/50 rounded-2xl border border-teal-100/50">
              <h3 className="font-bold text-gray-900 mb-1.5 text-sm">Confiance</h3>
              <p className="text-xs text-gray-500 leading-relaxed">
                Paiement sécurisé, vendeurs et livreurs vérifiés, litiges pris au sérieux.
              </p>
            </div>
          </div>
        </SectionCard>

        <SectionCard id="confiance" icon={ShieldCheck} title="Un marché de confiance">
          <p>
            Chaque vendeur et chaque livreur est vérifié manuellement avant de pouvoir vendre ou livrer sur
            Ayiba. Chaque paiement est protégé en séquestre jusqu'à la confirmation de livraison par le
            client. C'est cette double vérification — des personnes et de l'argent — qui rend Ayiba fiable.
          </p>
        </SectionCard>

        <SectionCard id="zones" icon={MapPin} title="Où nous sommes">
          <p>
            Ayiba démarre à Cotonou et Calavi, avec l'ambition de couvrir progressivement d'autres communes du
            Bénin, au rythme de l'arrivée de nouveaux vendeurs et livreurs.
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
