"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Wallet,
  QrCode,
  ShieldCheck,
  ArrowRight,
  Store,
  Bike,
  CheckCircle2,
  XCircle,
  ChevronDown,
  Lock,
  Sparkles,
  ShoppingBag,
  Clock,
  HelpCircle,
  ShieldAlert,
} from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";

export default function CommentCaMarchePage() {
  const [activeRole, setActiveRole] = useState<"acheteur" | "vendeur" | "livreur">("acheteur");
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const stepsByRole = {
    acheteur: [
      {
        step: 1,
        title: "Paiement 100% Sécurisé (Escrow)",
        subtitle: "Vos fonds sont protégés",
        description:
          "Lorsque vous passez commande, votre argent est bloqué en toute sécurité sur un compte de garantie neutre Ayiba. Le vendeur ne touche pas un sous tant que vous n'avez pas validé votre livraison.",
        icon: Wallet,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "Garantie Escrow",
      },
      {
        step: 2,
        title: "Code Secret & Tracking en Direct",
        subtitle: "Votre clé de déverrouillage",
        description:
          "Dès l'expédition, un Code Secret unique à 6 chiffres vous est généré dans votre espace client. Ce code reste confidentiel : vous ne le donnez à personne à l'avance.",
        icon: QrCode,
        color: "text-[#FF5A5F]",
        bgColor: "bg-rose-50 border-rose-200/60",
        badge: "Code Confidentiel",
      },
      {
        step: 3,
        title: "Vérification & Remise du Code",
        subtitle: "Paiement libéré au vendeur",
        description:
          "Le livreur se présente chez vous à Cotonou ou Calavi. Vous inspectez votre colis. Tout est conforme ? Transmettez-lui votre Code Secret pour valider la réception. Le vendeur est payé.",
        icon: ShieldCheck,
        color: "text-teal-600",
        bgColor: "bg-teal-50 border-teal-200/60",
        badge: "Transaction Validée",
      },
    ],
    vendeur: [
      {
        step: 1,
        title: "Créez votre boutique gratuitement",
        subtitle: "En 2 minutes chrono",
        description:
          "Inscrivez-vous sur Ayiba, définissez le nom de votre boutique et complétez votre profil avec vos informations de contact et votre quartier au Bénin.",
        icon: Store,
        color: "text-[#FF5A5F]",
        bgColor: "bg-rose-50 border-rose-200/60",
        badge: "Boutique Offerte",
      },
      {
        step: 2,
        title: "Publiez vos articles",
        subtitle: "Photos & Description",
        description:
          "Ajoutez vos photos, fixez vos prix et précisez les caractéristiques. Vos produits sont instantanément visibles par des milliers d'acheteurs locaux.",
        icon: ShoppingBag,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "Visibilité Locale",
      },
      {
        step: 3,
        title: "Expédiez & Recevez votre argent",
        subtitle: "Paiement garanti",
        description:
          "Dès qu'une commande est passée, remettez le colis au livreur. Dès que l'acheteur saisit le code secret, vos fonds sont crédités sur votre solde Mobile Money ou bancaire.",
        icon: Wallet,
        color: "text-teal-600",
        bgColor: "bg-teal-50 border-teal-200/60",
        badge: "Revenus Sécurisés",
      },
    ],
    livreur: [
      {
        step: 1,
        title: "Postulez & Validez votre profil",
        subtitle: "Rejoignez la flotte",
        description:
          "Soumettez votre pièce d'identité et vos informations de livraison (Cotonou, Calavi, Godomey, etc.). Notre équipe valide rapidement votre compte.",
        icon: Bike,
        color: "text-teal-600",
        bgColor: "bg-teal-50 border-teal-200/60",
        badge: "Partenaire Agrée",
      },
      {
        step: 2,
        title: "Acceptez des missions à proximité",
        subtitle: "Flexibilité totale",
        description:
          "Recevez des demandes de courses selon votre zone géographique. Récupérez le colis auprès du vendeur et acheminez-le chez l'acheteur.",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "Liberté d'horaires",
      },
      {
        step: 3,
        title: "Scannez le Code Secret & Encaissez",
        subtitle: "Preuve de livraison",
        description:
          "Arrivé chez l'acheteur, demandez le Code Secret à 6 chiffres et validez-le sur votre application. Votre commission de livraison est immédiatement créditée.",
        icon: QrCode,
        color: "text-[#FF5A5F]",
        bgColor: "bg-rose-50 border-rose-200/60",
        badge: "Gains Immédiats",
      },
    ],
  };

  const faqs = [
    {
      question: "Que se passe-t-il si l'article reçu ne correspond pas à la commande ?",
      answer:
        "C'est l'avantage de la sécurité Ayiba ! Vous pouvez refuser de communiquer votre Code Secret au livreur si le colis n'est pas conforme. L'argent reste bloqué sur notre compte neutre. Notre équipe de support intervient immédiatement pour annuler la transaction et vous rembourser intégralement.",
    },
    {
      question: "Comment se déroule la livraison à Cotonou, Calavi et Porto-Novo ?",
      answer:
        "Nos livreurs partenaires sillonnent quotidiennement les communes du Bénin. Les frais de livraison sont calculés automatiquement au checkout en fonction de la distance exacte entre la boutique du vendeur et votre adresse de livraison.",
    },
    {
      question: "Combien de temps l'argent reste-t-il bloqué ?",
      answer:
        "Les fonds sont débloqués 24 heures après la saisie valide du Code Secret par l'acheteur lors de la remise physique du colis.",
    },
    {
      question: "Y a-t-il des frais pour créer une boutique sur Ayiba ?",
      answer:
        "Non, la création de boutique et la publication d'articles sont 100% gratuites sur Ayiba. Une petite commission fixe est prélevée uniquement lors d'une vente réussie.",
    },
  ];

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-[#F9F6F0] font-sans text-gray-900">
        
        {/* --- 1. HERO SECTION DE LA PAGE --- */}
        <section className="pt-12 pb-14 md:pt-20 md:pb-20 border-b border-stone-200/60 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10 text-center">
            
            {/* Badge d'en-tête */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-amber-100/80 text-amber-800 border border-amber-200/80 mb-4 shadow-xs">
              <Sparkles size={14} className="text-amber-600" />
              <span>Garantie Anti-Arnaque 100% Béninoise</span>
            </div>

            {/* Titre Principal */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-gray-900 max-w-4xl mx-auto leading-[1.15]">
              Zéro risque. <span className="text-[#FF5A5F]">100% Sérénité.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Découvrez comment Ayiba protège vos achats, vos ventes et vos livraisons partout au Bénin grâce au paiement Escrow et au Code Secret.
            </p>

            {/* --- ONGLET SECTEUR DE RÔLE (ACHETEUR / VENDEUR / LIVREUR) --- */}
            <div className="mt-10 inline-flex items-center p-1.5 rounded-2xl bg-stone-200/70 border border-stone-300/50 shadow-inner max-w-full overflow-x-auto">
              <button
                onClick={() => setActiveRole("acheteur")}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeRole === "acheteur"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛒 Je suis Acheteur
              </button>

              <button
                onClick={() => setActiveRole("vendeur")}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeRole === "vendeur"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛍️ Je suis Vendeur
              </button>

              <button
                onClick={() => setActiveRole("livreur")}
                className={`px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm transition-all duration-200 cursor-pointer whitespace-nowrap ${
                  activeRole === "livreur"
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                🛵 Je suis Livreur
              </button>
            </div>

          </div>
        </section>

        {/* --- 2. LES ÉTAPES ILLUSTRÉES EN CARTES --- */}
        <section className="py-14 md:py-20 max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900">
              Comment ça marche pour un{" "}
              <span className="text-[#FF5A5F]">
                {activeRole === "acheteur"
                  ? "Acheteur"
                  : activeRole === "vendeur"
                  ? "Vendeur"
                  : "Livreur"}
              </span>{" "}
              ?
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Un parcours simple en 3 étapes clés.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            <AnimatePresence mode="wait">
              {stepsByRole[activeRole].map((item) => {
                const IconComp = item.icon;
                return (
                  <motion.div
                    key={`${activeRole}-${item.step}`}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    transition={{ duration: 0.25 }}
                    className="bg-white rounded-3xl p-7 md:p-8 border border-stone-200/80 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow"
                  >
                    <div>
                      {/* Numéro et Badge */}
                      <div className="flex items-center justify-between mb-6">
                        <span className="w-10 h-10 rounded-2xl bg-gray-900 text-white font-extrabold text-sm flex items-center justify-center shadow-xs">
                          0{item.step}
                        </span>
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full border ${item.bgColor} ${item.color}`}
                        >
                          {item.badge}
                        </span>
                      </div>

                      {/* Icône */}
                      <div className={`w-14 h-14 rounded-2xl ${item.bgColor} flex items-center justify-center mb-5 ${item.color}`}>
                        <IconComp size={28} strokeWidth={2} />
                      </div>

                      {/* Titre & Description */}
                      <h3 className="text-lg font-black text-gray-900 mb-1">{item.title}</h3>
                      <p className="text-xs font-bold text-gray-400 mb-3">{item.subtitle}</p>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </section>

        {/* --- 3. TABLEAU COMPARATIF : SANS AYIBA VS AVEC AYIBA --- */}
        <section className="py-14 md:py-20 bg-white border-y border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-[#FF5A5F] border border-rose-100 mb-3">
                <ShieldAlert size={14} />
                <span>Pourquoi choisir Ayiba ?</span>
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-gray-900 tracking-tight">
                La différence qui change tout
              </h2>
              <p className="text-sm text-gray-500 font-medium mt-2">
                Fini les déceptions sur les réseaux sociaux.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Carte SANS Ayiba */}
              <div className="bg-rose-50/50 rounded-3xl p-7 md:p-8 border border-rose-100">
                <div className="flex items-center gap-2.5 text-rose-700 font-extrabold text-base mb-6">
                  <XCircle size={22} className="text-rose-500 shrink-0" />
                  <span>Achat classique sur les réseaux sociaux</span>
                </div>
                <ul className="space-y-4 text-sm font-medium text-gray-700">
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Payer par Mobile Money avant même de voir le produit.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Risque de recevoir un produit non conforme ou abîmé.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-rose-500 shrink-0 mt-0.5" />
                    <span>Aucun recours possible en cas de vendeur fantôme.</span>
                  </li>
                </ul>
              </div>

              {/* Carte AVEC Ayiba */}
              <div className="bg-teal-50/50 rounded-3xl p-7 md:p-8 border border-teal-100">
                <div className="flex items-center gap-2.5 text-teal-800 font-extrabold text-base mb-6">
                  <CheckCircle2 size={22} className="text-teal-600 shrink-0" />
                  <span>Achat sécurisé sur Ayiba</span>
                </div>
                <ul className="space-y-4 text-sm font-medium text-gray-800">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span>L'argent est bloqué (Escrow) jusqu'à votre validation finale.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span>Inspection du colis avant de donner votre Code Secret.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <CheckCircle2 size={16} className="text-teal-600 shrink-0 mt-0.5" />
                    <span>Vendeurs et livreurs avec identité vérifiée (KYC).</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* --- 4. FAQ ACCORDION INTERACTIF --- */}
        <section className="py-14 md:py-20 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
              Questions Fréquentes
            </h2>
            <p className="text-sm text-gray-500 font-medium mt-1">
              Tout ce que vous devez savoir pour démarrer sereinement.
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200/80 shadow-xs overflow-hidden transition-all"
              >
                <button
                  onClick={() => toggleFaq(idx)}
                  className="w-full p-5 md:p-6 text-left font-bold text-base text-gray-900 flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-50/60 transition-colors"
                >
                  <span>{faq.question}</span>
                  <ChevronDown
                    size={18}
                    className={`text-gray-500 transition-transform duration-200 shrink-0 ${
                      openFaq === idx ? "rotate-180 text-[#FF5A5F]" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {openFaq === idx && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="px-5 pb-6 md:px-6 md:pb-6 text-sm text-gray-600 leading-relaxed font-medium border-t border-stone-100 pt-4">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* --- 5. CALL TO ACTION FINAL --- */}
        <section className="py-14 md:py-20 bg-stone-900 text-white border-t border-stone-800">
          <div className="max-w-5xl mx-auto px-4 md:px-8 text-center">
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4">
              Prêt à vivre une expérience d'achat 100% sereine ?
            </h2>
            <p className="text-stone-300 text-base max-w-xl mx-auto mb-8 font-medium">
              Rejoignez la première marketplace béninoise qui protège vos transactions à chaque étape.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/catalogue"
                className="w-full sm:w-auto py-4 px-8 rounded-xl bg-[#FF5A5F] hover:bg-[#E0484D] text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg"
              >
                <span>Explorer le Catalogue</span>
                <ArrowRight size={18} />
              </Link>

              <Link
                href="/devenir-vendeur"
                className="w-full sm:w-auto py-4 px-8 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-base flex items-center justify-center gap-2 border border-white/20 transition-all active:scale-[0.98]"
              >
                <Store size={18} />
                <span>Ouvrir ma boutique</span>
              </Link>
            </div>
          </div>
        </section>

      </div>

      <Footer />
    </>
  );
}
