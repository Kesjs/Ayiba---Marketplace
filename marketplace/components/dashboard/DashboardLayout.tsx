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
  personalized?: boolean; // active "Bonjour {prénom} 👋"
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

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <DashboardHeader
          boutiqueName={boutiqueName}
          title={title || "Tableau de bord"}
          greeting={personalized ? `${saluerSelonHeure()} ${prenom} 👋` : undefined}
          subtitle={personalized ? "Bon retour sur Ayiba" : undefined}
          avatarUrl={profile?.avatar_url}
          fullName={displayName}
          notificationsCount={badges.notifications}
          notifications={badges.notificationsList}
        />

        <div className="p-4 md:p-8 lg:p-10 pb-28 lg:pb-10 max-w-7xl mx-auto">
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
