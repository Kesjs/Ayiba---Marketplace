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
}

export function DashboardLayout({ children, role, userName, title, boutiqueName }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { profile } = useUser();
  const badges = useBadgeCounts(profile?.id, role);

  const displayName = userName || profile?.full_name || "Utilisateur";

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
          avatarUrl={profile?.avatar_url}
          fullName={displayName}
          notificationsCount={badges.notifications}
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
