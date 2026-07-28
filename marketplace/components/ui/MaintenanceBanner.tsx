"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fr-FR", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

/**
 * Bannière annonçant à l'avance une fenêtre de maintenance programmée,
 * réglée depuis Admin > Paramètres système. Contrairement à
 * `mode_maintenance` (qui bloque immédiatement le site), cette bannière est
 * purement informative : elle prévient les visiteurs sans les empêcher
 * d'utiliser la plateforme.
 */
export function MaintenanceBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const { data } = await supabase
        .from("parametres_systeme")
        .select("cle, valeur")
        .in("cle", [
          "maintenance_prevue_active",
          "maintenance_prevue_debut",
          "maintenance_prevue_fin",
          "maintenance_prevue_message",
        ]);
      if (cancelled || !data) return;

      const map: Record<string, any> = {};
      data.forEach((row: { cle: string; valeur: unknown }) => (map[row.cle] = row.valeur));

      const active = map.maintenance_prevue_active === true || map.maintenance_prevue_active === "true";
      const fin = map.maintenance_prevue_fin;
      const dejaTerminee = fin && new Date(fin).getTime() < Date.now();

      if (!active || dejaTerminee) return;

      const debutTxt = map.maintenance_prevue_debut ? formatDate(map.maintenance_prevue_debut) : null;
      const finTxt = fin ? formatDate(fin) : null;
      const customMsg = map.maintenance_prevue_message && String(map.maintenance_prevue_message).trim();

      const texte =
        customMsg ||
        (debutTxt && finTxt
          ? `Le site sera indisponible du ${debutTxt} au ${finTxt} pour une opération de maintenance.`
          : "Une opération de maintenance est prévue prochainement.");

      const dismissKey = `ayiba_maintenance_dismiss_${map.maintenance_prevue_debut}_${fin}`;
      if (sessionStorage.getItem(dismissKey) === "1") return;

      setMessage(texte);
      (window as any).__ayibaMaintenanceDismissKey = dismissKey;
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  if (!message || dismissed) return null;

  return (
    <div className="w-full bg-amber-50 border-b border-amber-100 text-amber-900">
      <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">
        <AlertTriangle size={16} className="text-amber-500 shrink-0" />
        <p className="text-xs sm:text-sm font-medium flex-1">{message}</p>
        <button
          onClick={() => {
            const key = (window as any).__ayibaMaintenanceDismissKey;
            if (key) sessionStorage.setItem(key, "1");
            setDismissed(true);
          }}
          aria-label="Fermer la notification"
          className="text-amber-500 hover:text-amber-700 transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
