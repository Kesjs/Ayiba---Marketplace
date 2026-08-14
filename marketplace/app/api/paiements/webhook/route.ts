import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServiceClient } from '@supabase/supabase-js'
import { verifierSignatureWebhook, timestampWebhookValide } from '@/lib/geniuspay'

/**
 * Point d'entrée GeniusPay (configuré dans le dashboard GeniusPay :
 * Webhooks > Créer un webhook > https://TON_DOMAINE/api/paiements/webhook,
 * événements payment.success / payment.failed / payment.cancelled /
 * payment.expired).
 *
 * Sécurité : la signature `X-Webhook-Signature` est vérifiée avec le secret
 * du endpoint (GENIUSPAY_WEBHOOK_SECRET, distinct des clés API — affiché une
 * seule fois à la création du webhook dans le dashboard). Sans ça, n'importe
 * qui pourrait appeler cette URL et se faire créditer une commande sans
 * avoir payé.
 *
 * Le body est lu en texte BRUT (req.text(), pas req.json()) avant toute
 * vérification : la signature HMAC porte sur les octets exacts envoyés par
 * GeniusPay, un JSON.parse puis re-stringify pourrait légèrement différer
 * (ordre des clés, espaces) et faire échouer la vérification à tort.
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('[paiements/webhook] Configuration Supabase (service role) manquante')
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }

  const rawBody = await req.text()
  const signature = req.headers.get('x-webhook-signature') || ''
  const timestamp = req.headers.get('x-webhook-timestamp') || ''
  const eventType = req.headers.get('x-webhook-event') || ''

  if (!timestamp || !timestampWebhookValide(timestamp)) {
    console.error('[paiements/webhook] Timestamp manquant ou hors fenêtre (anti-rejeu)')
    return NextResponse.json({ error: 'Timestamp invalide ou expiré' }, { status: 400 })
  }

  let signatureValide: boolean
  try {
    signatureValide = verifierSignatureWebhook(rawBody, timestamp, signature)
  } catch (err) {
    console.error('[paiements/webhook] Erreur de vérification de signature:', err)
    return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
  }
  if (!signatureValide) {
    console.error('[paiements/webhook] Signature invalide')
    return NextResponse.json({ error: 'Signature invalide' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    console.error('[paiements/webhook] Payload JSON invalide')
    return NextResponse.json({ error: 'Payload invalide' }, { status: 400 })
  }

  const admin = createServiceClient(supabaseUrl, serviceRoleKey)
  const reference = event?.data?.reference
  const nomEvenement = eventType || event?.event

  if (!reference) {
    console.error('[paiements/webhook] Événement sans référence de transaction:', nomEvenement)
    return NextResponse.json({ received: true })
  }

  switch (nomEvenement) {
    case 'payment.success': {
      const { data, error } = await admin.rpc('finaliser_paiement_checkout', {
        p_transaction_id: String(reference),
      })
      if (error) {
        console.error('[paiements/webhook] finaliser_paiement_checkout error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (data?.success === false) {
        // Argent déjà prélevé côté GeniusPay mais création de commande en
        // échec (bug applicatif, stock épuisé entre-temps, etc.) — à
        // surveiller manuellement plutôt que de faire échouer silencieusement
        // le webhook.
        console.error('[paiements/webhook] Paiement approuvé mais commande non créée:', data)
      }
      break
    }
    case 'payment.failed':
    case 'payment.cancelled':
    case 'payment.expired': {
      // On log l'event complet : si GeniusPay inclut un jour un champ de
      // détail (solde insuffisant, PIN incorrect...), c'est ici qu'on le
      // verra pour affiner le message affiché au client.
      console.info('[paiements/webhook] Transaction refusée/annulée/expirée — event brut:', rawBody)
      const { error } = await admin.rpc('echouer_paiement_checkout', {
        p_transaction_id: String(reference),
        p_raison: nomEvenement,
      })
      if (error) {
        console.error('[paiements/webhook] echouer_paiement_checkout error:', error)
      }
      break
    }
    default:
      // payment.initiated, payment.refunded, cashout.*, webhook.test, etc.
      // — rien à faire ici.
      break
  }

  return NextResponse.json({ received: true })
}
