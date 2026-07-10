"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, Search, User, Heart, LayoutDashboard, 
  Package, MessageSquare, Truck, MapPin, ClipboardList, 
  PlusSquare, Briefcase, X, Store, Bike
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { motion, AnimatePresence } from "framer-motion";

export function BottomNav() {
  const pathname = usePathname();
  const { profile } = useUser();
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  
  const role = profile?.role || "guest";

  const hideOnPaths = [
    '/auth', '/admin', '/cgu', '/privacy', '/compte-suspendu', 
    '/devenir-vendeur', '/devenir-livreur', '/accueil', 
    '/commandes', '/messages', '/favoris', '/historique', 
    '/profil', '/produits'
  ];

  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));
  if (shouldHide) return null;

  const navItems = {
    guest: [
      { label: "Catalogue", icon: Search, href: "/catalogue" },
      { label: "Explorer", icon: MapPin, href: "/explorer" },
      { label: "Accueil", icon: Home, href: "/", isCentral: true },
      { label: "Partenaire", icon: Briefcase, isAction: true },
    ],
    client: [
      { label: "Favoris", icon: Heart, href: "/favoris" },
      { label: "Explorer", icon: MapPin, href: "/explorer" },
      { label: "Accueil", icon: Home, href: "/", isCentral: true },
      { label: "Profil", icon: User, href: "/profil" },
    ],
    vendeur: [
      { label: "Articles", icon: Package, href: "/vendeur/articles" },
      { label: "Dashboard", icon: LayoutDashboard, href: "/vendeur/dashboard" },
      { label: "Publier", icon: PlusSquare, href: "/vendeur/articles/nouveau", isCentral: true },
      { label: "Messages", icon: MessageSquare, href: "/vendeur/messages" },
    ],
    livreur: [
      { label: "Missions", icon: Truck, href: "/livreur/missions" },
      { label: "Actives", icon: ClipboardList, href: "/livreur/missions", isCentral: true },
      { label: "Carte", icon: MapPin, href: "/livreur/carte" },
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
    <>
      {/* Menu Partenaire (Bottom Sheet) */}
      <AnimatePresence>
        {isPartnerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsPartnerOpen(false)}
              className="fixed inset-0 bg-gray-900/40 z-[60] backdrop-blur-sm"
            />
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Devenir Partenaire</h3>
                <button onClick={() => setIsPartnerOpen(false)}><X size={20}/></button>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/devenir-vendeur" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-4 p-4 bg-coral-50 rounded-2xl text-coral-600 font-bold">
                  <Store /> Ouvrir ma boutique
                </Link>
                <Link href="/devenir-livreur" onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-4 p-4 bg-teal-50 rounded-2xl text-teal-600 font-bold">
                  <Bike /> Devenir livreur
                </Link>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Barre de navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 lg:hidden px-4 pb-4 pointer-events-none">
        <motion.nav 
          initial={{ y: 100 }} animate={{ y: 0 }}
          className="bg-white/80 backdrop-blur-xl border border-gray-100 rounded-[32px] shadow-2xl shadow-black/10 flex items-center justify-around p-2 pointer-events-auto"
        >
          {currentItems.map((item) => {
            const isActive = pathname === item.href;

            if (item.isAction) {
              return (
                <button key={item.label} onClick={() => setIsPartnerOpen(true)} className="flex flex-col items-center gap-1 py-2 px-4">
                  <item.icon size={22} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase text-gray-400">{item.label}</span>
                </button>
              );
            }
            
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

            return (
              <Link key={item.label} href={item.href} className="flex flex-col items-center gap-1 py-2 px-4">
                <motion.div whileTap={{ scale: 0.9 }}>
                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-coral-500" : "text-gray-400"} />
                </motion.div>
                <span className={`text-[10px] font-bold uppercase tracking-widest ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </motion.nav>
      </div>
    </>
  );
}
