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
        subtitle: "Vos fonds sont protégés par GeniusPay",
        description:
          "Lorsque vous passez commande via Mobile Money (MTN, Moov, Celtiis), vos fonds sont bloqués en toute sécurité sur un compte de garantie neutre Ayiba. Le vendeur n'est payé que lorsque vous recevez et validez votre produit.",
        icon: Wallet,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "Garantie Escrow",
      },
      {
        step: 2,
        title: "Suivi GPS & QR Code / Code OTP",
        subtitle: "Suivez votre livreur en direct",
        description:
          "Dès l'expédition, suivez la position de votre livreur en temps réel sur la carte interactive. Un QR Code scannable et un Code OTP confidentiel à 6 chiffres sont générés dans votre compte.",
        icon: QrCode,
        color: "text-coral-500",
        bgColor: "bg-coral-50 border-coral-100",
        badge: "Tracking GPS & QR Code",
      },
      {
        step: 3,
        title: "Inspection & Validation",
        subtitle: "Paiement libéré après votre accord",
        description:
          "Le livreur arrive chez vous à Cotonou ou Calavi. Vous inspectez le colis. Tout est conforme ? Laissez le livreur scanner votre QR Code (ou donnez-lui le Code OTP) pour clôturer la commande et libérer le paiement.",
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
          "Inscrivez-vous sur Ayiba, personnalisez le nom de votre boutique et renseignez votre quartier au Bénin (Cotonou, Calavi, Godomey, Akpakpa...).",
        icon: Store,
        color: "text-coral-500",
        bgColor: "bg-coral-50 border-coral-100",
        badge: "Boutique Offerte",
      },
      {
        step: 2,
        title: "Publiez vos articles",
        subtitle: "Visibilité auprès des clients locaux",
        description:
          "Ajoutez vos photos, fixez vos prix et variantes. Vos produits sont immédiatement mis en avant auprès de milliers d'acheteurs vérifiés.",
        icon: ShoppingBag,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "Visibilité Locale",
      },
      {
        step: 3,
        title: "Remettez au livreur & Encaissez",
        subtitle: "Retraits Mobile Money instantanés",
        description:
          "Remettez le colis au livreur partenaire assigné. Dès la livraison validée par QR Code ou Code OTP chez le client, votre argent est crédité sur votre portefeuille Ayiba et retiré par Mobile Money.",
        icon: Wallet,
        color: "text-teal-600",
        bgColor: "bg-teal-50 border-teal-200/60",
        badge: "Revenus Sécurisés",
      },
    ],
    livreur: [
      {
        step: 1,
        title: "Rejoignez la flotte partenaire",
        subtitle: "Profil vérifié (KYC)",
        description:
          "Soumettez votre pièce d'identité et votre zone d'action (Cotonou, Calavi, etc.). Notre équipe modère et active votre profil en moins de 24h.",
        icon: Bike,
        color: "text-teal-600",
        bgColor: "bg-teal-50 border-teal-200/60",
        badge: "Partenaire Agrée",
      },
      {
        step: 2,
        title: "Acceptez les courses & Guidage GPS",
        subtitle: "Missions à proximité",
        description:
          "Consultez les commandes disponibles avec la distance exacte et votre gain net affiché. Lancez le guidage GPS et partagez votre position en direct.",
        icon: Clock,
        color: "text-amber-600",
        bgColor: "bg-amber-50 border-amber-200/60",
        badge: "GPS & Autonomie",
      },
      {
        step: 3,
        title: "Scannez le QR Code / OTP & Encaissez",
        subtitle: "Validation sécurisée",
        description:
          "Arrivé chez le client, scannez son QR Code ou entrez son Code OTP à 6 chiffres. La course est validée et votre gain est immédiatement versé sur votre compte.",
        icon: QrCode,
        color: "text-coral-500",
        bgColor: "bg-coral-50 border-coral-100",
        badge: "Gains Immédiats",
      },
    ],
  };

  const faqs = [
    {
      question: "Comment se déroule la validation de livraison avec le QR Code et le Code OTP ?",
      answer:
        "Lorsque le livreur arrive chez vous, vous pouvez soit lui présenter le QR Code affiché sur la page de votre commande pour qu'il le scanne avec son téléphone, soit lui dicter votre Code OTP à 6 chiffres. Les deux méthodes valident instantanément la livraison et libèrent le paiement au vendeur.",
    },
    {
      question: "Puis-je suivre le livreur en direct sur la carte ?",
      answer:
        "Oui ! Dès que le livreur prend en charge votre commande, un suivi GPS en direct s'active. Vous pouvez visualiser le temps estimé d'arrivée et le déplacement du livreur sur la carte en temps réel.",
    },
    {
      question: "Que se passe-t-il si l'article reçu ne correspond pas à la commande ?",
      answer:
        "C'est l'avantage de la sécurité Ayiba ! Vous pouvez refuser de présenter votre QR Code ou Code OTP au livreur si le colis n'est pas conforme. L'argent reste bloqué en toute sécurité sur notre compte Escrow. Notre équipe de support (ayiba.marketplace@gmail.com) intervient immédiatement pour annuler la transaction et vous rembourser intégralement.",
    },
    {
      question: "Quels sont les moyens de paiement acceptés ?",
      answer:
        "Toutes les transactions sont sécurisées via GeniusPay et prennent en charge les réseaux Mobile Money (MTN Mobile Money, Moov Money, Celtiis Cash) ainsi que les cartes bancaires.",
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
              Zéro risque. <span className="text-coral-500">100% Sérénité.</span>
            </h1>

            <p className="mt-4 text-base sm:text-lg text-gray-600 font-medium max-w-2xl mx-auto leading-relaxed">
              Découvrez comment Ayiba protège vos achats, vos ventes et vos livraisons partout au Bénin grâce au paiement Escrow, au suivi GPS en direct et aux QR Codes / Codes OTP.
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
              <span className="text-coral-500">
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

        {/* --- 2.5 SECTION RÉASSURANCE & GARANTIES (Transférée de la Home) --- */}
        <section className="py-14 md:py-20 bg-[#F1EFE8] border-y border-stone-200/80">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-xs font-extrabold text-teal-800 uppercase tracking-widest bg-teal-50 px-3 py-1 rounded-full border border-teal-100">
                Achetez en toute sérénité
              </span>
              <h2 className="text-2xl md:text-4xl font-extrabold text-gray-900 tracking-tight mt-3">
                Pourquoi nos clients adorent Ayiba
              </h2>
              <p className="text-sm md:text-base text-gray-600 font-medium mt-2">
                Chaque commande est sécurisée par le système d'escrow Mobile Money et vérifiée à la livraison par un code OTP confidentiel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 mb-6">
                  <Wallet size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Paiement Sécurisé (Escrow)</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Vos fonds via Mobile Money (MTN / Moov / Celtiis) restent bloqués sur un compte neutre jusqu'à la réception physique de votre colis.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-coral-50 border border-coral-100 flex items-center justify-center text-coral-500 mb-6">
                  <QrCode size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Validation par Code OTP</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  À la remise du colis, vous donnez votre code secret OTP à 6 chiffres au livreur uniquement si vous êtes 100% satisfait du produit.
                </p>
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-8 border border-stone-200/80 shadow-xs">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 mb-6">
                  <Bike size={28} />
                </div>
                <h3 className="text-lg font-extrabold text-gray-900 mb-2">Livraison Express Locale</h3>
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  Des livreurs de proximité contrôlés et géolocalisés assurent l'expédition rapide dans tout Cotonou, Calavi, Porto-Novo et environs.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* --- 3. TABLEAU COMPARATIF : SANS AYIBA VS AVEC AYIBA --- */}
        <section className="py-14 md:py-20 bg-white border-y border-stone-200/60">
          <div className="max-w-5xl mx-auto px-4 md:px-8">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold bg-coral-50 text-coral-600 border border-coral-100 mb-3">
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
              <div className="bg-red-50/50 rounded-3xl p-7 md:p-8 border border-red-100">
                <div className="flex items-center gap-2.5 text-red-700 font-extrabold text-base mb-6">
                  <XCircle size={22} className="text-red-500 shrink-0" />
                  <span>Achat classique sur les réseaux sociaux</span>
                </div>
                <ul className="space-y-4 text-sm font-medium text-gray-700">
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Payer par Mobile Money avant même de voir le produit.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <span>Risque de recevoir un produit non conforme ou abîmé.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
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
                    <span>Suivi GPS en direct & inspection du colis avant scan QR Code ou code OTP.</span>
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
                      openFaq === idx ? "rotate-180 text-coral-500" : ""
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
                className="w-full sm:w-auto py-4 px-8 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-extrabold text-base flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-coral-500/20"
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
