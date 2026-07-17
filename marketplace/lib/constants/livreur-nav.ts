import { Truck, Wallet, MessageSquare, User, type LucideIcon } from "lucide-react";

export interface LivreurNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "missions" | "messages";
}

// Source unique de vérité pour la navigation livreur —
// consommée par Sidebar.tsx (desktop) ET BottomNav.tsx (mobile).
// 4 onglets directs, pas de tiroir "Menu" : Historique et Paramètres
// vivent comme des raccourcis à l'intérieur de la page Profil.
export const LIVREUR_NAV_ITEMS: LivreurNavItem[] = [
  { label: "Missions", href: "/livreur/missions", icon: Truck, badgeKey: "missions" },
  { label: "Paiements", href: "/livreur/paiements", icon: Wallet },
  { label: "Messages", href: "/livreur/messages", icon: MessageSquare, badgeKey: "messages" },
  { label: "Profil", href: "/livreur/profil", icon: User },
];
