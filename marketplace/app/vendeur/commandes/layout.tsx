import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurCommandesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
