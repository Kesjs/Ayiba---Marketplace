"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, ChevronDown, ChevronRight, FileText, ShieldCheck, LifeBuoy } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

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
    reponse: "Mobile Money (MTN ou Moov) et le paiement en espèces à la livraison selon le vendeur.",
  },
  {
    question: "Que faire si ma livraison a un problème ?",
    reponse:
      "Depuis \"Mes commandes\", ouvre la commande concernée et utilise \"Signaler un problème\" : un litige est ouvert et le paiement reste bloqué jusqu'à résolution.",
  },
  {
    question: "Comment supprimer mon compte ?",
    reponse:
      "Depuis Compte > Centre de confiance > Sécurité, la zone sensible en bas de page propose \"Supprimer mon compte\" pour lancer une demande de suppression définitive.",
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
    <DashboardLayout role="client" title="Centre d'aide" backHref="/menu">
      <div className="max-w-lg mx-auto space-y-6">
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
            href="mailto:ayiba.marketplace@gmail.com"
            className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 px-4 py-3.5 hover:bg-gray-50 transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
              <Mail size={16} />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-800">ayiba.marketplace@gmail.com</p>
              <p className="text-xs text-gray-400">Réponse par email</p>
            </div>
          </a>
        </div>

        {/* Légal — récupéré de l'ancien "Paramètres" (supprimé de Compte,
            faisait doublon avec le reste du menu). */}
        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">Légal</h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            <a
              href="/cgu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                <FileText size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800">Conditions d'utilisation</span>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </a>
            <a
              href="/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center text-gray-500 shrink-0">
                <ShieldCheck size={16} />
              </div>
              <span className="flex-1 text-sm font-semibold text-gray-800">Politique de confidentialité</span>
              <ChevronRight size={16} className="text-gray-300 shrink-0" />
            </a>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
