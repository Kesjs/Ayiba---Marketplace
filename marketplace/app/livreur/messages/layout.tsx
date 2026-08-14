import { requireValidLivreur } from "@/lib/livreur-guard";

export default async function LivreurMessagesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireValidLivreur();

  return <>{children}</>;
}
