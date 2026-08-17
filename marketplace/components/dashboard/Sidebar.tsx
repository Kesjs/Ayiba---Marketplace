"use client";

import { useState, type ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  ShoppingCart,
  MessageSquare,
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
  ChevronDown,
  ChevronsUpDown,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { useToast } from "@/context/ToastContext";
import LogoAyiba from "@/components/ui/LogoAyiba";

interface SidebarProps {
  role: "admin" | "vendeur" | "livreur" | "client";
  userName?: string;
  avatarUrl?: string | null;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  onCartClick?: () => void;
  cartItemCount?: number;
}

interface SidebarChildItem {
  name: string;
  path: string;
}

interface SidebarMenuItem {
  name: string;
  icon: ElementType;
  path?: string;
  children?: SidebarChildItem[];
  requiresValidation?: boolean;
}

export function Sidebar({ role, userName, avatarUrl, isCollapsed, onToggleCollapse, onCartClick, cartItemCount = 0 }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { exitDemoMode, profile } = useUser();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const menuItems: Record<SidebarProps["role"], SidebarMenuItem[]> = {
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
    ],
    vendeur: [
      { name: "Tableau de bord", icon: LayoutDashboard, path: "/vendeur/dashboard" },
      { name: "Articles", icon: Package, path: "/vendeur/articles" },
      { name: "Ventes", icon: ShoppingBag, path: "/vendeur/commandes" },
      {
        name: "Achats",
        icon: ShoppingCart,
        children: [
          { name: "Catalogue", path: "/vendeur/catalogue" },
          { name: "Commandes", path: "/vendeur/achats" },
        ],
      },
      { name: "Favoris", icon: Heart, path: "/vendeur/favoris" },
      { name: "Boutique", icon: Store, path: "/vendeur/boutique" },
      { name: "Paiements", icon: Wallet, path: "/vendeur/paiements" },
      { name: "Messages", icon: MessageSquare, path: "/vendeur/messages" },
    ],
    client: [
      { name: "Accueil", icon: LayoutDashboard, path: "/" },
      { name: "Commandes", icon: Package, path: "/commandes" },
      { name: "Favoris", icon: ShoppingBag, path: "/favoris" },
      { name: "Messages", icon: MessageSquare, path: "/messages" },
    ],
    // La bottom bar mobile se limite à 4 onglets (LIVREUR_NAV_ITEMS) ;
    // le sidebar desktop a la place d'afficher toutes les sections.
    livreur: [
      { name: "Missions", icon: Truck, path: "/livreur/missions", requiresValidation: true },
      { name: "Paiements", icon: Wallet, path: "/livreur/paiements", requiresValidation: true },
      { name: "Messages", icon: MessageSquare, path: "/livreur/messages", requiresValidation: true },
      { name: "Historique", icon: History, path: "/livreur/historique", requiresValidation: true },
      { name: "Profil", icon: User, path: "/livreur/profil" },
    ],
  };

  // Route "Paramètres" (ou équivalent) par rôle — c'est désormais le bloc
  // identité en bas de sidebar qui y mène (avatar + nom + rôle cliquables),
  // d'où la disparition de l'entrée correspondante dans le menu ci-dessus.
  const settingsPath: Record<SidebarProps["role"], string> = {
    admin: "/admin/parametres",
    vendeur: "/vendeur/parametres",
    livreur: "/livreur/parametres",
    client: "/menu",
  };

  const items = menuItems[role];
  const { isValide: isLivreurValide, loading: statutLoading } =
    useLivreurVerificationStatut(role === "livreur");
  const { showToast } = useToast();

  // Item parent (ex. "Achats") actuellement déplié — un seul ouvert à la
  // fois. Ouvert par défaut si on se trouve déjà sur une de ses sous-pages,
  // pour ne pas cacher l'endroit où on est.
  const [expandedMenu, setExpandedMenu] = useState<string | null>(() => {
    const parentActif = items.find((item) =>
      item.children?.some((child) => pathname === child.path || pathname.startsWith(`${child.path}/`))
    );
    return parentActif?.name ?? null;
  });

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
      <div className={`h-14 flex items-center border-b border-gray-100 ${isCollapsed ? "justify-center px-2" : "px-6"}`}>
        {isCollapsed ? (
          <LogoAyiba iconOnly className="h-8 w-8 shrink-0" />
        ) : (
          <LogoAyiba className="h-8 w-auto shrink-0" />
        )}
      </div>

      {/* Badge rôle et carte utilisateur : déplacés en bas de la sidebar
          (cf. section "Bottom Actions"), regroupés en un seul bloc juste
          au-dessus de la déconnexion — le menu de navigation démarre donc
          directement après le logo. */}

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
        {items.map((item) => {
          const isActive = item.path
            ? pathname === item.path || pathname.startsWith(`${item.path}/`)
            : false;
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

          // Item avec sous-menu (ex. "Achats" → Catalogue / Commandes) :
          // pas de navigation directe, on déplie/replie la liste des enfants.
          if (item.children) {
            const isOpen = expandedMenu === item.name;
            const unEnfantActif = item.children.some(
              (child) => pathname === child.path || pathname.startsWith(`${child.path}/`)
            );

            return (
              <div key={item.name}>
                <button
                  onClick={() => {
                    // Sidebar repliée : pas de place pour un sous-menu déroulant,
                    // on va directement sur le premier enfant.
                    if (isCollapsed) {
                      router.push(item.children![0].path);
                      return;
                    }
                    setExpandedMenu(isOpen ? null : item.name);
                  }}
                  className={`
                    w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group
                    ${unEnfantActif
                      ? "bg-coral-50 text-coral-600 shadow-sm shadow-coral-500/5"
                      : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
                  `}
                >
                  <item.icon
                    size={22}
                    strokeWidth={unEnfantActif ? 2.5 : 2}
                    className={`shrink-0 ${unEnfantActif ? "text-coral-500" : "group-hover:text-gray-700"}`}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="font-semibold text-[14px] whitespace-nowrap flex-1 text-left">
                        {item.name}
                      </span>
                      <ChevronDown
                        size={16}
                        className={`shrink-0 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                      />
                    </>
                  )}
                </button>

                {!isCollapsed && isOpen && (
                  <div className="mt-1 ml-[22px] pl-[14px] border-l border-gray-100 space-y-1">
                    {item.children.map((child) => {
                      const childActive = pathname === child.path || pathname.startsWith(`${child.path}/`);
                      return (
                        <Link
                          key={child.path}
                          href={child.path}
                          className={`
                            block px-3 py-2 rounded-lg text-[13px] font-semibold whitespace-nowrap transition-colors
                            ${childActive
                              ? "text-coral-600 bg-coral-50"
                              : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"}
                          `}
                        >
                          {child.name}
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          }

          return (
            <Link
              key={item.path}
              href={item.path!}
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

      {/* Bottom Actions : identité (nom + rôle) + panier (client), séparés
          du menu de nav au-dessus par une bordure. */}
      <div className="p-3 border-t border-gray-100 space-y-1">
        <Link
          href={settingsPath[role]}
          className={`flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-50 transition-colors ${isCollapsed ? "justify-center px-0" : ""}`}
        >
          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={userName || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <User size={18} className="text-gray-500" />
            )}
          </div>
          {!isCollapsed && (
            <>
              <div className="overflow-hidden min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-900 truncate leading-tight">{userName || "Utilisateur"}</p>
                <p className="text-[11px] font-bold text-coral-500 uppercase tracking-wide truncate leading-tight">{role}</p>
              </div>
              <ChevronsUpDown size={16} className="text-gray-400 shrink-0" />
            </>
          )}
        </Link>
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
      </div>

      {/* Déconnexion — isolée dans sa propre section, bordure au-dessus
          pour la séparer du bloc identité/panier, et accent rouge permanent
          (pas juste au survol) pour bien la distinguer : c'est une action
          de rupture, pas une destination comme le reste du menu. */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={() => setShowLogoutModal(true)}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 font-semibold hover:bg-red-50 transition-all group ${isCollapsed ? "justify-center px-0" : ""}`}
        >
          <LogOut size={22} className="text-red-500 shrink-0" />
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
