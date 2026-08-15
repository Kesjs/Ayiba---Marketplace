"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ArrowLeft, Search, X, ShoppingCart, Menu } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { NotificationsDropdown, type Notification } from "./NotificationsDropdown";
import { AccountDropdown, type AccountLink } from "./AccountDropdown";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { useCart } from "@/context/CartContext";

export type { Notification, AccountLink };

interface DashboardHeaderProps {
  boutiqueName?: string;
  title: string;
  greeting?: string;      // ex: "Bonjour Ken 👋"
  subtitle?: string;      // ex: "Bon retour sur Ayiba"
  avatarUrl?: string | null;
  fullName?: string;
  notificationsCount?: number;
  notifications?: Notification[];
  onBoutiqueClick?: () => void;
  /** Utilisé seulement si `accountLinks` n'est pas fourni : clic direct sans menu. */
  onAvatarClick?: () => void;
  onBellClick?: () => void;
  backHref?: string;
  backLabel?: string;
  /** Sous-titre affiché dans le menu compte (ex: nom de la boutique, "Livreur Ayiba"). */
  accountSubtitle?: string;
  /** Si fourni (et non vide), le clic sur l'avatar ouvre un menu déroulant
   * (identité + ces liens + déconnexion) au lieu d'appeler `onAvatarClick`. */
  accountLinks?: AccountLink[];
  /** Appelé après confirmation dans la modale de déconnexion. */
  onLogout?: () => void | Promise<void>;
  /** Affiche la barre de recherche globale sous l'identité, présente sur
   * tous les écrans du rôle concerné (ex: tout le Dashboard vendeur). */
  showSearch?: boolean;
  searchPlaceholder?: string;
  /** Route vers laquelle la recherche redirige (préfixée du `?q=`). */
  searchHref?: string;
  /** Si fourni, prend le dessus sur la navigation par défaut vers `searchHref`. */
  onSearchSubmit?: (query: string) => void;
  /** Icône panier (mobile + desktop) — ouvre le CartDrawer global (sidebar
   * depuis la droite, même comportement que sur le site public). Seul le
   * rôle vendeur achète depuis son propre dashboard (livreur/admin non
   * concernés), donc ce prop est explicite plutôt que déduit ici. */
  showCart?: boolean;
  /** Bascule l'état replié/déplié de la sidebar (desktop uniquement). Si
   * fourni, un bouton hamburger apparaît dans le header desktop — c'est lui
   * qui pilote désormais le collapse (remplace l'ancien bouton flottant sur
   * la bordure de la sidebar, qui passait derrière le header sticky). */
  onToggleSidebar?: () => void;
  sidebarCollapsed?: boolean;
}

