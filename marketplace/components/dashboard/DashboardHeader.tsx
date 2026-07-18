"use client";

import { useEffect, useRef, useState } from "react";
import { Bell, ArrowLeft } from "lucide-react";
import Link from "next/link";

export interface Notification {
  id: string;
  titre: string;
  createdAt: string;
  couleur?: "coral" | "teal" | "amber" | "gray";
  lien?: string | null;
}

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
  onAvatarClick?: () => void;
  onBellClick?: () => void;
  backHref?: string;
  backLabel?: string;
}

const DOT_COLORS: Record<string, string> = {
  coral: "bg-coral-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  gray: "bg-gray-400",
};

function NotificationsDropdown({
  notifications,
  onClose,
}: {
  notifications: Notification[];
  onClose: () => void;
}) {
  return (
    <div className="absolute right-0 top-11 w-80 max-w-[90vw] bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-30">
      <div className="px-5 py-4 border-b border-gray-100">
        <p className="font-bold text-gray-900">Notifications</p>
      </div>

      {notifications.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-gray-400">
          Aucune notification pour le moment
        </div>
      ) : (
        <ul className="max-h-80 overflow-y-auto divide-y divide-gray-50">
          {notifications.map((n) => (
            <li key={n.id}>
              <Link
                href={n.lien || "#"}
                onClick={onClose}
                className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[n.couleur || "gray"]}`}
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{n.titre}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{n.createdAt}</p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/vendeur/notifications"
        onClick={onClose}
        className="block text-center py-3 text-sm font-bold text-coral-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
      >
        Voir tout
      </Link>
    </div>
  );
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
}: DashboardHeaderProps) {
  const [showNotifs, setShowNotifs] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
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
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      {/* --- Version mobile (< md) --- */}
      <div className="flex md:hidden items-center justify-between gap-3 px-4 h-14 max-w-7xl mx-auto">
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

        <div className="relative shrink-0" ref={containerRef}>
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
      </div>

      {/* --- Version desktop (>= md) --- */}
      <div className="hidden md:flex relative items-center justify-between gap-3 px-4 h-14 max-w-7xl mx-auto">
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

        <div className="flex items-center gap-2 shrink-0">
          <div className="relative" ref={containerRef}>
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
