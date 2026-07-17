"use client";

import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Truck,
  MapPin,
  Clock,
  Wallet,
  Navigation,
  CheckCircle2,
  Phone,
  ChevronRight,
  ShieldCheck,
  Star,
  AlertCircle,
} from "lucide-react";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useLivreurMissions, type MissionCommande } from "@/app/hooks/useLivreurMissions";

const DeliveryMap = dynamic(() => import("@/components/dashboard/DeliveryMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-50 flex items-center justify-center text-gray-400 font-bold">
      Chargement de la carte...
    </div>
  ),
});

export default function LivreurMissionsPage() {
  const {
    loading,
    error,
    stats,
    noteMoyenne,
    aConfirmer,
    enCours,
    loadMissions,
    confirmerMission,
    refuserMission,
    marquerLivree,
  } = useLivreurMissions();

  const [activeTab, setActiveTab] = useState<"a-confirmer" | "en-cours">("a-confirmer");
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);

  const statCards = [
    {
      label: "Gains du jour",
      value: `${(stats?.gains_jour ?? 0).toLocaleString("fr-FR")} F`,
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-50",
    },
    {
      label: "Livraisons du jour",
      value: String(stats?.livraisons_jour ?? 0),
      icon: Truck,
      color: "text-coral-500",
      bg: "bg-coral-50",
    },
    {
      label: "Note",
      value: noteMoyenne ? `${noteMoyenne.toFixed(1)}/5` : "—",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50",
    },
  ];

  const handleConfirmer = async (id: string) => {
    setActionEnCours(id);
    await confirmerMission(id);
    setActionEnCours(null);
  };

  const handleRefuser = async (id: string) => {
    setActionEnCours(id);
    await refuserMission(id);
    setActionEnCours(null);
  };

  const handleMarquerLivree = async (id: string) => {
    setActionEnCours(id);
    await marquerLivree(id);
    setActionEnCours(null);
  };

  return (
    <DashboardLayout role="livreur" title="Mes Missions">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-red-600 mb-4">{error}</p>
          <button
            onClick={() => loadMissions()}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {statCards.map((stat, i) => (
              <div key={i} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <stat.icon size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
                    <p className="text-xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mb-8">
            {[
              { id: "a-confirmer", label: "À confirmer", count: aConfirmer.length },
              { id: "en-cours", label: "En cours", count: enCours.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 flex items-center gap-2
                  ${activeTab === tab.id ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}
                `}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] ${
                      activeTab === tab.id ? "bg-coral-500 text-white" : "bg-gray-200 text-gray-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              {activeTab === "a-confirmer" ? (
                aConfirmer.length === 0 ? (
                  <EmptyState text="Aucune mission à confirmer pour l'instant" />
                ) : (
                  aConfirmer.map((mission) => (
                    <MissionACConfirmerCard
                      key={mission.id}
                      mission={mission}
                      disabled={actionEnCours === mission.id}
                      onAccepter={() => handleConfirmer(mission.id)}
                      onRefuser={() => handleRefuser(mission.id)}
                    />
                  ))
                )
              ) : enCours.length === 0 ? (
                <EmptyState text="Aucune mission en cours" />
              ) : (
                enCours.map((mission) => (
                  <MissionEnCoursCard
                    key={mission.id}
                    mission={mission}
                    disabled={actionEnCours === mission.id}
                    onMarquerLivree={() => handleMarquerLivree(mission.id)}
                  />
                ))
              )}
            </div>

            <div className="space-y-8">
              <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
                <h3 className="text-lg font-bold mb-6">Mon Status</h3>
                <div className="flex items-center justify-between p-4 bg-teal-50 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center text-teal-500 shadow-xs">
                      <CheckCircle2 size={20} />
                    </div>
                    <span className="text-sm font-bold text-teal-700">En Ligne</span>
                  </div>
                </div>
              </div>

              <div className="bg-gray-900 p-8 rounded-3xl text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <ShieldCheck size={20} className="text-coral-400" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Sécurité d'abord</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium">
                    Respectez le code de la route et portez toujours votre casque Ayiba.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-coral-400 group-hover:gap-4 transition-all cursor-pointer">
                    Guide de sécurité <ChevronRight size={14} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
      <p className="text-gray-400 font-bold">{text}</p>
    </div>
  );
}

function MissionACConfirmerCard({
  mission,
  disabled,
  onAccepter,
  onRefuser,
}: {
  mission: MissionCommande;
  disabled: boolean;
  onAccepter: () => void;
  onRefuser: () => void;
}) {
  const pointRetrait = mission.vendeur_nom_boutique
    ? `${mission.vendeur_nom_boutique}${mission.vendeur_quartier ? `, ${mission.vendeur_quartier}` : ""}`
    : "Boutique non renseignée";
  const pointLivraison = mission.adresse_livraison || mission.commune || "Non renseignée";

  return (
    <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow group">
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400">
            <Truck size={20} />
          </div>
          <div>
            <p className="text-sm font-bold text-gray-900">Commande {mission.numero}</p>
            <p className="text-xs text-gray-400 font-medium">{mission.nb_articles} article(s) à livrer</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-coral-500">
            {(mission.frais_livraison ?? 0).toLocaleString("fr-FR")} F
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gain de la course</p>
        </div>
      </div>

      <div className="space-y-6 relative mb-8">
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 border-l-2 border-dashed border-gray-100" />
        <div className="flex gap-4 relative">
          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center z-10">
            <div className="w-2 h-2 bg-teal-500 rounded-full" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">Point de retrait</p>
            <p className="text-sm font-bold text-gray-900">{pointRetrait}</p>
          </div>
        </div>
        <div className="flex gap-4 relative">
          <div className="w-6 h-6 rounded-full bg-coral-50 flex items-center justify-center z-10">
            <MapPin size={12} className="text-coral-500" />
          </div>
          <div>
            <p className="text-[10px] font-bold text-coral-600 uppercase tracking-widest mb-0.5">Point de livraison</p>
            <p className="text-sm font-bold text-gray-900">{pointLivraison}</p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          disabled={disabled}
          onClick={onRefuser}
          className="flex-1 h-12 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all disabled:opacity-50"
        >
          Refuser
        </button>
        <button
          disabled={disabled}
          onClick={onAccepter}
          className="flex-[2] h-12 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50"
        >
          {disabled ? "..." : "Accepter la mission"}
        </button>
      </div>
    </div>
  );
}

function MissionEnCoursCard({
  mission,
  disabled,
  onMarquerLivree,
}: {
  mission: MissionCommande;
  disabled: boolean;
  onMarquerLivree: () => void;
}) {
  const points = [
    mission.vendeur_quartier
      ? { lat: 6.366, lng: 2.418, label: `${mission.vendeur_nom_boutique ?? "Boutique"} (Retrait)`, type: "pickup" as const }
      : null,
    { lat: 6.35, lng: 2.39, label: `${mission.adresse_livraison ?? mission.commune ?? "Client"} (Livraison)`, type: "delivery" as const },
  ].filter(Boolean) as { lat: number; lng: number; label: string; type: "pickup" | "delivery" }[];

  return (
    <div className="bg-white p-8 rounded-3xl border border-teal-100 shadow-xl shadow-teal-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
      </div>
      <h3 className="text-xl font-bold mb-6 flex items-center gap-3">
        Commande {mission.numero}
        <span className="text-xs font-bold px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md">EN COURS</span>
      </h3>
      <div className="h-64 mb-8">
        <DeliveryMap points={points} />
      </div>
      <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100 mb-8">
        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Instructions</p>
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          Récupérer le colis à{" "}
          <span className="font-bold">{mission.vendeur_nom_boutique ?? "la boutique du vendeur"}</span>. Livraison à{" "}
          {mission.adresse_livraison || mission.commune || "l'adresse indiquée"}.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <button className="flex-1 h-14 bg-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20">
          <Navigation size={20} />
          Ouvrir GPS
        </button>
        <button className="flex-1 h-14 border border-teal-200 text-teal-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-50 transition-all">
          <Phone size={20} />
          Appeler Client
        </button>
      </div>
      <div className="mt-10 pt-8 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-4">
          <AlertCircle size={14} className="text-amber-500" />
          <p className="text-xs font-medium text-amber-600">
            Code OTP non vérifié automatiquement pour l'instant — confirmation manuelle
          </p>
        </div>
        <button
          disabled={disabled}
          onClick={onMarquerLivree}
          className="w-full h-14 bg-gray-900 text-white font-bold rounded-2xl hover:bg-black transition-all disabled:opacity-50"
        >
          {disabled ? "..." : "Confirmer la livraison"}
        </button>
      </div>
    </div>
  );
}
