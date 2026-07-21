"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { NotificationsDropdown, type Notification } from "./NotificationsDropdown";
import { AccountDropdown, type AccountLink } from "./AccountDropdown";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

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
  /** Cible du logo affiché en dessous du breakpoint lg (là où le Sidebar,
   * qui porte déjà le logo, est masqué). Le dashboard du rôle plutôt que
   * "/" pour éviter un aller-retour inutile par la home publique. */
  logoHref?: string;
  /** Sous-titre affiché dans le menu compte (ex: nom de la boutique, "Livreur Ayiba"). */
  accountSubtitle?: string;
  /** Si fourni (et non vide), le clic sur l'avatar ouvre un menu déroulant
   * (identité + ces liens + déconnexion) au lieu d'appeler `onAvatarClick`. */
  accountLinks?: AccountLink[];
  /** Appelé après confirmation dans la modale de déconnexion. */
  onLogout?: () => void | Promise<void>;
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
  logoHref = "/",
  accountSubtitle,
  accountLinks,
  onLogout,
}: DashboardHeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const [showAccount, setShowAccount] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
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
        <Link href={logoHref} className="flex items-center">
          <LogoAyiba className="h-6 w-auto" />
        </Link>

        <div className="flex items-center gap-2 shrink-0" ref={topBarRef}>
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

      {/* --- Desktop réel (>= lg) : inchangé --- */}
      <div className="hidden lg:flex relative items-center justify-between gap-3 px-4 h-14 max-w-7xl mx-auto">
        <button
          onClick={onBoutiqueClick}
          className="flex items-center gap-1 shrink-0 text-sm font-bold text-gray-900"
        >
          {boutiqueName || "Ma boutique"}
        </button>

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

        <div className="flex items-center gap-2 shrink-0" ref={desktopRef}>
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
