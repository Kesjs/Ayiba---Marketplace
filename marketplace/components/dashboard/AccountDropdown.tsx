import Link from "next/link";
import { LogOut, type LucideIcon } from "lucide-react";

export interface AccountLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

export function AccountDropdown({
  fullName,
  avatarUrl,
  subtitle,
  links,
  onLogoutClick,
  onClose,
}: {
  fullName?: string;
  avatarUrl?: string | null;
  /** Ex: nom de la boutique (vendeur), "Livreur Ayiba" (livreur)... */
  subtitle?: string;
  links: AccountLink[];
  onLogoutClick: () => void;
  onClose: () => void;
}) {
  const initials = fullName
    ? fullName.split(" ").map((n) => n[0]).slice(0, 2).join("").toUpperCase()
    : "?";

  return (
    <div className="absolute right-0 top-11 w-64 bg-white rounded-2xl border border-gray-100 shadow-xl overflow-hidden z-30">
      <div className="px-4 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden shrink-0">
          {avatarUrl ? (
            <img src={avatarUrl} alt={fullName || "Avatar"} className="w-full h-full object-cover" />
          ) : (
            <span className="text-sm font-bold text-gray-500">{initials}</span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-gray-900 truncate">{fullName || "Utilisateur"}</p>
          {subtitle && <p className="text-xs text-gray-400 truncate">{subtitle}</p>}
        </div>
      </div>

      <ul className="py-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <link.icon size={18} className="text-gray-400 shrink-0" />
              {link.label}
            </Link>
          </li>
        ))}
      </ul>

      <div className="border-t border-gray-100 py-1">
        <button
          onClick={onLogoutClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut size={18} className="shrink-0" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
