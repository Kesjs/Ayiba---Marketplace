// app/api/ai/enrichir/route.ts
import { NextRequest, NextResponse } from "next/server";

function generateFallback(nom: string, categoriesStr: string): any {
  const nomTrim = nom.trim();
  
  // Catégorie basique (on prend la première si possible)
  let catId = null;
  try {
    const cats = JSON.parse(categoriesStr);
    if (cats && cats.length > 0) {
      catId = cats[0].id; // Fallback idiot: on prend la 1ere
    }
  } catch(e) {}

  return {
    description: `${nomTrim} disponible en stock dans notre boutique. Article neuf avec livraison rapide et sécurisée.`,
    categorie_id: catId,
    tags: [nomTrim.split(" ")[0].toLowerCase()]
  };
}

export async function POST(req: NextRequest) {
  try {
    const { nom, categories } = await req.json();

    if (!nom || typeof nom !== "string") {
      return NextResponse.json({ error: "Le nom de l'article est requis." }, { status: 400 });
    }

    const groqKey = process.env.GROQ_API_KEY;
    const categoriesStr = JSON.stringify(categories || []);

    if (groqKey) {
      try {
        const prompt = `Tu es un assistant e-commerce africain. Ta mission est d'analyser cet article et de retourner un objet JSON strict.
Article : "${nom}"

Liste des catégories valides :
${categoriesStr}

Règles absolues :
1. "description" : Rédige une description commerciale courte (2 phrases). Ne mentionne JAMAIS de prix. Aucun emoji. Ton professionnel.
2. "categorie_id" : Trouve l'ID de la catégorie la plus adaptée depuis la liste fournie.
3. "tags" : Liste de 4 à 6 mots-clés pertinents pour le SEO et la recherche (en minuscules).
4. Ne renvoie QUE le JSON, aucun texte avant ou après.

Format attendu :
{
  "description": "...",
  "categorie_id": "id-de-la-categorie",
  "tags": ["mot1", "mot2", "mot3"]
}`;

        const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${groqKey}`,
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [{ role: "user", content: prompt }],
            max_tokens: 300,
            temperature: 0.1,
            response_format: { type: "json_object" }
          }),
        });

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          let content = groqData.choices?.[0]?.message?.content?.trim() ?? "";
          content = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

          const result = JSON.parse(content);
          return NextResponse.json({ ...result, source: "groq" });
        }
      } catch (groqError) {
        console.warn("[AI Enrichir] Erreur Groq, fallback interne.");
      }
    }

    // Fallback
    const fallback = generateFallback(nom, categoriesStr);
    return NextResponse.json({ ...fallback, source: "interne" });
  } catch (err) {
    console.error("[AI Enrichir] Erreur inattendue:", err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
