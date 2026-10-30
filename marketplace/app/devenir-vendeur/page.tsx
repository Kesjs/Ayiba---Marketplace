"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { BarChart3, Check, ChevronDown, Coins, LockKeyhole, PackageCheck, Plus, Share2, ShoppingBag, Store, Truck, UserCheck, Wallet } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";

const STEPS = [
  ["01", UserCheck, "Créez votre compte", "Renseignez vos informations et envoyez votre demande vendeur. Votre profil est vérifié avant sa mise en ligne."],
  ["02", Store, "Ajoutez vos produits", "Présentez vos articles avec leurs photos, leurs prix et les informations utiles à vos clients."],
  ["03", PackageCheck, "Recevez et préparez", "Quand une commande arrive, vous la préparez. Ayiba organise ensuite la remise au livreur."],
] as const;
const FAQS = [
  ["Combien coûte la vente sur Ayiba ?", "Ayiba prélève 5 % sur une commande réussie. L'inscription et la publication de produits sont gratuites."],
  ["Qui s'occupe de la livraison ?", "Après la préparation de la commande, Ayiba coordonne la livraison avec un livreur disponible."],
  ["Quand mon argent est-il débloqué ?", "Le paiement est conservé jusqu'à la confirmation de la livraison. Le versement suit ensuite le circuit prévu pour votre portefeuille Mobile Money."],
  ["Puis-je partager ma boutique ?", "Oui. Votre boutique dispose d'une adresse partageable, pratique pour WhatsApp, Instagram ou Facebook."],
  ["Puis-je modifier mes produits ?", "Oui. Vous gardez la main sur vos produits, vos prix, vos disponibilités et vos commandes."],
] as const;
const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function DevenirVendeurPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [alreadyLoggedIn, setAlreadyLoggedIn] = useState(false);
  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      if (!session?.user) return setCheckingSession(false);
      const { data: userData } = await supabase.from("users").select("role").eq("id", session.user.id).single();
      if (!active) return;
      setAlreadyLoggedIn(true);
      const target = userData?.role && isValidRole(userData.role) ? getRedirectPathForRole(userData.role) : "/";
      router.replace(target);
    })();
    return () => { active = false; };
  }, [router]);
  if (checkingSession || alreadyLoggedIn) return null;
  const start = () => router.push("/connexion?role=vendeur");
  return <>
    <Navbar />
    <main className="bg-white text-gray-900">
      <section className="border-b border-gray-100 bg-[#fffaf7] px-4 py-16 md:px-8 md:py-24">
        <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: .55 }} className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[.16em] text-coral-500"><Store className="h-4 w-4" /> Devenir vendeur</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">Votre boutique, vos produits, une façon plus simple de vendre.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">Présentez votre activité sur Ayiba, recevez vos commandes et laissez-nous coordonner le paiement sécurisé et la livraison.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button variant="primary" onClick={start}>Créer ma boutique</Button><a href="#comment-ca-marche" className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white">Voir comment ça marche</a></div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600"><span className="inline-flex items-center gap-2"><Coins className="h-4 w-4 text-coral-500" />5 % sur une vente réussie</span><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-teal-600" />Paiement sécurisé</span><span className="inline-flex items-center gap-2"><Truck className="h-4 w-4 text-coral-500" />Livraison coordonnée</span></div>
            </div>
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .55, delay: .1 }} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(30,30,30,.08)] md:p-7">
              <div className="flex items-center justify-between border-b border-gray-100 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Votre espace vendeur</p><p className="mt-1 text-xl font-semibold">La boutique de Sarah</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Ouverte</span></div>
              <div className="mt-5 grid grid-cols-2 gap-3"><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Produits publiés</p><p className="mt-2 text-2xl font-semibold">12</p></div><div className="rounded-2xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Commandes à traiter</p><p className="mt-2 text-2xl font-semibold">03</p></div></div>
              <div className="mt-4 rounded-2xl border border-coral-100 bg-coral-50/50 p-4"><div className="flex items-center gap-3"><div className="rounded-xl bg-white p-2 text-coral-500"><ShoppingBag className="h-5 w-5" /></div><div><p className="font-semibold">Nouvelle commande</p><p className="text-sm text-gray-500">Préparez-la, Ayiba coordonne la suite.</p></div></div></div>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <section id="comment-ca-marche" className="scroll-mt-20 px-4 py-20 md:px-8 md:py-28"><div className="mx-auto max-w-6xl"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-coral-500">Le parcours vendeur</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Comment ça marche ?</h2><p className="mt-4 text-lg leading-8 text-gray-600">Trois étapes pour mettre votre activité en ligne et commencer à recevoir des commandes.</p></motion.div><div className="mt-12 grid gap-5 md:grid-cols-3">{STEPS.map(([number, Icon, title, text], i) => <motion.article key={number} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * .1 }} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-coral-200 hover:shadow-lg"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-coral-500">{number}</span><Icon className="h-6 w-6 text-gray-400" /></div><h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-gray-600">{text}</p></motion.article>)}</div></div></section>
      <section className="border-y border-gray-100 bg-gray-50 px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-10 lg:grid-cols-2"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-coral-500">Chacun son rôle</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Vous gérez votre activité. Ayiba simplifie le reste.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">Vous restez maître de votre catalogue et de vos prix. La plateforme vous aide à présenter vos produits, suivre vos commandes et organiser la livraison.</p></motion.div><div className="grid gap-3 sm:grid-cols-2">{[["Vous", "Produits, prix, disponibilité, préparation"], ["Ayiba", "Mise en relation, paiement et coordination"], ["Votre client", "Commande et confirmation de réception"], ["Le livreur", "Collecte et remise du colis"]].map(([title, text], i) => <motion.div key={title} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * .08 }} className="rounded-2xl border border-gray-200 bg-white p-5"><p className="font-semibold">{title}</p><p className="mt-2 text-sm leading-6 text-gray-600">{text}</p></motion.div>)}</div></div></div></section>
      <section className="px-4 py-20 md:px-8 md:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr]"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-coral-500">Une règle simple</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Vous savez ce que vous gagnez.</h2><p className="mt-5 text-lg leading-8 text-gray-600">Ayiba prélève 5 % uniquement sur une vente réussie. Pas de frais d'inscription, pas d'abonnement mensuel.</p></motion.div><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="rounded-3xl bg-gray-900 p-7 text-white md:p-10"><div className="flex items-end justify-between gap-6 border-b border-white/15 pb-7"><div><p className="text-sm text-white/60">Exemple sur une vente de</p><p className="mt-2 text-4xl font-semibold">100 000 FCFA</p></div><Wallet className="h-9 w-9 text-coral-300" /></div><div className="space-y-4 pt-7 text-sm"><div className="flex justify-between"><span className="text-white/70">Votre part (95 %)</span><strong>95 000 FCFA</strong></div><div className="flex justify-between"><span className="text-white/70">Commission Ayiba (5 %)</span><strong>5 000 FCFA</strong></div></div></motion.div></div></section>
      <section className="border-y border-gray-100 bg-[#fffaf7] px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-5 md:grid-cols-3"><div className="md:col-span-2"><p className="text-sm font-semibold uppercase tracking-[.16em] text-coral-500">Votre espace</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Une boutique que vous pouvez partager.</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">Ajoutez vos articles, partagez votre lien et suivez les commandes depuis le même espace.</p></div><div className="flex items-end justify-start md:justify-end"><Button variant="secondary" onClick={start}>Commencer maintenant</Button></div></div><div className="mt-10 grid gap-4 sm:grid-cols-3">{[[Share2, "Partager", "Envoyez votre boutique à vos clients."], [BarChart3, "Suivre", "Gardez une vue claire sur vos commandes."], [Plus, "Développer", "Ajoutez de nouveaux produits quand vous le souhaitez."]].map(([Icon, title, text]) => { const C = Icon as typeof Share2; return <div key={title as string} className="rounded-2xl border border-gray-200 bg-white p-5"><C className="h-6 w-6 text-coral-500" /><h3 className="mt-5 font-semibold">{title as string}</h3><p className="mt-2 text-sm leading-6 text-gray-600">{text as string}</p></div>; })}</div></div></section>
      <section className="px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-3xl"><h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">Vos questions, nos réponses</h2><div className="mt-10 space-y-3">{FAQS.map(([q, a], i) => { const isOpen = openFaq === i; return <div key={q} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-coral-200 shadow-sm" : "border-gray-200"}`}><button type="button" onClick={() => setOpenFaq(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-semibold"><span>{q}</span><ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180 text-coral-500" : ""}`} /></button>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: .22 }} className="border-t border-gray-100 px-5 pb-5 pt-4 text-gray-600 leading-7">{a}</motion.div>}</div>; })}</div></div></section>
      <section className="bg-coral-500 px-4 py-16 text-white md:px-8 md:py-20"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Prêt à présenter vos produits ?</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-white/85">Créez votre espace vendeur et avancez à votre rythme.</p><Button variant="secondary" onClick={start} className="mt-8 border-0 bg-white text-coral-600 hover:bg-gray-50">Créer ma boutique</Button><div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-white/85"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />5 % par vente réussie</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Pas d'abonnement</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Livraison coordonnée</span></div></motion.div></section>
    </main>
    <Footer />
  </>;
}
