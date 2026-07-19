"use client";

import { useCallback, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type EtapeConfirmation = "qr" | "code6" | "litige" | "confirmee";

interface EtatVerification {
  etape: EtapeConfirmation;
  tentativesRestantes: number | null;
  attendreSecondes: number | null;
  erreur: string | null;
  enCours: boolean;
}

const ETAT_INITIAL: EtatVerification = {
  etape: "qr",
  tentativesRestantes: null,
  attendreSecondes: null,
  erreur: null,
  enCours: false,
};

// Hook client — appelé depuis l'écran "Détail de la commande" quand la
// commande est "expediee". Toute la logique de comptage/verrouillage vit
// dans la fonction Postgres verifier_code_livraison ; ce hook ne fait que
// relayer l'appel et interpréter la réponse.
export function useConfirmationLivraison(commandeId: string) {
  const supabase = createClient();
  const [etat, setEtat] = useState<EtatVerification>(ETAT_INITIAL);

  const soumettre = useCallback(
    async (type: "qr" | "code6", code: string) => {
      setEtat((prev) => ({ ...prev, enCours: true, erreur: null }));

      try {
        const { data, error } = await supabase.rpc("verifier_code_livraison", {
          p_commande_id: commandeId,
          p_type: type,
          p_code: code,
        });

        if (error) throw error;

        if (data?.success) {
          setEtat({
            etape: "confirmee",
            tentativesRestantes: null,
            attendreSecondes: null,
            erreur: null,
            enCours: false,
          });
          return { success: true };
        }

        // Échec : interpréter la raison renvoyée par la fonction serveur.
        if (data?.litige) {
          setEtat({
            etape: "litige",
            tentativesRestantes: 0,
            attendreSecondes: null,
            erreur: null,
            enCours: false,
          });
        } else if (data?.basculer_code6) {
          setEtat({
            etape: "code6",
            tentativesRestantes: 3,
            attendreSecondes: null,
            erreur: "Code QR incorrect à 3 reprises. Utilise le code de secours affiché sous le QR du livreur.",
            enCours: false,
          });
        } else if (data?.raison === "trop_rapide") {
          setEtat((prev) => ({
            ...prev,
            enCours: false,
            attendreSecondes: data.attendre_secondes ?? 15,
            erreur: "Merci d'attendre avant de retenter.",
          }));
        } else {
          setEtat((prev) => ({
            ...prev,
            enCours: false,
            tentativesRestantes: data?.tentatives_restantes ?? null,
            erreur: "Code incorrect. Vérifie et réessaie.",
          }));
        }

        return { success: false, data };
      } catch (err) {
        console.error("[useConfirmationLivraison] erreur:", err);
        setEtat((prev) => ({
          ...prev,
          enCours: false,
          erreur: err instanceof Error ? err.message : "Erreur lors de la vérification",
        }));
        return { success: false };
      }
    },
    [supabase, commandeId]
  );

  const reinitialiser = useCallback(() => setEtat(ETAT_INITIAL), []);

  return { etat, soumettre, reinitialiser };
}
