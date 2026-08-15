"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
  Settings,
  LogOut,
  ShieldCheck,
  Store,
  User,
  Heart,
  AlertTriangle,
  Users,
  Wallet,
  Truck,
  History,
  Lock,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { useToast } from "@/context/ToastContext";
import LogoAyiba from "@/components/ui/LogoAyiba";

interface SidebarProps {
  role: "admin" | "vendeur" | "livreur" | "client";
  userName?: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
}

export function Sidebar({ role, userName, isCollapsed, onToggleCollapse, onCartClick, cartItemCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { exitDemoMode, profile } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems = {
    admin: [
      { name: "Vue d'ensemble", icon: LayoutDashboard, path: "/admin/dashboard" },
      { name: "Vendeurs (KYC)", icon: Store, path: "/admin/vendeurs" },
      { name: "Livreurs (KYC)", icon: Truck, path: "/admin/livreurs" },
      { name: "Modération articles", icon: ShieldCheck, path: "/admin/moderation" },
      { name: "Commandes", icon: ShoppingBag, path: "/admin/commandes" },
      { name: "Litiges", icon: AlertTriangle, path: "/admin/litiges" },
      { name: "Paiements & retraits", icon: Wallet, path: "/admin/paiements" },
      { name: "Utilisateurs", icon: Users, path: "/admin/utilisateurs" },
      { name: "Catégories", icon: Package, path: "/admin/categories" },
      { name: "Avis", icon: MessageSquare, path: "/admin/avis" },
      { name: "Suppressions", icon: Lock, path: "/admin/demandes" },
      { name: "Paramètres", icon: Settings, path: "/admin/parametres" },
    ],
    vendeur: [
      { name: "Tableau de bord", icon: LayoutDashboard, path: "/vendeur/dashboard" },
      { name: "Mes Articles", icon: Package, path: "/vendeur/articles" },
      { name: "Mes ventes", icon: ShoppingBag, path: "/vendeur/commandes" },
      { name: "Mes achats", icon: ShoppingCart, path: "/vendeur/achats" },
      { name: "Favoris", icon: Heart, path: "/vendeur/favoris" },
      { name: "Boutique", icon: Store, path: "/vendeur/boutique" },
      { name: "Paiements", icon: Wallet, path: "/vendeur/paiements" },
      { name: "Messages", icon: MessageSquare, path: "/vendeur/messages" },
      { name: "Paramètres", icon: Settings, path: "/vendeur/parametres" },
    ],
    client: [
      { name: "Accueil", icon: LayoutDashboard, path: "/accueil" },
      { name: "Commandes", icon: Package, path: "/commandes" },
      { name: "Favoris", icon: ShoppingBag, path: "/favoris" },
      { name: "Messages", icon: MessageSquare, path: "/messages" },
      { name: "Compte", icon: User, path: "/menu" },
    ],
    // La bottom bar mobile se limite à 4 onglets (LIVREUR_NAV_ITEMS) ;
    // le sidebar desktop a la place d'afficher toutes les sections.
    livreur: [
      { name: "Missions", icon: Truck, path: "/livreur/missions", requiresValidation: true },
      { name: "Paiements", icon: Wallet, path: "/livreur/paiements", requiresValidation: true },
      { name: "Messages", icon: MessageSquare, path: "/livreur/messages", requiresValidation: true },
      { name: "Historique", icon: History, path: "/livreur/historique", requiresValidation: true },
      { name: "Profil", icon: User, path: "/livreur/profil" },
      { name: "Paramètres", icon: Settings, path: "/livreur/parametres" },
    ],
  };

  const items = menuItems[role];
  const { isValide: isLivreurValide, loading: statutLoading } =
    useLivreurVerificationStatut(role === "livreur");
  const { showToast } = useToast();

  const confirmLogout = async () => {
    setShowLogoutModal(false);

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
      {/* Logo — volontairement non cliquable dans les dashboards (admin/
          vendeur/livreur) : contrairement au site public, sortir du
          dashboard par erreur en visant la sidebar n'est jamais voulu ici.
          Seul le Navbar public (espace client) garde un logo qui ramène à
          l'accueil. Le collapse de la sidebar est désormais piloté par le
          bouton hamburger du DashboardHeader (cf. onToggleCollapse), pas
          depuis la sidebar elle-même. */}
      <div className={`h-20 flex items-center ${isCollapsed ? "justify-center px-2" : "px-6"}`}>
        {isCollapsed ? (
          <LogoAyiba iconOnly className="h-8 w-8 shrink-0" />
        ) : (
          <LogoAyiba className="h-8 w-auto shrink-0" />
        )}
      </div>

      {/* Badge rôle — bandeau pleine largeur, corail clair, sous le logo.
          En mode replié : version compacte centrée (une lettre) pour rester
          lisible dans les 80px disponibles. */}
      <div className={isCollapsed ? "px-3 mb-3" : "px-6 mb-3"}>
        <div
          className={`bg-coral-50 border border-coral-100 text-coral-500 font-bold uppercase tracking-wider rounded-lg text-center ${
            isCollapsed ? "text-[10px] py-1.5" : "text-[11px] py-1.5"
          }`}
        >
          {isCollapsed ? role.slice(0, 1) : role}
        </div>
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
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = pathname === item.path || pathname.startsWith(`${item.path}/`);
          const isLocked =
            (item as { requiresValidation?: boolean }).requiresValidation &&
            !statutLoading &&
            !isLivreurValide;

          if (isLocked) {
            return (
              <button
                key={item.path}
                onClick={() =>
                  showToast("Compte en cours de vérification — accessible sous 24-48h.", "info")
                }
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 cursor-not-allowed group"
              >
                <div className="relative shrink-0">
                  <item.icon size={22} strokeWidth={2} />
                  <Lock
                    size={11}
                    strokeWidth={2.5}
                    className="absolute -bottom-1 -right-1.5 text-gray-400 bg-white rounded-full p-[1px]"
                  />
                </div>
                {!isCollapsed && (
                  <span className="font-semibold text-[14px] whitespace-nowrap">{item.name}</span>
                )}
              </button>
            );
          }

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
        {role === "client" && onCartClick && (
          <button
            onClick={onCartClick}
            className="relative w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-all group"
          >
            <ShoppingCart size={22} className="shrink-0 group-hover:text-gray-700" />
            {!isCollapsed && <span className="font-semibold text-[14px] whitespace-nowrap">Panier</span>}
            {cartItemCount > 0 && (
              <span className="ml-auto min-w-5 h-5 px-1 rounded-full bg-coral-500 text-white text-[11px] font-bold flex items-center justify-center">
                {cartItemCount}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setShowLogoutModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all group"
        >
          <LogOut size={22} className="group-hover:text-red-500 shrink-0" />
          {!isCollapsed && <span className="font-semibold text-[14px] whitespace-nowrap">Déconnexion</span>}
        </button>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </aside>
  );
}
