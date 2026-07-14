export const STATUTS_COMMANDE = {
  EN_ATTENTE: "en_attente",
  CONFIRMEE: "confirmee",
  PREPAREE: "preparee",
  EN_LIVRAISON: "en_livraison",
  LIVREE: "livree",
  ANNULEE: "annulee",
} as const;

export type StatutCommande = typeof STATUTS_COMMANDE[keyof typeof STATUTS_COMMANDE];
