import { NextResponse } from 'next/server'

/**
 * GET /api/paiements/mode
 * Expose au client si FedaPay tourne en sandbox ou en live, pour afficher un
 * bandeau "Mode test" (comme le ruban jaune de Stripe) — évite de perdre du
 * temps à chercher un bug de paiement alors que c'est simplement le mode
 * sandbox qui bride le réseau Mobile Money et n'accepte que deux numéros de
 * test (voir lib/fedapay.ts, NUMEROS_TEST_SANDBOX_SUCCES).
 * Volontairement une route à part (plutôt que NEXT_PUBLIC_FEDAPAY_MODE) pour
 * ne pas dupliquer la variable d'env à maintenir en synchro sur Render.
 */
export async function GET() {
  const live = (process.env.FEDAPAY_ENVIRONMENT || 'sandbox') === 'live'
  return NextResponse.json({ live })
}
