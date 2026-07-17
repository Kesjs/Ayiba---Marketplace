import { Truck, History, User, Settings, type LucideIcon } from "lucide-react";

export interface LivreurNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badgeKey?: "missions";
}

// Source unique de vérité pour la navigation livreur —
// consommée par Sidebar.tsx (desktop) ET BottomNav.tsx (mobile).
export const LIVREUR_NAV_ITEMS: LivreurNavItem[] = [
  { label: "Missions", href: "/livreur/missions", icon: Truck, badgeKey: "missions" },
  { label: "Historique", href: "/livreur/historique", icon: History },
  { label: "Profil", href: "/livreur/profil", icon: User },
  { label: "Paramètres", href: "/livreur/parametres", icon: Settings },
];
