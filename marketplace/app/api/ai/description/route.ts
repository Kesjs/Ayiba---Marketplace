// app/api/ai/description/route.ts
// Génère une description produit sobre et professionnelle via Groq (Llama 3)
// avec fallback automatique sur le générateur interne si l'API n'est pas disponible.
// RÈGLE STRICTE : 0 emoji, ton direct et commercial, 2-3 phrases maximum.

import { NextRequest, NextResponse } from "next/server";

// ─── Générateur de description interne (0 dépendance externe, illimité) ────────
function generateDescriptionInterne(
  nom: string,
  prix: number,
  categorie: string
): string {
  const cat = categorie.trim().toLowerCase();
  const nomTrim = nom.trim();

  // Phrases d'accroche selon la catégorie
  const accrochesParCategorie: Record<string, string> = {
    mode: `${nomTrim} proposé dans un style soigné et contemporain.`,
    chaussure: `${nomTrim} alliant confort et durabilité pour un usage quotidien.`,
    electronique: `${nomTrim} offrant des performances fiables et une prise en main intuitive.`,
    informatique: `${nomTrim} conçu pour répondre aux exigences professionnelles et personnelles.`,
    beaute: `${nomTrim} formulé pour prendre soin de votre peau avec douceur et efficacité.`,
    maison: `${nomTrim} pour embellir et optimiser votre intérieur avec simplicité.`,
    alimentation: `${nomTrim} sélectionné pour sa qualité et sa fraîcheur garantie.`,
    sport: `${nomTrim} conçu pour accompagner vos séances d'entraînement avec performance.`,
    enfant: `${nomTrim} adapté aux besoins des enfants avec des matériaux sûrs et durables.`,
    bijou: `${nomTrim} réalisé avec soin pour sublimer votre style au quotidien.`,
  };

  // Cherche la catégorie correspondante
  let accroche = `${nomTrim} disponible en stock dans notre boutique.`;
  for (const [key, phrase] of Object.entries(accrochesParCategorie)) {
    if (cat.includes(key)) {
      accroche = phrase;
      break;
    }
  }

  const finales = [
    "Article neuf, disponible immédiatement avec livraison rapide et sécurisée.",
    "Produit authentique disponible en stock. Livraison assurée à domicile.",
    "Disponible dès maintenant. Commandez en toute confiance sur Ayiba.",
  ];

  const finale = finales[Math.floor(Math.random() * finales.length)];
  return `${accroche} ${finale}`;
}

// ─── Endpoint principal ────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const { nom, prix, categorie } = await req.json();

    if (!nom || typeof nom !== "string") {
      return NextResponse.json(
        { error: "Le nom de l'article est requis." },
        { status: 400 }
      );
    }

    const prixNum = typeof prix === "number" ? prix : 0;
    const categorieStr = typeof categorie === "string" ? categorie : "";

    const groqKey = process.env.GROQ_API_KEY;

    // ─── Essai avec Groq (Llama 3.3 70B) si clé disponible ──────────────────
    if (groqKey) {
      try {
        const prompt = `Tu es un assistant spécialisé en e-commerce africain. Rédige une description commerciale courte (2 à 3 phrases maximum) pour cet article :

- Nom : ${nom}
- Catégorie : ${categorieStr || "non spécifiée"}

Règles absolues à respecter :
- Ne mentionne JAMAIS le prix de l'article dans la description (il est déjà affiché ailleurs).
- Aucun emoji, aucun symbole spécial.
- Ton sobre, direct et professionnel.
- Pas de formules excessives ni de superlatifs vides.
- 2 à 3 phrases seulement.
- Finir par une phrase mentionnant la disponibilité ou la livraison.

Réponds uniquement avec la description, sans titre ni explication.`;

        const groqResponse = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${groqKey}`,
            },
            body: JSON.stringify({
              model: "openai/gpt-oss-120b",
              messages: [{ role: "user", content: prompt }],
              max_tokens: 150,
              temperature: 0.5,
            }),
          }
        );

        if (groqResponse.ok) {
          const groqData = await groqResponse.json();
          let description =
            groqData.choices?.[0]?.message?.content?.trim() ?? "";

          // Nettoyer les balises <think>...</think> si présentes (certains modèles raisonnent à voix haute)
          description = description.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();

          if (description.length > 20) {
            return NextResponse.json({
              description,
              source: "groq",
            });
          }
        }
      } catch (groqError) {
        // Groq non disponible → on passe au fallback silencieusement
        console.warn("[AI Description] Groq indisponible, bascule sur le générateur interne.");
      }
    }

    // ─── Fallback : générateur interne (toujours disponible, illimité) ────────
    const description = generateDescriptionInterne(nom, prixNum, categorieStr);
    return NextResponse.json({ description, source: "interne" });
  } catch (err) {
    console.error("[AI Description] Erreur inattendue:", err);
    return NextResponse.json(
      { error: "Erreur lors de la génération de la description." },
      { status: 500 }
    );
  }
}
