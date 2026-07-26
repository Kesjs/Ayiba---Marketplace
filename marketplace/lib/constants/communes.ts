// Communes actuellement couvertes par Ayiba (cf. Politique de livraison).
// Liste volontairement centralisée ici : à étendre au même endroit le jour
// où la couverture s'élargit à d'autres communes.
export const COMMUNES_COUVERTES = ["Cotonou", "Calavi"] as const;

export type CommuneCouverte = (typeof COMMUNES_COUVERTES)[number];
