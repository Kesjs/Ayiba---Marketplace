"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Clock, AlertCircle, ArrowRight } from "lucide-react";

interface LivreurStatusBannerProps {
  statut: string;
  raisonRejet?: string | null;
}

export function LivreurStatusBanner({ statut, raisonRejet }: LivreurStatusBannerProps) {
  if (statut === "valide") return null;

  const isPending = statut === "en_attente";

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="sticky top-0 z-40 w-full backdrop-blur-md border-b border-black/[0.06]"
        style={{
          backgroundColor: isPending
            ? "rgba(255, 251, 235, 0.85)"
            : "rgba(254, 242, 242, 0.85)",
        }}
      >
        <div className="max-w-3xl mx-auto flex items-center gap-3 px-4 py-2.5">
          <div
            className={`flex items-center justify-center w-7 h-7 rounded-full shrink-0 ${
              isPending ? "bg-amber-100" : "bg-red-100"
            }`}
          >
            {isPending ? (
              <Clock size={14} className="text-amber-600" />
            ) : (
              <AlertCircle size={14} className="text-red-600" />
            )}
          </div>

          <p
            className={`flex-1 text-[13px] font-medium leading-snug ${
              isPending ? "text-amber-800" : "text-red-800"
            }`}
          >
            {isPending
              ? "Vérification de ton compte en cours — activation sous 24-48h."
              : `Vérification refusée${raisonRejet ? ` — ${raisonRejet}` : "."}`}
          </p>

          {!isPending && (
            <Link
              href="/livreur/kyc"
              className="flex items-center gap-1 text-[13px] font-semibold text-red-700 hover:text-red-800 transition-colors shrink-0 whitespace-nowrap"
            >
              Corriger
              <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
