import { createClient } from "@/lib/supabase/client";

export async function reportArticle(articleId: string, clientId: string | null, motif: string, details: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("article_signalements")
    .insert({
      article_id: articleId,
      client_id: clientId,
      motif,
      details,
    });

  if (error) throw error;
}
