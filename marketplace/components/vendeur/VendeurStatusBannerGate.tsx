"use client";

import { usePathname } from "next/navigation";
import { VendeurStatusBanner } from "@/components/vendeur/VendeurStatusBanner";

interface VendeurStatusBannerGateProps {
  statut: string;
  raisonRejet?: string | null;
}

// La page KYC est l'endroit où le vendeur résout justement son statut de
// vérification : y afficher la bannière "vérification en cours / refusée"
// par-dessus le wizard est redondant et perturbe la mise en page du formulaire.
// On la masque donc uniquement sur cette route, sans avoir à déplacer /vendeur/kyc
// hors de l'arborescence commune du layout.
const HIDDEN_ON = ["/vendeur/kyc"];

export function VendeurStatusBannerGate({ statut, raisonRejet }: VendeurStatusBannerGateProps) {
  const pathname = usePathname();

  if (HIDDEN_ON.some((path) => pathname?.startsWith(path))) {
    return null;
  }

  return <VendeurStatusBanner statut={statut} raisonRejet={raisonRejet} />;
}
