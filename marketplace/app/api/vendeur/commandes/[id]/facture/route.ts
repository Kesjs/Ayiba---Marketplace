import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { genererFacturePDF, type FactureData } from "@/lib/pdf/facture";
import { genererCodeSecurite } from "@/lib/pdf/facture-securite";

// pdfkit utilise Buffer/fs — incompatible avec le runtime edge, donc on
// force explicitement le runtime Node.js pour cette route.
export const runtime = "nodejs";

function one<T>(rel: T | T[] | null | undefined): T | null {
  if (!rel) return null;
  return Array.isArray(rel) ? rel[0] ?? null : rel;
}

/**
 * Génère la facture PDF d'une commande, côté serveur. Remplace l'ancienne
 * version HTML imprimable côté client (window.print() cassé sur iOS, popup
 * bloqué, encodage mal déclaré). RLS ne suffit pas seule ici : on revérifie
 * explicitement que la commande appartient bien au vendeur connecté avant de
 * générer quoi que ce soit, pour renvoyer un 404 propre plutôt qu'un tableau
 * vide silencieux exploité pour construire un PDF vide.
 */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    return NextResponse.json({ error: "Configuration serveur incomplète" }, { status: 500 });
  }

  const supabase = createServerClient(supabaseUrl, anonKey, {
    cookies: {
      getAll: () => req.cookies.getAll(),
      setAll: () => {},
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const { data: commande, error: commandeError } = await supabase
    .from("commandes")
    .select(
      "id, numero, nom_client, telephone_client, adresse_livraison, commune, montant_total, created_at, vendeur_id, livreur:livreurs!commandes_livreur_id_fkey ( nom_complet, users!livreurs_id_fkey ( phone ) )"
    )
    .eq("id", id)
    .eq("vendeur_id", user.id)
    .single();

  if (commandeError || !commande) {
    return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
  }

  const { data: vendeurRow } = await supabase
    .from("vendeurs")
    .select("nom_boutique, nom_complet, quartier, commune, statut, users ( phone )")
    .eq("id", user.id)
    .single();

  const { data: articlesRows } = await supabase
    .from("commande_articles")
    .select("quantite, prix_unitaire, total, article:articles(nom)")
    .eq("commande_id", id);

  const commandeRow = commande as any;
  const vendeur = vendeurRow as any;
  const livreur = one(commandeRow.livreur);
  const localisationVendeur = [vendeur?.quartier, vendeur?.commune].filter(Boolean).join(", ");

  const factureData: FactureData = {
    numero: commandeRow.numero,
    dateISO: commandeRow.created_at,
    vendeurNom: vendeur?.nom_boutique || vendeur?.nom_complet || "Boutique Ayiba",
    vendeurLocalisation: localisationVendeur || null,
    vendeurTelephone: one(vendeur?.users)?.phone ?? null,
    clientNom: commandeRow.nom_client ?? "Client",
    clientTelephone: commandeRow.telephone_client ?? null,
    clientAdresse: commandeRow.adresse_livraison ?? null,
    clientCommune: commandeRow.commune ?? null,
    livreurNom: livreur?.nom_complet ?? null,
    livreurTelephone: one(livreur?.users)?.phone ?? null,
    articles: ((articlesRows as any[]) ?? []).map((r) => ({
      nom: r.article?.nom ?? "Article",
      quantite: r.quantite,
      prix_unitaire: r.prix_unitaire,
      total: r.total,
    })),
    montantTotal: commandeRow.montant_total,
    vendeurVerifie: vendeur?.statut === "valide",
    codeSecurite: genererCodeSecurite(commandeRow.numero, commandeRow.montant_total, commandeRow.vendeur_id),
    qrCodeUrl: `${process.env.NEXT_PUBLIC_SITE_URL}/verifier/${commandeRow.numero}`,
  };

  const pdfBuffer = await genererFacturePDF(factureData);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="facture_${factureData.numero}.pdf"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
