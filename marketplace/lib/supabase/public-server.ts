import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase serveur SANS cookies — pour les lectures publiques que
 * l'on veut mettre en cache (unstable_cache / revalidate) sans que la
 * réponse dépende de la session de l'utilisateur qui déclenche le calcul.
 * Ne jamais utiliser pour des données propres à un utilisateur connecté :
 * pour ça, `lib/supabase/server.ts` (cookies-based) reste la bonne référence.
 */
export function createPublicServerClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not set (public-server client)");
    return null as any;
  }

  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
