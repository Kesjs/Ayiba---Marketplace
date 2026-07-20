import Link from "next/link";

export interface Notification {
  id: string;
  titre: string;
  createdAt: string;
  couleur?: "coral" | "teal" | "amber" | "gray";
  lien?: string | null;
}

const DOT_COLORS: Record<string, string> = {
  coral: "bg-coral-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  gray: "bg-gray-400",
};

export function NotificationsDropdown({
  notifications,
  onClose,
  viewAllHref = "/vendeur/notifications",
}: {
  notifications: Notification[];
  onClose: () => void;
  /** Cible du lien "Voir tout", propre à chaque rôle (ex: "/profil/notifications" côté client). */
  viewAllHref?: string;
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
        href={viewAllHref}
        onClick={onClose}
        className="block text-center py-3 text-sm font-bold text-coral-600 hover:bg-gray-50 transition-colors border-t border-gray-100"
      >
        Voir tout
      </Link>
    </div>
  );
}