export function DashboardHeader({
  boutiqueName,
  title,
  greeting,
  subtitle,
  avatarUrl,
  fullName,
  notificationsCount = 0,
  notifications = [],
  onBoutiqueClick,
  onAvatarClick,
  onBellClick,
  backHref,
  backLabel,
  accountSubtitle,
  accountLinks,
  onLogout,
  showSearch = false,
  searchPlaceholder = "Rechercher un produit...",
  searchHref = "/recherche",
  onSearchSubmit,
  showCart = false,
  onToggleSidebar,
  sidebarCollapsed = false,
}: DashboardHeaderProps) {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = searchValue.trim();
    if (!q) return;
    if (onSearchSubmit) {
      onSearchSubmit(q);
    } else {
      router.push(`${searchHref}?q=${encodeURIComponent(q)}`);
    }
  }
  // Deux instances (bande unique mobile/tablette, ligne desktop réel)
  // coexistent dans le DOM ; chaque grappe cloche+avatar a son propre
  // conteneur pour le clic-dehors, qui referme les deux menus à la fois.
  const topBarRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

  const hasAccountMenu = !!accountLinks && accountLinks.length > 0;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      const insideTopBar = topBarRef.current?.contains(target);
      const insideDesktop = desktopRef.current?.contains(target);
      if (!insideTopBar && !insideDesktop) {
        setShowNotifs(false);
        setShowAccount(false);
      }
    }
    if (showNotifs || showAccount) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs, showAccount]);

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  function handleBellClick() {
    setShowAccount(false);
    setShowNotifs((v) => !v);
    onBellClick?.();
  }

  function handleAvatarClick() {
    if (hasAccountMenu) {
      setShowNotifs(false);
      setShowAccount((v) => !v);
    } else {
      onAvatarClick?.();
    }
  }

  function handleLogoutClick() {
    setShowAccount(false);
    setShowLogoutConfirm(true);
  }

  async function confirmLogout() {
    setShowLogoutConfirm(false);
    await onLogout?.();
  }

  return (
    <>
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      {/* --- Bande actions unique, mobile ET tablette (< lg) ---
          Le Sidebar porte déjà logo + avatar à partir de lg ; en dessous,
          cette bande unique regroupe logo + cloche + avatar sur une seule
          ligne (fusion des anciennes bandes "logo" et "desktop-style" qui
          se dupliquaient sur la tranche tablette md-lg). La bande du
          dessous ne porte plus que le contenu (salutation/retour/titre). */}
      <div className="lg:hidden flex items-center justify-between gap-3 px-4 h-12 border-b border-gray-50">
        <div className="flex items-center">
          <LogoAyiba className="h-6 w-auto" />
        </div>

        <div className="flex items-center gap-2 shrink-0" ref={topBarRef}>
          {showCart && (
            <button
              onClick={openCart}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Voir le panier"
            >
              <ShoppingCart size={19} className="text-gray-500" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          )}

          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-500" />
              {notificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <NotificationsDropdown notifications={notifications} onClose={() => setShowNotifs(false)} />
            )}
          </div>

          <div className="relative">
            <button
              onClick={handleAvatarClick}
              className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
              aria-label="Profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-500">{initials}</span>
              )}
            </button>

            {showAccount && hasAccountMenu && (
              <AccountDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                subtitle={accountSubtitle}
                links={accountLinks!}
                onLogoutClick={handleLogoutClick}
                onClose={() => setShowAccount(false)}
              />
            )}
          </div>
        </div>
      </div>

      {/* --- Bande contenu, mobile ET tablette (< lg) : pleine largeur, plus rien à droite --- */}
      <div className="lg:hidden flex items-center px-4 h-14 max-w-7xl mx-auto">
        {backHref ? (
          <Link
            href={backHref}
            className="flex items-center gap-1.5 -ml-2 pl-2 pr-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors min-w-0"
          >
            <ArrowLeft size={18} className="text-gray-500 shrink-0" />
            <span className="text-sm font-bold text-gray-900 truncate">{backLabel || title}</span>
          </Link>
        ) : greeting ? (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{greeting}</p>
            {subtitle && <p className="text-[11px] text-gray-500 truncate leading-tight">{subtitle}</p>}
          </div>
        ) : (
          <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* --- Barre de recherche, mobile ET tablette (< lg) : présente sur
          tous les écrans du rôle quand `showSearch` est activé. --- */}
      {showSearch && (
        <div className="lg:hidden px-4 pb-3 max-w-7xl mx-auto">
          <form onSubmit={submitSearch} className="relative">
            <Search
              size={17}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              inputMode="search"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full h-11 pl-10 pr-9 bg-gray-50 border border-transparent rounded-2xl text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-400 focus:bg-white transition-all"
            />
            {searchValue && (
              <button
                type="button"
                onClick={() => setSearchValue("")}
                aria-label="Effacer la recherche"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-200/60"
              >
                <X size={14} />
              </button>
            )}
          </form>
        </div>
      )}

      {/* --- Desktop réel (>= lg) : inchangé --- */}
      <div className="hidden lg:flex relative items-center justify-between gap-3 px-4 h-14 max-w-7xl mx-auto">
        <div className="flex items-center gap-1 shrink-0">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
              aria-label={sidebarCollapsed ? "Déplier la sidebar" : "Replier la sidebar"}
              title={sidebarCollapsed ? "Déplier la sidebar" : "Replier la sidebar"}
            >
              <Menu size={19} />
            </button>
          )}
          <button
            onClick={onBoutiqueClick}
            className="flex items-center gap-1 text-sm font-bold text-gray-900"
          >
            {boutiqueName || "Ma boutique"}
          </button>
        </div>

        {backHref ? (
          <Link
            href={backHref}
            className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft size={16} className="text-gray-400" />
            <span className="text-sm font-semibold text-gray-500">{backLabel || title}</span>
          </Link>
        ) : greeting ? (
          <div className="absolute left-1/2 -translate-x-1/2 text-center">
            <p className="text-sm font-bold text-gray-900 leading-tight">{greeting}</p>
            {subtitle && <p className="text-[11px] text-gray-500 leading-tight">{subtitle}</p>}
          </div>
        ) : (
          <h1 className="text-sm font-semibold text-gray-500 truncate absolute left-1/2 -translate-x-1/2">
            {title}
          </h1>
        )}

        <div className="flex items-center gap-3 shrink-0" ref={desktopRef}>
          {showSearch && (
            <form onSubmit={submitSearch} className="relative">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
              <input
                type="text"
                inputMode="search"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-56 xl:w-72 h-10 pl-10 pr-3 bg-gray-50 border border-transparent rounded-full text-sm font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-100 focus:border-coral-400 focus:bg-white transition-all"
              />
            </form>
          )}

          {showCart && (
            <button
              onClick={openCart}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Voir le panier"
            >
              <ShoppingCart size={19} className="text-gray-500" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </button>
          )}

          <div className="relative">
            <button
              onClick={handleBellClick}
              className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
              aria-label="Notifications"
            >
              <Bell size={20} className="text-gray-500" />
              {notificationsCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                  {notificationsCount > 9 ? "9+" : notificationsCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <NotificationsDropdown notifications={notifications} onClose={() => setShowNotifs(false)} />
            )}
          </div>

          <div className="relative">
            <button
              onClick={handleAvatarClick}
              className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
              aria-label="Profil"
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-gray-500">{initials}</span>
              )}
            </button>

            {showAccount && hasAccountMenu && (
              <AccountDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                subtitle={accountSubtitle}
                links={accountLinks!}
                onLogoutClick={handleLogoutClick}
                onClose={() => setShowAccount(false)}
              />
            )}
          </div>
        </div>
      </div>

      </header>

      <LogoutConfirmModal
        open={showLogoutConfirm}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutConfirm(false)}
      />
    </>
  );
}
