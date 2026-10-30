"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import Link from "next/link";
import { AlertCircle, ArrowLeft, ArrowRight, Check, CreditCard, Loader2, MapPin, Phone, ShieldCheck, Smartphone, X } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { DELIVERY_STATUS_LABELS, DELIVERY_STATUS_STEPS, formatFcfa, getDeliveryStepIndex, type DeliveryCourse } from "@/lib/delivery";

const DeliveryLiveTracker = dynamic(() => import("@/components/delivery/DeliveryLiveTracker"), {
  ssr: false,
  loading: () => <div className="h-[380px] animate-pulse rounded-[26px] bg-gray-100" />,
});

type PaymentMethod = "mobile_money" | "carte";

export default function DeliveryCoursePage() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { showToast } = useToast();
  const supabase = useMemo(() => createClient(), []);
  const [course, setCourse] = useState<DeliveryCourse | null>(null);
  const [livreurNom, setLivreurNom] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("mobile_money");
  const [network, setNetwork] = useState<"mtn" | "moov">("mtn");
  const [phone, setPhone] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [waitingPayment, setWaitingPayment] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const loadCourse = async () => {
    if (!user || !params.id) return;
    setLoading(true);
    const { data, error: loadError } = await supabase.from("courses_delivery").select("*").eq("id", params.id).eq("client_id", user.id).maybeSingle();
    if (loadError || !data) {
      setError("Cette course est introuvable ou ne t’appartient pas.");
      setLoading(false);
      return;
    }
    setCourse(data as DeliveryCourse);
    if (data.livreur_id) {
      const { data: rider } = await supabase.from("livreurs").select("nom_complet").eq("id", data.livreur_id).maybeSingle();
      setLivreurNom(rider?.nom_complet || null);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!userLoading && !user) router.replace(`/connexion?redirect=${encodeURIComponent(`/delivery/courses/${params.id}`)}`);
  }, [params.id, router, user, userLoading]);

  useEffect(() => { loadCourse(); }, [params.id, user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!user || !params.id) return;
    const channel = supabase.channel(`delivery-page-${params.id}`).on("postgres_changes", { event: "UPDATE", schema: "public", table: "courses_delivery", filter: `id=eq.${params.id}` }, (payload: any) => {
      setCourse((previous) => previous ? { ...previous, ...payload.new } : payload.new);
      if (payload.new.statut === "livree") {
        setWaitingPayment(false);
        setPaymentOpen(false);
        showToast("Paiement confirmé. Course terminée.", "success");
      }
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [params.id, showToast, supabase, user]);

  useEffect(() => {
    if (searchParams.get("payment") === "error") showToast("Le paiement n’a pas abouti. Tu peux réessayer.", "error");
  }, [searchParams, showToast]);

  useEffect(() => {
    if (!waitingPayment || !course) return;
    const timer = window.setInterval(async () => {
      const { data } = await supabase.from("delivery_payment_intents").select("statut").eq("course_id", course.id).maybeSingle();
      if (data?.statut === "echoue") {
        setWaitingPayment(false);
        showToast("Le paiement a été refusé. Tu peux réessayer.", "error");
      }
      if (data?.statut === "paye") {
        setWaitingPayment(false);
        await loadCourse();
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [course, showToast, supabase, waitingPayment]); // eslint-disable-line react-hooks/exhaustive-deps

  const handlePayment = async () => {
    if (!course) return;
    setPaymentLoading(true);
    try {
      const response = await fetch(`/api/delivery/courses/${course.id}/payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method: paymentMethod, network, phone: phone || profile?.phone || "" }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Paiement impossible.");
      if (body.paymentUrl) {
        window.location.href = body.paymentUrl;
        return;
      }
      setPaymentOpen(false);
      setWaitingPayment(true);
      showToast("Valide la demande sur ton téléphone pour confirmer le paiement.", "info");
    } catch (reason) {
      showToast(reason instanceof Error ? reason.message : "Le paiement n’a pas pu démarrer.", "error");
    } finally {
      setPaymentLoading(false);
    }
  };

  const cancelCourse = async () => {
    if (!course) return;
    setCancelLoading(true);
    const { error: cancelError } = await supabase.rpc("annuler_course_delivery", { p_course_id: course.id, p_raison: "Annulée par le client" });
    if (cancelError) showToast(cancelError.message, "error");
    else { showToast("Course annulée.", "info"); await loadCourse(); }
    setCancelLoading(false);
  };

  if (userLoading || loading) return <div className="min-h-screen bg-gray-50" />;
  if (!course) return <DashboardLayout role="client" title="Course Delivery"><div className="rounded-3xl bg-white p-8 text-center"><AlertCircle className="mx-auto text-red-500" /><p className="mt-3 font-semibold text-gray-900">{error || "Course introuvable"}</p><Link href="/delivery" className="mt-5 inline-flex text-sm font-bold text-coral-500">Retour à Delivery</Link></div></DashboardLayout>;

  const currentStep = getDeliveryStepIndex(course.statut);
  const amountDue = course.montant_final ?? course.montant_estime;
  const canCancel = ["en_attente", "attribuee", "vers_retrait"].includes(course.statut);
  const paymentDue = course.statut === "arrivee" && course.statut_paiement !== "paye";

  return (
    <DashboardLayout role="client" title={`Course ${course.numero}`} personalized>
      <div className="mx-auto max-w-6xl space-y-6">
        <Link href="/delivery" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-900"><ArrowLeft size={16} /> Ayiba Delivery</Link>
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">{course.numero}</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-gray-900">{DELIVERY_STATUS_LABELS[course.statut]}</h1><p className="mt-2 text-sm text-gray-500">Créée le {new Date(course.created_at).toLocaleString("fr-FR", { dateStyle: "medium", timeStyle: "short" })}</p></div>{canCancel && <button onClick={cancelCourse} disabled={cancelLoading} className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-100 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"><X size={16} /> {cancelLoading ? "Annulation..." : "Annuler la course"}</button>}</div>

        <div className="rounded-[26px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6"><div className="grid gap-4 sm:grid-cols-6">{DELIVERY_STATUS_STEPS.map((step, index) => { const done = index < currentStep || (course.statut === "livree" && index <= currentStep); const active = index === currentStep; return <div key={step.key} className="flex items-center gap-3 sm:block"><div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold ${done ? "bg-[#1d9e75] text-white" : active ? "border-2 border-[#d85a30] text-[#d85a30]" : "bg-gray-100 text-gray-400"}`}>{done ? <Check size={16} /> : index + 1}</div><p className={`text-xs font-bold sm:mt-2 ${active ? "text-gray-900" : done ? "text-[#1d9e75]" : "text-gray-400"}`}>{step.label}</p></div>; })}</div></div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_360px] lg:items-start">
          <div className="space-y-6"><DeliveryLiveTracker course={course} livreurNom={livreurNom} />
            <div className="grid gap-4 sm:grid-cols-2"><div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><MapPin className="mt-0.5 text-[#1d9e75]" size={18} /><div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Départ</p><p className="mt-1 text-sm font-semibold text-gray-800">{course.depart_adresse}</p>{course.depart_nom && <p className="mt-1 text-xs text-gray-500">{course.depart_nom} · {course.depart_telephone || "Téléphone non renseigné"}</p>}</div></div></div><div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-start gap-3"><MapPin className="mt-0.5 text-[#d85a30]" size={18} /><div><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Destination</p><p className="mt-1 text-sm font-semibold text-gray-800">{course.destination_adresse}</p>{course.destination_nom && <p className="mt-1 text-xs text-gray-500">{course.destination_nom} · {course.destination_telephone || "Téléphone non renseigné"}</p>}</div></div></div></div>
          </div>
          <aside className="space-y-4 lg:sticky lg:top-6"><div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Montant</p><p className="mt-2 text-4xl font-semibold tracking-[-0.05em] text-gray-900">{formatFcfa(amountDue)}</p><p className="mt-1 text-sm text-gray-500">{course.montant_final != null ? "montant final du trajet" : "estimation avant l’arrivée"}</p><div className="mt-5 space-y-3 border-t border-gray-100 pt-4 text-sm"><div className="flex justify-between"><span className="text-gray-500">Distance estimée</span><span className="font-bold">{Number(course.distance_finale_km ?? course.distance_estimee_km).toFixed(1)} km</span></div><div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-bold capitalize">{course.type_colis}</span></div></div>{paymentDue && <button onClick={() => setPaymentOpen(true)} disabled={waitingPayment} className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-coral-500 px-4 py-3.5 text-sm font-bold text-white shadow-lg shadow-coral-500/15 hover:bg-coral-600 disabled:opacity-60">{waitingPayment ? <><Loader2 size={17} className="animate-spin" /> Paiement en attente...</> : <>Payer {formatFcfa(amountDue)} <ArrowRight size={17} /></>}</button>}{course.statut === "livree" && <div className="mt-6 flex items-center gap-2 rounded-2xl bg-teal-50 p-3 text-sm font-bold text-teal-800"><ShieldCheck size={17} /> Paiement confirmé</div>}</div>
            {paymentOpen && <div className="rounded-[26px] border border-gray-100 bg-white p-6 shadow-sm"><div className="flex items-center justify-between"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Paiement sécurisé</p><h2 className="mt-1 text-lg font-bold">Choisir un moyen</h2></div><button onClick={() => setPaymentOpen(false)} className="rounded-full p-2 text-gray-400 hover:bg-gray-50" aria-label="Fermer"><X size={18} /></button></div><div className="mt-5 grid grid-cols-2 gap-2"><button onClick={() => setPaymentMethod("mobile_money")} className={`rounded-xl border p-3 text-sm font-bold ${paymentMethod === "mobile_money" ? "border-coral-400 bg-coral-50 text-coral-700" : "border-gray-200 text-gray-500"}`}><Smartphone className="mx-auto mb-1" size={18} />Mobile Money</button><button onClick={() => setPaymentMethod("carte")} className={`rounded-xl border p-3 text-sm font-bold ${paymentMethod === "carte" ? "border-coral-400 bg-coral-50 text-coral-700" : "border-gray-200 text-gray-500"}`}><CreditCard className="mx-auto mb-1" size={18} />Carte bancaire</button></div>{paymentMethod === "mobile_money" && <div className="mt-4 space-y-3"><select value={network} onChange={(event) => setNetwork(event.target.value as "mtn" | "moov")} className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm"><option value="mtn">MTN MoMo</option><option value="moov">Moov Money</option></select><input value={phone || profile?.phone || ""} onChange={(event) => setPhone(event.target.value)} placeholder="Numéro Mobile Money" className="h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm outline-none focus:border-coral-400" /></div>}<button onClick={handlePayment} disabled={paymentLoading} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-60">{paymentLoading ? <Loader2 size={16} className="animate-spin" /> : paymentMethod === "carte" ? <CreditCard size={16} /> : <Smartphone size={16} />} {paymentLoading ? "Préparation..." : `Payer ${formatFcfa(amountDue)}`}</button><p className="mt-3 text-center text-xs leading-5 text-gray-500">Le livreur est payé seulement après confirmation GeniusPay.</p></div>}
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
