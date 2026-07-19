"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Truck,
  MapPin,
  Wallet,
  Navigation,
  CheckCircle2,
  Phone,
  ChevronRight,
  ShieldCheck,
  Star,
  Zap,
  PackageCheck,
  Radio,
  Bike,
} from "lucide-react";
import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useLivreurMissions, type MissionCommande, type CodesLivraison } from "@/app/hooks/useLivreurMissions";

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
    codesActifs,
    loadMissions,
    recupererColis,
    regenererCodes,
    refuserMission,
    signalerClientIndisponible,
  } = useLivreurMissions();

  const [activeTab, setActiveTab] = useState<"a-confirmer" | "en-cours">("a-confirmer");
  const [actionEnCours, setActionEnCours] = useState<string | null>(null);
  const [enLigne, setEnLigne] = useState(true);

  const statCards = [
    {
      label: "Gains du jour",
      value: `${(stats?.gains_jour ?? 0).toLocaleString("fr-FR")} F`,
      icon: Wallet,
      color: "text-teal-600",
      bg: "bg-teal-50",
      trend: stats?.gains_jour ? "+ aujourd'hui" : null,
    },
    {
      label: "Livraisons du jour",
      value: String(stats?.livraisons_jour ?? 0),
      icon: Truck,
      color: "text-coral-500",
      bg: "bg-coral-50",
      trend: null,
    },
    {
      label: "Note",
      value: noteMoyenne ? `${noteMoyenne.toFixed(1)}/5` : "—",
      icon: Star,
      color: "text-amber-500",
      bg: "bg-amber-50",
      trend: null,
    },
  ];

  const handleRecupererColis = async (id: string) => {
    setActionEnCours(id);
    await recupererColis(id);
    setActionEnCours(null);
    setActiveTab("en-cours");
  };

  const handleRefuser = async (id: string) => {
    setActionEnCours(id);
    await refuserMission(id);
    setActionEnCours(null);
  };

  const handleClientIndisponible = async (id: string) => {
    setActionEnCours(id);
    await signalerClientIndisponible(id);
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
          {/* Bandeau de bienvenue + toggle en ligne */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
          >
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                <Bike size={20} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  {enLigne ? "Prêt à rouler" : "Tu es hors ligne"}
                </h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  {enLigne
                    ? "Tu reçois les nouvelles missions en temps réel."
                    : "Repasse en ligne pour recevoir des missions."}
                </p>
              </div>
            </div>

            <button
              onClick={() => setEnLigne((v) => !v)}
              className={`relative flex items-center gap-3 pl-4 pr-1.5 py-1.5 rounded-full border transition-colors shrink-0 self-start sm:self-auto ${
                enLigne
                  ? "bg-teal-50 border-teal-200"
                  : "bg-gray-100 border-gray-200"
              }`}
            >
              <span
                className={`text-sm font-bold ${enLigne ? "text-teal-700" : "text-gray-500"}`}
              >
                {enLigne ? "En ligne" : "Hors ligne"}
              </span>
              <span
                className={`relative w-11 h-7 rounded-full transition-colors duration-300 ${
                  enLigne ? "bg-teal-500" : "bg-gray-300"
                }`}
              >
                <motion.span
                  layout
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center"
                  style={{ left: enLigne ? "calc(100% - 24px)" : "4px" }}
                >
                  {enLigne && (
                    <span className="w-2 h-2 bg-teal-500 rounded-full animate-pulse" />
                  )}
                </motion.span>
              </span>
            </button>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
            {statCards.map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: i * 0.06 }}
                whileHover={{ y: -3 }}
                className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-12 h-12 rounded-2xl ${stat.bg} ${stat.color} flex items-center justify-center shrink-0`}
                  >
                    <stat.icon size={24} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                      {stat.label}
                    </p>
                    <p className="text-xl font-bold text-gray-900 truncate">{stat.value}</p>
                    {stat.trend && (
                      <p className="text-[11px] font-semibold text-teal-500 mt-0.5">{stat.trend}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Tabs avec pastille glissante */}
          <LayoutGroup>
            <div className="flex gap-2 p-1 bg-gray-100 rounded-2xl w-fit mb-8 max-w-full overflow-x-auto">
              {[
                { id: "a-confirmer", label: "À confirmer", count: aConfirmer.length },
                { id: "en-cours", label: "En cours", count: enCours.length },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className="relative px-4 sm:px-6 py-2.5 rounded-xl text-sm font-bold transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {activeTab === tab.id && (
                    <motion.span
                      layoutId="tab-pill"
                      className="absolute inset-0 bg-white rounded-xl shadow-sm"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                  <span
                    className={`relative z-10 ${
                      activeTab === tab.id ? "text-gray-900" : "text-gray-500"
                    }`}
                  >
                    {tab.label}
                  </span>
                  {tab.count > 0 && (
                    <span
                      className={`relative z-10 px-1.5 py-0.5 rounded-md text-[10px] ${
                        activeTab === tab.id
                          ? "bg-coral-500 text-white"
                          : "bg-gray-200 text-gray-500"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </LayoutGroup>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-10">
            <div className="lg:col-span-2 space-y-6 min-w-0">
              <AnimatePresence mode="popLayout">
                {activeTab === "a-confirmer" ? (
                  aConfirmer.length === 0 ? (
                    <EmptyState
                      key="empty-confirmer"
                      icon={Radio}
                      title="Aucune mission pour l'instant"
                      text={
                        enLigne
                          ? "Reste en ligne, la prochaine ne devrait pas tarder."
                          : "Passe en ligne pour commencer à recevoir des missions."
                      }
                    />
                  ) : (
                    aConfirmer.map((mission) => (
                      <motion.div
                        key={mission.id}
                        layout
                        initial={{ opacity: 0, y: 16, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, x: -24, scale: 0.97 }}
                        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
                      >
                        <MissionACConfirmerCard
                          mission={mission}
                          disabled={actionEnCours === mission.id}
                          onAccepter={() => handleRecupererColis(mission.id)}
                          onRefuser={() => handleRefuser(mission.id)}
                        />
                      </motion.div>
                    ))
                  )
                ) : enCours.length === 0 ? (
                  <EmptyState
                    key="empty-en-cours"
                    icon={PackageCheck}
                    title="Aucune course active"
                    text="Accepte une mission dans l'onglet « À confirmer » pour démarrer une livraison."
                  />
                ) : (
                  enCours.map((mission) => (
                    <motion.div
                      key={mission.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.3 }}
                    >
                      <MissionEnCoursCard
                        mission={mission}
                        disabled={actionEnCours === mission.id}
                        codes={codesActifs?.commandeId === mission.id ? codesActifs : null}
                        onRegenererCodes={() => regenererCodes(mission.id)}
                        onClientIndisponible={() => handleClientIndisponible(mission.id)}
                      />
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>

            <div className="space-y-6 lg:space-y-8 min-w-0">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.15 }}
                className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm"
              >
                <h3 className="text-lg font-bold mb-6">Mon statut</h3>
                <div
                  className={`flex items-center justify-between p-4 rounded-2xl transition-colors ${
                    enLigne ? "bg-teal-50" : "bg-gray-50"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs shrink-0">
                      {enLigne ? (
                        <CheckCircle2 size={20} className="text-teal-500" />
                      ) : (
                        <Radio size={20} className="text-gray-400" />
                      )}
                    </div>
                    <span
                      className={`text-sm font-bold ${enLigne ? "text-teal-700" : "text-gray-500"}`}
                    >
                      {enLigne ? "En Ligne" : "Hors Ligne"}
                    </span>
                  </div>
                  {enLigne && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 shrink-0">
                      <Zap size={12} /> Actif
                    </span>
                  )}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: 0.22 }}
                className="bg-gray-900 p-6 sm:p-8 rounded-3xl text-white relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-coral-500/20 rounded-full -mr-16 -mt-16 blur-2xl" />
                <div className="relative z-10">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mb-6">
                    <ShieldCheck size={20} className="text-coral-400" />
                  </div>
                  <h4 className="font-bold text-lg mb-2">Sécurité d'abord</h4>
                  <p className="text-sm text-gray-400 leading-relaxed mb-6 font-medium">
                    Respecte le code de la route et porte toujours ton casque Ayiba.
                  </p>
                  <div className="flex items-center gap-2 text-xs font-bold text-coral-400 group-hover:gap-4 transition-all cursor-pointer">
                    Guide de sécurité <ChevronRight size={14} />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
}

function EmptyState({
  icon: Icon,
  title,
  text,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  text: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="py-16 text-center bg-white rounded-3xl border border-dashed border-gray-200 px-4"
    >
      <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-300">
        <Icon size={26} />
      </div>
      <p className="font-bold text-gray-700 mb-1">{title}</p>
      <p className="text-sm text-gray-400 max-w-xs mx-auto">{text}</p>
    </motion.div>
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
    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-200 transition-all group">
      <div className="flex items-start justify-between gap-3 mb-8">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-coral-50 group-hover:text-coral-500 transition-colors shrink-0">
            <Truck size={20} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">Commande {mission.numero}</p>
            <p className="text-xs text-gray-400 font-medium">{mission.nb_articles} article(s) à livrer</p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <motion.p
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-xl sm:text-2xl font-bold text-coral-500"
          >
            {(mission.frais_livraison ?? 0).toLocaleString("fr-FR")} F
          </motion.p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gain de la course</p>
        </div>
      </div>

      <div className="space-y-6 relative mb-8">
        <div className="absolute left-[11px] top-3 bottom-3 w-0.5 border-l-2 border-dashed border-gray-100" />
        <div className="flex gap-4 relative">
          <div className="w-6 h-6 rounded-full bg-teal-50 flex items-center justify-center z-10 shrink-0">
            <div className="w-2 h-2 bg-teal-500 rounded-full" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-0.5">Point de retrait</p>
            <p className="text-sm font-bold text-gray-900 break-words">{pointRetrait}</p>
          </div>
        </div>
        <div className="flex gap-4 relative">
          <div className="w-6 h-6 rounded-full bg-coral-50 flex items-center justify-center z-10 shrink-0">
            <MapPin size={12} className="text-coral-500" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-coral-600 uppercase tracking-widest mb-0.5">Point de livraison</p>
            <p className="text-sm font-bold text-gray-900 break-words">{pointLivraison}</p>
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
        <motion.button
          whileTap={{ scale: 0.97 }}
          disabled={disabled}
          onClick={onAccepter}
          className="flex-[2] h-12 rounded-xl bg-gray-900 text-white font-bold text-sm hover:bg-black transition-all shadow-lg shadow-gray-900/10 disabled:opacity-50"
        >
          {disabled ? "..." : "Accepter la mission"}
        </motion.button>
      </div>
    </div>
  );
}

function MissionEnCoursCard({
  mission,
  disabled,
  codes,
  onRegenererCodes,
  onClientIndisponible,
}: {
  mission: MissionCommande;
  disabled: boolean;
  codes: CodesLivraison | null;
  onRegenererCodes: () => void;
  onClientIndisponible: () => void;
}) {
  const points = [
    mission.vendeur_quartier
      ? { lat: 6.366, lng: 2.418, label: `${mission.vendeur_nom_boutique ?? "Boutique"} (Retrait)`, type: "pickup" as const }
      : null,
    { lat: 6.35, lng: 2.39, label: `${mission.adresse_livraison ?? mission.commune ?? "Client"} (Livraison)`, type: "delivery" as const },
  ].filter(Boolean) as { lat: number; lng: number; label: string; type: "pickup" | "delivery" }[];

  return (
    <div className="bg-white p-5 sm:p-6 md:p-8 rounded-3xl border border-teal-100 shadow-xl shadow-teal-500/5 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-4">
        <span className="flex h-3 w-3 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-teal-500"></span>
        </span>
      </div>
      <h3 className="text-lg sm:text-xl font-bold mb-6 flex flex-wrap items-center gap-3 pr-6">
        Commande {mission.numero}
        <span className="text-xs font-bold px-2 py-0.5 bg-teal-50 text-teal-600 rounded-md">EN COURS</span>
      </h3>

      {/* Stepper de progression */}
      <div className="flex items-center gap-2 mb-8">
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
            <CheckCircle2 size={14} />
          </div>
          <span className="text-xs font-bold text-teal-600 hidden sm:inline">Retrait</span>
        </div>
        <div className="flex-1 h-0.5 bg-teal-200" />
        <div className="flex items-center gap-2 flex-1">
          <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white shrink-0 relative">
            <Navigation size={13} />
            <span className="absolute inset-0 rounded-full bg-teal-400 animate-ping opacity-60" />
          </div>
          <span className="text-xs font-bold text-teal-600 hidden sm:inline">En route</span>
        </div>
        <div className="flex-1 h-0.5 bg-gray-200" />
        <div className="flex items-center gap-2 flex-1 justify-end">
          <span className="text-xs font-bold text-gray-400 hidden sm:inline">Livraison</span>
          <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
            <PackageCheck size={14} />
          </div>
        </div>
      </div>

      <div className="h-56 sm:h-64 mb-8 rounded-2xl overflow-hidden">
        <DeliveryMap points={points} />
      </div>
      <div className="p-5 sm:p-6 bg-teal-50/50 rounded-2xl border border-teal-100 mb-8">
        <p className="text-xs font-bold text-teal-600 uppercase tracking-widest mb-2">Instructions</p>
        <p className="text-sm font-medium text-gray-900 leading-relaxed">
          Récupère le colis à{" "}
          <span className="font-bold">{mission.vendeur_nom_boutique ?? "la boutique du vendeur"}</span>. Livraison à{" "}
          {mission.adresse_livraison || mission.commune || "l'adresse indiquée"}.
        </p>
      </div>
      <div className="flex flex-col sm:flex-row gap-4">
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex-1 h-14 bg-teal-500 text-white font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-600 transition-all shadow-lg shadow-teal-500/20"
        >
          <Navigation size={20} />
          Ouvrir GPS
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          className="flex-1 h-14 border border-teal-200 text-teal-700 font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-teal-50 transition-all"
        >
          <Phone size={20} />
          Appeler Client
        </motion.button>
      </div>

      {/* Confirmation de livraison : ce n'est plus le livreur qui confirme.
          Il affiche son QR + code de secours ; c'est le client qui les
          scanne/saisit depuis son propre compte pour valider la réception. */}
      <div className="mt-10 pt-8 border-t border-gray-100">
        <div className="flex items-start gap-2 mb-5">
          <ShieldCheck size={14} className="text-teal-600 shrink-0 mt-0.5" />
          <p className="text-xs font-medium text-gray-500">
            Montre cet écran au client. Il scanne le QR (ou saisit le code de secours) depuis son
            application pour confirmer la réception — c'est ce qui libère le paiement.
          </p>
        </div>

        {codes ? (
          <CodeConfirmationDisplay qrToken={codes.qrToken} code6={codes.code6} />
        ) : (
          <div className="p-5 bg-amber-50 border border-amber-100 rounded-2xl text-center">
            <p className="text-sm font-medium text-amber-700 mb-3">
              Codes non disponibles à l'écran (app rechargée depuis la prise en charge).
            </p>
            <motion.button
              whileTap={{ scale: 0.97 }}
              disabled={disabled}
              onClick={onRegenererCodes}
              className="h-11 px-5 bg-amber-500 text-white font-bold rounded-xl text-sm disabled:opacity-50"
            >
              {disabled ? "..." : "Régénérer les codes"}
            </motion.button>
          </div>
        )}

        <button
          disabled={disabled}
          onClick={onClientIndisponible}
          className="w-full mt-4 h-12 text-sm font-bold text-gray-500 hover:text-gray-700 hover:bg-gray-50 rounded-xl transition-colors disabled:opacity-50"
        >
          Client indisponible pour confirmer
        </button>
      </div>
    </div>
  );
}

// Affiche le QR (encode commande_id + token, jamais transmis à un service tiers —
// génération 100% côté client via la lib "qrcode") et le code de secours à 6
// chiffres en dessous. Nécessite d'ajouter la dépendance : npm install qrcode
function CodeConfirmationDisplay({ qrToken, code6 }: { qrToken: string; code6: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("qrcode")
      .then((QRCode) =>
        QRCode.toDataURL(qrToken, { margin: 1, width: 220 }).then((url: string) => {
          if (!cancelled) setQrDataUrl(url);
        })
      )
      .catch((err) => console.error("[CodeConfirmationDisplay] génération QR échouée:", err));
    return () => {
      cancelled = true;
    };
  }, [qrToken]);

  return (
    <div className="flex flex-col items-center gap-5 p-6 bg-gray-50 rounded-2xl border border-gray-100">
      <div className="w-[220px] h-[220px] bg-white rounded-xl flex items-center justify-center border border-gray-100 overflow-hidden">
        {qrDataUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qrDataUrl} alt="QR Code de confirmation de livraison" width={220} height={220} />
        ) : (
          <span className="text-xs text-gray-400">Génération du QR...</span>
        )}
      </div>
      <div className="text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">
          Code de secours
        </p>
        <p className="text-2xl font-bold tracking-[0.3em] text-gray-900">{code6}</p>
      </div>
    </div>
  );
}
