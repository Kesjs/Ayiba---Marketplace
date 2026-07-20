"use client";

import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import Link from "next/link";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { NotificationsDropdown, type Notification } from "@/components/dashboard/NotificationsDropdown";

export type { Notification };

interface ClientDashboardHeaderProps {
  title: string;
  greeting?: string;   // ex: "Bonsoir Ken 👋"
  subtitle?: string;   // ex: "Découvrez les meilleures offres de votre quartier"
  avatarUrl?: string | null;
  fullName?: string;
  notificationsCount?: number;
  notifications?: Notification[];
  onAvatarClick?: () => void;
  onBellClick?: () => void;
  /** Cible du logo affiché en dessous du breakpoint md (là où l'aside client,
   * qui porte déjà le logo, est masqué). */
  logoHref?: string;
}

export function ClientDashboardHeader({
  title,
  greeting,
  subtitle,
  avatarUrl,
  fullName,
  notificationsCount = 0,
  notifications = [],
  onAvatarClick,
  onBellClick,
  logoHref = "/accueil",
}: ClientDashboardHeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  // Deux instances de la cloche (bande unique mobile, ligne desktop réel)
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
      }
    }
    if (showNotifs) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showNotifs]);

  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  function handleBellClick() {
    setShowNotifs((v) => !v);
    onBellClick?.();
  }

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100 shrink-0">
      {/* --- Bande actions unique, mobile (< md) ---
          L'aside client porte déjà le logo à partir de md ; en dessous,
          cette bande unique regroupe logo + cloche + avatar sur une seule
          ligne, même principe que pour vendeur/livreur mais calé sur md
          puisque l'aside client (contrairement au Sidebar rôle) apparaît
          dès md et non lg. */}
      <div className="md:hidden flex items-center justify-between gap-3 px-4 h-12 border-b border-gray-50">
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
          </div>

          <button
            onClick={onAvatarClick}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
            aria-label="Profil"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold text-gray-500">{initials}</span>
            )}
          </button>
        </div>
      </div>

      {/* --- Bande contenu, mobile (< md) : pleine largeur, plus rien à droite --- */}
      <div className="md:hidden flex items-center px-4 h-14">
        {greeting ? (
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate leading-tight">{greeting}</p>
            {subtitle && <p className="text-[11px] text-gray-500 truncate leading-tight">{subtitle}</p>}
          </div>
        ) : (
          <h1 className="text-base font-bold text-gray-900 truncate">{title}</h1>
        )}
      </div>

      {/* --- Desktop réel (>= md) : l'aside garde le logo, le header garde cloche+avatar --- */}
      <div className="hidden md:flex relative items-center justify-between gap-3 px-4 md:px-8 h-16">
        {greeting ? (
          <div>
            <p className="text-lg font-bold text-gray-900 tracking-tight leading-tight">{greeting}</p>
            {subtitle && <p className="text-sm text-gray-500 leading-tight mt-0.5">{subtitle}</p>}
          </div>
        ) : (
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">{title}</h1>
        )}

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
          </div>

          <button
            onClick={onAvatarClick}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
            aria-label="Profil"
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
