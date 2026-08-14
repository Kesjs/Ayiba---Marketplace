"use client";

import { useState, useEffect, Suspense, lazy } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { AuthModal } from "@/components/ui/AuthModal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";

// Lazy-load heavy animation components to reduce initial bundle
const HeroSection = dynamic(() => import("@/components/devenir-livreur/HeroSection").then(m => ({ default: m.HeroSection })), { ssr: true });
const StepsSection = dynamic(() => import("@/components/devenir-livreur/StepsSection").then(m => ({ default: m.StepsSection })), { ssr: true });
const CommissionSection = dynamic(() => import("@/components/devenir-livreur/CommissionSection").then(m => ({ default: m.CommissionSection })), { ssr: true });
import {
  Wallet,
  ShieldCheck,
  Clock,
  Zap,
  Bike,
  ChevronDown,
  Coins,
  MapPin,
  IdCard,
  Smartphone,
  Truck,
  UserCheck,
  CheckCircle,
  Package,
  TrendingUp,
  Users,
  Calendar,
  Target,
  BarChart3,
} from "lucide-react";


// ─────────────────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────────────────

// Données statiques - préchargées au build time
const STEPS = [
  {
    number: "01",
    illustration: "/illustrations/rider-step-1.svg",
    title: "Profil vérifié",
    desc: "Inscrivez-vous en 2 minutes. Notre équipe vérifie votre identité et votre véhicule pour garantir la sécurité et le sérieux des livraisons sur Ayiba.",
    icon: IdCard,
  },
  {
    number: "02",
    illustration: "/illustrations/rider-step-2.svg",
    title: "Missions locales",
    desc: "Recevez des demandes de livraison à proximité. Acceptez les courses qui vous conviennent en un clic via votre application dédiée.",
    icon: Smartphone,
  },
  {
    number: "03",
    illustration: "/illustrations/rider-step-3.svg",
    title: "Gains instantanés",
    desc: "Soyez payé dès que le client valide la réception avec son code OTP unique. Vos gains (95%) sont crédités instantanément sur votre compte Mobile Money.",
    icon: Wallet,
  },
] as const;

const THREE_BENEFITS = [
  {
    icon: Wallet,
    title: "Paiements immédiats",
    desc: "Recevez 95% de chaque course sur Mobile Money.",
  },
  {
    icon: MapPin,
    title: "Courses de proximité",
    desc: "Livrez dans votre quartier, réduisez vos trajets.",
  },
  {
    icon: Clock,
    title: "Flexibilité totale",
    desc: "Travaillez quand vous voulez, à votre rythme.",
  },
];

const DELIVERY_FLOW = [
  { number: "1", label: "Mission disponible", icon: Package },
  { number: "2", label: "Vous acceptez", icon: CheckCircle },
  { number: "3", label: "Récupération colis", icon: Truck },
  { number: "4", label: "Livraison client", icon: Users },
  { number: "5", label: "Code OTP validé", icon: ShieldCheck },
  { number: "6", label: "Paiement reçu", icon: Wallet },
];

const WHY_AYIBA = [
  {
    icon: Wallet,
    title: "Revenus immédiats",
    desc: "Retrait quotidien via MTN, Moov ou Celtiis",
    color: "teal",
  },
  {
    icon: Clock,
    title: "Horaires flexibles",
    desc: "Vous choisissez vos heures de travail",
    color: "teal",
  },
  {
    icon: ShieldCheck,
    title: "Sécurité garantie",
    desc: "Validation OTP pour chaque livraison",
    color: "coral",
  },
  {
    icon: MapPin,
    title: "Proximité prioritaire",
    desc: "Courses dans votre zone géographique",
    color: "teal",
  },
  {
    icon: BarChart3,
    title: "Statistiques détaillées",
    desc: "Suivez vos performances et revenus",
    color: "teal",
  },
  {
    icon: Zap,
    title: "Missions instantanées",
    desc: "Notification en temps réel des nouvelles courses",
    color: "coral",
  },
];

