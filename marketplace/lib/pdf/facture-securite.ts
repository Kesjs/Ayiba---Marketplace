import crypto from "crypto";

/**
 * Code de sécurité imprimé sur la facture, en plus du QR code : un
 * HMAC-SHA256 tronqué du triplet (numéro, montant, vendeur), signé avec un
 * secret connu seulement du serveur.
 *
 * Contrairement au numéro de facture (structure prévisible : date +
 * suffixe aléatoire), ce code ne peut pas être recalculé par quelqu'un qui
 * ne connaît pas FACTURE_HMAC_SECRET — donc impossible à forger en éditant
 * juste le texte du PDF. Sert de vérification "hors-ligne" (lu à voix
 * haute, comparé à la main) en complément du QR qui pointe vers
 * /verifier/[numero].
 *
 * IMPORTANT : définir FACTURE_HMAC_SECRET dans les variables d'environnement
 * (chaîne aléatoire longue, ex. générée avec `openssl rand -hex 32`).
 * Ne jamais réutiliser une autre clé secrète existante (service role,
 * webhook FedaPay...) pour cet usage.
 */

function secret(): string {
  const s = process.env.FACTURE_HMAC_SECRET;
  if (!s) {
    throw new Error(
      "FACTURE_HMAC_SECRET manquant : définis cette variable d'environnement pour générer le code de sécurité des factures."
    );
  }
  return s;
}

function payload(numero: string, montantTotal: number, vendeurId: string): string {
  return `${numero}|${montantTotal}|${vendeurId}`;
}

/** Génère le code de sécurité, ex. "A3F9-21C8-77DE" (12 caractères hex, 48 bits). */
export function genererCodeSecurite(numero: string, montantTotal: number, vendeurId: string): string {
  const digest = crypto
    .createHmac("sha256", secret())
    .update(payload(numero, montantTotal, vendeurId))
    .digest("hex")
    .toUpperCase();
  return `${digest.slice(0, 4)}-${digest.slice(4, 8)}-${digest.slice(8, 12)}`;
}

/** Revérifie un code fourni (page de vérification, support client...). */
export function verifierCodeSecurite(
  numero: string,
  montantTotal: number,
  vendeurId: string,
  code: string
): boolean {
  return genererCodeSecurite(numero, montantTotal, vendeurId) === code.trim().toUpperCase();
}
