import { requireValidLivreur } from "@/lib/livreur-guard";

export default async function LivreurMissionsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidLivreur();

  return <>{children}</>;
}
