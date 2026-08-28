import { requireValidVendeur } from "@/lib/vendeur-guard";

export default async function VendeurDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidVendeur();

  return <>{children}</>;
}
