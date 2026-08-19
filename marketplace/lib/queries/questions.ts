import { createClient } from "@/lib/supabase/client";

export interface ArticleQuestion {
  id: string;
  article_id: string;
  client_id: string;
  question: string;
  reponse: string | null;
  repondu_le: string | null;
  created_at: string;
  client: { full_name: string; avatar_url: string | null } | null;
}

export async function getArticleQuestions(articleId: string): Promise<ArticleQuestion[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("article_questions")
    .select(`
      id, article_id, client_id, question, reponse, repondu_le, created_at,
      client:users!article_questions_client_id_fkey(full_name, avatar_url)
    `)
    .eq("article_id", articleId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data || []).map((q: any) => ({
    ...q,
    client: q.client ? {
      full_name: q.client.full_name || 'Client',
      avatar_url: q.client.avatar_url,
    } : null,
  }));
}

export async function askQuestion(articleId: string, clientId: string, question: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("article_questions")
    .insert({ article_id: articleId, client_id: clientId, question });

  if (error) throw error;
}

export async function answerQuestion(questionId: string, reponse: string) {
  const supabase = createClient();
  const { error } = await supabase
    .from("article_questions")
    .update({ reponse, repondu_le: new Date().toISOString() })
    .eq("id", questionId);

  if (error) throw error;
}
