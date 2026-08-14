"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, ChevronDown, LifeBuoy } from "lucide-react";

interface Faq {
  question: string;
  reponse: string;
}

const FAQS: Faq[] = [
  {
    question: "Comment suivre ma commande ?",
    reponse:
      "Va dans l'onglet \"Commandes\" pour voir l'état de chaque commande en temps réel : confirmée, préparée, expédiée puis livrée.",
  },
  {
    question: "Comment modifier ou annuler une commande ?",
    reponse:
      "Une commande peut être annulée tant qu'elle est \"en attente\". Passé ce stade, contacte le vendeur directement via la messagerie ou signale un problème depuis le détail de la commande.",
  },
  {
    question: "Quels moyens de paiement sont acceptés ?",
    reponse: "Mobile Money (MTN, Moov, Celtiis) et le paiement en espèces à la livraison selon le vendeur.",
  },
  {
    question: "Que faire si ma livraison a un problème ?",
    reponse:
      "Depuis \"Mes commandes\", ouvre la commande concernée et utilise \"Signaler un problème\" : un litige est ouvert et le paiement reste bloqué jusqu'à résolution.",
  },
  {
    question: "Comment supprimer mon compte ?",
    reponse: "Depuis ton Profil, en bas de page, l'option \"Supprimer mon compte\" lance une suppression définitive.",
  },
];

function FaqItem({ faq }: { faq: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-gray-50 last:border-b-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3.5 text-left"
      >
        <span className="text-sm font-semibold text-gray-800">{faq.question}</span>
        <ChevronDown
          size={16}
          className={`text-gray-400 shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <p className="px-4 pb-4 text-sm text-gray-500 leading-relaxed">{faq.reponse}</p>}
    </div>
  );
}

export default function SupportPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Centre d'aide</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-white rounded-2xl border border-coral-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
            <LifeBuoy size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Besoin d'aide ?</p>
            <p className="text-xs text-gray-400">Notre équipe te répond sous 24-48h</p>
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Questions fréquentes
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {FAQS.map((faq) => (
              <FaqItem key={faq.question} faq={faq} />
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            Nous contacter
          </h2>
          <a
            href="mailto:support@ayiba.bj"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">support@ayiba.bj</p>
              <p className="text-xs text-gray-400">Réponse par email</p>
            </div>
          </a>
        </div>
      </div>
    </main>
  );
}
