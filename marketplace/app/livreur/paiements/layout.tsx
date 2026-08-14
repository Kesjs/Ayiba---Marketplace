import { requireValidLivreur } from "@/lib/livreur-guard";

export default async function LivreurPaiementsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidLivreur();

  return <>{children}</>;
}
