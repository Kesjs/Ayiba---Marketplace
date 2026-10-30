"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Box, CheckCircle2, Clock3, Loader2, MapPin, Package, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { AdresseForm, type AdresseFormValue } from "@/components/adresse/AdresseForm";
import { Button } from "@/components/ui/Button";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { formatFcfa, type DeliveryQuote } from "@/lib/delivery";

const emptyAddress: AdresseFormValue = { adresse_complete: "", quartier: "", commune: "", latitude: 0, longitude: 0 };

function addressFromRouteParams(prefix: "depart" | "destination"): AdresseFormValue {
  if (typeof window === "undefined") return { ...emptyAddress };
  const params = new URLSearchParams(window.location.search);
  const latitude = Number(params.get(`${prefix}Lat`));
  const longitude = Number(params.get(`${prefix}Lng`));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude === 0 || longitude === 0) return { ...emptyAddress };
  return {
    ...emptyAddress,
    adresse_complete: params.get(prefix) || (prefix === "depart" ? "Point de départ" : "Destination"),
    latitude,
    longitude,
  };
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; type?: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition focus:border-coral-400 focus:ring-4 focus:ring-coral-400/10"
      />
    </label>
  );
}

export default function CreateDeliveryCoursePage() {
  const router = useRouter();
  const { user, profile, loading: userLoading } = useUser();
  const { showToast } = useToast();
  const [depart, setDepart] = useState<AdresseFormValue>(() => addressFromRouteParams("depart"));
  const [destination, setDestination] = useState<AdresseFormValue>(() => addressFromRouteParams("destination"));
  const [departNom, setDepartNom] = useState("");
  const [departTelephone, setDepartTelephone] = useState(profile?.phone || "");
  const [destinationNom, setDestinationNom] = useState("");
  const [destinationTelephone, setDestinationTelephone] = useState("");
  const [typeColis, setTypeColis] = useState("colis");
  const [descriptionColis, setDescriptionColis] = useState("");
  const [noteLivreur, setNoteLivreur] = useState("");
  const [quote, setQuote] = useState<DeliveryQuote | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const addressesReady = useMemo(
    () => depart.latitude !== 0 && destination.latitude !== 0,
    [depart.latitude, destination.latitude],
  );
  const visibleQuote = addressesReady && !quoteLoading ? quote : null;

  useEffect(() => {
    if (!userLoading && !user) {
      const redirect = typeof window !== "undefined" ? `${window.location.pathname}${window.location.search}` : "/delivery/course";
      router.replace(`/connexion?redirect=${encodeURIComponent(redirect)}`);
    }
  }, [router, user, userLoading]);

  useEffect(() => {
    if (!addressesReady) {
      return;
    }
    const controller = new AbortController();
    const chargerTarif = async () => {
      setQuoteLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/delivery/tarif?departLat=${depart.latitude}&departLng=${depart.longitude}&destinationLat=${destination.latitude}&destinationLng=${destination.longitude}`, { signal: controller.signal });
        const body = await response.json();
        if (!response.ok) throw new Error(body.error || "Le tarif n’a pas pu être calculé.");
        setQuote(body.quote);
      } catch (reason) {
        if (reason instanceof Error && reason.name !== "AbortError") setError(reason.message);
      } finally {
        setQuoteLoading(false);
      }
    };
    void chargerTarif();
    return () => controller.abort();
  }, [addressesReady, depart.latitude, depart.longitude, destination.latitude, destination.longitude]);

  const handleSubmit = async () => {
    if (!addressesReady || quoteLoading || !visibleQuote?.disponible) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/delivery/courses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departAdresse: depart.adresse_complete,
          departCommune: depart.commune,
          departLatitude: depart.latitude,
          departLongitude: depart.longitude,
          departNom,
          departTelephone,
          destinationAdresse: destination.adresse_complete,
          destinationCommune: destination.commune,
          destinationLatitude: destination.latitude,
          destinationLongitude: destination.longitude,
          destinationNom,
          destinationTelephone,
          typeColis,
          descriptionColis,
          noteLivreur,
        }),
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "La course n’a pas pu être créée.");
      showToast("Course créée. Nous recherchons un livreur.", "success");
      router.push(`/delivery/courses/${body.course.id}`);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "La course n’a pas pu être créée.");
    } finally {
      setSubmitting(false);
    }
  };

  if (userLoading || !user) {
    return <div className="min-h-screen bg-gray-50" />;
  }

  return (
    <DashboardLayout role="client" title="Nouvelle course" personalized>
      <div className="mx-auto max-w-6xl space-y-7">
        <Link href="/delivery" className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900">
          <ArrowLeft size={16} /> Retour à Ayiba Delivery
        </Link>

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1.2fr)_360px] lg:items-start">
          <div className="space-y-6">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="rounded-[28px] bg-gray-900 p-6 text-white sm:p-8">
              <div className="flex items-start justify-between gap-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#79d8b5]">Étape 1 · Itinéraire</p>
                  <h1 className="mt-3 text-3xl font-semibold tracking-[-0.04em] sm:text-4xl">Où doit aller votre colis ?</h1>
                  <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">Sélectionnez les deux positions pour obtenir un montant clair avant de confirmer.</p>
                </div>
                <div className="hidden rounded-2xl bg-white/10 p-3 sm:block"><Sparkles className="h-5 w-5 text-[#79d8b5]" /></div>
              </div>
              <div className="mt-7 grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl bg-white p-4 text-gray-900">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f1ee] text-[#1d9e75]">A</span> Départ</div>
                  <AdresseForm
                    key={`depart-${depart.latitude}-${depart.longitude}`}
                    valeurInitiale={depart.latitude !== 0 ? depart : null}
                    onValider={setDepart}
                    labelBouton="Utiliser ce départ"
                  />
                </div>
                <div className="rounded-2xl bg-white p-4 text-gray-900">
                  <div className="mb-3 flex items-center gap-2 text-sm font-bold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#fff0eb] text-[#d85a30]">B</span> Destination</div>
                  <AdresseForm
                    key={`destination-${destination.latitude}-${destination.longitude}`}
                    valeurInitiale={destination.latitude !== 0 ? destination : null}
                    onValider={setDestination}
                    labelBouton="Utiliser cette destination"
                  />
                </div>
              </div>
            </motion.div>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><div className="rounded-2xl bg-coral-50 p-3 text-coral-500"><UserRound size={20} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Étape 2 · Remise</p><h2 className="text-xl font-bold text-gray-900">Qui remet et reçoit le colis ?</h2></div></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <Field label="Nom au départ" value={departNom} onChange={setDepartNom} placeholder="Nom de la personne" />
                <Field label="Téléphone au départ" value={departTelephone} onChange={setDepartTelephone} placeholder="97 00 11 22" />
                <Field label="Nom à destination" value={destinationNom} onChange={setDestinationNom} placeholder="Nom du destinataire" />
                <Field label="Téléphone à destination" value={destinationTelephone} onChange={setDestinationTelephone} placeholder="97 00 11 22" />
              </div>
            </section>

            <section className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm sm:p-8">
              <div className="flex items-center gap-3"><div className="rounded-2xl bg-teal-50 p-3 text-teal-600"><Package size={20} /></div><div><p className="text-xs font-bold uppercase tracking-[0.16em] text-gray-400">Étape 3 · Colis</p><h2 className="text-xl font-bold text-gray-900">Quelques détails utiles</h2></div></div>
              <div className="mt-6 grid gap-4 sm:grid-cols-2">
                <label className="block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Type de colis</span><select value={typeColis} onChange={(event) => setTypeColis(event.target.value)} className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm outline-none focus:border-coral-400"><option value="colis">Colis</option><option value="document">Document</option><option value="alimentaire">Alimentaire</option><option value="fragile">Fragile</option></select></label>
                <Field label="Description courte" value={descriptionColis} onChange={setDescriptionColis} placeholder="Ex. enveloppe A4, petit paquet..." />
              </div>
              <label className="mt-4 block"><span className="mb-2 block text-xs font-bold uppercase tracking-[0.14em] text-gray-500">Instruction au livreur (facultatif)</span><textarea value={noteLivreur} onChange={(event) => setNoteLivreur(event.target.value)} rows={3} placeholder="Repère, étage, personne à appeler..." className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-coral-400 focus:ring-4 focus:ring-coral-400/10" /></label>
            </section>
          </div>

          <aside className="lg:sticky lg:top-6">
            <div className="overflow-hidden rounded-[28px] border border-gray-100 bg-white shadow-sm">
              <div className="border-b border-gray-100 p-6"><p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400">Votre estimation</p><div className="mt-3 flex items-end justify-between gap-3"><div><p className="text-4xl font-semibold tracking-[-0.05em] text-gray-900">{quoteLoading ? "—" : visibleQuote ? formatFcfa(visibleQuote.montant) : "—"}</p><p className="mt-1 text-sm text-gray-500">montant estimé avant confirmation</p></div><div className="rounded-2xl bg-gray-50 p-3 text-gray-400"><Box size={22} /></div></div></div>
              <div className="space-y-4 p-6">
                <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-[#1d9e75]" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Départ</p><p className="mt-1 truncate text-sm font-semibold text-gray-800">{depart.adresse_complete || "À sélectionner"}</p></div></div>
                <div className="ml-2 h-5 border-l border-dashed border-gray-300" />
                <div className="flex items-start gap-3"><MapPin size={17} className="mt-0.5 text-[#d85a30]" /><div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-gray-400">Destination</p><p className="mt-1 truncate text-sm font-semibold text-gray-800">{destination.adresse_complete || "À sélectionner"}</p></div></div>
                <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-4 text-sm"><div className="rounded-2xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Distance</p><p className="mt-1 font-bold text-gray-900">{visibleQuote ? `${visibleQuote.distance_km.toFixed(1)} km` : "—"}</p></div><div className="rounded-2xl bg-gray-50 p-3"><p className="text-xs text-gray-400">Durée estimée</p><p className="mt-1 flex items-center gap-1 font-bold text-gray-900"><Clock3 size={14} />{visibleQuote ? `${Math.max(5, Math.round((visibleQuote.distance_km / 25) * 60 + 3))} min` : "—"}</p></div></div>
                {visibleQuote && !visibleQuote.disponible && <p className="rounded-2xl bg-amber-50 p-3 text-sm font-semibold text-amber-800">Cette distance dépasse actuellement la zone de livraison disponible.</p>}
                {error && <p role="alert" className="rounded-2xl bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</p>}
                <Button type="button" onClick={handleSubmit} disabled={!visibleQuote?.disponible || submitting} className="w-full py-4">{submitting ? <><Loader2 size={17} className="animate-spin" /> Création...</> : <>Confirmer la course <ArrowRight size={17} /></>}</Button>
                <div className="flex items-start gap-2 text-xs leading-5 text-gray-500"><ShieldCheck size={15} className="mt-0.5 shrink-0 text-teal-600" />Le montant final peut être ajusté selon le trajet réel. Vous le verrez avant le paiement à l’arrivée.</div>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs font-semibold text-gray-400"><CheckCircle2 size={14} className="text-teal-500" /> Paiement sécurisé par GeniusPay</div>
          </aside>
        </div>
      </div>
    </DashboardLayout>
  );
}
