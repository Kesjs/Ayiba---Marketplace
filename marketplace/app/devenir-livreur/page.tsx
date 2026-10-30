"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Bike, Check, ChevronDown, ClipboardCheck, Clock3, Coins, FileCheck2, LockKeyhole, MapPin, PackageCheck, Smartphone, Truck, Wallet } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";

const STEPS = [
  ["01", FileCheck2, "Déposez votre demande", "Renseignez vos informations et envoyez votre pièce d'identité ainsi que les documents de votre véhicule."],
  ["02", Smartphone, "Activez votre disponibilité", "Après validation de votre profil, vous indiquez quand vous pouvez livrer et recevez les missions disponibles dans votre zone."],
  ["03", PackageCheck, "Livrez et confirmez", "Vous récupérez le colis, le remettez au client et saisissez le code de confirmation communiqué à la livraison."],
] as const;
const FAQS = [
  ["De quoi ai-je besoin pour m'inscrire ?", "Une pièce d'identité, un téléphone, un compte Mobile Money et les documents du véhicule utilisé pour les livraisons. Les éléments exacts sont confirmés pendant l'inscription."],
  ["Puis-je choisir mes horaires ?", "Vous activez votre disponibilité quand vous le souhaitez. Les missions sont proposées selon votre zone et les besoins du moment."],
  ["Puis-je refuser une mission ?", "Oui. Vous pouvez accepter ou refuser une mission avant de vous engager. Consultez ses informations avant de décider."],
  ["Comment fonctionne le code de confirmation ?", "À la remise du colis, le client confirme la réception avec le code prévu. Cette confirmation permet de clôturer correctement la livraison."],
  ["Comment sont calculés mes gains ?", "La rémunération dépend de la course. La commission Ayiba et le montant qui vous revient doivent être visibles avant ou pendant le traitement de la mission."],
] as const;
const reveal = { hidden: { opacity: 0, y: 18 }, visible: { opacity: 1, y: 0 } };

