"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
} from "lucide-react";

const STEPS = [
  {
    number: "01",
    illustration: "/illustrations/seller-step-1.svg",
    title: "Inscription vérifiée",
    desc: "Créez votre compte en 2 minutes. Pour protéger notre communauté, chaque profil vendeur est contrôlé et validé manuellement par notre équipe avant toute mise en ligne.",
  },
  {
    number: "02",
    illustration: "/illustrations/seller-step-2.svg",
    title: "Boutique sécurisée",
    desc: "Publiez vos produits en toute simplicité. Notre algorithme et notre équipe s'assurent que chaque annonce respecte les standards de qualité Ayiba pour inspirer confiance aux acheteurs.",
  },
  {
    number: "03",
    illustration: "/illustrations/seller-step-3.svg",
    title: "Vente protégée par code OTP",
    desc: "Le paiement est sécurisé via Mobile Money (Escrow). À la livraison, le client valide la réception en donnant un code OTP unique au livreur. Votre argent est libéré sur votre portefeuille après confirmation.",
  },
];

const ADVANTAGES = [
  {
    icon: Coins,
    title: "Zéro frais fixes",
    desc: "L'inscription et la publication sont 100% gratuites. Ayiba prend seulement 5% sur les ventes réussies.",
  },
  {
    icon: ShieldCheck,
    title: "Paiement garanti",
    desc: "FedaPay sécurise l'argent du client dès la commande. Tu es garanti d'être payé avant même la livraison.",
  },
  {
    icon: Truck,
    title: "Logistique intégrée",
    desc: "Tu n'as pas à chercher de livreur. La plateforme gère tout le flux de livraison de A à Z.",
  },
  {
    icon: Users,
    title: "Clients locaux qualifiés",
    desc: "Accède à une base de clients de Calavi qui cherchent des produits de proximité, prêts à acheter.",
  },
];

const COMMISSION = [
  { label: "Part du Vendeur", value: "95%", color: "text-teal-600", bg: "bg-teal-50", border: "border-teal-100" },
  { label: "Commission Ayiba", value: "5%", color: "text-coral-500", bg: "bg-coral-50", border: "border-coral-100" },
];

const FAQS = [
  {
    q: "Combien ça coûte pour s'inscrire ?",
    a: "Rien du tout. L'inscription et la publication sont 100% gratuites. Ayiba prend seulement 5% sur chaque vente réussie.",
  },
  {
    q: "Comment je reçois mon argent ?",
    a: "Directement sur ton Mobile Money (MTN ou Moov) dans les 24h après confirmation de la livraison par le client.",
  },
  {
    q: "Qui livre mes produits ?",
    a: "Des livreurs indépendants vérifiés sur la plateforme. Ils viennent chercher le colis chez toi avec un code OTP sécurisé.",
  },
  {
    q: "Que se passe-t-il si le client n'est pas satisfait ?",
    a: "Le client peut ouvrir un litige. Notre équipe arbitre la situation. L'argent reste bloqué jusqu'à la résolution.",
  },
  {
    q: "Combien de temps pour valider mon compte ?",
    a: "Moins de 24h. Notre équipe valide les profils et les articles manuellement pour garantir la qualité de la plateforme.",
  },
];

