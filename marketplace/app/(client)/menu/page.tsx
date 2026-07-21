"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
import { ClientDashboardHeader } from "@/components/client/ClientDashboardHeader";
import {
  User,
  Heart,
  Clock,
  CreditCard,
  Bell,
  Star,
  LifeBuoy,
  Settings,
  Store,
  Bike,
  ChevronRight,
  MapPin,
  ShieldCheck,
} from "lucide-react";

// Consolide ce qui était éparpillé sur plusieurs onglets de bottom nav
// (Profil, Favoris, Historique) — voir dashboard-client.md, Décision 1 et
// section 8. Chaque ligne pointe vers une page existante ; certaines sections
// (Paramètres, Support, Avis) sont des points d'entrée à construire — voir
// note de fin de fichier.

interface MenuLien {
  label: string;
  href: string;
  icon: typeof User;
  description?: string;
}

interface MenuSection {
  titre: string;
  liens: MenuLien[];
}

const SECTIONS: MenuSection[] = [
  {
    titre: "Mon compte",
    liens: [
      { label: "Profil", href: "/profil", icon: User, description: "Informations, photo, vérification" },
    ],
  },
  {
    titre: "Livraison",
    liens: [{ label: "Mes adresses", href: "/profil", icon: MapPin }],
  },
  {
    titre: "Favoris",
    liens: [
      { label: "Produits & boutiques favoris", href: "/favoris", icon: Heart },
      { label: "Historique", href: "/historique", icon: Clock },
    ],
  },
  {
    titre: "Paiements",
    liens: [{ label: "Historique des paiements", href: "/profil/paiements", icon: CreditCard }],
  },
  {
    titre: "Notifications & avis",
    liens: [
      { label: "Notifications", href: "/profil/notifications", icon: Bell },
      { label: "Mes évaluations", href: "/profil/avis", icon: Star },
    ],
  },
  {
    titre: "Sécurité",
    liens: [
      { label: "Centre de confiance", href: "/menu/confiance", icon: ShieldCheck, description: "Paiements, connexions, mot de passe" },
    ],
  },
  {
    titre: "Support",
    liens: [{ label: "Centre d'aide", href: "/profil/support", icon: LifeBuoy }],
  },
  {
    titre: "Paramètres",
    liens: [{ label: "Langue, confidentialité, sécurité", href: "/profil/parametres", icon: Settings }],
  },
];

export default function MenuPage() {
  const router = useRouter();
  const { profile } = useUser();
  const badges = useBadgeCounts(profile?.id, 'client');

  return (
    <main className="min-h-screen bg-gray-50/30">
      <ClientDashboardHeader
        title="Menu"
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name || undefined}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        onAvatarClick={() => router.push('/profil')}
        logoHref="/accueil"
      />
      <div className="px-4 md:px-8 py-6 md:py-10 max-w-2xl mx-auto w-full">

      {/* Décision 5 : point d'entrée "devenir partenaire" pour un client déjà
          connecté — même contenu visuel que le menu partenaire guest. */}
      <div className="mb-8">
        <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 px-1">
          Devenir partenaire
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <Link
            href="/vendeur/kyc"
            className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-coral-100 hover:shadow-lg hover:shadow-coral-500/5 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500">
              <Store size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Ouvrir ma boutique</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Vends tes produits en ligne</p>
            </div>
          </Link>
          <Link
            href="/livreur/kyc"
            className="flex flex-col gap-3 p-4 bg-white rounded-2xl border border-teal-100 hover:shadow-lg hover:shadow-teal-500/5 transition-all"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
              <Bike size={20} />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">Devenir livreur</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Gagne de l'argent en livrant</p>
            </div>
          </Link>
        </div>
      </div>

      {SECTIONS.map((section) => (
        <div key={section.titre} className="mb-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
            {section.titre}
          </h2>
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
            {section.liens.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className="flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors"
              >
                <lien.icon size={18} className="text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">{lien.label}</p>
                  {lien.description && <p className="text-xs text-gray-400">{lien.description}</p>}
                </div>
                <ChevronRight size={16} className="text-gray-300 shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      ))}
      </div>
    </main>
  );
}

// NOTE D'IMPLÉMENTATION (à lire avant de considérer ce fichier "terminé") :
//
// 1. Toutes les pages du menu existent désormais : /profil (adresses y sont
//    gérées directement), /profil/paiements, /profil/avis, /profil/support,
//    /profil/parametres, /profil/notifications, /menu/confiance.
//
// 2. Les cartes "Ouvrir ma boutique" / "Devenir livreur" pointent directement
//    vers /vendeur/kyc et /livreur/kyc. Or ces pages (voir
//    app/vendeur/kyc/page.tsx et app/livreur/kyc/page.tsx) redirigent si
//    users.role n'est pas déjà "vendeur"/"livreur". Un client authentifié a
//    users.role = "client" : il sera donc redirigé, pas laissé sur le
//    wizard. Il manque une étape avant ce lien — soit un changement de rôle
//    assumé (et alors, un client qui devient vendeur perd-il l'accès à son
//    dashboard client ?), soit un modèle multi-rôles (un users.id peut être
//    à la fois client ET vendeur). C'est une décision d'architecture à
//    trancher avant que ces deux cartes fonctionnent réellement — pas un
//    simple bug de lien.
