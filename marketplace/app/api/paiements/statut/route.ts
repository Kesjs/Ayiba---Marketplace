import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

/**
 * GET /api/paiements/statut?id=<paiementCheckoutId>
 * Filet de sécurité pour l'écran d'attente du checkout, en plus de
 * l'abonnement Realtime : si la connexion websocket a raté l'événement, le
 * front peut interroger cette route toutes les quelques secondes.
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

  const { data, error } = await supabase
    .from('paiements_checkout')
    .select('statut, commande_ids, raison_echec')
    .eq('id', id)
    .single()

  if (error || !data) {
    return NextResponse.json({ error: "Intention de paiement introuvable" }, { status: 404 })
  }

  return NextResponse.json(data)
}
