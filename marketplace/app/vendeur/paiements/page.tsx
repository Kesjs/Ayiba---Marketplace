"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { Bell } from "lucide-react";

type Couleur = "coral" | "teal" | "amber" | "gray";

type NotificationRow = {
  id: string;
  titre: string;
  type: string | null;
  created_at: string;
  lien: string | null;
  lu: boolean;
};

const DOT_COLORS: Record<Couleur, string> = {
  coral: "bg-coral-500",
  teal: "bg-teal-500",
  amber: "bg-amber-500",
  gray: "bg-gray-400",
};

// Garde ce mapping cohérent avec celui de lib/hooks/useBadgeCounts.ts
function couleurPourType(type: string | null): Couleur {
  switch (type) {
    case "commande":
      return "coral";
    case "paiement":
      return "teal";
    case "message":
      return "amber";
    default:
      return "gray";
  }
}

function formatRelatif(dateIso: string): string {
  const diffMs = Date.now() - new Date(dateIso).getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "À l'instant";
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  const diffJ = Math.floor(diffH / 24);
  if (diffJ === 1) return "Hier";
  if (diffJ < 7) return `Il y a ${diffJ} j`;
  return new Date(dateIso).toLocaleDateString("fr-FR");
}

export default function VendeurNotificationsPage() {
  const { profile } = useUser();
  const supabase = useMemo(() => createClient(), []);

  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!profile?.id) return;
    const { data, error } = await supabase
      .from("vue_notifications_dashboard")
      .select("id, titre, type, created_at, lien, lu")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error) {
      setNotifications((data ?? []) as NotificationRow[]);
    }
    setLoading(false);
  }, [profile?.id, supabase]);

  useEffect(() => {
    if (profile?.id) {
      fetchNotifications();
    }
  }, [profile?.id, fetchNotifications]);

  // Rafraîchit la liste en temps réel (nouvelle notif, ou statut lu changé ailleurs)
  useEffect(() => {
    if (!profile?.id) return;
    const channel = supabase
      .channel(`notifications-page-${profile.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${profile.id}` },
        () => fetchNotifications()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile?.id, supabase, fetchNotifications]);

  async function handleClick(n: NotificationRow) {
    if (!n.lu) {
      setNotifications((prev) => prev.map((item) => (item.id === n.id ? { ...item, lu: true } : item)));
      await supabase.from("notifications").update({ lu: true }).eq("id", n.id);
    }
  }

  return (
    <DashboardLayout role="vendeur" title="Notifications" userName={profile?.full_name ?? undefined}>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:px-0">
        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <Bell size={24} className="text-gray-300" />
            </div>
            <p className="text-sm font-semibold text-gray-900">Aucune notification</p>
            <p className="text-xs text-gray-400 mt-1">Tu seras prévenu ici dès qu'il y a du nouveau.</p>
          </div>
        ) : (
          <ul className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {notifications.map((n) => (
              <li key={n.id}>
                <Link
                  href={n.lien || "#"}
                  onClick={() => handleClick(n)}
                  className={`flex items-start gap-3 px-5 py-4 transition-colors hover:bg-gray-50 ${
                    n.lu ? "" : "bg-coral-50/40"
                  }`}
                >
                  <span
                    className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${DOT_COLORS[couleurPourType(n.type)]}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm text-gray-900 ${n.lu ? "font-medium" : "font-bold"}`}>{n.titre}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{formatRelatif(n.created_at)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </DashboardLayout>
  );
}
