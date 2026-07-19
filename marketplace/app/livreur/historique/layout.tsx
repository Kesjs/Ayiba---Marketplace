import { requireValidLivreur } from "@/lib/livreur-guard";

export default async function LivreurHistoriqueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidLivreur();

  return <>{children}</>;
}
