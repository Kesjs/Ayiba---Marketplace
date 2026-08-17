import { NextResponse } from "next/server";
import { getBentoData } from "@/lib/queries/bento";

/**
 * Expose les données bento calculées côté serveur (voir lib/queries/bento.ts).
 * Le calcul lui-même est caché 1h via unstable_cache — cette route ne fait
 * que le relayer, donc rester légère est volontaire.
 */
export async function GET() {
  try {
    const data = await getBentoData();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erreur /api/bento:", error);
    return NextResponse.json(
      { topCategory: null, newSeller: null, topProduct: null, categories: [] },
      { status: 200 } // on renvoie un objet vide plutôt qu'une 500 — le front gère l'absence de données
    );
  }
}
