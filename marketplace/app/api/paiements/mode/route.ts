import { NextResponse } from 'next/server'

/**
 * GET /api/paiements/mode
 * Expose au client si GeniusPay tourne en sandbox ou en live, pour afficher
 * un bandeau "Mode test" (comme le ruban jaune de Stripe) — évite de perdre
 * du temps à chercher un bug de paiement alors que c'est simplement le mode
 * sandbox qui est actif.
 *
 * Contrairement à FedaPay (variable d'env FEDAPAY_ENVIRONMENT séparée),
 * GeniusPay encode le mode directement dans le préfixe de la clé publique
 * (pk_live_... vs pk_sandbox_...) — pas de variable à garder en synchro en
 * plus des clés elles-mêmes.
 */
export async function GET() {
  const apiKey = process.env.GENIUSPAY_API_KEY || ''
  const live = apiKey.startsWith('pk_live_')
  return NextResponse.json({ live })
}
