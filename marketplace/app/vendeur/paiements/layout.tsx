import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurPaiementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
