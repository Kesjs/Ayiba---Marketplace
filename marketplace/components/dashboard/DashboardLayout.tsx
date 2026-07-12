"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { ReactNode } from "react";

interface DashboardLayoutProps {
  children: ReactNode;
  role: "admin" | "vendeur" | "livreur";
  userName?: string;
  title?: string;
}

export function DashboardLayout({ children, role, userName, title }: DashboardLayoutProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar
        role={role}
        userName={userName}
        isCollapsed={isCollapsed}
        onToggleCollapse={() => setIsCollapsed((c) => !c)}
      />

      <main className={`flex-1 transition-all duration-300 ${isCollapsed ? "lg:pl-20" : "lg:pl-64"}`}>
        <div className="p-4 md:p-8 lg:p-10 pb-24 md:pb-8 lg:pb-10 max-w-7xl mx-auto">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-gray-900">{title || "Tableau de bord"}</h1>
              <p className="text-gray-500 font-medium text-sm mt-1">Gérez votre activité Ayiba en toute simplicité.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden md:block text-right">
                <p className="text-sm font-bold text-gray-900">{userName || "Utilisateur"}</p>
                <p className="text-[11px] text-gray-400 uppercase tracking-widest font-bold">{role}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden">
                <img
                  src={`https://i.pravatar.cc/100?u=${userName || role}`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Page Content */}
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
