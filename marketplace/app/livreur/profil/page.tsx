"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { User, MapPin, Bike, Star, ShieldCheck, ShieldAlert, Truck, ChevronRight, Edit3 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { useLivreurProfil } from "@/app/hooks/useLivreurProfil";

const VEHICULE_LABELS: Record<string, string> = {
  motocyclette: "Motocyclette",
  velo: "Vélo",
  tricycle: "Tricycle",
  a_pied: "À pied",
};

export default function LivreurProfilPage() {
  const { loading, error, profil, reload } = useLivreurProfil();

  return (
    <DashboardLayout role="livreur" title="Mon profil">
      {loading ? (
        <DashboardSkeleton />
      ) : error ? (
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6 text-center">
          <p className="text-sm font-medium text-red-600 mb-4">{error}</p>
          <button
            onClick={() => reload()}
            className="px-5 py-2.5 bg-red-600 text-white text-sm font-bold rounded-xl hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      ) : (
        <div className="max-w-2xl">
          {/* En-tête profil */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6"
          >
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-2xl bg-gray-100 overflow-hidden shrink-0">
                {profil?.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profil.avatarUrl} alt={profil.fullName ?? "Photo de profil"} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-300">
                    <User size={28} />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">{profil?.fullName || "Livreur Ayiba"}</h2>
                <div className="flex items-center gap-1.5 mt-1">
                  <Star size={14} className="text-amber-500 fill-amber-500" />
                  <span className="text-sm font-bold text-gray-700">
                    {profil?.nbAvis ? profil.noteMoyenne.toFixed(1) : "—"}
                  </span>
                  {!!profil?.nbAvis && (
                    <span className="text-xs text-gray-400 font-medium">({profil.nbAvis} avis)</span>
                  )}
                </div>
              </div>
            </div>

            <div
              className={`flex items-center gap-2 p-3 rounded-xl text-xs font-bold ${
                profil?.statutVerification === "valide"
                  ? "bg-teal-50 text-teal-700"
                  : profil?.statutVerification === "refuse"
                  ? "bg-red-50 text-red-600"
                  : "bg-amber-50 text-amber-600"
              }`}
            >
              {profil?.statutVerification === "valide" ? (
                <ShieldCheck size={16} />
              ) : (
                <ShieldAlert size={16} />
              )}
              {profil?.statutVerification === "valide"
                ? "Compte vérifié"
                : profil?.statutVerification === "refuse"
                ? "Dossier KYC refusé"
                : "Vérification en attente"}
            </div>

            <Link
              href="/livreur/parametres"
              className="flex items-center justify-center gap-2 mt-6 h-12 border border-gray-200 rounded-xl text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit3 size={16} /> Modifier mon profil
            </Link>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.05 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-500 flex items-center justify-center mb-3">
                <Truck size={18} />
              </div>
              <p className="text-xl font-bold text-gray-900">{profil?.livraisonsTotal ?? 0}</p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Livraisons</p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center mb-3">
                <Bike size={18} />
              </div>
              <p className="text-xl font-bold text-gray-900">
                {profil?.typeVehicule ? VEHICULE_LABELS[profil.typeVehicule] ?? profil.typeVehicule : "—"}
              </p>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Véhicule</p>
            </motion.div>
          </div>

          {/* Localisation */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <MapPin size={16} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Zone de livraison</h3>
            </div>
            <p className="text-sm font-medium text-gray-700">
              {[profil?.quartier, profil?.commune].filter(Boolean).join(", ") || "Non renseignée"}
            </p>
            {profil?.plaqueImmatriculation && (
              <p className="text-xs text-gray-400 font-medium mt-2">
                Plaque : {profil.plaqueImmatriculation}
              </p>
            )}
          </motion.div>

          {/* Avis récents */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.2 }}
            className="bg-white p-6 sm:p-8 rounded-3xl border border-gray-100 shadow-sm mb-6"
          >
            <div className="flex items-center gap-2 mb-4">
              <Star size={16} className="text-gray-400" />
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">Avis récents</h3>
            </div>
            {!profil?.avisRecents?.length ? (
              <p className="text-sm text-gray-400 font-medium">Aucun avis pour l'instant.</p>
            ) : (
              <div className="space-y-4">
                {profil.avisRecents.map((avis) => (
                  <div key={avis.id} className="pb-4 border-b border-gray-50 last:border-0 last:pb-0">
                    <div className="flex items-center gap-1 mb-1.5">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          size={13}
                          className={i < avis.note ? "text-amber-500 fill-amber-500" : "text-gray-200"}
                        />
                      ))}
                      <span className="text-[11px] text-gray-400 font-medium ml-2">
                        {new Date(avis.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                    {avis.commentaire && (
                      <p className="text-sm text-gray-600 font-medium">{avis.commentaire}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </motion.div>

          <p className="text-xs text-gray-400 text-center font-medium mb-10">
            Membre depuis{" "}
            {profil?.membreDepuis &&
              new Date(profil.membreDepuis).toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
