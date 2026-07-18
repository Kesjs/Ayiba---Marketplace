"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
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
}

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
}: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useUser();
  const badges = useBadgeCounts(profile?.id, role);

  const displayName = userName || profile?.full_name || "Utilisateur";
  const prenom = displayName.split(" ")[0];

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar
        role={role}
        userName={displayName}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((c) => !c)}
      />

      <main className={`flex-1 min-w-0 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
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
        />

<div className="p-5 sm:p-6 md:p-8 lg:p-10 pb-32 lg:pb-10 max-w-7xl mx-auto min-w-0">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 min-w-0">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
