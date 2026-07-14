// Valeurs canoniques du cycle de vie d'une commande.
// Toute création ou mise à jour de commande doit utiliser ces constantes
// plutôt que des chaînes littérales, pour éviter toute désynchronisation
// entre les différents endroits du code qui lisent/écrivent le statut.

export const STATUTS_COMMANDE = {
  EN_ATTENTE: "en_attente",       // commande passée, vendeur doit confirmer
  CONFIRMEE: "confirmee",          // vendeur a accepté
  PREPAREE: "preparee",            // articles prêts, en attente de retrait/livraison
  EN_LIVRAISON: "en_livraison",     // prise en charge par le livreur
  LIVREE: "livree",                // terminée, livrée au client
  ANNULEE: "annulee",              // annulée (client ou vendeur)
} as const;

export type StatutCommande = typeof STATUTS_COMMANDE[keyof typeof STATUTS_COMMANDE];

// Statuts considérés comme "action requise" côté vendeur — utilisé pour
// les badges de notification (bottom nav, dashboard, etc.)
export const STATUTS_A_TRAITER: StatutCommande[] = [
  STATUTS_COMMANDE.EN_ATTENTE,
];

// Libellés affichés dans l'UI (filtres, badges de statut sur les cartes commande)
export const LABELS_STATUT_COMMANDE: Record<StatutCommande, string> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: "En attente",
  [STATUTS_COMMANDE.CONFIRMEE]: "Confirmée",
  [STATUTS_COMMANDE.PREPAREE]: "Préparée",
  [STATUTS_COMMANDE.EN_LIVRAISON]: "En livraison",
  [STATUTS_COMMANDE.LIVREE]: "Livrée",
  [STATUTS_COMMANDE.ANNULEE]: "Annulée",
};
