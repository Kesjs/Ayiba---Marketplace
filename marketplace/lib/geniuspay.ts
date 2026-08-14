import crypto from "crypto";

/**
 * Variables d'environnement requises (server-only, à ajouter sur Render) :
 * - GENIUSPAY_API_KEY        : clé publique (pk_live_... ou pk_sandbox_...)
 * - GENIUSPAY_API_SECRET     : clé secrète (sk_live_... ou sk_sandbox_...)
 * - GENIUSPAY_WEBHOOK_SECRET : secret du endpoint webhook (whsec_live_...),
 *   distinct des clés API — récupéré dans le dashboard GeniusPay au moment
 *   de la création du webhook, affiché une seule fois.
 *
 * Doc API : https://geniuspay.ci/docs/api
 */

const GENIUSPAY_BASE_URL = "https://geniuspay.ci/api/v1/merchant";

function getCredentials() {
  const apiKey = process.env.GENIUSPAY_API_KEY;
  const apiSecret = process.env.GENIUSPAY_API_SECRET;
  if (!apiKey || !apiSecret) {
    throw new Error("GENIUSPAY_API_KEY / GENIUSPAY_API_SECRET manquantes côté serveur");
  }
  return { apiKey, apiSecret };
}

// Réseau Mobile Money côté Ayiba -> code opérateur PawaPay pour le Bénin.
// GeniusPay ne route le Bénin que sur ces deux opérateurs (voir la table
// "Pays et opérateurs disponibles" de la doc) : pas de Celtiis possible ici,
// contrairement à l'ancien flux FedaPay.
export const MMO_PROVIDER_PAR_RESEAU: Record<"mtn" | "moov", string> = {
  mtn: "MTN_MOMO_BEN",
  moov: "MOOV_BEN",
};

interface DeclencherPaiementParams {
  montant: number;
  description: string;
  reseau: "mtn" | "moov";
  telephone: string;
  nomClient: string;
  emailClient: string;
  /** Données réinjectées telles quelles dans la réponse et le webhook — on y met l'id du paiement_checkout pour le rattacher côté webhook si besoin. */
  metadata?: Record<string, string>;
}

/**
 * Crée la transaction GeniusPay en mode direct (payment_method=pawapay +
 * mmo_provider explicite) : le client ne passe pas par la page de checkout
 * hébergée GeniusPay, il reste dans l'app Ayiba (même choix UX que
 * l'ancienne intégration FedaPay — cf. PaiementWaitingOverlay).
 *
 * Ne résout PAS le statut final : l'approbation réelle arrive de façon
 * asynchrone via le webhook GeniusPay (payment.success / payment.failed).
 */
export async function declencherPaiementMobileMoney({
  montant,
  description,
  reseau,
  telephone,
  nomClient,
  emailClient,
  metadata,
}: DeclencherPaiementParams): Promise<{ reference: string }> {
  const { apiKey, apiSecret } = getCredentials();

  // Le numéro doit être en format international pour le routage PawaPay ;
  // on ne préfixe que s'il ne l'est pas déjà (le champ côté UI ne contient
  // que les 8 chiffres locaux, cf. MobileMoneySelector).
  const chiffres = telephone.replace(/\D/g, "");
  const telephoneInternational = chiffres.startsWith("229") ? `+${chiffres}` : `+229${chiffres}`;

  const res = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(montant),
      currency: "XOF",
      payment_method: "pawapay",
      mmo_provider: MMO_PROVIDER_PAR_RESEAU[reseau],
      description,
      customer: {
        name: nomClient || "Client Ayiba",
        email: emailClient,
        phone: telephoneInternational,
        country: "BJ",
      },
      ...(metadata ? { metadata } : {}),
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(extraireMessageErreurGeniusPay(json, res.status));
  }

  const reference = json?.data?.reference;
  if (!reference) {
    throw new Error("Réponse GeniusPay sans référence de transaction");
  }

  return { reference: String(reference) };
}

interface DeclencherPaiementParCarteParams {
  montant: number;
  description: string;
  nomClient: string;
  emailClient: string;
  successUrl: string;
  errorUrl: string;
  /** Données réinjectées telles quelles dans la réponse et le webhook — on y met l'id du paiement_checkout pour le rattacher côté webhook si besoin. */
  metadata?: Record<string, string>;
}

