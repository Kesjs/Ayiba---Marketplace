"use client";

import { Mail, MessageCircle, Clock, AlertCircle } from "lucide-react";

const CANAUX = [
  {
    icon: Mail,
    title: "Par email",
    desc: "Pour toute question générale ou un problème avec une commande.",
    action: "support@ayiba.bj",
    href: "mailto:support@ayiba.bj",
    color: "coral",
  },
  {
    icon: MessageCircle,
    title: "Par WhatsApp",
    desc: "Pour une réponse rapide, du lundi au samedi.",
    action: "Ouvrir WhatsApp",
    href: "https://wa.me/2290146279139",
    color: "teal",
  },
];

export function ContactContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Contactez-nous
        </h1>
        <p className="text-sm sm:text-base text-gray-500">
          Une question, un signalement, une suggestion ? Notre équipe vous répond directement.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        {CANAUX.map((c) => (
          <a
            key={c.title}
            href={c.href}
            target={c.href.startsWith("http") ? "_blank" : undefined}
            rel="noopener noreferrer"
            className="flex flex-col bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:border-coral-200 hover:shadow-md transition-all"
          >
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center mb-4 ${
                c.color === "coral" ? "bg-coral-50 text-coral-500" : "bg-teal-50 text-teal-600"
              }`}
            >
              <c.icon size={19} />
            </div>
            <h2 className="text-base font-bold text-gray-900 mb-1.5">{c.title}</h2>
            <p className="text-xs text-gray-500 leading-relaxed mb-4">{c.desc}</p>
            <span className="text-sm font-bold text-gray-900 mt-auto">{c.action}</span>
          </a>
        ))}
      </div>

      <section className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7 flex items-start gap-3">
        <div className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center shrink-0">
          <Clock size={17} />
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-900 mb-1">Horaires du support</h2>
          <p className="text-sm text-gray-500 leading-relaxed">
            Du lundi au samedi, 8h à 19h. Les demandes reçues en dehors de ces horaires sont traitées dès
            l'ouverture suivante.
          </p>
        </div>
      </section>

      <div className="mt-6 flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-2xl p-4">
        <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
        <p className="text-xs text-amber-700 leading-relaxed">
          Pour un problème sur une commande en cours, indiquez toujours son numéro — vous le trouvez dans
          « Mes commandes » sur l'application.
        </p>
      </div>
    </div>
  );
}
