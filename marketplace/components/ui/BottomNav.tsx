"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Search, User, Heart, LayoutDashboard, 
  Package, MessageSquare, Truck, MapPin, ClipboardList, PlusSquare, Briefcase
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { motion } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useUser();
  
  // Utilisation de la logique de rôle que nous avons définie
  const role = profile?.role || "guest";

  // Liste des pages où la bottom nav doit être masquée
  const hideOnPaths = [
    '/auth', '/admin', '/cgu', '/privacy', '/compte-suspendu',
    '/devenir-vendeur', '/devenir-livreur', '/accueil', 
    '/commandes', '/messages', '/favoris', '/historique', 
    '/profil', '/produits'
  ];

  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));
  if (shouldHide) return null;

  // Logique des items par rôle
  const navItems = {
    guest: [
      { label: "Catalogue", icon: Search, href: "/catalogue" },
      { label: "Accueil", icon: Home, href: "/", isCentral: true },
      { label: "Partenaire", icon: Briefcase, href: "/partenaires" },
    ],
    client: [
      { label: "Favoris", icon: Heart, href: "/favoris" },
      { label: "Accueil", icon: Home, href: "/", isCentral: true },
      { label: "Profil", icon: User, href: "/profil" },
    ],
    vendeur: [
      { label: "Articles", icon: Package, href: "/vendeur/articles" },
      { label: "Publier", icon: PlusSquare, href: "/vendeur/articles/nouveau", isCentral: true },
      { label: "Messages", icon: MessageSquare, href: "/vendeur/messages" },
    ],
    livreur: [
      { label: "Missions", icon: Truck, href: "/livreur/missions" },
      { label: "Actives", icon: ClipboardList, href: "/livreur/missions", isCentral: true },
      { label: "Profil", icon: User, href: "/livreur/profil" },
    ],
    admin: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/admin/dashboard" },
      { label: "Modération", icon: Search, href: "/admin/moderation" },
      { label: "Paramètres", icon: User, href: "/admin/parametres" },
    ]
  };

  const currentItems: any[] = navItems[role as keyof typeof navItems] || navItems.guest;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pointer-events-none">
      <motion.nav 
        initial={{ y: 100 }} animate={{ y: 0 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[32px] shadow-2xl shadow-black/10 flex items-center justify-around p-2 pointer-events-auto"
      >
        {currentItems.map((item) => {
          const isActive = pathname === item.href;
          
          // Rendu spécifique pour l'item central "Floating"
          if (item.isCentral) {
            return (
              <Link key={item.label} href={item.href} className="relative -top-8">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.9 }}
                  className="w-16 h-16 bg-white border-4 border-gray-50 rounded-full flex items-center justify-center shadow-lg shadow-black/10 relative"
                >
                  <div className="w-12 h-12 bg-coral-500 rounded-full flex items-center justify-center text-white">
                    <item.icon size={26} strokeWidth={2.5} />
                  </div>
                </motion.div>
              </Link>
            );
          }

          // Rendu des items standards
          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 py-2 px-4">
              <motion.div 
                whileTap={{ scale: 0.9 }} 
                className={`relative transition-colors ${isActive ? "text-coral-500" : "text-gray-400"}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </motion.nav>
    </div>
  );
}
