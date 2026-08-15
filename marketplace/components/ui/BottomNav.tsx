"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { 
  Home, Search, User, Heart, LayoutDashboard, 
  Package, MessageSquare, MapPin, 
  Briefcase, X, Store, Bike,
  ShoppingBag, ShoppingCart, Wallet, Settings, LogOut, Menu as MenuIcon, Plus,
  Users, AlertTriangle, ChevronRight
} from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
import { useLivreurVerificationStatut } from "@/lib/hooks/useLivreurVerificationStatut";
import { createClient } from "@/lib/supabase/client";
import { motion, AnimatePresence, useDragControls } from "framer-motion";
import { LIVREUR_NAV_ITEMS } from "@/lib/constants/livreur-nav";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { useToast } from "@/context/ToastContext";
import { useUiChrome } from "@/context/UiChromeContext";
import { Lock } from "lucide-react";

// Seuils pour fermer un tiroir bottom-sheet au glissement vers le bas :
// soit on a suffisamment tiré (offset), soit le geste était assez rapide
// (velocity) même sur une courte distance — comme les bottom sheets natifs.
function shouldCloseOnSwipeDown(info: { offset: { y: number }; velocity: { y: number } }) {
  return info.offset.y > 120 || info.velocity.y > 500;
}

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { profile, loading, exitDemoMode } = useUser();
  const [isPartnerOpen, setIsPartnerOpen] = useState(false);
  const [isVendeurMenuOpen, setIsVendeurMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const vendeurMenuDragControls = useDragControls();
  const partnerDragControls = useDragControls();
  const { showToast } = useToast();
  const { hideBottomNav } = useUiChrome();

  const role = profile?.role || "guest";
  const badges = useBadgeCounts(profile?.id, role);
  // Onglets Missions/Paiements/Messages verrouillés tant que le dossier KYC
  // n'est pas validé — évite le rebond silencieux vers /livreur/kyc que
  // produisait requireValidLivreur() quand on tapait dessus en attente.
  const { statut: livreurStatut, isValide: isLivreurValide, loading: statutLoading } =
    useLivreurVerificationStatut(role === "livreur");

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
    '/produits', '/vendeur/kyc', '/profil/devenir-vendeur', '/profil/devenir-livreur'
  ];

  // Cas particulier /livreur/kyc : la page sert à la fois pour le wizard actif
  // (formulaire pas encore soumis, ou en train d'être modifié) et pour l'écran
  // de statut "En attente"/"Vérifié" une fois le dossier envoyé. On ne cache
  // la bottom bar que dans le premier cas.
  const dossierDejaSoumis = livreurStatut === "en_attente" || livreurStatut === "valide";
  const isLivreurKycWizardActif =
    pathname.startsWith('/livreur/kyc') && (statutLoading || !dossierDejaSoumis);

  const shouldHide =
    hideOnPaths.some(path => pathname.startsWith(path)) || isLivreurKycWizardActif || hideBottomNav;
  if (shouldHide) return null;

  if (loading) return null;

  // Regroupé par section (au lieu d'une liste plate) pour un tiroir plus
  // lisible — même disposition reprise pour le desktop dans AccountDropdown.
  const vendeurMenuGroups: {
    title: string;
    items: { label: string; icon: typeof Store; href: string; badge?: number; iconBg: string; iconColor: string }[];
  }[] = [
    {
      // Groupe séparé (pas fondu dans "Boutique") pour que ce point d'entrée
      // ressorte bien : c'est le seul endroit dans toute la navigation mobile
      // du dashboard vendeur qui bascule vers le catalogue public — sans lui
      // un vendeur n'a aucun moyen évident d'acheter chez un autre vendeur.
      // Même lien que "Faire des achats" dans AccountDropdown (desktop et
      // header mobile), ajouté ici aussi car ce tiroir est la navigation
      // mobile réellement utilisée au quotidien.
      title: "Acheter",
      items: [
        { label: "Faire des achats", icon: ShoppingBag, href: "/vendeur/catalogue", iconBg: "bg-coral-50", iconColor: "text-coral-500" },
        { label: "Mes achats", icon: ShoppingCart, href: "/vendeur/achats", iconBg: "bg-gray-50", iconColor: "text-gray-600" },
      ],
    },
    {
      title: "Boutique",
      items: [
        { label: "Ma boutique", icon: Store, href: "/vendeur/boutique", iconBg: "bg-teal-50", iconColor: "text-teal-600" },
        { label: "Paiements", icon: Wallet, href: "/vendeur/paiements", iconBg: "bg-amber-50", iconColor: "text-amber-600" },
      ],
    },
    {
      title: "Activité",
      items: [
        { label: "Messages", icon: MessageSquare, href: "/vendeur/messages", badge: badges.messages, iconBg: "bg-coral-50", iconColor: "text-coral-500" },
      ],
    },
    {
      title: "Compte",
      items: [
        { label: "Paramètres", icon: Settings, href: "/vendeur/parametres", iconBg: "bg-gray-100", iconColor: "text-gray-500" },
      ],
    },
  ];
  const vendeurMenuItems = vendeurMenuGroups.flatMap((g) => g.items);
  const vendeurDisplayName = profile?.full_name || "Vendeur";
  const vendeurInitials = vendeurDisplayName
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const navItems = {
    guest: [
      { label: "Accueil", icon: Home, href: "/" },
      { label: "Catalogue", icon: Search, href: "/catalogue" },
      { label: "Explorer", icon: MapPin, href: "/boutiques" },
      { label: "Partenaire", icon: Briefcase, isAction: true },
    ],
    client: [
      { label: "Accueil", icon: Home, href: "/accueil" },
      { label: "Commandes", icon: Package, href: "/commandes", badge: badges.commandes },
      { label: "Favoris", icon: Heart, href: "/favoris" },
      { label: "Messages", icon: MessageSquare, href: "/messages", badge: badges.messages },
      { label: "Compte", icon: User, href: "/menu" },
    ],
    admin: [
      { label: "Admin", icon: LayoutDashboard, href: "/admin/dashboard" },
      { label: "Utilisateurs", icon: Users, href: "/admin/utilisateurs" },
      { label: "Litiges", icon: AlertTriangle, href: "/admin/litiges" },
      { label: "Menu", icon: MenuIcon, href: "/admin/menu" },
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
                drag="y"
                dragControls={vendeurMenuDragControls}
                dragListener={false}
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={{ top: 0, bottom: 1 }}
                onDragEnd={(_, info) => { if (shouldCloseOnSwipeDown(info)) setIsVendeurMenuOpen(false); }}
                className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] shadow-2xl max-h-[85vh] flex flex-col"
              >
                <div
                  onPointerDown={(e) => vendeurMenuDragControls.start(e)}
                  className="relative flex justify-center pt-3 pb-1 shrink-0 cursor-grab active:cursor-grabbing touch-none"
                >
                  <div className="w-10 h-1 rounded-full bg-gray-200" />
                  <button
                    onClick={() => setIsVendeurMenuOpen(false)}
                    className="absolute right-4 top-1 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center"
                    aria-label="Fermer"
                  >
                    <X size={16} />
                  </button>
                </div>

                <div className="overflow-y-auto touch-pan-y">
                  <Link
                    href="/vendeur/parametres"
                    onClick={() => { triggerHaptic(); setIsVendeurMenuOpen(false); }}
                    className="flex items-center justify-between gap-3 px-6 pt-3 pb-5 border-b border-gray-50 hover:bg-gray-50/60 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-coral-50 text-coral-600 flex items-center justify-center overflow-hidden shrink-0">
                        {profile?.avatar_url ? (
                          <img src={profile.avatar_url} alt={vendeurDisplayName} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-sm font-bold">{vendeurInitials}</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-base font-bold text-gray-900 truncate">{vendeurDisplayName}</p>
                        <p className="text-xs text-gray-400 truncate">Vendeur Ayiba</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0" />
                  </Link>

                  <div className="p-6 pt-4 flex flex-col gap-5">
                    {vendeurMenuGroups.map((group) => (
                      <div key={group.title}>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 px-1 mb-1.5">
                          {group.title}
                        </p>
                        <div className="flex flex-col gap-2">
                          {group.items.map((item) => (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => { triggerHaptic(); setIsVendeurMenuOpen(false); }}
                              className="flex items-center justify-between gap-3 p-3 rounded-2xl bg-gray-50/70 hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className={`w-10 h-10 rounded-xl ${item.iconBg} ${item.iconColor} flex items-center justify-center shrink-0`}>
                                  <item.icon size={20} />
                                </div>
                                <span className="font-bold text-sm text-gray-900 truncate">{item.label}</span>
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                {!!item.badge && item.badge > 0 && (
                                  <span className="min-w-[20px] h-5 px-1.5 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                    {item.badge > 9 ? "9+" : item.badge}
                                  </span>
                                )}
                                <ChevronRight size={16} className="text-gray-300" />
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}

                    <button
                      onClick={() => {
                        setIsVendeurMenuOpen(false);
                        setShowLogoutModal(true);
                      }}
                      className="flex items-center gap-3 p-3 rounded-2xl hover:bg-red-50 transition-colors text-left border-t border-gray-50 pt-5"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center">
                        <LogOut size={20} />
                      </div>
                      <span className="font-bold text-sm text-red-600">Déconnexion</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        <LogoutConfirmModal
          open={showLogoutModal}
          onConfirm={confirmLogout}
          onCancel={() => setShowLogoutModal(false)}
        />

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
          {LIVREUR_NAV_ITEMS.map((item) => {
            const isLocked = item.requiresValidation && !statutLoading && !isLivreurValide;

            if (isLocked) {
              return (
                <button
                  key={item.href}
                  onClick={() => {
                    triggerHaptic();
                    showToast("Compte en cours de vérification — accessible sous 24-48h.", "info");
                  }}
                  className="relative flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-2xl min-w-[56px] opacity-40"
                  aria-label={`${item.label} (verrouillé, vérification en cours)`}
                >
                  <div className="relative">
                    <item.icon size={22} className="text-gray-400" />
                    <Lock
                      size={11}
                      strokeWidth={2.5}
                      className="absolute -bottom-1 -right-1.5 text-gray-500 bg-white rounded-full p-[1px]"
                    />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    {item.label}
                  </span>
                </button>
              );
            }

            return (
              <VendeurNavLink
                key={item.href}
                href={item.href}
                icon={item.icon}
                label={item.label}
                badge={item.badgeKey ? badges[item.badgeKey] : undefined}
                pathname={pathname}
                onClick={triggerHaptic}
              />
            );
          })}
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
              transition={{ type: "spring", damping: 28, stiffness: 320 }}
              drag="y"
              dragControls={partnerDragControls}
              dragListener={false}
              dragConstraints={{ top: 0, bottom: 0 }}
              dragElastic={{ top: 0, bottom: 1 }}
              onDragEnd={(_, info) => { if (shouldCloseOnSwipeDown(info)) setIsPartnerOpen(false); }}
              className="fixed bottom-0 left-0 right-0 z-[70] bg-white rounded-t-[32px] shadow-2xl"
            >
              <div
                onPointerDown={(e) => partnerDragControls.start(e)}
                className="flex justify-center pt-3 pb-1 cursor-grab active:cursor-grabbing touch-none"
              >
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="p-6 pt-2">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold">Devenir Partenaire</h3>
                  <button onClick={() => setIsPartnerOpen(false)}><X size={20}/></button>
                </div>
                <div className="flex flex-col gap-3">
                  <Link href={profile ? "/profil/devenir-vendeur" : "/devenir-vendeur"} onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-4 p-4 bg-coral-50 rounded-2xl text-coral-600 font-bold">
                    <Store /> Ouvrir ma boutique
                  </Link>
                  <Link href={profile ? "/profil/devenir-livreur" : "/devenir-livreur"} onClick={() => setIsPartnerOpen(false)} className="flex items-center gap-4 p-4 bg-teal-50 rounded-2xl text-teal-600 font-bold">
                    <Bike /> Devenir livreur
                  </Link>
                </div>
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
