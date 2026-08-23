"use client";

import { usePathname } from "next/navigation";
import { LivreurStatusBanner } from "@/components/livreur/LivreurStatusBanner";

interface LivreurStatusBannerGateProps {
  statut?: string | null;
  raisonRejet?: string | null;
}

// La page KYC est l'endroit où le livreur remplit ou consulte son statut :
// y afficher la bannière par-dessus le wizard perturbe la mise en page.
// On la masque donc sur cette route, tout en la conservant sur les autres pages du layout.
const HIDDEN_ON = ["/livreur/kyc"];

export function LivreurStatusBannerGate({ statut, raisonRejet }: LivreurStatusBannerGateProps) {
  const pathname = usePathname();

  if (HIDDEN_ON.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return <LivreurStatusBanner statut={statut} raisonRejet={raisonRejet} />;
}
