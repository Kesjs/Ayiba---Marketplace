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
// À ajouter dans ton fichier existant, à côté de STATUT_STYLE
export const STATUT_SPINE_COLOR: Record<StatutCommande, string> = {
  en_attente: "#D89B3C",
  confirmee: "#2F8F82",
  preparee: "#5B5FC7",
  expediee: "#3B7DD8",
  livree: "#3E9B5C",
  annulee: "#C1443C",
};


// Transitions valides depuis chaque statut — logique métier du workflow commande
export const PROCHAINS_STATUTS: Record<StatutCommande, StatutCommande[]> = {
  [STATUTS_COMMANDE.EN_ATTENTE]: [STATUTS_COMMANDE.CONFIRMEE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.CONFIRMEE]: [STATUTS_COMMANDE.PREPAREE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.PREPAREE]: [STATUTS_COMMANDE.EXPEDIEE, STATUTS_COMMANDE.ANNULEE],
  [STATUTS_COMMANDE.EXPEDIEE]: [STATUTS_COMMANDE.LIVREE],
  [STATUTS_COMMANDE.LIVREE]: [],
  [STATUTS_COMMANDE.ANNULEE]: [],
  [STATUTS_COMMANDE.REMBOURSEE]: [],
};
