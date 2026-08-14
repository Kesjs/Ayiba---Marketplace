import { FedaPay, Transaction } from 'fedapay'

/**
 * Initialise le SDK FedaPay pour la requête en cours. À appeler en tête de
 * chaque route API qui parle à FedaPay — jamais côté client (la clé secrète
 * ne doit jamais quitter le serveur).
 *
 * Variables d'environnement requises (server-only, à ajouter sur Render) :
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

/**
 * Le SDK FedaPay lève parfois des erreurs dont `.message` est vide — le
 * détail utile (numéro invalide, méthode non disponible en sandbox,
 * identifiants marchand incorrects...) se trouve alors dans `.errors` ou
 * `.response.data`. On essaie plusieurs emplacements avant de retomber sur
 * un message générique, pour ne plus jamais afficher un texte vide au client.
 */
export function extraireMessageErreurFedaPay(err: unknown): string {
  if (err instanceof Error && err.message) return err.message
  if (err && typeof err === 'object') {
    const e = err as Record<string, any>
    if (e.errors) {
      try {
        return typeof e.errors === 'string' ? e.errors : JSON.stringify(e.errors)
      } catch {}
    }
    if (e.response?.data) {
      try {
        return typeof e.response.data === 'string' ? e.response.data : JSON.stringify(e.response.data)
      } catch {}
    }
    if (typeof e.message === 'string' && e.message) return e.message
  }
  try {
    return JSON.stringify(err)
  } catch {
    return 'Échec du déclenchement du paiement (FedaPay)'
  }
}

// Réseau Mobile Money côté Ayiba -> code de méthode de paiement FedaPay
// (Bénin uniquement pour l'instant, cf. chantier 1 : communes couvertes).
// N'est utilisé qu'en environnement LIVE : en sandbox, FedaPay a supprimé
// les serveurs de test par opérateur au profit d'une méthode unique
// "momo_test" (voir declencherPaiementMobileMoney ci-dessous).
export const METHODE_FEDAPAY_PAR_RESEAU: Record<'mtn' | 'moov' | 'celtiis', string> = {
  mtn: 'mtn_open',
  moov: 'moov',
  celtiis: 'sbin',
}

// Méthode unique à utiliser en sandbox depuis que FedaPay a retiré les
// serveurs de test par opérateur (mtn_open/moov/sbin ne fonctionnent plus
// en mode test, d'où les échecs silencieux avant ce correctif).
const METHODE_TEST_SANDBOX = 'momo_test'

// En sandbox + méthode momo_test, FedaPay n'accepte que ces deux numéros
// pour simuler un paiement APPROUVÉ ; n'importe quel autre numéro simule un
// échec, quel que soit le réseau réellement sélectionné dans l'UI.
export const NUMEROS_TEST_SANDBOX_SUCCES = ['64000001', '66000001']

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
  const enSandbox = (process.env.FEDAPAY_ENVIRONMENT || 'sandbox') !== 'live'
  const methode = enSandbox ? METHODE_TEST_SANDBOX : METHODE_FEDAPAY_PAR_RESEAU[reseau]
  if (enSandbox && !NUMEROS_TEST_SANDBOX_SUCCES.includes(telephone.replace(/\D/g, '').slice(-8))) {
    // Pas bloquant : FedaPay renverra un échec simulé, mais autant prévenir
    // clairement dans les logs plutôt que de laisser deviner pourquoi.
    console.info(
      `[fedapay] Sandbox actif avec le numéro ${telephone} — seuls ${NUMEROS_TEST_SANDBOX_SUCCES.join(' et ')} simulent un paiement approuvé, tout autre numéro échoue volontairement côté FedaPay.`
    )
  }
  await (transaction as any).sendNowWithToken(methode, tokenObject.token)

  return { transactionId: String((transaction as any).id) }
}
