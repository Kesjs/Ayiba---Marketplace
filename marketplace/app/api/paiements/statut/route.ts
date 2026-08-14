import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { recupererPaiement } from '@/lib/geniuspay'

/**
 * GET /api/paiements/statut?id=<paiementCheckoutId>
 * Filet de sécurité pour l'écran d'attente du checkout, en plus de
 * l'abonnement Realtime : si la connexion websocket a raté l'événement, le
 * front peut interroger cette route toutes les quelques secondes.
 *
 * Deux ajouts au-delà de la simple lecture (cf. discussion checkout bloqué
 * en attente indéfiniment) :
 *  1. Expiration auto : une intention "en_attente" depuis plus de 3 min est
 *     basculée en "echoue" plutôt que de rester bloquée pour toujours.
 *  2. Vérification active : si le webhook GeniusPay n'est jamais arrivé (mal
 *     configuré côté dashboard GeniusPay, par exemple), on interroge
 *     directement l'API GeniusPay avec la référence déjà rattachée — même
 *     pattern de "reconciliation" que Stripe/PayPal recommandent (le webhook
 *     est un raccourci, jamais la seule source de vérité).
 */
export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'id requis' }, { status: 400 })
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  })

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
  }

  const selectCols = 'statut, commande_ids, raison_echec, reseau, telephone, montant, transaction_reference'

  let { data, error } = await supabase.from('paiements_checkout').select(selectCols).eq('id', id).single()

  if (error || !data) {
    return NextResponse.json({ error: "Intention de paiement introuvable" }, { status: 404 })
  }

  // 1. Expiration — RPC security definer, restreinte à auth.uid() en interne.
  if (data.statut === 'en_attente') {
    const { data: expireResult } = await supabase.rpc('expirer_paiement_checkout', {
      p_paiement_checkout_id: id,
    })
    if (expireResult?.expire) {
      const refetch = await supabase.from('paiements_checkout').select(selectCols).eq('id', id).single()
      if (refetch.data) data = refetch.data
    }
  }

  // 2. Reconciliation active auprès de GeniusPay, uniquement si toujours en
  // attente ET qu'une transaction a bien été créée (sinon rien à
  // interroger). Nécessite la clé service_role pour pouvoir appeler
  // finaliser_paiement_checkout / echouer_paiement_checkout (réservées au
  // serveur).
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (data.statut === 'en_attente' && data.transaction_reference && serviceRoleKey) {
    try {
      const transaction = await recupererPaiement(data.transaction_reference)
      const admin = createServiceClient(supabaseUrl, serviceRoleKey)

      if (transaction.status === 'completed') {
        await admin.rpc('finaliser_paiement_checkout', { p_transaction_id: String(data.transaction_reference) })
        const refetch = await supabase.from('paiements_checkout').select(selectCols).eq('id', id).single()
        if (refetch.data) data = refetch.data
      } else if (transaction.status === 'failed' || transaction.status === 'cancelled' || transaction.status === 'expired') {
        await admin.rpc('echouer_paiement_checkout', {
          p_transaction_id: String(data.transaction_reference),
          p_raison: `payment.${transaction.status}`,
        })
        const refetch = await supabase.from('paiements_checkout').select(selectCols).eq('id', id).single()
        if (refetch.data) data = refetch.data
      }
      // sinon (pending/processing) : rien à faire, on continue d'attendre le
      // webhook ou le prochain polling.
    } catch (err) {
      // Silencieux — c'est un filet de sécurité en plus du webhook, pas la
      // voie principale. On ne casse pas l'écran d'attente pour ça.
      console.error('[paiements/statut] Vérification active GeniusPay échouée:', err)
    }
  }

  return NextResponse.json(data)
}
