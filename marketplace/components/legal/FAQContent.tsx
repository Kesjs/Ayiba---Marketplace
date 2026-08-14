"use client";

import { useState } from "react";
import { HelpCircle, ShoppingBag, Store, Bike, Wallet, ChevronDown } from "lucide-react";

const SECTIONS = [
  { id: "general", icon: HelpCircle, title: "Général" },
  { id: "commandes", icon: ShoppingBag, title: "Commandes & Paiement" },
  { id: "vendeurs", icon: Store, title: "Vendeurs" },
  { id: "livreurs", icon: Bike, title: "Livreurs" },
];

const FAQ_DATA: Record<string, { q: string; a: string }[]> = {
  general: [
    {
      q: "Qu'est-ce qu'Ayiba ?",
      a: "Ayiba est une marketplace de proximité qui connecte les vendeurs, les livreurs et les clients au Bénin. Vous commandez un produit, un livreur vous l'apporte, et le paiement est sécurisé jusqu'à la remise.",
    },
    {
      q: "Où Ayiba est-il disponible ?",
      a: "Ayiba démarre à Cotonou et Calavi. D'autres zones seront ajoutées progressivement selon la demande et la disponibilité de vendeurs et livreurs.",
    },
    {
      q: "Faut-il payer pour utiliser Ayiba ?",
      a: "Créer un compte client, vendeur ou livreur est gratuit. Seule une commission de 5% est prélevée sur les ventes des vendeurs et sur les frais de livraison des livreurs — jamais sur les clients.",
    },
  ],
  commandes: [
    {
      q: "Comment est calculé le prix d'une livraison ?",
      a: "Les frais de livraison combinent un montant fixe de base et un montant par kilomètre estimé entre le vendeur et vous. Le détail (produit + livraison = total) est toujours affiché avant le paiement.",
    },
    {
      q: "Mon argent est-il en sécurité si je paie en ligne ?",
      a: "Oui. Votre paiement est bloqué en séquestre par Ayiba dès que vous commandez. Il n'est débloqué vers le vendeur et le livreur qu'après votre confirmation de réception (QR Code ou code à 6 chiffres).",
    },
    {
      q: "Comment je confirme avoir bien reçu ma commande ?",
      a: "À la remise, vous scannez le QR Code affiché sur votre application avec le livreur, ou lui communiquez votre code secret à 6 chiffres si le scan n'est pas possible. C'est cette étape qui débloque le paiement.",
    },
    {
      q: "Que se passe-t-il si le produit est endommagé ou incorrect ?",
      a: "Avant de valider, signalez le problème directement dans l'application. Votre paiement reste bloqué en séquestre et notre équipe examine la situation avant toute décision.",
    },
  ],
  vendeurs: [
    {
      q: "Combien coûte la vente sur Ayiba ?",
      a: "Ayiba prélève une commission de 5% sur chaque vente réussie. Aucun frais d'inscription, aucun abonnement mensuel.",
    },
    {
      q: "Quand suis-je payé après une vente ?",
      a: "Dès que le client confirme la réception de sa commande, votre part (95% du prix du produit) est créditée sur votre compte Ayiba, disponible pour retrait via Mobile Money.",
    },
    {
      q: "Pourquoi mon article est-il « en vérification » ?",
      a: "Chaque nouvel article, ou toute modification du nom, de la description, de la catégorie ou des photos, est vérifié par notre équipe avant d'être visible aux acheteurs. Cela protège la confiance sur la plateforme.",
    },
  ],
  livreurs: [
    {
      q: "Combien je gagne par course ?",
      a: "Vous touchez 95% des frais de livraison de chaque course. Ayiba prélève une commission de 5% pour la sécurité et la technologie de la plateforme.",
    },
    {
      q: "Quand suis-je payé ?",
      a: "Dès que le client confirme la réception de sa commande (QR Code ou code secret), votre gain est crédité sur votre compte Ayiba, disponible pour retrait via Mobile Money.",
    },
    {
      q: "Dois-je scanner un code chez le vendeur ?",
      a: "Non. La récupération du colis chez le vendeur se fait en un simple clic. Seule la remise finale au client nécessite une validation (QR Code ou code secret).",
    },
  ],
};

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-gray-50/60">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 p-4 text-left"
      >
        <span className="text-sm font-bold text-gray-900">{q}</span>
        <ChevronDown
          size={16}
          className={`shrink-0 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-gray-600 leading-relaxed">{a}</p>
        </div>
      )}
    </div>
  );
}

function SectionCard({
  id,
  icon: Icon,
  title,
  items,
}: {
  id: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  items: { q: string; a: string }[];
}) {
  return (
    <section id={id} className="scroll-mt-24 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 sm:p-7">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <Icon size={18} />
        </div>
        <h2 className="text-base sm:text-lg font-bold text-gray-900 tracking-tight">{title}</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <FAQItem key={i} q={item.q} a={item.a} />
        ))}
      </div>
    </section>
  );
}

export function FAQContent() {
  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-4xl font-bold text-gray-900 tracking-tight mb-2">
          Questions fréquentes
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
        {SECTIONS.map((s) => (
          <SectionCard key={s.id} id={s.id} icon={s.icon} title={s.title} items={FAQ_DATA[s.id]} />
        ))}
      </div>
    </div>
  );
}
