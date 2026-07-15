export const STATUTS_COMMANDE = {
  EN_ATTENTE: "en_attente",
  CONFIRMEE: "confirmee",
  PREPAREE: "preparee",
  EXPEDIEE: "expediee",
  LIVREE: "livree",
  ANNULEE: "annulee",
  REMBOURSEE: "remboursee",
} as const;

export type StatutCommande = typeof STATUTS_COMMANDE[keyof typeof STATUTS_COMMANDE];

export const STATUTS_A_TRAITER: StatutCommande[] = [STATUTS_COMMANDE.EN_ATTENTE];

export const LABELS_STATUT_COMMANDE: Record<StatutCommande, string> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: "En attente",
  [STATUTS_COMMANDE.CONFIRMEE]: "Confirmée",
  [STATUTS_COMMANDE.PREPAREE]: "Préparée",
  [STATUTS_COMMANDE.EXPEDIEE]: "Expédiée",
  [STATUTS_COMMANDE.LIVREE]: "Livrée",
  [STATUTS_COMMANDE.ANNULEE]: "Annulée",
  [STATUTS_COMMANDE.REMBOURSEE]: "Remboursée",
};

export const STATUT_STYLE: Record<StatutCommande, string> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: "bg-amber-50 text-amber-700 border-amber-100",
  [STATUTS_COMMANDE.CONFIRMEE]: "bg-teal-50 text-teal-700 border-teal-100",
  [STATUTS_COMMANDE.PREPAREE]: "bg-blue-50 text-blue-700 border-blue-100",
  [STATUTS_COMMANDE.EXPEDIEE]: "bg-indigo-50 text-indigo-700 border-indigo-100",
  [STATUTS_COMMANDE.LIVREE]: "bg-green-50 text-green-700 border-green-100",
  [STATUTS_COMMANDE.ANNULEE]: "bg-red-50 text-red-700 border-red-100",
  [STATUTS_COMMANDE.REMBOURSEE]: "bg-gray-100 text-gray-600 border-gray-200",
};

// Couleur du repère visuel ("spine") sur les cartes de commande — dashboard vendeur
export const STATUT_SPINE_COLOR: Record<StatutCommande, string> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: "#D89B3C",
  [STATUTS_COMMANDE.CONFIRMEE]: "#2F8F82",
  [STATUTS_COMMANDE.PREPAREE]: "#5B5FC7",
  [STATUTS_COMMANDE.EXPEDIEE]: "#3B7DD8",
  [STATUTS_COMMANDE.LIVREE]: "#3E9B5C",
  [STATUTS_COMMANDE.ANNULEE]: "#C1443C",
  [STATUTS_COMMANDE.REMBOURSEE]: "#8B5CF6",
};

// Transitions valides depuis chaque statut — logique métier du workflow commande.
// Le remboursement n'est proposé que depuis les statuts où un paiement a pu être
// encaissé (livrée : retour après réception : annulée : paiement déjà pris avant
// l'annulation). À ajuster si ta logique de paiement diffère.
export const PROCHAINS_STATUTS: Record<StatutCommande, StatutCommande[]> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: [STATUTS_COMMANDE.CONFIRMEE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.CONFIRMEE]: [STATUTS_COMMANDE.PREPAREE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.PREPAREE]: [STATUTS_COMMANDE.EXPEDIEE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.EXPEDIEE]: [STATUTS_COMMANDE.LIVREE],
  [STATUTS_COMMANDE.LIVREE]: [STATUTS_COMMANDE.REMBOURSEE],
  [STATUTS_COMMANDE.ANNULEE]: [STATUTS_COMMANDE.REMBOURSEE],
  [STATUTS_COMMANDE.REMBOURSEE]: [],
};
