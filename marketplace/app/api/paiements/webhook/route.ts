import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { Webhook } from 'fedapay'

/**
 * Point d'entrée FedaPay (à configurer dans le tableau de bord FedaPay :
 * Webhooks > Nouveau webhook > https://TON_DOMAINE/api/paiements/webhook).
 *
 * Sécurité : la signature `X-FEDAPAY-SIGNATURE` est vérifiée avec la clé
 * secrète du endpoint (FEDAPAY_WEBHOOK_SECRET, différente de la clé API —
 * elle se trouve dans les paramètres du webhook, pas dans les clés API).
 * Sans ça, n'importe qui pourrait appeler cette URL et se faire créditer une
 * commande sans avoir payé.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const endpointSecret = process.env.FEDAPAY_WEBHOOK_SECRET

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[paiements/webhook] Configuration Supabase (service role) manquante')
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }
  if (!endpointSecret) {
    console.error('[paiements/webhook] FEDAPAY_WEBHOOK_SECRET manquante')
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-fedapay-signature') || ''

  let event: any
  try {
    event = Webhook.constructEvent(rawBody, signature, endpointSecret)
  } catch (err) {
    console.error('[paiements/webhook] Signature invalide:', err)
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 })
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey)
  const transactionId = event?.data?.object?.id ?? event?.data?.id
  if (!transactionId) {
    console.error('[paiements/webhook] Événement sans ID de transaction:', event?.name)
    return NextResponse.json({ received: true })
  }

  switch (event.name) {
    case 'transaction.approved': {
      const { data, error } = await admin.rpc('finaliser_paiement_checkout', {
        p_transaction_id: String(transactionId),
      })
      if (error) {
        console.error('[paiements/webhook] finaliser_paiement_checkout error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (data?.success === false) {
        // Argent déjà prélevé côté FedaPay mais création de commande en échec
        // (bug applicatif, stock épuisé entre-temps, etc.) — à surveiller
        // manuellement (Sentry, cf. chantier 9) plutôt que de faire échouer
        // silencieusement le webhook.
        console.error('[paiements/webhook] Paiement approuvé mais commande non créée:', data)
      }
      break
    }
    case 'transaction.declined':
    case 'transaction.canceled': {
      // On log l'event complet (pas juste le nom) : si FedaPay inclut un jour
      // un champ de détail (ex. solde insuffisant, PIN incorrect), c'est ici
      // qu'on le verra pour affiner le message affiché au client.
      console.info('[paiements/webhook] Transaction refusée/annulée — event brut:', JSON.stringify(event))
      const { error } = await admin.rpc('echouer_paiement_checkout', {
        p_transaction_id: String(transactionId),
        p_raison: event.name,
      })
      if (error) {
        console.error('[paiements/webhook] echouer_paiement_checkout error:', error)
      }
      break
    }
    default:
      // transaction.created, transaction.transferred, etc. — rien à faire ici.
      break
  }

  return NextResponse.json({ received: true })
}
