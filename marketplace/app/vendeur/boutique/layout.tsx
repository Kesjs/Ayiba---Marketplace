import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurBoutiqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
