import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { CheckCircle2, ShieldCheck, XCircle } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { genererCodeSecurite } from "@/lib/pdf/facture-securite";

// Page publique (aucune authentification) pointée par le QR code imprimé
// sur la facture PDF. Ne lit que la vue `verification_facture`, qui expose
// volontairement un sous-ensemble minimal de colonnes sans aucune donnée
// personnelle du client — voir la migration
// 20260803_facture_credibilite.sql pour le détail de ce qui est exposé et
// pourquoi.

interface VerificationRow {
  numero: string;
  created_at: string;
  montant_total: number;
  vendeur_id: string;
  vendeur_nom: string;
  vendeur_verifie: boolean;
}

async function getVerification(numero: string): Promise<VerificationRow | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) return null;

  const supabase = createClient(supabaseUrl, anonKey);
  const { data } = await supabase
    .from("verification_facture")
    .select("numero, created_at, montant_total, vendeur_id, vendeur_nom, vendeur_verifie")
    .eq("numero", numero)
    .maybeSingle();

  return (data as VerificationRow) ?? null;
}

function formatMontant(v: number) {
  return new Intl.NumberFormat("fr-FR").format(v) + " F";
}

export async function generateMetadata({ params }: { params: Promise<{ numero: string }> }) {
  const { numero } = await params;
  return { title: `Vérification facture ${decodeURIComponent(numero)} · Ayiba` };
}

export default async function VerificationFacturePage({
  params,
}: {
  params: Promise<{ numero: string }>;
}) {
  const { numero: numeroBrut } = await params;
  const numero = decodeURIComponent(numeroBrut);
  const commande = await getVerification(numero);

  let codeSecurite: string | null = null;
  if (commande) {
    try {
      codeSecurite = genererCodeSecurite(commande.numero, commande.montant_total, commande.vendeur_id);
    } catch (e) {
      console.error("Impossible de calculer le code de sécurité :", e);
    }
  }

  return (
    <>
      <Navbar />
      <main className="min-h-[70vh] px-5 py-14">
        <div className="mx-auto max-w-md text-center">
          {!commande ? (
            <>
              <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border-2 border-dashed border-red-100">
                <XCircle className="h-11 w-11 text-red-400" strokeWidth={1.5} />
              </div>
              <StatusBadge variant="error">Facture introuvable</StatusBadge>
              <h1 className="mt-4 text-xl font-bold text-gray-900">
                Ce numéro ne correspond à aucune commande Ayiba
              </h1>
              <p className="mt-2 text-sm text-gray-400">
                Le numéro <span className="font-mono text-gray-600">{numero}</span> n&apos;existe pas dans notre
                système. Cette facture est peut-être invalide — contacte le support Ayiba en cas de doute.
              </p>
              <Link href="/" className="mt-6 inline-block">
                <Button variant="secondary">Retour à Ayiba</Button>
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto mb-5 flex h-28 w-28 items-center justify-center rounded-full border-2 border-dashed border-coral-200">
                <CheckCircle2 className="h-12 w-12 text-teal-400" strokeWidth={1.5} />
              </div>
              <StatusBadge variant="success" icon={<CheckCircle2 className="h-3.5 w-3.5" />}>
                Facture authentique
              </StatusBadge>
              <h1 className="mt-4 text-xl font-bold text-gray-900">Commande confirmée</h1>
              <p className="mt-1 text-sm text-gray-400">Ces informations proviennent directement du système Ayiba.</p>

              <div className="mt-6 space-y-3 rounded-lg border border-gray-100 bg-white p-5 text-left shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Numéro</span>
                  <span className="font-mono text-sm font-semibold text-gray-900">{commande.numero}</span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Date</span>
                  <span className="text-sm font-semibold text-gray-900">
                    {new Date(commande.created_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-gray-50 pt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Vendeur</span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-gray-900">
                    {commande.vendeur_nom}
                    {commande.vendeur_verifie && (
                      <ShieldCheck className="h-4 w-4 text-teal-400" strokeWidth={2} />
                    )}
                  </span>
                </div>
                <div className="flex items-center justify-between border-t border-gray-50 pt-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-gray-400">Montant total</span>
                  <span className="text-lg font-bold text-coral-400">{formatMontant(commande.montant_total)}</span>
                </div>
              </div>

              {codeSecurite && (
                <div className="mt-4 rounded-lg bg-teal-50 p-5 text-left">
                  <p className="text-xs font-medium uppercase tracking-wide text-teal-800">
                    Code de sécurité attendu
                  </p>
                  <p className="mt-1 font-mono text-lg font-bold tracking-wider text-teal-800">{codeSecurite}</p>
                  <p className="mt-2 text-xs text-teal-800">
                    Compare ce code à celui imprimé en bas de ton ticket. S&apos;ils ne correspondent pas, contacte
                    le support Ayiba avant de valider quoi que ce soit.
                  </p>
                </div>
              )}

              <Link href="/" className="mt-6 inline-block">
                <Button variant="secondary">Retour à Ayiba</Button>
              </Link>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