/**
 * Crée une transaction GeniusPay pour paiement par carte bancaire.
 * Retourne une payment_url vers la page de saisie de carte hébergée GeniusPay.
 * Le client y entre ses coordonnées de carte, puis est redirigé vers success_url
 * ou error_url selon le résultat.
 * 
 * L'approbation réelle est notifiée via webhook (payment.success / payment.failed).
 */
export async function declencherPaiementParCarte({
  montant,
  description,
  nomClient,
  emailClient,
  successUrl,
  errorUrl,
  metadata,
}: DeclencherPaiementParCarteParams): Promise<{ reference: string; paymentUrl: string }> {
  const { apiKey, apiSecret } = getCredentials();

  const res = await fetch(`${GENIUSPAY_BASE_URL}/payments`, {
    method: "POST",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: Math.round(montant),
      currency: "XOF",
      payment_method: "card",
      description,
      customer: {
        name: nomClient || "Client Ayiba",
        email: emailClient,
      },
      success_url: successUrl,
      error_url: errorUrl,
      ...(metadata ? { metadata } : {}),
    }),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.success) {
    throw new Error(extraireMessageErreurGeniusPay(json, res.status));
  }

  const reference = json?.data?.reference;
  const paymentUrl = json?.data?.payment_url;
  if (!reference || !paymentUrl) {
    throw new Error("Réponse GeniusPay sans référence ou payment_url");
  }

  return { reference: String(reference), paymentUrl };
}

/**
 * GeniusPay renvoie toujours { success: false, error: { code, message } }
 * en cas d'erreur — beaucoup plus prévisible que FedaPay (dont .message
 * était parfois vide). On garde quand même un filet générique par sécurité.
 */
export function extraireMessageErreurGeniusPay(json: any, httpStatus?: number): string {
  if (json?.error?.message) return json.error.message;
  if (json?.error?.code) return `Erreur GeniusPay (${json.error.code})`;
  if (httpStatus) return `Échec du déclenchement du paiement (GeniusPay, HTTP ${httpStatus})`;
  return "Échec du déclenchement du paiement (GeniusPay)";
}

/**
 * Récupère l'état actuel d'une transaction par sa référence — sert de filet
 * de reconciliation (voir app/api/paiements/statut/route.ts) : le webhook
 * est un raccourci, jamais la seule source de vérité (même logique que
 * Stripe/PayPal recommandent).
 */
export async function recupererPaiement(reference: string): Promise<{
  status: "pending" | "processing" | "completed" | "failed" | "expired" | "cancelled";
}> {
  const { apiKey, apiSecret } = getCredentials();

  const res = await fetch(`${GENIUSPAY_BASE_URL}/payments/${encodeURIComponent(reference)}`, {
    method: "GET",
    headers: {
      "X-API-Key": apiKey,
      "X-API-Secret": apiSecret,
    },
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.success) {
    throw new Error(extraireMessageErreurGeniusPay(json, res.status));
  }
  return { status: json.data.status };
}

/**
 * Vérifie la signature d'un webhook GeniusPay.
 * Format documenté : HMAC-SHA256(timestamp + "." + payload_json_brut, secret).
 *
 * IMPORTANT : `rawBody` doit être le texte BRUT reçu (avant tout
 * JSON.parse), sinon la signature ne correspondra jamais — un
 * re-sérialisation de l'objet parsé peut réordonner les clés ou changer un
 * espacement et casser la comparaison.
 */
export function verifierSignatureWebhook(rawBody: string, timestamp: string, signature: string): boolean {
  const secret = process.env.GENIUSPAY_WEBHOOK_SECRET;
  if (!secret) {
    throw new Error("GENIUSPAY_WEBHOOK_SECRET manquante côté serveur");
  }
  const donnees = `${timestamp}.${rawBody}`;
  const signatureAttendue = crypto.createHmac("sha256", secret).update(donnees).digest("hex");

  // Comparaison à temps constant — évite une fuite d'information par
  // timing attack sur la vérification de signature.
  const a = Buffer.from(signatureAttendue, "utf8");
  const b = Buffer.from(signature || "", "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** Protection anti-rejeu : GeniusPay recommande une fenêtre de 5 minutes. */
export function timestampWebhookValide(timestamp: string): boolean {
  const t = Number(timestamp);
  if (!Number.isFinite(t)) return false;
  return Math.abs(Date.now() / 1000 - t) <= 300;
}