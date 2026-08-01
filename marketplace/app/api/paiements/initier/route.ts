import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { initFedaPay, declencherPaiementMobileMoney, extraireMessageErreurFedaPay } from '@/lib/fedapay'

interface GroupeCommande {
  vendeur_id: string
  articles: { article_id: string; quantite: number; variante_id?: string | null }[]
  nom_client: string
  telephone_client: string
  adresse_livraison: string
  commune: string
  latitude: number | null
  longitude: number | null
}

/**
 * Étape "Paiement" du checkout (chantier 5) : NE crée PAS de commande.
 * Enregistre une intention de paiement (`paiements_checkout`), déclenche le
 * prélèvement Mobile Money côté FedaPay, et renvoie l'ID à surveiller.
 * La ou les commandes ne seront créées qu'au webhook `transaction.approved`
 * (voir app/api/paiements/webhook/route.ts et la RPC finaliser_paiement_checkout).
 */
export async function POST(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: 'Configuration Supabase manquante' }, { status: 500 })
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

  let body: {
    groupes: GroupeCommande[]
    montant: number
    reseau: 'mtn' | 'moov' | 'celtiis'
    telephone: string
    nomClient: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { groupes, montant, reseau, telephone, nomClient } = body

  if (!Array.isArray(groupes) || groupes.length === 0) {
    return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
  }
  if (!montant || montant <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }
  if (!reseau || !['mtn', 'moov', 'celtiis'].includes(reseau)) {
    return NextResponse.json({ error: 'Réseau Mobile Money invalide' }, { status: 400 })
  }
  if (!telephone?.trim()) {
    return NextResponse.json({ error: 'Numéro Mobile Money requis' }, { status: 400 })
  }
  for (const g of groupes) {
    if (!g.vendeur_id || !Array.isArray(g.articles) || g.articles.length === 0 || !g.commune?.trim() || !g.adresse_livraison?.trim()) {
      return NextResponse.json({ error: 'Panier ou adresse incomplet' }, { status: 400 })
    }
  }

  // 1. Intention de paiement — RLS garantit client_id = auth.uid()
  const { data: paiementCheckout, error: insertError } = await supabase
    .from('paiements_checkout')
    .insert({
      client_id: user.id,
      montant,
      reseau,
      telephone: telephone.trim(),
      payload: { groupes },
    })
    .select('id')
    .single()

  if (insertError || !paiementCheckout) {
    return NextResponse.json(
      { error: `Impossible d'enregistrer l'intention de paiement : ${insertError?.message}` },
      { status: 500 }
    )
  }

  // 2. Déclenchement FedaPay
  try {
    initFedaPay()
    const description =
      groupes.length > 1
        ? `Commande Ayiba — ${groupes.length} boutiques`
        : 'Commande Ayiba'

    const { transactionId } = await declencherPaiementMobileMoney({
      montant,
      description,
      reseau,
      telephone: telephone.trim(),
      nomClient: nomClient?.trim() || 'Client Ayiba',
      emailClient: user.email || `client-${user.id}@ayiba.app`,
    })

    // 3. On rattache l'ID de transaction à l'intention de paiement (permet au
    // webhook de retrouver la ligne quand il reçoit l'événement FedaPay).
    const { error: rpcError } = await supabase.rpc('attacher_transaction_fedapay', {
      p_paiement_checkout_id: paiementCheckout.id,
      p_transaction_id: transactionId,
    })
    if (rpcError) {
      throw new Error(`Transaction créée mais non rattachée : ${rpcError.message}`)
    }

    return NextResponse.json({
      paiementCheckoutId: paiementCheckout.id,
      transactionId,
    })
  } catch (err) {
    // On log l'objet brut en entier (pas juste err.message, souvent vide côté
    // FedaPay) : c'est ce qu'il faut regarder dans les logs Render pour voir
    // la vraie cause (numéro refusé, méthode indisponible en sandbox, clé API
    // invalide, etc.).
    console.error('[paiements/initier] FedaPay error (brut):', err)
    const messageErreur = extraireMessageErreurFedaPay(err)
    console.error('[paiements/initier] FedaPay error (message extrait):', messageErreur)
    // On marque l'intention comme échouée pour ne pas la laisser traîner
    // "en_attente" indéfiniment si FedaPay a refusé avant même de créer la transaction.
    await supabase.rpc('echouer_initiation_paiement', { p_paiement_checkout_id: paiementCheckout.id })
    return NextResponse.json({ error: messageErreur }, { status: 502 })
  }
}
