"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ChevronLeft, LogOut, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { NotificationsDropdown, type Notification } from "@/components/dashboard/NotificationsDropdown";
import { AccountDropdown } from "@/components/dashboard/AccountDropdown";
import { createClient } from "@/lib/supabase/client";

export type { Notification };

interface ClientDashboardHeaderProps {
  title: string;
  greeting?: string;   // ex: "Bonsoir Ken 👋"
  subtitle?: string;   // ex: "Découvrez les meilleures offres de votre quartier"
  avatarUrl?: string | null;
  fullName?: string;
  notificationsCount?: number;
  notifications?: Notification[];
  onBellClick?: () => void;
  /** Cible du logo affiché en dessous du breakpoint md (là où l'aside client,
   * qui porte déjà le logo, est masqué). */
  logoHref?: string;
  /** Si fourni, affiche une flèche retour vers cette route. À utiliser sur les
   * pages ouvertes depuis le Menu (favoris, historique, profil...) qui ne sont
   * pas des onglets principaux de la barre de navigation basse. */
  backHref?: string;
}

const ACCOUNT_LINKS = [
  { label: "Mon profil", href: "/profil", icon: User },
  { label: "Paramètres", href: "/profil/parametres", icon: Settings },
];

export function ClientDashboardHeader({
  title,
  greeting,
  subtitle,
  avatarUrl,
  fullName,
  notificationsCount = 0,
  notifications = [],
  onBellClick,
  logoHref = "/",
  backHref,
}: ClientDashboardHeaderProps) {
  const router = useRouter();
  const [showNotifs, setShowNotifs] = useState(false);
  // Le clic sur l'avatar ouvre un vrai menu (Mon profil / Paramètres /
  // Déconnexion), comme AccountDropdown côté vendeur/livreur/admin — avant,
  // l'avatar se contentait de pousser vers /profil, ce qui ne faisait
  // rien de visible quand on était déjà sur cette page.
  const [showAccount, setShowAccount] = useState(false);
  // Deux instances de la cloche/de l'avatar (bande unique mobile, ligne desktop réel)
  // coexistent dans le DOM ; chacune a son propre conteneur pour le clic-dehors.
  const topBarRef = useRef<HTMLDivElement>(null);
  const desktopRef = useRef<HTMLDivElement>(null);

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
    setShowNotifs(false);
    setShowAccount((v) => !v);
  }

  async function handleLogoutClick() {
    setShowAccount(false);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 shrink-0">
      {/* --- Bande actions unique, mobile (< lg) ---
          L'aside client porte déjà le logo à partir de lg ; en dessous,
          cette bande unique regroupe logo + cloche + avatar sur une seule
          ligne, même principe que pour vendeur/livreur mais calé sur lg
          puisque l'aside client (contrairement au Sidebar rôle) apparaît
          dès lg et non lg. */}
      <div className="lg:hidden flex items-center justify-between gap-3 px-4 h-12 border-b border-gray-50">
        <Link href={logoHref} className="flex items-center">
          <LogoAyiba className="h-6 w-auto" />
        </Link>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={topBarRef}>
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
              <NotificationsDropdown
                notifications={notifications}
                onClose={() => setShowNotifs(false)}
                viewAllHref="/profil/notifications"
              />
            )}

            {showAccount && (
              <AccountDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                subtitle="Client Ayiba"
                links={ACCOUNT_LINKS}
                onLogoutClick={handleLogoutClick}
                onClose={() => setShowAccount(false)}
              />
            )}
          </div>

          <button
            onClick={handleAvatarClick}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
            aria-label="Mon compte"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* --- Bande contenu, mobile (< lg) : pleine largeur, plus rien à droite --- */}
      <div className="lg:hidden flex items-center gap-2 px-4 h-14">
        {backHref && (
          <Link
            href={backHref}
            className="w-8 h-8 -ml-1.5 flex items-center justify-center shrink-0 text-gray-600 hover:text-gray-900"
            aria-label="Retour"
          >
            <ChevronLeft size={22} />
          </Link>
        )}
        {greeting ? (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{greeting}</p>
            {subtitle && <p className="text-[11px] text-gray-500 truncate leading-tight">{subtitle}</p>}
          </div>
        ) : (
          <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* --- Desktop réel (>= lg) : l'aside garde le logo, le header garde cloche+avatar --- */}
      <div className="hidden lg:flex relative items-center justify-between gap-3 px-4 md:px-8 h-16">
        <div className="flex items-center gap-3 min-w-0">
          {backHref && (
            <Link
              href={backHref}
              className="w-9 h-9 flex items-center justify-center shrink-0 rounded-full hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
              aria-label="Retour"
            >
              <ChevronLeft size={20} />
            </Link>
          )}
          {greeting ? (
            <div>
              <p className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{greeting}</p>
              {subtitle && <p className="text-sm text-gray-500 leading-tight mt-0.5">{subtitle}</p>}
            </div>
          ) : (
            <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={desktopRef}>
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
              <NotificationsDropdown
                notifications={notifications}
                onClose={() => setShowNotifs(false)}
                viewAllHref="/profil/notifications"
              />
            )}

            {showAccount && (
              <AccountDropdown
                fullName={fullName}
                avatarUrl={avatarUrl}
                subtitle="Client Ayiba"
                links={ACCOUNT_LINKS}
                onLogoutClick={handleLogoutClick}
                onClose={() => setShowAccount(false)}
              />
            )}
          </div>

          <button
            onClick={handleAvatarClick}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
            aria-label="Mon compte"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500">{initials}</span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
