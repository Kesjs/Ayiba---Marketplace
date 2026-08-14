// lib/articles/moderation.ts

const MOTS_INTERDITS = ["arme", "drogue", "contrefacon", "contrefaçon"]; // à enrichir au besoin

interface ModerationInput {
  nom: string;
  description: string;
  prix: number;
  vendeurStatut: string | null;
  articlesRecents: number; // nb d'articles créés par ce vendeur dans les 10 dernières minutes
}

interface ModerationResult {
  statut: "publie" | "en_attente";
  raison?: string;
}

export function determinerStatutInitial({
  nom,
  description,
  prix,
  vendeurStatut,
  articlesRecents,
}: ModerationInput): ModerationResult {
  const texte = `${nom} ${description}`.toLowerCase();

  // 1. Mots interdits dans le nom ou la description
  if (MOTS_INTERDITS.some((mot) => texte.includes(mot))) {
    return { statut: "en_attente", raison: "Contenu à vérifier" };
  }

  // 2. Prix hors bornes raisonnables
  if (prix <= 0 || prix > 5_000_000) {
    return { statut: "en_attente", raison: "Prix hors norme à vérifier" };
  }

  // 3. Anti-spam : trop de publications rapprochées
  if (articlesRecents >= 10) {
    return { statut: "en_attente", raison: "Trop de publications rapprochées" };
  }

  // 4. Vendeur non encore vérifié (KYC)
  if (vendeurStatut !== "valide") {
    return { statut: "en_attente", raison: "Vendeur non encore vérifié" };
  }

  // Toutes les conditions sont réunies : publication directe
  return { statut: "publie" };
}
