"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Bike, Check, Clock3, Loader2, MapPin, PackageCheck, Phone, RefreshCw, Route, ShieldCheck, Truck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { formatFcfa, type DeliveryCourse } from "@/lib/delivery";
import { useToast } from "@/context/ToastContext";

function ActionLabel({ status }: { status: DeliveryCourse["statut"] }) {
  if (status === "attribuee") return <>Démarrer vers le retrait <ArrowRight size={15} /></>;
  if (status === "vers_retrait") return <>Confirmer le retrait <PackageCheck size={15} /></>;
  if (status === "recuperee") return <>Partir vers la destination <Route size={15} /></>;
  if (status === "vers_destination") return <>Signaler l’arrivée <MapPin size={15} /></>;
  return null;
}

export function DeliveryCourseInbox() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const [available, setAvailable] = useState<DeliveryCourse[]>([]);
  const [active, setActive] = useState<DeliveryCourse | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase.from("courses_delivery").select("*").or(`statut.eq.en_attente,livreur_id.eq.${user.id}`).order("created_at", { ascending: true });
    const rows = (data || []) as DeliveryCourse[];
    setAvailable(rows.filter((course) => course.statut === "en_attente" && !course.livreur_id));
    setActive(rows.find((course) => course.livreur_id === user.id && !["livree", "annulee"].includes(course.statut)) || null);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const channel = supabase.channel("delivery-dispatch-inbox").on("postgres_changes", { event: "*", schema: "public", table: "courses_delivery" }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const accept = async (courseId: string) => {
    setActionId(courseId);
    const { error } = await supabase.rpc("accepter_course_delivery", { p_course_id: courseId });
    if (error) showToast(error.message || "Cette course n’est plus disponible.", "error");
    else showToast("Course acceptée.", "success");
    await load();
    setActionId(null);
  };

  const advance = async (course: DeliveryCourse) => {
    const next: Record<string, DeliveryCourse["statut"]> = { attribuee: "vers_retrait", vers_retrait: "recuperee", recuperee: "vers_destination", vers_destination: "arrivee" };
    const nextStatus = next[course.statut];
    if (!nextStatus) return;
    setActionId(course.id);
    const { error } = await supabase.rpc("mettre_a_jour_course_delivery", { p_course_id: course.id, p_statut: nextStatus });
    if (error) showToast(error.message || "Impossible de mettre à jour la course.", "error");
    else showToast(nextStatus === "arrivee" ? "Arrivée signalée. Le client peut maintenant payer." : "Statut mis à jour.", "success");
    await load();
    setActionId(null);
  };

  if (loading) return <div className="mb-8 h-56 animate-pulse rounded-[28px] bg-gray-100" />;

  return (
    <section className="mb-10 space-y-5 rounded-[30px] border border-[#dcefe8] bg-[#f5fbf8] p-5 sm:p-7">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d9e75]">Ayiba Delivery</p><h2 className="mt-2 text-2xl font-bold tracking-[-0.03em] text-gray-900">Courses à proximité</h2><p className="mt-1 text-sm text-gray-500">Accepte une course, suis les étapes et attends la confirmation du paiement.</p></div><button onClick={load} className="inline-flex items-center gap-2 self-start rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-600 hover:text-gray-900"><RefreshCw size={14} /> Actualiser</button></div>
      {active && <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><div className="flex items-center gap-2"><span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-teal-700">Course active</span><span className="font-mono text-xs text-gray-400">{active.numero}</span></div><h3 className="mt-3 text-lg font-bold text-gray-900">{active.destination_adresse}</h3><div className="mt-2 flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500"><span className="inline-flex items-center gap-1"><MapPin size={13} className="text-[#1d9e75]" /> Départ : {active.depart_adresse}</span><span className="inline-flex items-center gap-1"><Clock3 size={13} /> {active.distance_estimee_km.toFixed(1)} km</span><span className="inline-flex items-center gap-1"><ShieldCheck size={13} /> Gain estimé : {formatFcfa(active.montant_net_livreur ?? active.montant_estime)}</span></div></div><div className="flex shrink-0 flex-col gap-2 sm:items-end"><span className="text-sm font-bold text-gray-900">{active.statut === "arrivee" ? "En attente du paiement client" : active.statut.replaceAll("_", " ")}</span>{active.statut !== "arrivee" && <button onClick={() => advance(active)} disabled={actionId === active.id} className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{actionId === active.id ? <Loader2 size={15} className="animate-spin" /> : <ActionLabel status={active.statut} />}</button>}</div></div></div>}
      <div className="grid gap-3 md:grid-cols-2">{available.map((course) => <article key={course.id} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-3"><div><p className="font-mono text-[11px] text-gray-400">{course.numero}</p><h3 className="mt-1 font-bold text-gray-900">{course.depart_adresse} <span className="mx-1 text-gray-300">→</span> {course.destination_adresse}</h3></div><span className="rounded-full bg-[#fff0eb] px-2.5 py-1 text-xs font-bold text-[#c54d2a]">{formatFcfa(course.montant_net_livreur ?? course.montant_estime)}</span></div><div className="mt-4 flex items-center justify-between gap-3 text-xs text-gray-500"><span className="inline-flex items-center gap-1"><Truck size={13} /> {course.type_colis}</span><span>{course.distance_estimee_km.toFixed(1)} km</span><button onClick={() => accept(course.id)} disabled={actionId === course.id} className="inline-flex items-center gap-1 rounded-lg bg-[#1d9e75] px-3 py-2 font-bold text-white disabled:opacity-50">{actionId === course.id ? <Loader2 size={13} className="animate-spin" /> : <><Check size={13} /> Accepter</>}</button></div></article>)}</div>
      {!active && available.length === 0 && <div className="rounded-2xl border border-dashed border-gray-300 bg-white/70 p-8 text-center"><Bike className="mx-auto text-gray-300" size={28} /><p className="mt-3 font-bold text-gray-700">Aucune course disponible pour l’instant</p><p className="mt-1 text-sm text-gray-500">Reste en ligne : les nouvelles demandes apparaîtront ici.</p></div>}
    </section>
  );
}
