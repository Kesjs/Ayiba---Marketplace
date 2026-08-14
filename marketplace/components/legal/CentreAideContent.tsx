"use client";

import {
  LifeBuoy, HelpCircle, Truck, RotateCcw, Percent, FileText, MessageCircle, Mail,
} from "lucide-react";

const LIENS_RAPIDES = [
  { href: "/faq", icon: HelpCircle, title: "FAQ", desc: "Réponses aux questions les plus courantes" },
  { href: "/politique-livraison", icon: Truck, title: "Politique de livraison", desc: "Calcul des frais, zones, délais" },
  { href: "/politique-remboursement", icon: RotateCcw, title: "Politique de remboursement", desc: "Litiges et remboursements" },
  { href: "/politique-commission", icon: Percent, title: "Politique de commission", desc: "Comment Ayiba se rémunère" },
  { href: "/cgu", icon: FileText, title: "Conditions d'utilisation", desc: "Les règles de la plateforme" },
];

export function CentreAideContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8 text-center sm:text-left">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center mb-4 mx-auto sm:mx-0">
          <LifeBuoy size={22} />
        </div>
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Centre d'aide
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Une question, un souci ? Retrouvez les réponses ci-dessous ou contactez-nous directement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {LIENS_RAPIDES.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="flex items-start gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:border-coral-200 hover:shadow-md transition-all"
          >
            <div className="w-9 h-9 rounded-xl bg-coral-50 text-coral-500 flex items-center justify-center shrink-0">
              <l.icon size={16} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 mb-1">{l.title}</p>
              <p className="text-xs text-gray-500 leading-relaxed">{l.desc}</p>
            </div>
          </a>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <MessageCircle size={18} />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">
            Vous ne trouvez pas votre réponse ?
          </h2>
        </div>
        <p className="text-sm sm:text-base text-gray-600 leading-relaxed mb-4">
          Notre équipe vous répond directement par email ou WhatsApp.
        </p>
        <a
          href="/contact"
          className="inline-flex items-center gap-2 text-sm font-bold text-white bg-gray-950 hover:bg-coral-500 transition-colors px-5 py-3 rounded-2xl"
        >
          <Mail size={15} />
          Contacter le support
        </a>
      </section>
    </div>
  );
}
