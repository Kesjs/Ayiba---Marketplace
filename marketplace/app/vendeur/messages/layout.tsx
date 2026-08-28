import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
