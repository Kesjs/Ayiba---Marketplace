"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, Clock3, MapPin, RefreshCw, Route, ShieldCheck, Truck, Wallet } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { formatFcfa, type DeliveryCourse, type DeliveryStatus, DELIVERY_STATUS_LABELS } from "@/lib/delivery";
import { useToast } from "@/context/ToastContext";

type Rider = { id: string; nom_complet: string; commune: string | null; statut_verification: string | null; en_pause: boolean };

const filters: Array<{ value: "all" | DeliveryStatus; label: string }> = [
  { value: "all", label: "Toutes" },
  { value: "en_attente", label: "À attribuer" },
  { value: "attribuee", label: "Attribuées" },
  { value: "vers_destination", label: "En route" },
  { value: "arrivee", label: "Paiement attendu" },
  { value: "livree", label: "Terminées" },
];

export default function AdminDeliveryPage() {
  const supabase = useMemo(() => createClient(), []);
  const { showToast } = useToast();
  const [courses, setCourses] = useState<DeliveryCourse[]>([]);
  const [riders, setRiders] = useState<Rider[]>([]);
  const [filter, setFilter] = useState<"all" | DeliveryStatus>("all");
  const [loading, setLoading] = useState(true);
  const [assignment, setAssignment] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [{ data: courseData }, { data: riderData }] = await Promise.all([
      supabase.from("courses_delivery").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("livreurs").select("id, nom_complet, commune, statut_verification, en_pause").eq("statut_verification", "valide").eq("en_pause", false).order("nom_complet"),
    ]);
    setCourses((courseData || []) as DeliveryCourse[]);
    setRiders((riderData || []) as Rider[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    const channel = supabase.channel("admin-delivery-monitor").on("postgres_changes", { event: "*", schema: "public", table: "courses_delivery" }, load).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [load, supabase]);

  const assign = async (courseId: string) => {
    const riderId = assignment[courseId];
    if (!riderId) return;
    setSavingId(courseId);
    const { error } = await supabase.rpc("admin_assigner_course_delivery", { p_course_id: courseId, p_livreur_id: riderId });
    if (error) showToast(error.message || "Impossible d’attribuer cette course.", "error");
    else { showToast("Course attribuée au livreur.", "success"); await load(); }
    setSavingId(null);
  };

  const visibleCourses = filter === "all" ? courses : courses.filter((course) => course.statut === filter);
  const stats = {
    open: courses.filter((course) => course.statut === "en_attente").length,
    active: courses.filter((course) => !["livree", "annulee"].includes(course.statut)).length,
    waitingPayment: courses.filter((course) => course.statut === "arrivee").length,
    revenue: courses.filter((course) => course.statut === "livree").reduce((sum, course) => sum + Number(course.montant_final ?? course.montant_estime), 0),
  };

  return (
    <DashboardLayout role="admin" title="Delivery · Opérations">
      <div className="mx-auto max-w-7xl space-y-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#1d9e75]">Même administration Ayiba</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-gray-900">Courses Delivery</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">Surveille les courses, attribue un livreur et garde les incidents au même endroit que les commandes marketplace.</p></div><div className="flex gap-2"><Link href="/admin/parametres" className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 hover:border-gray-300"><Wallet size={16} /> Tarifs</Link><button onClick={load} className="inline-flex items-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-bold text-white"><RefreshCw size={16} /> Actualiser</button></div></div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["À attribuer", stats.open, Truck, "text-coral-500 bg-coral-50"], ["Courses actives", stats.active, Route, "text-teal-600 bg-teal-50"], ["Paiements attendus", stats.waitingPayment, Clock3, "text-amber-600 bg-amber-50"], ["Chiffre livré", formatFcfa(stats.revenue), Wallet, "text-gray-700 bg-gray-100"]].map(([label, value, Icon, color]) => { const C = Icon as typeof Truck; return <div key={String(label)} className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><p className="text-sm font-semibold text-gray-500">{label as string}</p><span className={`rounded-xl p-2 ${color as string}`}><C size={17} /></span></div><p className="mt-4 text-2xl font-bold text-gray-900">{value as string | number}</p></div>; })}</div>
        <div className="flex flex-wrap gap-2">{filters.map((item) => <button key={item.value} onClick={() => setFilter(item.value)} className={`rounded-full px-4 py-2 text-sm font-bold transition ${filter === item.value ? "bg-gray-900 text-white" : "bg-white text-gray-500 ring-1 ring-gray-200 hover:text-gray-900"}`}>{item.label}</button>)}</div>
        <section className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm"><div className="border-b border-gray-100 px-5 py-4 sm:px-7"><div className="flex items-center justify-between"><div><h2 className="font-bold text-gray-900">Flux des courses</h2><p className="mt-1 text-xs text-gray-500">{visibleCourses.length} course{visibleCourses.length > 1 ? "s" : ""} affichée{visibleCourses.length > 1 ? "s" : ""}</p></div><ShieldCheck className="text-teal-600" size={20} /></div></div>{loading ? <div className="space-y-3 p-6"><div className="h-20 animate-pulse rounded-2xl bg-gray-100" /><div className="h-20 animate-pulse rounded-2xl bg-gray-100" /></div> : visibleCourses.length === 0 ? <div className="p-12 text-center"><CheckCircle2 className="mx-auto text-gray-300" size={30} /><p className="mt-3 font-bold text-gray-700">Aucune course dans ce filtre</p><p className="mt-1 text-sm text-gray-500">Les nouvelles demandes apparaîtront automatiquement ici.</p></div> : <div className="divide-y divide-gray-100">{visibleCourses.map((course) => <article key={course.id} className="grid gap-5 p-5 sm:p-7 lg:grid-cols-[1.4fr_.8fr_.75fr] lg:items-center"><div><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-xs text-gray-400">{course.numero}</span><span className="rounded-full bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-600">{DELIVERY_STATUS_LABELS[course.statut]}</span>{course.statut_paiement === "paye" && <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[10px] font-bold text-teal-700">Payée</span>}</div><p className="mt-3 font-bold text-gray-900">{course.depart_adresse} <span className="mx-1 text-gray-300">→</span> {course.destination_adresse}</p><div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500"><span className="inline-flex items-center gap-1"><MapPin size={13} /> {course.distance_finale_km?.toFixed(1) || course.distance_estimee_km.toFixed(1)} km</span><span>{course.type_colis}</span><span>{formatFcfa(course.montant_final ?? course.montant_estime)}</span></div></div><div className="text-sm">{course.livreur_id ? <p className="font-bold text-gray-800">Livreur attribué</p> : <p className="font-semibold text-amber-700">Aucun livreur</p>}<p className="mt-1 text-xs text-gray-500">{new Date(course.created_at).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}</p></div><div>{course.statut === "en_attente" ? <div className="flex gap-2"><select value={assignment[course.id] || ""} onChange={(event) => setAssignment((previous) => ({ ...previous, [course.id]: event.target.value }))} className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold"><option value="">Attribuer...</option>{riders.map((rider) => <option key={rider.id} value={rider.id}>{rider.nom_complet}{rider.commune ? ` · ${rider.commune}` : ""}</option>)}</select><button onClick={() => assign(course.id)} disabled={!assignment[course.id] || savingId === course.id} className="rounded-xl bg-gray-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-40">{savingId === course.id ? "..." : "Attribuer"}</button></div> : <div className="flex items-center gap-2 text-xs font-bold text-gray-500"><AlertTriangle size={14} className={course.statut === "arrivee" ? "text-amber-500" : "text-gray-300"} />{course.statut === "arrivee" ? "Paiement client attendu" : "Suivi automatique"}</div>}</div></article>)}</div>}</section>
      </div>
    </DashboardLayout>
  );
}