export default function DevenirLivreurPage() {
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
  const start = () => router.push("/connexion?role=livreur");
  return <>
    <Navbar />
    <main className="bg-white text-gray-900">
      <section className="border-b border-gray-100 bg-[#f5fbfa] px-4 py-16 md:px-8 md:py-24">
        <motion.div initial="hidden" animate="visible" variants={reveal} transition={{ duration: .55 }} className="mx-auto max-w-6xl">
          <div className="grid items-center gap-12 lg:grid-cols-[1.05fr_.95fr]">
            <div>
              <p className="mb-5 inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[.16em] text-teal-700"><Bike className="h-4 w-4" /> Devenir livreur partenaire</p>
              <h1 className="max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight md:text-6xl">Livrez des commandes près de chez vous, quand vous êtes disponible.</h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-gray-600">Ayiba vous met en relation avec des missions de livraison. Vous acceptez les courses qui vous conviennent, récupérez le colis et confirmez sa remise au client.</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row"><Button variant="primary" onClick={start} className="!bg-teal-700 hover:!bg-teal-800">Déposer ma demande</Button><a href="#comment-ca-marche" className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-5 py-3 font-medium text-gray-700 transition hover:border-gray-300 hover:bg-white">Voir comment ça marche</a></div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600"><span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4 text-teal-700" />Missions selon votre zone</span><span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-teal-700" />Disponibilité flexible</span><span className="inline-flex items-center gap-2"><LockKeyhole className="h-4 w-4 text-teal-700" />Suivi sécurisé</span></div>
            </div>
            <motion.div initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .55, delay: .1 }} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-[0_20px_60px_rgba(30,30,30,.08)] md:p-7">
              <div className="flex items-center justify-between border-b border-gray-100 pb-5"><div><p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Exemple de mission</p><p className="mt-1 text-xl font-semibold">Cotonou → Cadjèhoun</p></div><span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-semibold text-teal-700">Disponible</span></div>
              <div className="mt-5 space-y-3"><div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><MapPin className="h-5 w-5 text-teal-700" /><div><p className="text-sm font-semibold">Récupération</p><p className="text-sm text-gray-500">Chez le vendeur</p></div></div><div className="ml-6 h-5 border-l border-dashed border-gray-300" /><div className="flex items-center gap-3 rounded-2xl bg-gray-50 p-4"><Truck className="h-5 w-5 text-teal-700" /><div><p className="text-sm font-semibold">Remise</p><p className="text-sm text-gray-500">Chez le client</p></div></div></div>
              <div className="mt-4 flex items-center justify-between rounded-2xl border border-teal-100 bg-teal-50/60 p-4"><span className="text-sm text-gray-600">Montant de la course</span><span className="font-semibold text-teal-800">Visible avant acceptation</span></div>
            </motion.div>
          </div>
        </motion.div>
      </section>
      <section className="px-4 py-16 md:px-8 md:py-20"><div className="mx-auto max-w-6xl"><div className="grid gap-4 md:grid-cols-3">{[[ClipboardCheck, "Un profil vérifié", "Votre identité et les informations nécessaires sont contrôlées avant les premières missions."], [MapPin, "Des courses localisées", "Les missions sont liées à une zone de départ et d'arrivée pour vous aider à décider."], [Wallet, "Une rémunération lisible", "Le montant et les règles de la course doivent être clairs avant votre engagement."]].map(([Icon, title, text]) => { const C = Icon as typeof ClipboardCheck; return <motion.div key={title as string} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="rounded-2xl border border-gray-200 bg-white p-6 transition hover:-translate-y-1 hover:border-teal-200 hover:shadow-lg"><C className="h-6 w-6 text-teal-700" /><h3 className="mt-5 text-lg font-semibold">{title as string}</h3><p className="mt-2 leading-7 text-gray-600">{text as string}</p></motion.div>; })}</div></div></section>
      <section id="comment-ca-marche" className="scroll-mt-20 border-y border-gray-100 bg-gray-50 px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-teal-700">Le parcours livreur</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-5xl">Comment ça marche ?</h2><p className="mt-4 max-w-2xl text-lg leading-8 text-gray-600">De la demande d'inscription à la remise du colis, voici ce que vous devez savoir.</p></motion.div><div className="mt-12 grid gap-5 md:grid-cols-3">{STEPS.map(([number, Icon, title, text], i) => <motion.article key={number} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * .1 }} className="rounded-2xl border border-gray-200 bg-white p-6"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-teal-700">{number}</span><Icon className="h-6 w-6 text-gray-400" /></div><h3 className="mt-12 text-xl font-semibold">{title}</h3><p className="mt-3 leading-7 text-gray-600">{text}</p></motion.article>)}</div></div></section>
      <section className="px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-6xl"><div className="grid gap-10 lg:grid-cols-2"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-teal-700">Une course, étape par étape</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Vous savez ce qui se passe avant d'accepter.</h2><p className="mt-5 max-w-xl text-lg leading-8 text-gray-600">Le parcours distingue clairement vos actions, celles du vendeur et les validations nécessaires à la fin de la livraison.</p></motion.div><div className="space-y-3">{[["1", "Mission proposée", "Vous consultez les informations de la course."], ["2", "Vous acceptez", "Vous choisissez de prendre la mission."], ["3", "Colis récupéré", "Vous récupérez le colis chez le vendeur."], ["4", "Client livré", "Vous remettez le colis et le client confirme la réception."], ["5", "Course clôturée", "La confirmation permet de traiter le paiement selon les règles prévues."]].map(([n, title, text], i) => <motion.div key={n} initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} transition={{ delay: i * .06 }} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-4"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">{n}</span><div><p className="font-semibold">{title}</p><p className="mt-1 text-sm leading-6 text-gray-600">{text}</p></div></motion.div>)}</div></div></div></section>
      <section className="border-y border-gray-100 bg-[#f5fbfa] px-4 py-20 md:px-8 md:py-24"><div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[.8fr_1.2fr]"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal}><p className="text-sm font-semibold uppercase tracking-[.16em] text-teal-700">Rémunération</p><h2 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">Des règles claires avant de rouler.</h2><p className="mt-5 text-lg leading-8 text-gray-600">Le montant dépend de la course. La commission Ayiba et la part qui vous revient doivent être affichées clairement dans le parcours de livraison.</p></motion.div><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="rounded-3xl bg-gray-900 p-7 text-white md:p-10"><div className="flex items-center gap-4 border-b border-white/15 pb-6"><div className="rounded-2xl bg-white/10 p-3"><Coins className="h-7 w-7 text-teal-300" /></div><div><p className="text-lg font-semibold">Avant d'accepter</p><p className="text-sm text-white/65">Vous devez voir les informations utiles de la course.</p></div></div><div className="grid gap-3 pt-6 sm:grid-cols-3"><div><p className="text-xs text-white/55">Départ</p><p className="mt-1 font-semibold">Zone indiquée</p></div><div><p className="text-xs text-white/55">Arrivée</p><p className="mt-1 font-semibold">Zone indiquée</p></div><div><p className="text-xs text-white/55">Rémunération</p><p className="mt-1 font-semibold">Montant affiché</p></div></div></motion.div></div></section>
      <section className="px-4 py-20 md:px-8 md:py-24"><div className="mx-auto max-w-3xl"><h2 className="text-center text-3xl font-semibold tracking-tight md:text-4xl">Questions fréquentes</h2><div className="mt-10 space-y-3">{FAQS.map(([q, a], i) => { const isOpen = openFaq === i; return <div key={q} className={`overflow-hidden rounded-2xl border bg-white transition ${isOpen ? "border-teal-200 shadow-sm" : "border-gray-200"}`}><button type="button" onClick={() => setOpenFaq(isOpen ? null : i)} aria-expanded={isOpen} className="flex w-full items-center justify-between gap-5 px-5 py-5 text-left font-semibold"><span>{q}</span><ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180 text-teal-700" : ""}`} /></button>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} transition={{ duration: .22 }} className="border-t border-gray-100 px-5 pb-5 pt-4 leading-7 text-gray-600">{a}</motion.div>}</div>; })}</div></div></section>
      <section className="bg-teal-700 px-4 py-16 text-white md:px-8 md:py-20"><motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={reveal} className="mx-auto max-w-3xl text-center"><h2 className="text-3xl font-semibold tracking-tight md:text-5xl">Vous êtes prêt à livrer ?</h2><p className="mx-auto mt-5 max-w-xl text-lg leading-8 text-teal-50">Déposez votre demande. Vous pourrez consulter les conditions et les informations nécessaires pendant l'inscription.</p><Button variant="secondary" onClick={start} className="mt-8 border-0 bg-white text-teal-700 hover:bg-gray-50">Déposer ma demande</Button><div className="mt-7 flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-teal-100"><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Disponibilité flexible</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Missions localisées</span><span className="inline-flex items-center gap-2"><Check className="h-4 w-4" />Parcours sécurisé</span></div></motion.div></section>
    </main>
    <Footer />
  </>;
}
