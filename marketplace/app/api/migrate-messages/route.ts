import { createServerClient } from "@supabase/ssr";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY; 

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "Config missing" }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, serviceRoleKey, {
      cookies: { getAll: () => [], setAll: () => {} },
    });

    // Chercher les messages "API" qui utilisent conversation_id et message_text
    const { data: messagesToMigrate, error: fetchError } = await supabase
      .from("messages")
      .select("id, conversation_id, sender_id, message_text, created_at")
      .not("conversation_id", "is", null)
      .is("expediteur_id", null);

    if (fetchError) {
      return NextResponse.json({ error: "Erreur lecture", details: fetchError }, { status: 500 });
    }

    if (!messagesToMigrate || messagesToMigrate.length === 0) {
      return NextResponse.json({ message: "Aucun message orphelin de l'API à migrer." }, { status: 200 });
    }

    let messagesUpdated = 0;

    // Pour chaque message, on trouve la conversation pour déduire le destinataire
    for (const msg of messagesToMigrate) {
      if (!msg.conversation_id || !msg.sender_id || !msg.message_text) continue;

      const { data: conv } = await supabase
        .from("conversations")
        .select("client_id, vendeur_id")
        .eq("id", msg.conversation_id)
        .single();

      if (!conv) continue;

      const destinataire_id = msg.sender_id === conv.client_id ? conv.vendeur_id : conv.client_id;

      // On met à jour le message pour utiliser le schéma standard universel
      const { error: updateError } = await supabase
        .from("messages")
        .update({
          expediteur_id: msg.sender_id,
          destinataire_id: destinataire_id,
          contenu: msg.message_text,
          // Optionnel: nettoyer les vieilles colonnes (mais on peut les laisser)
        })
        .eq("id", msg.id);

      if (!updateError) messagesUpdated++;
    }

    return NextResponse.json({
      success: true,
      messagesToMigrate: messagesToMigrate.length,
      messagesUpdated,
    });
  } catch (error: any) {
    return NextResponse.json({ error: "Erreur", details: error.message }, { status: 500 });
  }
}
