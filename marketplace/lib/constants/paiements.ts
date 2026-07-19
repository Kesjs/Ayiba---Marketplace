// Statuts partagés par les tables paiements ET retraits (même vocabulaire côté vendeur/livreur).
// Source unique — ne pas redéfinir de mapping couleur en local (cf. lib/constants/commandes.ts
// pour le même principe côté commandes).
export const STATUTS_PAIEMENT = {
  EN_ATTENTE: "en_attente",
  PAYE: "paye",
  VALIDE: "valide",
  ECHOUE: "echoue",
  REFUSE: "refuse",
  REMBOURSE: "rembourse",
} as const;

export type StatutPaiement = typeof STATUTS_PAIEMENT[keyof typeof STATUTS_PAIEMENT];

export const LABELS_STATUT_PAIEMENT: Record<StatutPaiement, string> = {
  [STATUTS_PAIEMENT.EN_ATTENTE]: "En attente",
  [STATUTS_PAIEMENT.PAYE]: "Payé",
  [STATUTS_PAIEMENT.VALIDE]: "Validé",
  [STATUTS_PAIEMENT.ECHOUE]: "Échoué",
  [STATUTS_PAIEMENT.REFUSE]: "Refusé",
  [STATUTS_PAIEMENT.REMBOURSE]: "Remboursé",
};

// Correspondance vers le variant du composant partagé <StatusBadge>.
export const STATUT_PAIEMENT_BADGE_VARIANT: Record<StatutPaiement, "success" | "pending" | "error" | "neutral" | "info"> = {
  [STATUTS_PAIEMENT.EN_ATTENTE]: "pending",
  [STATUTS_PAIEMENT.PAYE]: "success",
  [STATUTS_PAIEMENT.VALIDE]: "info",
  [STATUTS_PAIEMENT.ECHOUE]: "error",
  [STATUTS_PAIEMENT.REFUSE]: "error",
  [STATUTS_PAIEMENT.REMBOURSE]: "neutral",
};

// Bandeau "statut de livraison" affiché sur une ligne de paiement vendeur —
// regroupe volontairement tous les statuts intermédiaires de la commande sous
// "En cours de livraison" (logique métier existante, pas un simple mapping couleur).
export function getLivraisonBadge(commandeStatut?: string): { label: string; variant: "success" | "pending" | "neutral" } {
  if (commandeStatut === "livree") {
    return { label: "Livrée · disponible", variant: "success" };
  }
  if (commandeStatut === "annulee" || commandeStatut === "remboursee") {
    return { label: "Annulée", variant: "neutral" };
  }
  return { label: "En cours de livraison", variant: "pending" };
}
