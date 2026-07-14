"use client";

import { Bell } from "lucide-react";
import { useState } from "react";

interface DashboardHeaderProps {
  boutiqueName?: string;
  title: string;
  avatarUrl?: string | null;
  fullName?: string;
  notificationsCount?: number;
  onBoutiqueClick?: () => void;
  onAvatarClick?: () => void;
  onBellClick?: () => void;
}

export function DashboardHeader({
  boutiqueName,
  title,
  avatarUrl,
  fullName,
  notificationsCount = 0,
  onBoutiqueClick,
  onAvatarClick,
  onBellClick,
}: DashboardHeaderProps) {
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-xl border-b border-gray-100">
      <div className="flex items-center justify-between gap-3 px-4 h-14 max-w-7xl mx-auto">
        <button
          onClick={onBoutiqueClick}
          className="flex items-center gap-1 shrink-0 text-sm font-bold text-gray-900"
        >
          {boutiqueName || "Ma boutique"}
        </button>

        <h1 className="text-sm font-semibold text-gray-500 truncate absolute left-1/2 -translate-x-1/2">
          {title}
        </h1>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onBellClick}
            className="relative w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <Bell size={20} className="text-gray-500" />
            {notificationsCount > 0 && (
              <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                {notificationsCount > 9 ? "9+" : notificationsCount}
              </span>
            )}
          </button>

          <button
            onClick={onAvatarClick}
            className="w-9 h-9 rounded-full bg-gray-100 border border-gray-100 flex items-center justify-center overflow-hidden shrink-0"
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
