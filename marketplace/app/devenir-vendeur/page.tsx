"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { AuthModal } from "@/components/ui/AuthModal";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";
import {
  Store,
  Wallet,
  ShieldCheck,
  Truck,
  Users,
  UserCheck,
  Camera,
  Coins,
  ChevronDown,
  CheckCircle,
  MessageCircle,
  BarChart3,
  Lock,
  Share2,
  PhoneOff,
  TrendingUp,
  Zap,
  Gift,
  Smartphone,
  ShoppingBag,
} from "lucide-react";


// ─────────────────────────────────────────────────────────
// DONNÉES
// ─────────────────────────────────────────────────────────

const STEPS = [
  {
    number: "01",
    illustration: "/illustrations/seller-step-1.svg",
    icon: UserCheck,
    title: "Inscription vérifiée",
    desc: "Créez votre compte en 2 minutes. Pour protéger notre communauté, chaque profil vendeur est contrôlé et validé manuellement par notre équipe avant toute mise en ligne.",
  },
  {
    number: "02",
    illustration: "/illustrations/seller-step-2.svg",
    icon: Store,
    title: "Boutique sécurisée",
    desc: "Publiez vos produits en toute simplicité. Notre algorithme et notre équipe s'assurent que chaque annonce respecte les standards de qualité Ayiba pour inspirer confiance aux acheteurs.",
  },
  {
    number: "03",
    illustration: "/illustrations/seller-step-3.svg",
    icon: ShieldCheck,
    title: "Vente protégée par code OTP",
    desc: "Le paiement est sécurisé via Mobile Money (Escrow). À la livraison, le client valide la réception en donnant un code OTP unique au livreur. Votre argent est libéré sur votre portefeuille après confirmation.",
  },
];

const THREE_BENEFITS = [
  {
    icon: Users,
    title: "Plus de clients",
    desc: "Vos produits sont proposés aux acheteurs d'Ayiba.",
  },
  {
    icon: Store,
    title: "Votre propre boutique",
    desc: "Une boutique à votre nom, partageable partout.",
  },
  {
    icon: Truck,
    title: "Livraison gérée",
    desc: "Nous organisons la livraison de vos commandes.",
  },
];

const DELIVERY_STEPS = [
  { number: "1", label: "Nouvelle commande", icon: ShoppingBag },
  { number: "2", label: "Vous préparez", icon: Store },
  { number: "3", label: "Livreur assigné", icon: UserCheck },
  { number: "4", label: "Livreur récupère", icon: Truck },
  { number: "5", label: "Client reçoit", icon: CheckCircle },
  { number: "6", label: "Paiement débloqué", icon: Wallet },
];

const WHY_AYIBA = [
  {
    icon: Store,
    title: "Votre boutique",
    desc: "Espace commercial personnalisé avec votre identité",
    color: "coral",
  },
  {
    icon: TrendingUp,
    title: "Nouveaux clients",
    desc: "Accédez aux milliers d'acheteurs actifs sur Ayiba",
    color: "coral",
  },
  {
    icon: ShieldCheck,
    title: "Paiement sécurisé",
    desc: "Mobile Money avec système d'escrow intégré",
    color: "teal",
  },
  {
    icon: Truck,
    title: "Livraison incluse",
    desc: "Réseau de livreurs vérifiés prêts à intervenir",
    color: "coral",
  },
  {
    icon: BarChart3,
    title: "Statistiques détaillées",
    desc: "Suivez vos ventes, clients et performances en temps réel",
    color: "coral",
  },
  {
    icon: MessageCircle,
    title: "Support réactif",
    desc: "Équipe disponible pour vous accompagner au quotidien",
    color: "teal",
  },
];

const CONTROL_FEATURES = [
  "Gérer mes produits",
  "Définir mes prix",
  "Suivre mes commandes",
  "Voir mes clients",
  "Consulter mes revenus",
  "Partager ma boutique",
];

const FAQS = [
  {
    q: "Combien coûte la vente sur Ayiba ?",
    a: "5% par commande. L'inscription et la publication sont 100% gratuites.",
  },
  {
    q: "Qui livre mes commandes ?",
    a: "Ayiba organise la livraison. Des livreurs vérifiés viennent chercher le colis chez vous.",
  },
  {
    q: "Quand est-ce que je reçois mon argent ?",
    a: "Après confirmation de la livraison. Directement sur votre Mobile Money (MTN ou Moov) dans les 24h.",
  },
  {
    q: "Puis-je partager ma boutique à mes clients ?",
    a: "Oui. Chaque vendeur possède un lien de boutique partageable sur WhatsApp, Instagram, TikTok, Facebook.",
  },
  {
    q: "Puis-je modifier mes prix et mes produits ?",
    a: "Oui, à tout moment. Vous gardez le contrôle total.",
  },
  {
    q: "Est-ce que je dois avoir un site web ?",
    a: "Non. Ayiba est votre site web.",
  },
];