export default function DevenirVendeurPage() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const router = useRouter();

  // Page réservée aux visiteurs non connectés : "devenir vendeur" est un
  // choix fait à l'inscription, jamais une conversion depuis une session
  // déjà ouverte. On vérifie UNE SEULE FOIS au chargement (pas d'écoute
  // réactive) pour ne pas entrer en compétition avec la redirection que
  // l'AuthModal effectue lui-même juste après une inscription réussie
  // sur cette page.
  const [checkingSession, setCheckingSession] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);

  useEffect(() => {
    let active = true;
    const supabase = createClient();

    supabase.auth.getSession().then(async ({ data: { session } }) => {
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
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (checkingSession || alreadyLoggedIn) return null;

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-white">
        {/* HERO */}
        <section className="relative bg-white border-b border-gray-100 py-16 md:py-24">
          <div className="max-w-4xl mx-auto px-4 md:px-8 lg:px-12">
            <div className="flex flex-col items-center text-center">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-coral-50 border border-coral-100 rounded-full px-4 py-2 mb-8">
                <Store className="w-4 h-4 text-coral-500" />
                <span className="text-sm font-medium text-coral-700">
                  Deviens vendeur sur Ayiba
                </span>
              </div>

              {/* H1 */}
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Vends tes produits,{" "}
                <span className="text-coral-500">sans bouger.</span>
              </h1>

              {/* Subtexte */}
              <p className="text-base md:text-lg text-gray-500 mb-8 leading-relaxed max-w-lg">
                Ouvrez votre boutique gratuitement, touchez des milliers de clients locaux et encaissez par Mobile Money.
              </p>

              {/* Boutons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-12">
                <Button
                  variant="primary"
                  onClick={() => setAuthModalOpen(true)}
                >
                  Ouvrir ma boutique gratuite
                </Button>
                <Button variant="secondary">Comment ça marche</Button>
              </div>

                <div className="flex items-center gap-8 md:gap-12 text-sm text-gray-500">
                  <div className="flex items-center gap-2">
                    <Coins className="w-4 h-4 text-coral-500" />
                    <span>5% commission</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Truck className="w-4 h-4 text-coral-500" />
                    <span>Livraison gérée</span>
                  </div>
                </div>
            </div>
          </div>
        </section>

        {/* COMMENT ÇA MARCHE */}
        <section className="py-14 px-4 md:px-8 lg:px-12 bg-white">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-[22px] md:text-[26px] font-semibold text-gray-900 mb-2">
                Comment ça marche ?
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto">
                Deviens vendeur en 3 étapes simples
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {STEPS.map((s, i) => {
                return (
                  <div
                    key={s.number}
                    className="relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center"
                  >
                    <div className="relative w-full aspect-square max-w-[140px] mb-6 flex items-center justify-center">
                      {/* Lueur corail pour l'aspect exclusif/sécurisé */}
                      <div className="absolute inset-0 bg-coral-50 rounded-full blur-2xl opacity-60" />
                      <img
                        src={s.illustration}
                        alt={s.title}
                        className="relative z-10 w-full h-full object-contain"
                      />
                    </div>
                    
                    <div className="absolute top-6 left-6 flex items-center justify-center w-8 h-8 rounded-full bg-coral-50 border border-coral-100">
                      <span className="text-xs font-bold text-coral-500">
                        {s.number}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 mb-3 tracking-tight">
                      {s.title}
                    </h3>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      {s.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* COMMISSION */}
        <section className="py-14 bg-gray-50/60 border-y border-gray-100">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-md">
                <h2 className="text-[22px] md:text-[26px] font-semibold text-gray-900 mb-2">
                  Une commission transparente
                </h2>
                <p className="text-[14px] text-gray-600 leading-relaxed">
                  Sur chaque vente réussie, voici exactement comment le montant est réparti.
                  Pas de frais cachés, pas de surprise.
                </p>
              </div>
                <div className="flex gap-4">
                  {COMMISSION.map((c, i) => (
                    <div key={i} className={`${c.bg} border ${c.border} rounded-2xl p-6 text-center min-w-[140px] shadow-sm`}>
                      <p className={`text-4xl font-bold ${c.color} mb-1 tracking-tight`}>{c.value}</p>
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{c.label}</p>
                    </div>
                  ))}
                </div>
            </div>
          </div>
        </section>

        {/* AVANTAGES */}
        <section className="py-14 px-4 md:px-8 lg:px-12 bg-gray-50/60">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-[22px] md:text-[26px] font-semibold text-gray-900 mb-2">
                Pourquoi vendre sur Ayiba ?
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {ADVANTAGES.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div
                    key={i}
                    className="bg-white border border-gray-100 rounded-xl p-6 flex items-center gap-4 hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
                  >
                    <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0">
                      <Icon
                        className="w-6 h-6 text-teal-600"
                        strokeWidth={1.75}
                      />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{a.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-14 px-4 md:px-8 lg:px-12 bg-gray-50/60">
          <div className="max-w-3xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-[22px] md:text-[26px] font-semibold text-gray-900">
                Questions fréquentes
              </h2>
            </div>
            <div className="flex flex-col gap-2.5">
              {FAQS.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={f.q}
                    className={`bg-white border rounded-xl overflow-hidden transition-colors duration-300 ${
                      isOpen ? "border-coral-200" : "border-gray-100"
                    }`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between px-5 py-4 text-left"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {f.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-gray-400 shrink-0 ml-4 transition-transform duration-300 ${
                          isOpen ? "rotate-180 text-coral-500" : ""
                        }`}
                      />
                    </button>
                    <div
                      className={`grid transition-all duration-300 ease-out ${
                        isOpen
                          ? "grid-rows-[1fr] opacity-100"
                          : "grid-rows-[0fr] opacity-0"
                      }`}
                    >
                      <div className="overflow-hidden">
                        <p className="text-sm text-gray-600 leading-relaxed px-5 pb-4 pt-1 border-t border-gray-100">
                          {f.a}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA FINAL */}
        <section className="relative py-14 px-4 md:px-8 lg:px-12 bg-teal-700 overflow-hidden">
          <div className="relative max-w-2xl mx-auto text-center">
            <h2 className="text-[24px] md:text-[28px] font-semibold text-white mb-3">
              Prêt à commencer ?
            </h2>
            <p className="text-sm text-teal-50/90 mb-8 leading-relaxed">
              Rejoins les vendeurs qui réussissent sur Ayiba dès aujourd'hui.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => setAuthModalOpen(true)}
                className="hover:-translate-y-0.5 transition-transform duration-300"
              >
                Ouvre ta boutique gratuite
              </Button>
              <Button
                variant="secondary"
                className="bg-transparent! border-2! border-white! text-white! hover:bg-white! hover:text-teal-700! transition-colors duration-300"
              >
                Nous contacter
              </Button>
            </div>
          </div>
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
