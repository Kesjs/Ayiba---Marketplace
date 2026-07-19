"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home, Search, User, Heart, LayoutDashboard, 
  Package, MessageSquare, MapPin, 
  Briefcase, X, Store, Bike,
  ShoppingBag, Wallet, Settings, LogOut, Menu as MenuIcon, Plus
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { LIVREUR_NAV_ITEMS } from "@/lib/constants/livreur-nav";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, exitDemoMode } = useUser();
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isVendeurMenuOpen, setIsVendeurMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const role = profile?.role || "guest";
  const badges = useBadgeCounts(profile?.id, role);

  const triggerHaptic = () => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(10);
    }
  };

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    exitDemoMode();
    const supabase = createClient();
    await supabase.auth.signOut();
    setIsVendeurMenuOpen(false);
    router.push("/");
  };

  const hideOnPaths = [
    '/auth', '/cgu', '/privacy', '/compte-suspendu', 
    '/devenir-vendeur', '/devenir-livreur', '/accueil', 
    '/commandes', '/messages', '/favoris', '/historique', 
    '/profil', '/produits'
  ];

  const shouldHide = hideOnPaths.some(path => pathname.startsWith(path));
  if (shouldHide) return null;

  if (loading) return null;

  const vendeurMenuItems = [
    { label: "Messages", icon: MessageSquare, href: "/vendeur/messages", badge: badges.messages },
    { label: "Paiements", icon: Wallet, href: "/vendeur/paiements" },
    { label: "Boutique", icon: Store, href: "/vendeur/boutique" },
    { label: "Paramètres", icon: Settings, href: "/vendeur/parametres" },
  ];

  const navItems = {
    guest: [
      { label: "Accueil", icon: Home, href: "/" },
      { label: "Catalogue", icon: Search, href: "/catalogue" },
      { label: "Explorer", icon: MapPin, href: "/boutiques" },
      { label: "Partenaire", icon: Briefcase, isAction: true },
    ],
    client: [
      { label: "Explorer", icon: Search, href: "/explorer" },
      { label: "Commandes", icon: Package, href: "/commandes", badge: badges.commandes },
      { label: "Accueil", icon: Home, href: "/" },
      { label: "Messages", icon: MessageSquare, href: "/messages", badge: badges.messages },
      { label: "Menu", icon: MenuIcon, href: "/menu" },
    ],
    admin: [
      { label: "Admin", icon: LayoutDashboard, href: "/admin/dashboard" },
      { label: "Modération", icon: Search, href: "/admin/moderation" },
      { label: "Paramètres", icon: User, href: "/admin/parametres" },
    ]
  };

  if (role === "vendeur") {
    const vendeurMenuBadgeTotal = vendeurMenuItems.reduce((sum, item) => sum + (item.badge ?? 0), 0);

    return (
      <>
        <AnimatePresence>
          {isVendeurMenuOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsVendeurMenuOpen(false)}
                className="fixed inset-0 bg-gray-900/40 z-[60] backdrop-blur-sm"
              />
              <motion.div
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 28, stiffness: 320 }}
                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] p-6 shadow-2xl"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Menu</h3>
                  <button onClick={() => setIsVendeurMenuOpen(false)}><X size={20} /></button>
                </div>
                <div className="flex flex-col gap-2">
                  {vendeurMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => { triggerHaptic(); setIsVendeurMenuOpen(false); }}
                      className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-50 text-gray-500 flex items-center justify-center">
                          <item.icon size={20} />
                        </div>
                        <span className="font-bold text-sm text-gray-900">{item.label}</span>
                      </div>
                      {!!item.badge && item.badge > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {item.badge > 9 ? "9+" : item.badge}
                        </span>
                      )}
                    </Link>
                  ))}

                  <button
                    onClick={() => {
                      setIsVendeurMenuOpen(false);
                      setShowLogoutModal(true);
                    }}
                    className="flex items-center gap-3 p-4 rounded-2xl hover:bg-red-50 transition-colors text-left mt-2 border-t border-gray-50 pt-6"
                  >
                    <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                      <LogOut size={20} />
                    </div>
                    <span className="font-bold text-sm text-red-600">Déconnexion</span>
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Nav pleine largeur, collée au bord, fond opaque — plus d'effet flottant */}
        <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
          <nav className="bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
            <VendeurNavLink
              href="/vendeur/dashboard"
              icon={LayoutDashboard}
              label="Dashboard"
              badge={badges.dashboard}
              pathname={pathname}
              onClick={triggerHaptic}
            />

            <VendeurNavLink
              href="/vendeur/articles"
              icon={Package}
              label="Articles"
              pathname={pathname}
              onClick={triggerHaptic}
            />

            <Link
              href="/vendeur/articles/nouveau"
              onClick={triggerHaptic}
              className="relative flex flex-col items-center justify-center -mt-6"
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="w-14 h-14 rounded-2xl bg-coral-500 flex items-center justify-center shadow-lg shadow-coral-500/30 border-4 border-white"
              >
                <Plus size={26} className="text-white" strokeWidth={2.5} />
              </motion.div>
            </Link>

            <VendeurNavLink
              href="/vendeur/commandes"
              icon={ShoppingBag}
              label="Commandes"
              badge={badges.commandes}
              pathname={pathname}
              onClick={triggerHaptic}
            />

            <button
              onClick={() => { triggerHaptic(); setIsVendeurMenuOpen(true); }}
              className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl min-w-[64px]"
            >
              <div className="relative">
                <MenuIcon size={22} className="text-gray-400" />
                {vendeurMenuBadgeTotal > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                    {vendeurMenuBadgeTotal > 9 ? "9+" : vendeurMenuBadgeTotal}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">Menu</span>
            </button>
          </nav>
        </div>
      </>
    );
  }

  if (role === "livreur") {
    // 4 onglets directs, sans tiroir "Menu" : Historique et Paramètres
    // vivent comme raccourcis dans la page Profil.
    return (
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        <nav className="bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {LIVREUR_NAV_ITEMS.map((item) => (
            <VendeurNavLink
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              badge={item.badgeKey ? badges[item.badgeKey] : undefined}
              pathname={pathname}
              onClick={triggerHaptic}
            />
          ))}
        </nav>
      </div>
    );
  }

  const currentItems: any[] = navItems[role as keyof typeof navItems] || navItems.guest;

  return (
    <>
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

      {/* Nav pleine largeur, collée au bord, fond opaque — plus d'effet flottant */}
      <div className="fixed bottom-0 left-0 right-0 z-30 lg:hidden">
        <nav className="bg-white border-t border-gray-100 shadow-[0_-2px_16px_rgba(0,0,0,0.06)] flex items-center justify-around px-2 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {currentItems.map((item) => {
            const isActive = item.href
              ? pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href))
              : false;

            if (item.isAction) {
              return (
                <button
                  key={item.label}
                  onClick={() => { triggerHaptic(); setIsPartnerOpen(true); }}
                  className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl"
                >
                  <item.icon size={22} className="text-gray-400" />
                  <span className="text-[10px] font-bold uppercase text-gray-400">{item.label}</span>
                </button>
              );
            }

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={triggerHaptic}
                className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl min-w-[64px]"
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavActiveIndicator"
                    className="absolute inset-0 bg-coral-50 rounded-2xl -z-10"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}

                <div className="relative">
                  <motion.div whileTap={{ scale: 0.9 }}>
                    <item.icon
                      size={22}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? "text-coral-500" : "text-gray-400"}
                    />
                  </motion.div>

                  {!!item.badge && item.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
                      {item.badge > 9 ? "9+" : item.badge}
                    </span>
                  )}
                </div>

                <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? "text-gray-900" : "text-gray-400"}`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </nav>
      </div>

      <LogoutConfirmModal
        open={showLogoutModal}
        onConfirm={confirmLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </>
  );
}

function VendeurNavLink({
  href, icon: Icon, label, badge, pathname, onClick,
}: {
  href: string; icon: any; label: string; badge?: number; pathname: string; onClick: () => void;
}) {
  const isActive = pathname === href || pathname.startsWith(`${href}/`);
  return (
    <Link
      href={href}
      onClick={onClick}
      className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl min-w-[56px]"
    >
      {isActive && (
        <motion.div
          layoutId="vendeurNavActiveIndicator"
          className="absolute inset-0 bg-coral-50 rounded-2xl -z-10"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        />
      )}
      <div className="relative">
        <motion.div whileTap={{ scale: 0.9 }}>
          <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? "text-coral-500" : "text-gray-400"} />
        </motion.div>
        {!!badge && badge > 0 && (
          <span className="absolute -top-1.5 -right-2 min-w-[16px] h-4 px-1 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center border border-white">
            {badge > 9 ? "9+" : badge}
          </span>
        )}
      </div>
      <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? "text-gray-900" : "text-gray-400"}`}>
        {label}
      </span>
    </Link>
  );
}