export default function DevenirVendeurPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  const [checkingSession, setCheckingSession] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) {
        setCheckingSession(false);
        return;
      }
      const { data: userData } = await supabase
        .from("users")
        .select("role")
        .eq("id", session.user.id)
        .single();
      if (!active) return;
      setAlreadyLoggedIn(true);
      const target = userData?.role && isValidRole(userData.role) ? getRedirectPathForRole(userData.role) : "/";
      router.replace(target);
    })();

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession || alreadyLoggedIn) return null;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white">
        {/* ═══════════════════════════════════════════════════════
            HERO — "Votre boutique en ligne. Vos produits. Plus de clients."
        ═══════════════════════════════════════════════════════ */}
        <section className="relative py-20 md:py-32 bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex flex-col items-center text-center"
            >
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-coral-50 border border-coral-100 rounded-full px-4 py-2 mb-8">
                <Store className="w-4 h-4 text-coral-400" />
                <span className="text-sm font-medium text-coral-800">
                  Deviens vendeur sur Ayiba
                </span>
              </div>

              {/* H1 — Version 1 : Direct et actionnable */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.15] mb-6 tracking-tight">
                Créez votre boutique, partagez-la partout, on gère{" "}
                <span className="text-coral-400">paiement et livraison.</span>
              </h1>

              {/* Alternative H1 — Version 2 : Focus bénéfice client */}
              {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.15] mb-6 tracking-tight">
                Vendez en ligne sans site web, sans gestion{" "}
                <span className="text-coral-400">de livraison.</span>
              </h1> */}

              {/* Alternative H1 — Version 3 : Ultra court */}
              {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.15] mb-6 tracking-tight">
                Votre boutique en ligne.{" "}
                <span className="text-coral-400">Zéro logistique.</span>
              </h1> */}

              {/* Alternative H1 — Version 4 : Proposition de valeur claire */}
              {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-medium text-gray-900 leading-[1.15] mb-6 tracking-tight">
                Une boutique pro, des clients locaux,{" "}
                <span className="text-coral-400">livraison incluse.</span>
              </h1> */}

              {/* Sous-titre — court et précis */}
              <p className="text-lg text-gray-600 mb-10 leading-relaxed max-w-2xl">
                Votre boutique partageable sur tous vos réseaux, paiement Mobile Money sécurisé, livraison gérée.
              </p>

              {/* CTA Principal + Secondaire */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button
                  variant="primary"
                  onClick={() => setAuthModalOpen(true)}
                  className="text-base font-medium"
                >
                  Créer ma boutique gratuitement
                </Button>
                <Button variant="secondary" className="text-base font-medium">
                  Voir comment ça marche
                </Button>
              </div>

              {/* Trust line */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <Coins className="w-4 h-4 text-coral-400" />
                  <span>5% de commission</span>
                </div>
                <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-teal-400" />
                  <span>Paiement sécurisé</span>
                </div>
                <div className="w-px h-4 bg-gray-200 hidden sm:block" />
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-coral-400" />
                  <span>Livraison gérée</span>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            3 BÉNÉFICES FONDAMENTAUX
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
              {THREE_BENEFITS.map((benefit, i) => {
                const Icon = benefit.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="bg-white border border-gray-100 rounded-lg p-8 text-center hover:shadow-md transition-shadow"
                  >
                    <div className="w-16 h-16 rounded-full bg-coral-50 flex items-center justify-center mx-auto mb-6">
                      <Icon className="w-8 h-8 text-coral-400" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-3">
                      {benefit.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {benefit.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            COMMENT ÇA MARCHE
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Comment ça marche ?
              </h2>
              <p className="text-lg text-gray-600">
                Deviens vendeur en 3 étapes simples
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.15, duration: 0.6 }}
                    viewport={{ once: true }}
                    className="relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Badge numéro */}
                    <div className="absolute top-6 left-6 flex items-center justify-center w-10 h-10 rounded-full bg-coral-50 border-2 border-coral-100">
                      <span className="text-sm font-medium text-coral-400">
                        {step.number}
                      </span>
                    </div>

                    {/* Illustration */}
                    <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-8 mt-4 flex items-center justify-center">
                      <div className="absolute inset-0 bg-coral-50 rounded-full blur-3xl opacity-40" />
                      <img
                        src={step.illustration}
                        alt={step.title}
                        className="relative z-10 w-full h-full object-contain"
                        onError={(e) => {
                          // Fallback vers icône si l'image n'existe pas
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                          const iconContainer = target.nextElementSibling;
                          if (iconContainer) {
                            (iconContainer as HTMLElement).style.display = 'flex';
                          }
                        }}
                      />
                      {/* Fallback icon */}
                      <div className="hidden absolute inset-0 items-center justify-center">
                        <div className="w-20 h-20 rounded-2xl bg-coral-50 border border-coral-100 flex items-center justify-center">
                          <Icon className="w-10 h-10 text-coral-400" strokeWidth={1.5} />
                        </div>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-gray-900 mb-3 text-center">
                      {step.title}
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed text-center">
                      {step.desc}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            COMMISSION TRANSPARENTE
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50 border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Une commission transparente
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Sur chaque vente réussie, voici exactement comment le montant est réparti. Pas de frais cachés, pas de surprise.
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {/* Part Vendeur */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative bg-gradient-to-br from-teal-50 to-teal-50/50 border-2 border-teal-100 rounded-2xl p-8 overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Badge "VOUS" */}
                <div className="absolute top-4 right-4 bg-teal-400 text-white text-xs font-medium px-3 py-1 rounded-full">
                  VOUS
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center mb-6">
                    <Wallet className="w-8 h-8 text-teal-600" strokeWidth={2} />
                  </div>

                  <div className="mb-4">
                    <div className="text-6xl font-medium text-teal-600 mb-2 tracking-tight">
                      95%
                    </div>
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Part du Vendeur
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    Vous conservez la quasi-totalité de vos ventes. C'est votre travail, votre argent.
                  </p>
                </div>

                {/* Decoration */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-teal-100 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>

              {/* Commission Ayiba */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="relative bg-gradient-to-br from-coral-50 to-coral-50/50 border-2 border-coral-100 rounded-2xl p-8 overflow-hidden group hover:shadow-lg transition-all"
              >
                {/* Badge "AYIBA" */}
                <div className="absolute top-4 right-4 bg-coral-400 text-white text-xs font-medium px-3 py-1 rounded-full">
                  AYIBA
                </div>

                <div className="relative z-10">
                  <div className="w-16 h-16 rounded-2xl bg-coral-100 border border-coral-200 flex items-center justify-center mb-6">
                    <ShieldCheck className="w-8 h-8 text-coral-600" strokeWidth={2} />
                  </div>

                  <div className="mb-4">
                    <div className="text-6xl font-medium text-coral-400 mb-2 tracking-tight">
                      5%
                    </div>
                    <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                      Commission Ayiba
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">
                    Pour la technologie, la sécurité des paiements et l'infrastructure de livraison.
                  </p>
                </div>

                {/* Decoration */}
                <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-coral-100 rounded-full opacity-20 group-hover:scale-110 transition-transform duration-500" />
              </motion.div>
            </div>

            {/* Trust badges sous la commission */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 flex flex-wrap justify-center gap-6 text-sm text-gray-600"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>Aucun frais d'inscription</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>Aucun abonnement mensuel</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-teal-400" />
                <span>Vous payez uniquement si vous vendez</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            MOCKUP BOUTIQUE
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              {/* Mockup */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="flex justify-center"
              >
                <div className="w-full max-w-xs bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-lg">
                  {/* Header boutique */}
                  <div className="bg-coral-50 p-6 border-b border-gray-100">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-medium text-gray-900">
                          Bijoux Sarah
                        </h3>
                        <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                          <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
                          Vendeur vérifié
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <span className="text-amber-400">★</span>
                      <span className="font-medium text-gray-900">4,8</span>
                      <span className="text-gray-500">· 126 commandes</span>
                    </div>
                  </div>

                  {/* Produits grid */}
                  <div className="p-4 grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="bg-gray-50 rounded-lg aspect-square flex items-center justify-center border border-gray-100">
                        <div className="text-center">
                          <Gift className="w-6 h-6 text-gray-400 mx-auto mb-1" />
                          <span className="text-xs text-gray-500">Produit</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer */}
                  <div className="p-4 border-t border-gray-100 bg-gray-50">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Abomey-Calavi</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Text */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-6 leading-[1.2]">
                  Une boutique à votre nom
                </h2>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed">
                  Présentez vos produits, recevez des commandes et partagez votre boutique directement avec vos clients sur tous vos canaux.
                </p>
                <Button variant="secondary">
                  Voir un exemple de boutique
                </Button>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            VOS CLIENTS + NOS CLIENTS
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium text-gray-900 text-center mb-16 leading-[1.2]">
              Vos clients peuvent vous retrouver sur Ayiba
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              {/* Gauche : Flux de partage */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="space-y-4">
                  {[
                    { platform: "Vos réseaux sociaux", icon: Share2, color: "coral" },
                    { platform: "Votre boutique Ayiba", icon: Store, color: "teal" },
                    { platform: "Votre catalogue", icon: ShoppingBag, color: "coral" },
                    { platform: "Commande", icon: CheckCircle, color: "coral" },
                    { platform: "Paiement sécurisé", icon: ShieldCheck, color: "teal" },
                    { platform: "Livraison Ayiba", icon: Truck, color: "coral" },
                  ].map((step, i) => {
                    const Icon = step.icon;
                    const iconBg = step.color === "teal" ? "bg-teal-50" : "bg-coral-50";
                    const iconColor = step.color === "teal" ? "text-teal-600" : "text-coral-400";
                    const iconBorder = step.color === "teal" ? "border-teal-100" : "border-coral-100";

                    return (
                      <div key={i}>
                        <div className="flex items-center gap-4 p-4 bg-white border border-gray-100 rounded-lg hover:shadow-md transition-shadow">
                          <div className={`w-12 h-12 rounded-xl ${iconBg} border ${iconBorder} flex items-center justify-center shrink-0`}>
                            <Icon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
                          </div>
                          <span className="font-medium text-gray-900">{step.platform}</span>
                          {i < 5 && (
                            <div className="ml-auto text-gray-300">
                              <ChevronDown className="w-5 h-5 rotate-90" strokeWidth={2} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Droite : Clients Ayiba */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                viewport={{ once: true }}
                className="flex flex-col justify-center"
              >
                <div className="bg-teal-50 border border-teal-100 rounded-lg p-8">
                  <h3 className="text-2xl font-medium text-gray-900 mb-4">
                    Et nous vous apportons aussi de nouveaux clients
                  </h3>
                  <p className="text-lg text-gray-600 leading-relaxed mb-6">
                    Vos produits sont également visibles par les acheteurs qui recherchent déjà sur Ayiba.
                  </p>
                  <ul className="space-y-3">
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                      <span className="text-gray-700">Exposure automatique</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                      <span className="text-gray-700">Commandes sans effort</span>
                    </li>
                    <li className="flex items-center gap-3">
                      <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                      <span className="text-gray-700">Croissance garantie</span>
                    </li>
                  </ul>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            VOUS VENDEZ, NOUS LIVRONS — OPTION 2 (Split view avec étapes groupées)
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
                Vous vendez. Nous livrons.
              </h2>
              <p className="text-lg text-gray-600">
                Concentrez-vous sur vos produits, on s'occupe du reste
              </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne Vendeur */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-coral-50 border border-coral-100 flex items-center justify-center">
                    <Store className="w-6 h-6 text-coral-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Votre rôle</h3>
                    <p className="text-sm text-gray-600">Ce que vous gérez</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {DELIVERY_STEPS.slice(0, 2).map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-coral-50 border border-coral-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white border border-coral-200 flex items-center justify-center shrink-0">
                          <Icon className="w-5 h-5 text-coral-400" strokeWidth={2} />
                        </div>
                        <div>
                          <div className="text-xs text-coral-600 font-medium mb-1">Étape {step.number}</div>
                          <div className="font-medium text-gray-900">{step.label}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>

              {/* Colonne Ayiba */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                    <Truck className="w-6 h-6 text-teal-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">Ayiba s'occupe du reste</h3>
                    <p className="text-sm text-gray-600">Automatiquement géré</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {DELIVERY_STEPS.slice(2).map((step, i) => {
                    const Icon = step.icon;
                    return (
                      <div key={i} className="flex items-center gap-4 p-4 bg-teal-50 border border-teal-100 rounded-xl">
                        <div className="w-10 h-10 rounded-lg bg-white border border-teal-200 flex items-center justify-center shrink-0">
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
            </div>

            {/* Card finale */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-8 text-center bg-white border border-gray-200 rounded-2xl p-8 max-w-3xl mx-auto"
            >
              <CheckCircle className="w-12 h-12 text-teal-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-lg text-gray-900 font-medium mb-2">
                Livraison 100% gérée par Ayiba
              </p>
              <p className="text-gray-600">
                Attribution automatique du livreur, tracking en temps réel, confirmation par code OTP.
              </p>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            VOUS VENDEZ, NOUS LIVRONS — OPTION 1 (Timeline horizontale)
        ═══════════════════════════════════════════════════════ */}
        {/* <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Vous vendez. Nous livrons.
              </h2>
              <p className="text-lg text-gray-600">
                Zéro stress logistique, concentrez-vous sur vos produits
              </p>
            </motion.div>

            <div className="relative">
              <div className="hidden lg:block absolute top-8 left-0 right-0 h-1 bg-gray-100">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                  viewport={{ once: true }}
                  className="h-full bg-gradient-to-r from-coral-400 to-teal-400"
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 relative">
                {DELIVERY_STEPS.map((step, i) => {
                  const Icon = step.icon;
                  const isVendor = i <= 1;
                  const isLivreur = i >= 2 && i <= 4;
                  const isPaiement = i === 5;
                  
                  const bgColor = isVendor ? "bg-coral-50" : isLivreur ? "bg-gray-50" : "bg-teal-50";
                  const iconBg = isVendor ? "bg-coral-100" : isLivreur ? "bg-gray-200" : "bg-teal-100";
                  const iconColor = isVendor ? "text-coral-400" : isLivreur ? "text-gray-500" : "text-teal-600";
                  const borderColor = isVendor ? "border-coral-200" : isLivreur ? "border-gray-200" : "border-teal-200";

                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 30 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.5 }}
                      viewport={{ once: true }}
                      className={`relative ${bgColor} border ${borderColor} rounded-2xl p-6 hover:shadow-lg transition-all group`}
                    >
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-8 h-8 bg-white border-2 border-gray-200 rounded-full flex items-center justify-center text-xs font-medium text-gray-600 group-hover:scale-110 transition-transform">
                        {step.number}
                      </div>

                      <div className={`w-14 h-14 mx-auto mb-4 rounded-xl ${iconBg} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={2} />
                      </div>

                      <p className="text-sm font-medium text-gray-900 text-center leading-snug">
                        {step.label}
                      </p>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 text-center bg-coral-50 border border-coral-100 rounded-2xl p-8 max-w-2xl mx-auto"
            >
              <Truck className="w-12 h-12 text-coral-400 mx-auto mb-4" strokeWidth={1.5} />
              <p className="text-lg text-gray-900 font-medium mb-2">
                Pas besoin de chercher un livreur
              </p>
              <p className="text-gray-600">
                Ayiba gère tout le flux de livraison de A à Z. Vous n'avez qu'à préparer votre colis.
              </p>
            </motion.div>
          </div>
        </section> */}

        {/* ═══════════════════════════════════════════════════════
            VOUS VENDEZ, NOUS LIVRONS — OPTION 3 (Style kanban moderne)
        ═══════════════════════════════════════════════════════ */}
        {/* <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 bg-coral-50 border border-coral-100 rounded-full px-4 py-2 mb-6">
                <Truck className="w-4 h-4 text-coral-400" />
                <span className="text-sm font-medium text-coral-800">Logistique simplifiée</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                De la commande au paiement
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Un processus automatisé où vous ne gérez que la préparation
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  phase: "Commande",
                  color: "coral",
                  steps: DELIVERY_STEPS.slice(0, 2),
                  icon: ShoppingBag
                },
                {
                  phase: "Livraison",
                  color: "gray",
                  steps: DELIVERY_STEPS.slice(2, 5),
                  icon: Truck
                },
                {
                  phase: "Paiement",
                  color: "teal",
                  steps: DELIVERY_STEPS.slice(5),
                  icon: Wallet
                }
              ].map((phase, phaseIndex) => {
                const PhaseIcon = phase.icon;
                const isCorral = phase.color === "coral";
                const isTeal = phase.color === "teal";
                const bgColor = isCorral ? "bg-coral-50" : isTeal ? "bg-teal-50" : "bg-gray-50";
                const borderColor = isCorral ? "border-coral-100" : isTeal ? "border-teal-100" : "border-gray-100";
                const iconBg = isCorral ? "bg-coral-100" : isTeal ? "bg-teal-100" : "bg-gray-200";
                const iconColor = isCorral ? "text-coral-400" : isTeal ? "text-teal-600" : "text-gray-500";

                return (
                  <motion.div
                    key={phaseIndex}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: phaseIndex * 0.15, duration: 0.6 }}
                    viewport={{ once: true }}
                    className={`${bgColor} border ${borderColor} rounded-2xl p-6`}
                  >
                    <div className="flex items-center gap-3 mb-6">
                      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
                        <PhaseIcon className={`w-6 h-6 ${iconColor}`} strokeWidth={2} />
                      </div>
                      <h3 className="font-medium text-gray-900">{phase.phase}</h3>
                    </div>

                    <div className="space-y-3">
                      {phase.steps.map((step, i) => {
                        const StepIcon = step.icon;
                        return (
                          <div key={i} className="flex items-start gap-3 p-3 bg-white rounded-lg">
                            <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                              <StepIcon className="w-4 h-4 text-gray-600" strokeWidth={2} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-xs text-gray-500 mb-1">Étape {step.number}</div>
                              <div className="text-sm font-medium text-gray-900">{step.label}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto"
            >
              {[
                { icon: Store, text: "Vous préparez le colis", color: "coral" },
                { icon: Truck, text: "Ayiba gère la livraison", color: "gray" },
                { icon: Wallet, text: "Vous recevez l'argent", color: "teal" }
              ].map((item, i) => {
                const Icon = item.icon;
                const isCorral = item.color === "coral";
                const isTeal = item.color === "teal";
                const iconColor = isCorral ? "text-coral-400" : isTeal ? "text-teal-600" : "text-gray-500";
                
                return (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                    <Icon className={`w-6 h-6 ${iconColor} shrink-0`} strokeWidth={2} />
                    <span className="text-sm font-medium text-gray-900">{item.text}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>
        </section> */}

        {/* ═══════════════════════════════════════════════════════
            PAIEMENT SÉCURISÉ — DESIGN OPTION 2 (Shopify-inspired, fond gris)
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-gray-50 border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-100 rounded-full px-4 py-2 mb-6">
                <ShieldCheck className="w-4 h-4 text-teal-600" />
                <span className="text-sm font-medium text-teal-800">Paiement 100% sécurisé</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Encaissez en toute sérénité
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Système de paiement escrow : vos revenus sont garantis dès la commande
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-12">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0">
                    <Wallet className="w-6 h-6 text-teal-600" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Vous gardez 95%</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Commission transparente de 5% uniquement sur les ventes réussies
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-400" />
                    <span>Pas de frais d'inscription</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-400" />
                    <span>Pas d'abonnement mensuel</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-teal-400" />
                    <span>Retrait sous 24h</span>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
                className="bg-white border border-gray-200 rounded-2xl p-8 hover:shadow-xl transition-all"
              >
                <div className="flex items-start gap-4 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-coral-50 border border-coral-100 flex items-center justify-center shrink-0">
                    <Smartphone className="w-6 h-6 text-coral-400" strokeWidth={2} />
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Mobile Money</h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      Vos clients paient via MTN ou Moov en toute sécurité
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-coral-400" />
                    <span>Paiement instantané</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-coral-400" />
                    <span>Confirmation automatique</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <CheckCircle className="w-4 h-4 text-coral-400" />
                    <span>Escrow jusqu'à livraison</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gradient-to-br from-teal-50 to-white border border-teal-100 rounded-2xl p-8 max-w-4xl mx-auto"
            >
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center shrink-0">
                  <Lock className="w-8 h-8 text-teal-600" strokeWidth={2} />
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h3 className="font-medium text-gray-900 mb-2">Protection totale</h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    L'argent reste bloqué en sécurité jusqu'à la confirmation de livraison par le client. Zéro risque de non-paiement.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            PAIEMENT SÉCURISÉ — DESIGN OPTION 1 (Stripe-inspired)
        ═══════════════════════════════════════════════════════ */}
        {/* <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-y border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Votre argent est sécurisé
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Système d'escrow intégré : le client paie, vous livrez, l'argent est débloqué automatiquement
              </p>
            </motion.div>

            <div className="max-w-5xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-gray-100 via-teal-100 to-gray-100 -translate-y-1/2 z-0" />

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative z-10 bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-coral-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-coral-50 border border-coral-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Smartphone className="w-8 h-8 text-coral-400" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-600">
                      Étape 1
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Client paie</h3>
                    <p className="text-sm text-gray-600">
                      Mobile Money : MTN, Moov
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative z-10 bg-gradient-to-br from-teal-50 to-white border-2 border-teal-200 rounded-2xl p-8 shadow-lg"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-100 border border-teal-200 flex items-center justify-center mb-6">
                      <ShieldCheck className="w-8 h-8 text-teal-600" strokeWidth={2.5} />
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-100 px-3 py-1 rounded-full border border-teal-200 text-xs font-medium text-teal-700">
                      Étape 2
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Fonds sécurisés</h3>
                    <p className="text-sm text-gray-600">
                      En escrow jusqu'à confirmation de livraison
                    </p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative z-10 bg-white border-2 border-gray-100 rounded-2xl p-8 hover:border-teal-200 hover:shadow-lg transition-all group"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-100 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Wallet className="w-8 h-8 text-teal-600" strokeWidth={2} />
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white px-3 py-1 rounded-full border border-gray-200 text-xs font-medium text-gray-600">
                      Étape 3
                    </div>
                    <h3 className="font-medium text-gray-900 mb-2">Vous recevez</h3>
                    <p className="text-sm text-gray-600">
                      95% dans les 24h sur votre compte
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.6 }}
                viewport={{ once: true }}
                className="mt-12 flex flex-wrap justify-center gap-8 text-sm"
              >
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-gray-600">Chiffrement SSL</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <CheckCircle className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-gray-600">Conformité PCI DSS</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4 text-teal-600" />
                  </div>
                  <span className="text-gray-600">Protection anti-fraude</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section> */}

        {/* ═══════════════════════════════════════════════════════
            PAIEMENT SÉCURISÉ — DESIGN OPTION 3 (Minimal, inspired by Apple)
        ═══════════════════════════════════════════════════════ */}
        {/* <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-y border-gray-100">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Paiement. Sécurisé. Simple.
              </h2>
              <p className="text-lg text-gray-600">
                Tout est géré automatiquement
              </p>
            </motion.div>

            <div className="space-y-4">
              {[
                {
                  icon: Smartphone,
                  title: "Le client paie par Mobile Money",
                  desc: "MTN, Moov — paiement instantané et sécurisé",
                  color: "coral"
                },
                {
                  icon: Lock,
                  title: "L'argent est bloqué en sécurité",
                  desc: "Système d'escrow : les fonds sont protégés jusqu'à la livraison",
                  color: "teal"
                },
                {
                  icon: CheckCircle,
                  title: "Le client confirme la réception",
                  desc: "Code OTP unique validé à la livraison",
                  color: "coral"
                },
                {
                  icon: Wallet,
                  title: "Vous recevez votre argent",
                  desc: "95% du montant versé dans les 24h sur votre compte",
                  color: "teal"
                },
              ].map((step, i) => {
                const Icon = step.icon;
                const isCorral = step.color === "coral";
                const bgColor = isCorral ? "bg-coral-50" : "bg-teal-50";
                const iconColor = isCorral ? "text-coral-400" : "text-teal-600";
                const borderColor = isCorral ? "border-coral-100" : "border-teal-100";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className="flex items-start gap-6 p-6 bg-gray-50 border border-gray-100 rounded-2xl hover:shadow-md transition-all group"
                  >
                    <div className={`w-14 h-14 rounded-2xl ${bgColor} border ${borderColor} flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={2} />
                    </div>
                    <div className="flex-1 pt-1">
                      <h3 className="font-medium text-gray-900 mb-2">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                    <div className="text-2xl font-medium text-gray-300 shrink-0">
                      {i + 1}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <p className="text-sm text-gray-500 mb-4">Certification et sécurité</p>
              <div className="flex justify-center gap-6 text-xs text-gray-400">
                <span>SSL/TLS</span>
                <span>•</span>
                <span>PCI DSS</span>
                <span>•</span>
                <span>Anti-fraude</span>
              </div>
            </motion.div>
          </div>
        </section> */}

        {/* ═══════════════════════════════════════════════════════
            APERÇU DASHBOARD VENDEUR
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="text-center mb-12"
            >
              <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
                Tout votre commerce au même endroit
              </h2>
              <p className="text-lg text-gray-600">
                Dashboard intuitif pour piloter votre activité
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              viewport={{ once: true }}
              className="bg-gray-50 border-2 border-gray-100 rounded-2xl p-8 md:p-12"
            >
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {[
                  { label: "CA ce mois", value: "1 850 000", unit: "FCFA", icon: TrendingUp, color: "teal" },
                  { label: "Commandes", value: "86", icon: ShoppingBag, color: "coral" },
                  { label: "Clients", value: "54", icon: Users, color: "coral" },
                  { label: "Solde disponible", value: "1 420 000", unit: "FCFA", icon: Wallet, color: "teal" },
                ].map((metric, i) => {
                  const Icon = metric.icon;
                  const bgColor = metric.color === "teal" ? "bg-teal-50" : "bg-coral-50";
                  const borderColor = metric.color === "teal" ? "border-teal-100" : "border-coral-100";
                  const iconColor = metric.color === "teal" ? "text-teal-600" : "text-coral-400";

                  return (
                    <div key={i} className={`${bgColor} border ${borderColor} rounded-xl p-6`}>
                      <Icon className={`w-8 h-8 ${iconColor} mb-4`} strokeWidth={1.75} />
                      <div className="text-xs text-gray-500 mb-2 uppercase tracking-wider font-medium">
                        {metric.label}
                      </div>
                      <div className="font-medium text-gray-900 text-2xl">
                        {metric.value}
                        {metric.unit && <span className="text-sm text-gray-500 ml-1">{metric.unit}</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            VOUS GARDEZ LE CONTRÔLE
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-6">
                  Votre boutique reste votre activité
                </h2>
                <p className="text-lg text-gray-600 leading-relaxed mb-8">
                  Vous gardez le contrôle de vos produits, de vos prix, de vos commandes et de votre boutique. Ayiba vous fournit les outils et l'infrastructure pour vendre plus facilement.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6 }}
                viewport={{ once: true }}
              >
                <div className="space-y-3">
                  {CONTROL_FEATURES.map((feature, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 border border-gray-100 rounded-lg hover:bg-gray-100 transition-colors">
                      <CheckCircle className="w-5 h-5 text-teal-400 shrink-0" />
                      <span className="font-medium text-gray-900">{feature}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            POURQUOI AYIBA (6 BÉNÉFICES) — DESIGN PROFESSIONNEL
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
                Ce que Ayiba vous apporte
              </h2>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Une infrastructure complète pour développer votre activité commerciale
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {WHY_AYIBA.map((item, i) => {
                const Icon = item.icon;
                const isCorral = item.color === "coral";
                const bgColor = isCorral ? "bg-coral-50" : "bg-teal-50";
                const borderColor = isCorral ? "border-coral-100" : "border-teal-100";
                const iconBgColor = isCorral ? "bg-coral-100" : "bg-teal-100";
                const iconBorderColor = isCorral ? "border-coral-200" : "border-teal-200";
                const iconColor = isCorral ? "text-coral-400" : "text-teal-600";
                const hoverShadow = isCorral ? "hover:shadow-coral-400/10" : "hover:shadow-teal-400/10";

                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1, duration: 0.5 }}
                    viewport={{ once: true }}
                    className={`group relative bg-white border ${borderColor} rounded-2xl p-6 hover:shadow-xl ${hoverShadow} transition-all duration-300 hover:-translate-y-1 overflow-hidden`}
                  >
                    {/* Decoration background */}
                    <div className={`absolute top-0 right-0 w-32 h-32 ${bgColor} rounded-full blur-3xl opacity-20 group-hover:opacity-30 transition-opacity -z-0`} />

                    <div className="relative z-10">
                      {/* Icon container */}
                      <div className={`w-14 h-14 rounded-xl ${iconBgColor} border ${iconBorderColor} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className={`w-7 h-7 ${iconColor}`} strokeWidth={2} />
                      </div>

                      {/* Title */}
                      <h3 className="text-base font-medium text-gray-900 mb-3 leading-snug">
                        {item.title}
                      </h3>

                      {/* Description */}
                      <p className="text-sm text-gray-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>

                    {/* Hover accent line */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${isCorral ? "bg-coral-400" : "bg-teal-400"} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left`} />
                  </motion.div>
                );
              })}
            </div>

            {/* CTA sous la grille */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.6 }}
              viewport={{ once: true }}
              className="mt-12 text-center"
            >
              <p className="text-gray-600 mb-6">
                Rejoignez des centaines de vendeurs qui développent leur activité sur Ayiba
              </p>
              <Button
                variant="secondary"
                onClick={() => setAuthModalOpen(true)}
              >
                Démarrer maintenant
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            FAQ CIBLÉE VENDEUR
        ═══════════════════════════════════════════════════════ */}
        <section className="py-20 px-4 md:px-8 lg:px-12 bg-white border-b border-gray-100">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-medium text-gray-900 text-center mb-12">
              Vos questions, nos réponses
            </h2>

            <div className="space-y-3">
              {FAQS.map((faq, i) => {
                const isOpen = openFaq === i;
                return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05, duration: 0.3 }}
                    viewport={{ once: true }}
                    className={`bg-white border rounded-lg overflow-hidden transition-all duration-300 ${isOpen ? "border-coral-200 shadow-md" : "border-gray-100"
                      }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
                    >
                      <span className="font-medium text-gray-900">{faq.q}</span>
                      <ChevronDown
                        className={`w-5 h-5 text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-coral-400" : ""
                          }`}
                      />
                    </button>
                    {isOpen && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="border-t border-gray-100 px-6 py-4 bg-gray-50"
                      >
                        <p className="text-gray-600 leading-relaxed">{faq.a}</p>
                      </motion.div>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════
            CTA FINAL FORT
        ═══════════════════════════════════════════════════════ */}
        <section className="py-24 px-4 md:px-8 lg:px-12 bg-coral-50 border-t border-coral-100">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-4xl md:text-5xl font-medium text-gray-900 mb-6 leading-[1.2]">
              Prêt à commencer à vendre ?
            </h2>
            <p className="text-lg text-gray-600 mb-10">
              Créez votre boutique gratuitement et commencez à recevoir vos premières commandes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
              <Button
                variant="primary"
                onClick={() => setAuthModalOpen(true)}
                className="text-lg font-medium py-4 px-8"
              >
                Créer ma boutique
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-coral-400" />
                <span>5% de commission</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-teal-400" />
                <span>Paiement sécurisé</span>
              </div>
              <div className="w-px h-4 bg-gray-300" />
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-coral-400" />
                <span>Livraison gérée</span>
              </div>
            </div>
          </motion.div>
        </section>

      </div>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole="vendeur"
      />
    </>
  );
}
