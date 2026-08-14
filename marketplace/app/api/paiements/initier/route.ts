import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { declencherPaiementMobileMoney, declencherPaiementParCarte, extraireMessageErreurGeniusPay } from '@/lib/geniuspay'

interface GroupeCommande {
  vendeur_id: string
  articles: { article_id: string; quantite: number; variante_id?: string | null }[]
  nom_client: string
  telephone_client: string
  adresse_livraison: string
  commune: string
  repere_livraison?: string | null
  latitude: number | null
  longitude: number | null
}

/**
 * Étape "Paiement" du checkout : NE crée PAS de commande.
 * Enregistre une intention de paiement (`paiements_checkout`), déclenche le
 * prélèvement côté GeniusPay selon le moyen de paiement :
 * - MTN/Moov (Mobile Money) : mode direct, client reste dans l'app Ayiba
 * - Carte : redirection vers page de saisie hébergée par GeniusPay
 * La ou les commandes ne seront créées qu'au webhook `payment.success`
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
    methodePaiement?: 'moto' | 'carte' // défaut: 'moto'
    reseau?: 'mtn' | 'moov'
    telephone?: string
    nomClient: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Corps de requête invalide' }, { status: 400 })
  }

  const { groupes, montant, methodePaiement = 'moto', reseau, telephone, nomClient } = body

  if (!Array.isArray(groupes) || groupes.length === 0) {
    return NextResponse.json({ error: 'Panier vide' }, { status: 400 })
  }
  if (!montant || montant <= 0) {
    return NextResponse.json({ error: 'Montant invalide' }, { status: 400 })
  }
  if (!methodePaiement || !['moto', 'carte'].includes(methodePaiement)) {
    return NextResponse.json({ error: 'Méthode de paiement invalide' }, { status: 400 })
  }
  for (const g of groupes) {
    if (!g.vendeur_id || !Array.isArray(g.articles) || g.articles.length === 0 || !g.commune?.trim() || !g.adresse_livraison?.trim()) {
      return NextResponse.json({ error: 'Panier ou adresse incomplet' }, { status: 400 })
    }
  }

  // Validations spécifiques au moyen de paiement
  if (methodePaiement === 'moto') {
    if (!reseau || !['mtn', 'moov'].includes(reseau)) {
      return NextResponse.json({ error: 'Réseau Mobile Money invalide' }, { status: 400 })
    }
    if (!telephone?.trim()) {
      return NextResponse.json({ error: 'Numéro Mobile Money requis' }, { status: 400 })
    }
  }

  // Un vendeur ne peut pas s'acheter lui-même — vérifié ici, avant tout
  // prélèvement, pour ne jamais faire payer quelqu'un pour une
  // commande qui échouerait de toute façon à la création (contrainte DB
  // commandes_client_different_vendeur sur la table `commandes`).
  if (groupes.some((g) => g.vendeur_id === user.id)) {
    return NextResponse.json(
      { error: "Vous ne pouvez pas acheter vos propres articles." },
      { status: 400 }
    )
  }

  // 1. Intention de paiement — RLS garantit client_id = auth.uid()
  const { data: paiementCheckout, error: insertError } = await supabase
    .from('paiements_checkout')
    .insert({
      client_id: user.id,
      montant,
      reseau: methodePaiement === 'moto' ? reseau : null,
      telephone: methodePaiement === 'moto' ? telephone?.trim() : null,
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

  // 2. Déclenchement GeniusPay
  try {
    const description =
      groupes.length > 1
        ? `Commande Ayiba — ${groupes.length} boutiques`
        : 'Commande Ayiba'

    if (methodePaiement === 'moto') {
      // Mobile Money : mode direct, reste dans l'app
      const { reference } = await declencherPaiementMobileMoney({
        montant,
        description,
        reseau: reseau as 'mtn' | 'moov',
        telephone: telephone!.trim(),
        nomClient: nomClient?.trim() || 'Client Ayiba',
        emailClient: user.email || `client-${user.id}@ayiba.app`,
        metadata: { paiement_checkout_id: paiementCheckout.id, user_id: user.id },
      })

      // 3. On rattache la référence GeniusPay à l'intention de paiement
      const { error: rpcError } = await supabase.rpc('attacher_reference_paiement', {
        p_paiement_checkout_id: paiementCheckout.id,
        p_reference: reference,
      })
      if (rpcError) {
        throw new Error(`Transaction créée mais non rattachée : ${rpcError.message}`)
      }

      return NextResponse.json({
        paiementCheckoutId: paiementCheckout.id,
        transactionId: reference,
      })
    } else {
      // Carte : redirection vers page de saisie GeniusPay
      const { reference, paymentUrl } = await declencherPaiementParCarte({
        montant,
        description,
        nomClient: nomClient?.trim() || 'Client Ayiba',
        emailClient: user.email || `client-${user.id}@ayiba.app`,
        successUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?success=true&paiement=${paiementCheckout.id}`,
        errorUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/checkout?error=true&paiement=${paiementCheckout.id}`,
        metadata: { paiement_checkout_id: paiementCheckout.id, user_id: user.id },
      })

      // 3. On rattache la référence GeniusPay à l'intention de paiement
      const { error: rpcError } = await supabase.rpc('attacher_reference_paiement', {
        p_paiement_checkout_id: paiementCheckout.id,
        p_reference: reference,
      })
      if (rpcError) {
        throw new Error(`Transaction créée mais non rattachée : ${rpcError.message}`)
      }

      return NextResponse.json({
        paiementCheckoutId: paiementCheckout.id,
        transactionId: reference,
        paymentUrl,
      })
    }
  } catch (err) {
    // On log l'objet brut en entier : c'est ce qu'il faut regarder dans les
    // logs Render pour voir la vraie cause (numéro refusé, clé API
    // invalide, opérateur indisponible, etc.).
    console.error('[paiements/initier] GeniusPay error (brut):', err)
    const messageErreur = err instanceof Error ? err.message : extraireMessageErreurGeniusPay(err)
    console.error('[paiements/initier] GeniusPay error (message extrait):', messageErreur)
    // On marque l'intention comme échouée pour ne pas la laisser traîner
    // "en_attente" indéfiniment si GeniusPay a refusé avant même de créer la transaction.
    await supabase.rpc('echouer_initiation_paiement', { p_paiement_checkout_id: paiementCheckout.id })
    return NextResponse.json({ error: messageErreur }, { status: 502 })
  }
}
