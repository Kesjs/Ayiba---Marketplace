import { FedaPay, Transaction } from 'fedapay'

/**
 * Initialise le SDK FedaPay pour la requête en cours. À appeler en tête de
 * chaque route API qui parle à FedaPay — jamais côté client (la clé secrète
 * ne doit jamais quitter le serveur).
 *
 * Variables d'environnement requises (server-only, à ajouter sur Vercel) :
 * - FEDAPAY_SECRET_KEY   : clé API secrète (sandbox ou live)
 * - FEDAPAY_ENVIRONMENT  : 'sandbox' ou 'live' (défaut: 'sandbox' tant que le
 *   compte marchand n'est pas approuvé — voir chantier 9)
 */
export function initFedaPay() {
  const secretKey = process.env.FEDAPAY_SECRET_KEY
  if (!secretKey) {
    throw new Error('FEDAPAY_SECRET_KEY manquante côté serveur')
  }
  FedaPay.setApiKey(secretKey)
  FedaPay.setEnvironment((process.env.FEDAPAY_ENVIRONMENT as 'sandbox' | 'live') || 'sandbox')
}

// Réseau Mobile Money côté Ayiba -> code de méthode de paiement FedaPay
// (Bénin uniquement pour l'instant, cf. chantier 1 : communes couvertes).
// Utilisé uniquement en environnement 'live' — voir resoudreMethodeFedaPay.
export const METHODE_FEDAPAY_PAR_RESEAU: Record<'mtn' | 'moov' | 'celtiis', string> = {
  mtn: 'mtn_open',
  moov: 'moov',
  celtiis: 'sbin',
}

/**
 * FedaPay a supprimé les serveurs de test spécifiques à chaque opérateur en
 * sandbox : impossible d'y simuler mtn_open/moov/sbin. À la place, ils
 * imposent une méthode unique 'momo_test' pour TOUTE transaction de test,
 * peu importe le réseau choisi par le client dans l'UI.
 *
 * Numéros à utiliser pour tester en sandbox (doc FedaPay) :
 * - 64000001 ou 66000001 -> simule un paiement réussi
 * - N'importe quel autre numéro -> simule un paiement refusé
 *
 * En 'live', on garde bien sûr le vrai code opérateur choisi par le client.
 */
function resoudreMethodeFedaPay(reseau: 'mtn' | 'moov' | 'celtiis'): string {
  const environnement = process.env.FEDAPAY_ENVIRONMENT || 'sandbox'
  if (environnement !== 'live') {
    return 'momo_test'
  }
  return METHODE_FEDAPAY_PAR_RESEAU[reseau]
}

interface DeclencherPaiementParams {
  montant: number
  description: string
  reseau: 'mtn' | 'moov' | 'celtiis'
  telephone: string
  nomClient: string
  emailClient: string
}

/**
 * Crée la transaction FedaPay, génère son token, puis déclenche
 * immédiatement le prélèvement Mobile Money (mode "sans redirection" —
 * option A retenue dans la roadmap : le client reste dans l'app Ayiba et
 * valide sur son téléphone).
 *
 * Ne résout PAS le statut final : l'approbation réelle arrive de façon
 * asynchrone via le webhook FedaPay (transaction.approved / declined).
 */
export async function declencherPaiementMobileMoney({
  montant,
  description,
  reseau,
  telephone,
  nomClient,
  emailClient,
}: DeclencherPaiementParams) {
  const [prenom, ...resteNom] = nomClient.trim().split(/\s+/)
  const nomFamille = resteNom.join(' ') || prenom

  const transaction = await Transaction.create({
    description,
    amount: Math.round(montant),
    currency: { iso: 'XOF' },
    customer: {
      firstname: prenom || 'Client',
      lastname: nomFamille || 'Ayiba',
      email: emailClient,
      phone_number: {
        number: telephone.replace(/\s+/g, ''),
        country: 'bj',
      },
    },
  } as any)

  const tokenObject = await (transaction as any).generateToken()
  const methode = resoudreMethodeFedaPay(reseau)
  await (transaction as any).sendNowWithToken(methode, tokenObject.token)

  return { transactionId: String((transaction as any).id) }
}
