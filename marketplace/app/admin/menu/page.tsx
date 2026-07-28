"use client";

import Link from "next/link";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import {
  Store,
  Truck,
  ShieldCheck,
  ShoppingBag,
  AlertTriangle,
  Wallet,
  Users,
  Package,
  MessageSquare,
  Lock,
  Settings,
  ChevronRight,
} from "lucide-react";

interface MenuLien {
  label: string;
  href: string;
  icon: typeof Store;
  description?: string;
}

interface MenuSection {
  titre: string;
  liens: MenuLien[];
}

// Regroupe tout ce qui n'a pas de place directe dans la bottom bar mobile
// (limitée à 4 onglets : Admin, Utilisateurs, Litiges, Menu). La sidebar
// desktop garde déjà l'accès direct à tout ; cette page est l'équivalent
// mobile du menu complet.
const SECTIONS: MenuSection[] = [
  {
    titre: "Vérifications KYC",
    liens: [
      { label: "Vendeurs", href: "/admin/vendeurs", icon: Store, description: "Dossiers en attente de validation" },
      { label: "Livreurs", href: "/admin/livreurs", icon: Truck, description: "Dossiers en attente de validation" },
    ],
  },
  {
    titre: "Catalogue & contenu",
    liens: [
      { label: "Modération articles", href: "/admin/moderation", icon: ShieldCheck },
      { label: "Catégories", href: "/admin/categories", icon: Package },
      { label: "Avis", href: "/admin/avis", icon: MessageSquare },
    ],
  },
  {
    titre: "Commandes & argent",
    liens: [
      { label: "Commandes", href: "/admin/commandes", icon: ShoppingBag },
      { label: "Paiements & retraits", href: "/admin/paiements", icon: Wallet },
    ],
  },
  {
    titre: "Comptes",
    liens: [
      { label: "Utilisateurs", href: "/admin/utilisateurs", icon: Users, description: "Aussi accessible depuis la bottom bar" },
      { label: "Demandes de suppression", href: "/admin/demandes", icon: Lock },
    ],
  },
  {
    titre: "Système",
    liens: [
      { label: "Litiges", href: "/admin/litiges", icon: AlertTriangle, description: "Aussi accessible depuis la bottom bar" },
      { label: "Paramètres", href: "/admin/parametres", icon: Settings },
    ],
  },
];

export default function AdminMenuPage() {
  return (
    <DashboardLayout role="admin" userName="Admin Ayiba" title="Menu">
      <div className="space-y-8 max-w-xl">
        {SECTIONS.map((section) => (
          <div key={section.titre}>
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">{section.titre}</h3>
            <div className="bg-white rounded-[28px] border border-gray-50 shadow-sm divide-y divide-gray-50 overflow-hidden">
              {section.liens.map((lien) => (
                <Link
                  key={lien.href}
                  href={lien.href}
                  className="p-4 flex items-center gap-4 hover:bg-gray-50/60 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full shrink-0 flex items-center justify-center bg-gray-50 text-gray-500">
                    <lien.icon size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900">{lien.label}</p>
                    {lien.description && <p className="text-xs text-gray-400">{lien.description}</p>}
                  </div>
                  <ChevronRight size={18} className="text-gray-300 shrink-0" />
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </DashboardLayout>
  );
}
