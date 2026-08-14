"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Store, User, Settings, ShoppingBag } from "lucide-react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import type { AccountLink } from "./AccountDropdown";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
import { createClient } from "@/lib/supabase/client";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "vendeur" | "livreur";
  userName?: string;
  title?: string;
  boutiqueName?: string;
  personalized?: boolean; // active "Bonjour {prénom} "
  backHref?: string;   // affiche un bouton retour à la place du titre/greeting
  backLabel?: string;  // libellé du bouton retour (par défaut "Retour")
  fullHeight?: boolean; // verrouille la page sur la hauteur de l'écran (ex: messagerie) au lieu de laisser la page défiler
  /** Barre de recherche globale dans le header. Par défaut activée pour le
   * rôle vendeur (sur tous ses écrans) ; peut être désactivée explicitement
   * page par page si besoin (ex: écrans plein écran comme la messagerie). */
  searchable?: boolean;
  searchPlaceholder?: string;
}

// Liens rapides du menu compte (clic avatar). Chaque rôle n'a pas la même
// page profil : le vendeur n'en a pas de dédiée (l'info profil vit dans
// Paramètres), le livreur en a une ("Mon profil"), l'admin n'a que Paramètres.
// "Faire des achats" mène au catalogue public : un compte vendeur reste un
// utilisateur Ayiba comme un autre côté achat — panier, favoris, checkout et
// commandes ne font aucune distinction de rôle (RLS basée uniquement sur
// auth.uid()) — il ne lui manquait qu'un point d'entrée, la home étant
// réservée à son dashboard. Le livreur n'achète pas sur la plateforme, donc
// pas de lien équivalent pour lui.
const ROLE_ACCOUNT_LINKS: Record<"admin" | "vendeur" | "livreur", AccountLink[]> = {
  vendeur: [
    { label: "Faire des achats", href: "/catalogue", icon: ShoppingBag },
    { label: "Ma boutique", href: "/vendeur/boutique", icon: Store },
    { label: "Paramètres", href: "/vendeur/parametres", icon: Settings },
  ],
  livreur: [
    { label: "Mon profil", href: "/livreur/profil", icon: User },
    { label: "Paramètres", href: "/livreur/parametres", icon: Settings },
  ],
  admin: [{ label: "Paramètres", href: "/admin/parametres", icon: Settings }],
};

function saluerSelonHeure(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export function DashboardLayout({
  children,
  role,
  userName,
  title,
  boutiqueName,
  personalized = false,
  backHref,
  backLabel,
  fullHeight = false,
  searchable,
  searchPlaceholder = "Rechercher un produit...",
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const router = useRouter();
  const { profile, exitDemoMode } = useUser();
  const badges = useBadgeCounts(profile?.id, role);

  const displayName = userName || profile?.full_name || "Utilisateur";
  const prenom = displayName.split(" ")[0];

  // Recherche globale du header désactivée par défaut sur tout le Dashboard
  // vendeur : elle redirigeait vers /recherche (le catalogue public client,
  // pas une vue scoped au vendeur), et faisait doublon avec la recherche
  // locale déjà présente sur la page Articles. À réactiver page par page si
  // un jour une vraie recherche scoped-vendeur est branchée derrière.
  const showSearch = searchable ?? false;

  const accountSubtitle: Record<"admin" | "vendeur" | "livreur", string> = {
    vendeur: boutiqueName || "Vendeur Ayiba",
    livreur: "Livreur Ayiba",
    admin: "Administrateur",
  };

  async function handleLogout() {
    // Nettoie le mode démo (localStorage) s'il était actif
    exitDemoMode?.();
    // Déconnecte la vraie session Supabase si elle existe
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar
        role={role}
        userName={displayName}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((c) => !c)}
      />

      <main
        className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"} ${
          fullHeight ? "flex flex-col h-dvh overflow-hidden" : ""
        }`}
      >
        <DashboardHeader
          boutiqueName={boutiqueName}
          title={title || "Tableau de bord"}
          greeting={personalized ? `${saluerSelonHeure()} ${prenom} ` : undefined}
          subtitle={personalized ? "Bon retour sur Ayiba" : undefined}
          avatarUrl={profile?.avatar_url}
          fullName={displayName}
          notificationsCount={badges.notifications}
          notifications={badges.notificationsList}
          backHref={backHref}
          backLabel={backLabel}
          accountSubtitle={accountSubtitle[role]}
          accountLinks={ROLE_ACCOUNT_LINKS[role]}
          onLogout={handleLogout}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
        />

        <div
          className={
            fullHeight
              ? "flex-1 min-h-0 flex flex-col p-5 sm:p-6 md:p-8 lg:p-10 pb-3 lg:pb-6 max-w-7xl mx-auto min-w-0 w-full"
              : "p-5 sm:p-6 md:p-8 lg:p-10 pb-32 lg:pb-10 max-w-7xl mx-auto min-w-0"
          }
        >
          <div
            className={
              fullHeight
                ? "flex-1 min-h-0 flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0"
                : "animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0"
            }
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
