"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Search, 
  ShoppingBag, 
  User, 
  Heart, 
  PlusSquare, 
  LayoutDashboard, 
  Package, 
  MessageSquare,
  Truck,
  MapPin,
  ClipboardList
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useCart } from "@/context/CartContext";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const { user, profile } = useUser();
  const { itemCount } = useCart();

  const role = profile?.role || "guest";

  // Hide BottomNav on specific pages
  const hideOnPaths = [
    '/auth',
    '/admin',
    '/cgu',
    '/privacy',
    '/compte-suspendu',
    '/devenir-vendeur',
    '/devenir-livreur',
    '/accueil', // (client) pages have their own bottom nav
    '/commandes',
    '/messages',
    '/favoris',
    '/historique',
    '/profil',
    '/produits',
  ];

  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));

  if (shouldHide) return null;

  const navItems = {
    guest: [
      { label: "Accueil", icon: Home, href: "/" },
      { label: "Catalogue", icon: Search, href: "/catalogue" },
      { label: "Panier", icon: ShoppingBag, href: "/catalogue", isCentral: true, badge: itemCount },
      { label: "Compte", icon: User, href: "/auth/inscription" },
    ],
    client: [
      { label: "Accueil", icon: Home, href: "/" },
      { label: "Favoris", icon: Heart, href: "/favoris" },
      { label: "Panier", icon: ShoppingBag, href: "/catalogue", isCentral: true, badge: itemCount },
      { label: "Profil", icon: User, href: "/profil" },
    ],
    vendeur: [
      { label: "Dashboard", icon: LayoutDashboard, href: "/vendeur/dashboard" },
      { label: "Articles", icon: Package, href: "/vendeur/articles" },
      { label: "Publier", icon: PlusSquare, href: "/vendeur/articles/nouveau", isCentral: true },
      { label: "Messages", icon: MessageSquare, href: "/vendeur/messages" },
    ],
    livreur: [
      { label: "Missions", icon: Truck, href: "/livreur/missions" },
      { label: "Carte", icon: MapPin, href: "/livreur/carte" },
      { label: "Actives", icon: ClipboardList, href: "/livreur/missions", isCentral: true },
      { label: "Profil", icon: User, href: "/livreur/profil" },
    ],
    admin: [
      { label: "Admin", icon: LayoutDashboard, href: "/admin/dashboard" },
      { label: "Modération", icon: Search, href: "/admin/moderation" },
      { label: "Paramètres", icon: User, href: "/admin/parametres" },
    ]
  };

  const currentItems: any[] = navItems[role as keyof typeof navItems] || navItems.guest;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pointer-events-none">
      <motion.nav 
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 20 }}
        className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[32px] shadow-2xl shadow-black/10 flex items-center justify-around p-2 pointer-events-auto"
      >
        {currentItems.map((item, i) => {
          const isActive = pathname === item.href;
          
          if (item.isCentral) {
            return (
              <Link key={item.label} href={item.href} className="relative -top-6">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 + i * 0.1, type: "spring" }}
                  whileTap={{ scale: 0.9 }}
                  className="w-14 h-14 bg-coral-500 rounded-full flex items-center justify-center text-white shadow-xl shadow-coral-500/40 relative"
                >
                  <item.icon size={24} strokeWidth={2.5} />
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-white text-coral-500 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-coral-500">
                      {item.badge}
                    </span>
                  )}
                </motion.div>
              </Link>
            );
          }

          return (
            <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 py-2 px-4">
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                whileTap={{ scale: 0.9 }}
                className={`relative transition-colors ${isActive ? "text-coral-500" : "text-gray-400"}`}
              >
                <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                {isActive && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-coral-500 rounded-full"
                  />
                )}
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
