"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useUser } from "@/lib/hooks/useUser";
import { useToast } from "@/context/ToastContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { SettingsToggle } from "@/components/settings/SettingsForm";

type Canal = "notif_push" | "notif_whatsapp" | "notif_email";

const CANAUX: { id: Canal; label: string; description: string }[] = [
  { id: "notif_push", label: "Notifications push", description: "Alertes directement sur ton téléphone" },
  { id: "notif_whatsapp", label: "Alertes WhatsApp", description: "Suivi de commande et livraison par WhatsApp" },
  { id: "notif_email", label: "Notifications email", description: "Récapitulatifs et confirmations par email" },
];

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { profile, loading: userLoading } = useUser();
  const { showToast } = useToast();

  const [prefs, setPrefs] = useState<Record<Canal, boolean>>({
    notif_push: false,
    notif_whatsapp: false,
    notif_email: false,
  });
  const [saving, setSaving] = useState<Canal | null>(null);

  useEffect(() => {
    if (profile) {
      setPrefs({
        notif_push: profile.notif_push,
        notif_whatsapp: profile.notif_whatsapp,
        notif_email: profile.notif_email,
      });
    }
  }, [profile]);

  const handleToggle = async (canal: Canal, value: boolean) => {
    if (!profile) return;
    const previous = prefs[canal];
    setPrefs((prev) => ({ ...prev, [canal]: value }));
    setSaving(canal);
    try {
      const { error } = await supabase.from("users").update({ [canal]: value }).eq("id", profile.id);
      if (error) throw error;
    } catch (error) {
      console.error("Error updating notification preference:", error);
      setPrefs((prev) => ({ ...prev, [canal]: previous }));
      showToast("Erreur lors de la mise à jour", "error");
    } finally {
      setSaving(null);
    }
  };

  return (
    <DashboardLayout role="client" title="Notifications" backHref="/menu">
      <div className="max-w-lg mx-auto space-y-4">
        <p className="text-xs text-gray-400 px-1 mb-2">
          Choisis comment tu veux être prévenu pour tes commandes, livraisons et paiements.
        </p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden px-4">
          {userLoading ? (
            <div className="py-6 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-6 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : (
            CANAUX.map((c) => (
              <div key={c.id} className="py-3.5">
                <SettingsToggle
                  label={c.label}
                  checked={prefs[c.id]}
                  onChange={(v) => handleToggle(c.id, v)}
                  disabled={saving === c.id}
                />
                <p className="text-xs text-gray-400 mt-0.5">{c.description}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
