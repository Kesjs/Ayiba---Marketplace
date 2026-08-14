'use client'

import { motion, Variants } from "framer-motion";
import { Wallet, QrCode, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";

// Contenu déplacé depuis la home (ex-section "7. Comment ça marche") le jour
// où on a retiré le hero marketing : une marketplace va droit au but
// (recherche + catalogue dès l'arrivée), et ce contenu de réassurance
// détaillée vit désormais ici pour les visiteurs curieux qui veulent
// creuser — accessible depuis le footer ("Comment acheter" / "Comment ça
// marche"), plutôt qu'imposé à tout le monde sur la home.

const sectionVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
};

const lightStagger: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.06, delayChildren: 0.05 }
  }
};

const lightItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1, y: 0,
    transition: { duration: 0.4, ease: "easeOut" }
  }
};

const FEATURES = [
  {
    icon: Wallet,
    title: "Paiement en Escrow",
    desc: "Ayiba bloque votre argent en toute sécurité. Le vendeur n'est payé que 24h après votre confirmation de réception.",
    color: "text-amber-500",
    bg: "bg-amber-50"
  },
  {
    icon: QrCode,
    title: "Scan & Code Secret",
    desc: "Le livreur scanne le QR de votre commande à la remise. Pas de scanner ? Vous lui communiquez votre code à 6 chiffres, seulement quand il est devant vous.",
    color: "text-coral-500",
    bg: "bg-coral-50"
  },
  {
    icon: ShieldCheck,
    title: "Acteurs Vérifiés",
    desc: "Chaque vendeur et livreur passe par une validation manuelle d'identité. Pas de faux profils sur Ayiba.",
    color: "text-teal-500",
    bg: "bg-teal-50"
  }
];

export default function CommentCaMarchePage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-gray-50/50">
        <section className="py-14 md:py-24 text-gray-900 overflow-hidden relative flex-1">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 relative z-10">
            <motion.div
              variants={sectionVariants}
              initial="hidden"
              animate="visible"
              className="text-center max-w-3xl mx-auto mb-10 md:mb-16"
            >
              <h1 className="text-2xl md:text-4xl font-semibold mb-3 md:mb-4 tracking-tight">
                Zéro risque, <span className="text-coral-500 underline decoration-coral-500/20 underline-offset-8">100% plaisir.</span>
              </h1>
              <p className="text-gray-500 text-sm md:text-lg leading-relaxed font-medium">
                Nous avons construit Ayiba pour éliminer les arnaques et garantir que chaque transaction se termine par un sourire.
              </p>
            </motion.div>

            <motion.div
              variants={lightStagger}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-10 lg:gap-12"
            >
              {FEATURES.map((feature, i) => (
                <motion.div
                  key={i}
                  variants={lightItem}
                  className="group flex flex-col items-center text-center p-6 md:p-8 bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 md:mb-6 transition-transform duration-500 group-hover:scale-110 ${feature.color}`}>
                    <feature.icon size={26} strokeWidth={2} />
                  </div>
                  <h2 className="text-base md:text-lg font-semibold mb-2 md:mb-3 tracking-tight">{feature.title}</h2>
                  <p className="text-gray-500 leading-relaxed font-medium text-sm">{feature.desc}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  )
}
