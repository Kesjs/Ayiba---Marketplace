"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import { ArrowLeft, ShieldCheck, Lock, Smartphone, KeyRound, Fingerprint, ChevronRight } from "lucide-react";

// Rend visible ce qui existe déjà côté sécurité (escrow, KYC vendeur/livreur,
// confirmation de livraison QR/code) plutôt que de le laisser invisible pour
// le client — voir dashboard-client.md, section Menu > Centre de confiance.
export default function CentreConfiancePage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [derniereConnexion, setDerniereConnexion] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setEmail(data.user?.email ?? null);
      setDerniereConnexion(data.user?.last_sign_in_at ?? null);
    });
  }, [supabase]);

  return (
    <main className="min-h-screen bg-gray-50/30 pb-10">
      <div className="bg-white border-b border-gray-100 px-4 py-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <h1 className="text-base font-bold text-gray-900">Centre de confiance</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        <div className="bg-teal-50 border border-teal-100 rounded-2xl p-5 flex gap-3">
          <ShieldCheck size={22} className="text-teal-600 shrink-0" />
          <p className="text-sm text-teal-800 leading-relaxed">
            Tes paiements sont bloqués en séquestre (escrow) chez Ayiba jusqu'à la confirmation de
            ta livraison. Vendeurs et livreurs passent par une vérification d'identité avant de
            pouvoir opérer sur la plateforme.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Lock size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Paiements sécurisés</p>
              <p className="text-xs text-gray-400">Escrow Ayiba, libération après confirmation</p>
            </div>
          </div>

          <div className="flex items-center gap-3 px-4 py-4">
            <Smartphone size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Dernière connexion</p>
              <p className="text-xs text-gray-400">
                {derniereConnexion
                  ? new Date(derniereConnexion).toLocaleString("fr-FR", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })
                  : "—"}
                {email ? ` · ${email}` : ""}
              </p>
            </div>
          </div>

          <Link
            href="/profil/parametres"
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-gray-50 transition-colors"
          >
            <KeyRound size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold text-gray-800">Changer le mot de passe</p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
          </Link>

          <div className="flex items-center gap-3 px-4 py-4 opacity-50">
            <Fingerprint size={18} className="text-gray-400 shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-gray-800">Authentification à deux facteurs</p>
              <p className="text-xs text-gray-400">Bientôt disponible</p>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-gray-400 text-center leading-relaxed px-4">
          L'historique détaillé des appareils connectés et des sessions actives arrive dans une
          prochaine version.
        </p>
      </div>
    </main>
  );
}
