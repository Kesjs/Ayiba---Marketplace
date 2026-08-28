import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurArticlesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
