"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ShieldCheck,
  Store,
  User,
  Truck,
  AlertTriangle,
  Users,
  Wallet
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";

interface SidebarProps {
  role: "admin" | "vendeur" | "livreur";
  userName?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ role, userName, isCollapsed, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { exitDemoMode } = useUser();

  const menuItems = {
    admin: [
      { name: "Vue d'ensemble", icon: LayoutDashboard, path: "/admin/dashboard" },
      { name: "Vendeurs", icon: Store, path: "/admin/vendeurs" },
      { name: "Utilisateurs", icon: Users, path: "/admin/utilisateurs" },
      { name: "Litiges", icon: AlertTriangle, path: "/admin/litiges" },
      { name: "Modération", icon: ShieldCheck, path: "/admin/moderation" },
      { name: "Paramètres", icon: Settings, path: "/admin/parametres" },
    ],
    vendeur: [
      { name: "Tableau de bord", icon: LayoutDashboard, path: "/vendeur/dashboard" },
      { name: "Mes Articles", icon: Package, path: "/vendeur/articles" },
      { name: "Commandes", icon: ShoppingBag, path: "/vendeur/commandes" },
      { name: "Boutique", icon: Store, path: "/vendeur/boutique" },
      { name: "Paiements", icon: Wallet, path: "/vendeur/paiements" },
      { name: "Messages", icon: MessageSquare, path: "/vendeur/messages" },
      { name: "Paramètres", icon: Settings, path: "/vendeur/parametres" },
    ],
    livreur: [
      { name: "Missions", icon: Truck, path: "/livreur/missions" },
      { name: "Historique", icon: ShoppingBag, path: "/livreur/historique" },
      { name: "Mon Profil", icon: User, path: "/livreur/profil" },
      { name: "Paramètres", icon: Settings, path: "/livreur/parametres" },
    ],
  };

  const items = menuItems[role];

  const handleLogout = async () => {
    // Nettoie le mode démo (localStorage) s'il était actif
    exitDemoMode();

    // Déconnecte la vraie session Supabase si elle existe
    const supabase = createClient();
    await supabase.auth.signOut();

    router.push("/");
  };

  return (
    <aside
      className={`
        hidden lg:flex fixed inset-y-0 left-0 z-20 bg-white border-r border-gray-100 transition-all duration-300 flex-col
        ${isCollapsed ? "lg:w-20" : "lg:w-64"}
      `}
    >
      {/* Logo */}
      <div className="h-20 flex items-center px-6">
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 bg-coral-500 rounded-lg flex items-center justify-center text-white font-bold shrink-0">A</div>
          {!isCollapsed && (
            <span className="text-xl font-bold tracking-tight whitespace-nowrap">
              Ayiba <span className="text-gray-400 font-medium text-sm">| {role}</span>
            </span>
          )}
        </Link>
      </div>

      {/* User Profile Summary */}
      {!isCollapsed && (
        <div className="px-6 py-4 mb-4">
          <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
              <User size={20} className="text-gray-500" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-bold truncate">{userName || "Utilisateur"}</p>
              <p className="text-[11px] text-gray-400 uppercase tracking-wider font-bold">{role}</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                ${isActive
                  ? "bg-coral-50 text-coral-600 shadow-sm shadow-coral-500/5"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
              `}
            >
              <item.icon
                size={22}
                strokeWidth={isActive ? 2.5 : 2}
                className={`shrink-0 ${isActive ? "text-coral-500" : "group-hover:text-gray-700"}`}
              />
              {!isCollapsed && (
                <span className="font-semibold text-[14px] whitespace-nowrap">{item.name}</span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-3 border-t border-gray-50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut size={22} className="group-hover:text-red-500 shrink-0" />
          {!isCollapsed && <span className="font-semibold text-[14px] whitespace-nowrap">Déconnexion</span>}
        </button>

        <button
          onClick={onToggleCollapse}
          className="flex items-center justify-center w-full mt-2 p-2 text-gray-400 hover:text-gray-600"
        >
          <ChevronLeft size={20} className={`transition-transform duration-300 ${isCollapsed ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}
