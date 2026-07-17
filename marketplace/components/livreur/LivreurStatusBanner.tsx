"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Clock, AlertTriangle } from "lucide-react";

interface LivreurStatusBannerProps {
  statut: string;
  raisonRejet?: string | null;
}

export function LivreurStatusBanner({ statut, raisonRejet }: LivreurStatusBannerProps) {
  if (statut === "valide") return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="sticky top-0 z-40 w-full"
      >
        {statut === "en_attente" && (
          <div className="flex items-center justify-center gap-2 bg-amber-50 border-b border-amber-100 px-4 py-3 text-center">
            <Clock size={16} className="text-amber-600 shrink-0" />
            <p className="text-sm font-medium text-amber-700">
              Ton compte est en cours de vérification (24-48h)
            </p>
          </div>
        )}

        {statut === "refuse" && (
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 bg-red-50 border-b border-red-100 px-4 py-3 text-center">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-red-600 shrink-0" />
              <p className="text-sm font-medium text-red-700">
                Vérification refusée{raisonRejet ? ` — ${raisonRejet}` : ""}
              </p>
            </div>
            <Link
              href="/livreur/kyc"
              className="text-sm font-bold text-red-700 underline underline-offset-2 hover:text-red-800 transition-colors shrink-0"
            >
              Corriger mes informations
            </Link>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
