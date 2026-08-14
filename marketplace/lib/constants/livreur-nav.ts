import { Truck, Wallet, MessageSquare, User, type LucideIcon } from "lucide-react";

export interface LivreurNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "missions" | "messages";
  // true si la route est protégée par requireValidLivreur() côté serveur
  // (statut_verification === "valide" requis) — sert à griser/verrouiller
  // l'onglet dans la BottomNav tant que le dossier est en attente ou refusé,
  // plutôt que de laisser l'utilisateur taper dessus et se faire rebondir
  // vers /livreur/kyc.
  requiresValidation?: boolean;
}

// Source unique de vérité pour la navigation livreur —
// consommée par Sidebar.tsx (desktop) ET BottomNav.tsx (mobile).
// 4 onglets directs, pas de tiroir "Menu" : Historique et Paramètres
// vivent comme des raccourcis à l'intérieur de la page Profil.
export const LIVREUR_NAV_ITEMS: LivreurNavItem[] = [
  { label: "Missions", href: "/livreur/missions", icon: Truck, badgeKey: "missions", requiresValidation: true },
  { label: "Paiements", href: "/livreur/paiements", icon: Wallet, requiresValidation: true },
  { label: "Messages", href: "/livreur/messages", icon: MessageSquare, badgeKey: "messages", requiresValidation: true },
  { label: "Profil", href: "/livreur/profil", icon: User },
];