const FAQS = [
  {
    q: "De quoi j'ai besoin pour m'inscrire ?",
    a: "Une moto en bon état, votre pièce d'identité (CNI ou passeport), une photo de vous et les documents de votre véhicule. Tout est validé manuellement en moins de 24h.",
  },
  {
    q: "Comment fonctionne le système OTP ?",
    a: "C'est simple : à la remise du colis, le client vous donne un code à 6 chiffres qu'il génère sur son application. Une fois saisi, votre paiement est débloqué instantanément.",
  },
  {
    q: "Comment je reçois mes gains ?",
    a: "Directement sur votre Mobile Money (MTN, Moov ou Celtiis). Vous touchez 95% de chaque course — Ayiba prélève 5% pour assurer la sécurité et la technologie de la plateforme.",
  },
  {
    q: "Est-ce que je peux refuser une course ?",
    a: "Oui, vous êtes totalement libre. Vous activez votre disponibilité quand vous le souhaitez et vous acceptez les missions au cas par cas.",
  },
  {
    q: "Quand est-ce que je reçois mon argent ?",
    a: "Immédiatement après validation du code OTP par le client. Le transfert sur votre Mobile Money se fait automatiquement dans les minutes qui suivent.",
  },
];

export default function DevenirLivreurPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white">
        {/* ═══════════════════════════════════════════════════════
            HERO - Lazy-loaded
        ═══════════════════════════════════════════════════════ */}
        <HeroSection benefits={THREE_BENEFITS} onCTAClick={() => setAuthModalOpen(true)} />

        {/* ═══════════════════════════════════════════════════════
            COMMENT ÇA MARCHE - Lazy-loaded
        ═══════════════════════════════════════════════════════ */}
        <StepsSection steps={STEPS} />

        {/* ═══════════════════════════════════════════════════════
            COMMISSION — Style Shopify - Lazy-loaded
        ═══════════════════════════════════════════════════════ */}
        <CommissionSection />

        {/* ═══════════════════════════════════════════════════════
            FLUX DE LIVRAISON — Split view
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                De l'acceptation au paiement
              </h2>
              <p className="text-lg text-gray-600">
                Un processus simple et sécurisé en 6 étapes
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne Livreur */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-100 border border-teal-200 flex items-center justify-center">
                    <Bike className="w-6 h-6 text-teal-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Vos actions</h3>
                    <p className="text-sm text-gray-600">Ce que vous gérez</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {DELIVERY_FLOW.slice(0, 4).map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white border border-teal-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-teal-50 border border-teal-200 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-teal-600" strokeWidth={2} />
                        </div>
                        <div>
                          <div className="text-xs text-teal-700 font-medium mb-1">Étape {step.number}</div>
                          <div className="font-medium text-gray-900">{step.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Colonne Système */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-gradient-to-br from-coral-50 to-white border border-coral-100 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-coral-100 border border-coral-200 flex items-center justify-center">
                    <ShieldCheck className="w-6 h-6 text-coral-500" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Validation automatique</h3>
                    <p className="text-sm text-gray-600">Sécurité et paiement</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {DELIVERY_FLOW.slice(4).map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white border border-coral-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-coral-50 border border-coral-200 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-coral-500" strokeWidth={2} />
                        </div>
                        <div>
                          <div className="text-xs text-coral-700 font-medium mb-1">Étape {step.number}</div>
                          <div className="font-medium text-gray-900">{step.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Message explicatif */}
                <div className="mt-6 p-4 bg-white border border-coral-100 rounded-xl">
                  <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-medium text-coral-600">Sécurité maximale :</span> Le client vous donne son code OTP. Une fois validé, votre paiement est transféré instantanément.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Card finale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-8 text-center bg-gray-50 border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto"
            >
              <Zap className="w-12 h-12 text-teal-600 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-lg text-gray-900 font-medium mb-2">
                Paiement instantané garanti
              </p>
              <p className="text-gray-600">
                Dès validation du code OTP, vos gains arrivent directement sur votre Mobile Money. Aucune attente, aucun retard.
              </p>
            </motion.div>
          </div>
        </section>


        {/* ═══════════════════════════════════════════════════════
            POURQUOI AYIBA — 6 cartes avec effets hover
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Pourquoi livrer sur Ayiba ?
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Une plateforme pensée pour votre réussite et votre sécurité
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_AYIBA.map((item, i) => {
                const Icon = item.icon;
                const isCoral = item.color === "coral";
                const accentColor = isCoral ? "bg-coral-400" : "bg-teal-400";
                const iconBg = isCoral ? "bg-coral-50" : "bg-teal-50";
                const iconColor = isCoral ? "text-coral-500" : "text-teal-600";
                const borderHover = isCoral ? "hover:border-coral-200" : "hover:border-teal-200";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className={`group relative bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${borderHover}`}
                  >
                    {/* Accent line */}
                    <div className={`absolute top-0 left-0 right-0 h-1 ${accentColor} rounded-t-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />

                    <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">{item.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FAQ
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-t border-gray-100">
          <div className="max-w-3xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Questions fréquentes
              </h2>
              <p className="text-lg text-gray-600">
                Tout ce que vous devez savoir pour démarrer
              </p>
            </motion.div>

            <div className="space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.4 }}
                    viewport={{ once: true }}
                    className={`bg-white border rounded-2xl overflow-hidden transition-all duration-300 ${
                      isOpen ? "border-teal-200 shadow-md" : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-5 text-left group"
                    >
                      <span className="text-base font-medium text-gray-900 pr-4">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 shrink-0 transition-all duration-300 ${
                          isOpen ? "rotate-180 text-teal-600" : "text-gray-400 group-hover:text-gray-600"
                        }`}
                        strokeWidth={2}
                      />
                    </button>

                    <div
                      className={`grid transition-all duration-300 ease-in-out ${
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <div className="px-6 pb-5 pt-2 border-t border-gray-100">
                          <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CTA FINAL
        ═══════════════════════════════════════════════════════ */}
        <section className="relative py-20 px-4 md:px-8 lg:px-12 bg-gradient-to-br from-teal-600 to-teal-700 overflow-hidden border-t border-teal-800/20">
          {/* Patterns décoratifs */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-10 right-10 w-64 h-64 bg-white rounded-full blur-3xl" />
            <div className="absolute bottom-10 left-10 w-96 h-96 bg-white rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="relative max-w-3xl mx-auto text-center"
          >
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2 mb-6">
              <Bike className="w-4 h-4 text-white" strokeWidth={2} />
              <span className="text-sm font-medium text-white">
                Rejoignez des centaines de livreurs
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-medium text-white mb-6 leading-tight">
              Prêt à augmenter vos revenus ?
            </h2>

            <p className="text-lg text-teal-50 mb-10 leading-relaxed max-w-2xl mx-auto">
              Inscrivez-vous maintenant et commencez à livrer dès demain. Aucun engagement, vous décidez quand vous travaillez.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button
                variant="primary"
                onClick={() => setAuthModalOpen(true)}
                className="bg-white text-teal-700 hover:bg-gray-50 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 min-w-[220px] font-medium px-8 py-4"
              >
                Commencer maintenant
              </Button>
              <Button
                variant="secondary"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-teal-700 transition-all duration-300 font-medium px-8 py-4"
              >
                Nous contacter
              </Button>
            </div>

            <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-teal-100">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">95% de gains</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Paiement sécurisé</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" strokeWidth={2} />
                <span className="text-sm">Flexibilité totale</span>
              </div>
            </div>
          </motion.div>
        </section>
      </div>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole="livreur"
      />
    </>
  );
}
