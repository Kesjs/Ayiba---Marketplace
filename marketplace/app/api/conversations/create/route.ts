import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !anonKey) {
      return NextResponse.json({ error: 'Configuration serveur incomplète' }, { status: 500 })
    }

    // Créer le client Supabase depuis les cookies
    const supabase = createServerClient(supabaseUrl, anonKey, {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll: () => {},
      },
    });
    
    // Vérifier l'authentification
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { vendeurId, clientId, initialMessage, productId, productName } = await request.json()

    // Vérifier que l'utilisateur est le client
    if (user.id !== clientId) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    // Vérifier si une conversation existe déjà
    const { data: existingConversation } = await supabase
      .from('conversations')
      .select('id')
      .eq('vendeur_id', vendeurId)
      .eq('client_id', clientId)
      .single()

    let conversationId: string

    if (existingConversation) {
      conversationId = existingConversation.id
    } else {
      // Créer une nouvelle conversation
      const { data: newConversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          vendeur_id: vendeurId,
          client_id: clientId,
          product_id: productId || null,
          product_name: productName || null
        })
        .select('id')
        .single()

      if (createError) {
        console.error('Erreur création conversation:', createError)
        return NextResponse.json(
          { error: 'Erreur lors de la création' },
          { status: 500 }
        )
      }

      conversationId = newConversation.id
    }

    // Créer le message initial
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: clientId,
        sender_type: 'client',
        message_text: initialMessage,
        created_at: new Date().toISOString()
      })

    if (messageError) {
      console.error('Erreur création message:', messageError)
      return NextResponse.json(
        { error: 'Erreur lors de l\'envoi du message' },
        { status: 500 }
      )
    }

    return NextResponse.json({ conversationId }, { status: 201 })
  } catch (error) {
    console.error('Erreur API:', error)
    return NextResponse.json(
      { error: 'Erreur serveur' },
      { status: 500 }
    )
  }
}
