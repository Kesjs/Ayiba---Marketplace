"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Settings, LogOut, LayoutDashboard, X, ChevronDown, Store, Bike, Clock, ShoppingBag, MessageSquare, FileText, ShieldCheck, Heart, MapPin, HelpCircle, PackageSearch, FileQuestion, QrCode, LogIn, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/ui/AuthModal";
import { CartDrawer } from "@/components/ui/CartDrawer";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { useCart } from "@/context/CartContext";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";
import { LogoutConfirmModal } from "@/components/ui/LogoutConfirmModal";
import { LiveSearchBar } from "@/components/ui/LiveSearchBar";

const supabase = createClient();

// Petit badge de rôle affiché à côté du nom dans le header, pour que le
// dropdown "profil" reflète qui est connecté (vendeur, livreur, admin) au
// lieu de rester sur le libellé générique "Mon compte" pour tout le monde.
const ROLE_BADGE: Record<string, { label: string; className: string }> = {
  client: { label: "Client", className: "bg-gray-100 text-gray-600" },
  vendeur: { label: "Vendeur", className: "bg-coral-100 text-coral-600" },
  livreur: { label: "Livreur", className: "bg-teal-100 text-teal-600" },
  admin: { label: "Admin", className: "bg-gray-200 text-gray-600" },
};

// Exemples qui tournent dans le placeholder de la recherche (voir plus bas) —
// scope module pour ne pas recréer le tableau à chaque rendu.
const SEARCH_SUGGESTIONS = [
  "Casque audio JBL",
  "Baskets running",
  "Smartphone Android",
  "Pagne wax",
  "Riz local 25kg",
];

export function Navbar() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [partnerMenuOpen, setPartnerMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [userLocation, setUserLocation] = useState<string>("Cotonou, Bénin");
  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [helpMenuOpen, setHelpMenuOpen] = useState(false);

  const [user, setUser] = useState<any>(null);
  const { profile } = useUser();
  const userRole = profile?.role ?? null;
  const displayName = profile?.full_name || "Mon compte";
  const roleBadge = userRole ? ROLE_BADGE[userRole] : undefined;

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const helpMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("ayiba_user_location");
      if (saved) setUserLocation(saved);
    }
  }, []);

  // Menu compte au clic (et non plus au survol) : plus fiable sur desktop
  // (trackpad, clic qui traverse la zone de survol) et fermeture au clic en
  // dehors, comme ClientDashboardHeader/AccountDropdown le font déjà ailleurs.
  useEffect(() => {
    if (!userMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen]);

  useEffect(() => {
    if (!helpMenuOpen) return;
    function handleClickOutside(e: MouseEvent) {
      if (helpMenuRef.current && !helpMenuRef.current.contains(e.target as Node)) {
        setHelpMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [helpMenuOpen]);

  // Placeholder animé de la barre de recherche : quelques exemples concrets
  // qui tournent tant que le champ n'est ni focus ni rempli — remplace le
  // "Que cherchez-vous ?" statique par quelque chose qui donne tout de suite
  // une idée de ce qu'on peut trouver sur Ayiba (pattern courant sur les
  // grandes marketplaces). Suspendu au focus/saisie pour ne pas gêner.
  useEffect(() => {
    if (isSearchFocused || searchQuery || showSearchOverlay) return;
    const interval = setInterval(() => {
      setPlaceholderIndex((i) => (i + 1) % SEARCH_SUGGESTIONS.length);
    }, 2600);
    return () => clearInterval(interval);
  }, [isSearchFocused, searchQuery, showSearchOverlay]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        if (window.innerWidth >= 768) {
          searchInputRef.current?.focus();
        } else {
          setShowSearchOverlay(true);
          setTimeout(() => mobileSearchInputRef.current?.focus(), 100);
        }
      }

      if (e.key === "Escape") {
        if (showSearchOverlay) {
          setShowSearchOverlay(false);
          setSearchQuery("");
        } else if (document.activeElement === searchInputRef.current) {
          if (searchQuery) {
            setSearchQuery("");
          } else {
            searchInputRef.current?.blur();
          }
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showSearchOverlay, searchQuery]);

  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 24);
    }
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = mobileOpen ? "hidden" : "";
    }
    return () => { 
      if (typeof document !== 'undefined') {
        document.body.style.overflow = ""; 
      }
    };
  }, [mobileOpen]);

  // `profile` (rôle, avatar, nom complet) vient désormais de useUser() —
  // seule la session brute (`user`, pour les cas où on veut son id/phone)
  // reste suivie ici, en simple miroir de useUser (pas besoin de re-requêter
  // "users" nous-mêmes : c'était la version dupliquée, plus limitée, qui
  // n'exposait ni avatar_url ni full_name, d'où le "Mon compte" générique
  // affiché même pour un vendeur connecté).
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: any } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  const confirmLogout = async () => {
    setShowLogoutModal(false);
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/recherche?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchOverlay(false);
      setMobileOpen(false);
      setSearchQuery("");
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    router.push(`/recherche?q=${encodeURIComponent(suggestion)}`);
    setShowSearchOverlay(false);
  };

  // Icône compte mobile : ouvre le drawer mobile (choix connexion, devenir vendeur/livreur pour visiteur, ou dashboard pour connecté)
  const handleAccountIconClick = () => {
    setMobileOpen(true);
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 md:h-16 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            : "bg-coral-50/60 backdrop-blur-sm"
        }`}
      >
        <div className="flex items-center justify-between h-14 md:h-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full gap-4 md:gap-8">
          <div className="flex items-center gap-3 md:gap-4 shrink-0">
            <a href="/" className="flex items-center shrink-0 opacity-100 hover:opacity-80 transition-opacity duration-200">
              <LogoAyiba className="h-8 w-auto md:h-10" />
            </a>
          </div>

          {/* Barre de recherche dynamique LiveSearchBar (Desktop) */}
          <div className="hidden md:flex flex-1 max-w-2xl">
            <LiveSearchBar />
          </div>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {/* Menu Devenir Partenaire Dropdown (Desktop) */}
            {!user && (
              <div 
                className="relative group/partner" 
                onMouseEnter={() => setPartnerMenuOpen(true)}
                onMouseLeave={() => setPartnerMenuOpen(false)}
              >
                <button
                  onClick={() => setPartnerMenuOpen((v) => !v)}
                  className="text-[13px] font-semibold text-gray-700 hover:text-coral-500 flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-3 md:py-2 rounded-lg bg-gray-50/50 hover:bg-coral-50 transition-all duration-300 border border-transparent hover:border-coral-100 cursor-pointer"
                >
                  <Store size={16} className="text-gray-500 group-hover/partner:text-coral-500 transition-colors" />
                  <span className="hidden sm:inline">Devenir Partenaire</span>
                  <ChevronDown size={14} className={`hidden sm:inline transition-transform duration-300 ${partnerMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute right-0 top-full pt-2 w-64 origin-top-right transition-all duration-300 z-50 ${partnerMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-2">
                    <div className="flex flex-col gap-1">
                      <a 
                        href="/devenir-vendeur" 
                        onClick={() => setPartnerMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-coral-50 rounded-xl text-gray-700 hover:text-coral-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center text-coral-500 group-hover/item:bg-white shadow-xs shrink-0">
                          <Store size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Devenir Vendeur</span>
                          <span className="text-[10px] text-gray-400 font-medium">Ouvrez votre boutique</span>
                        </div>
                      </a>

                      <a 
                        href="/devenir-livreur" 
                        onClick={() => setPartnerMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-teal-50 rounded-xl text-gray-700 hover:text-teal-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover/item:bg-white shadow-xs shrink-0">
                          <Bike size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Devenir Livreur</span>
                          <span className="text-[10px] text-gray-400 font-medium">Gagnez des revenus</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Menu Aide Dropdown (Desktop & Mobile trigger) */}
            <div 
              className="relative group/help" 
              ref={helpMenuRef}
              onMouseEnter={() => setHelpMenuOpen(true)}
              onMouseLeave={() => setHelpMenuOpen(false)}
            >
              <button
                onClick={() => setHelpMenuOpen((v) => !v)}
                className="text-[13px] font-semibold text-gray-700 hover:text-coral-500 flex items-center gap-1 md:gap-1.5 px-2 py-1.5 md:px-3 md:py-2 rounded-lg bg-gray-50/50 hover:bg-coral-50 transition-all duration-300 border border-transparent hover:border-coral-100 cursor-pointer"
              >
                <HelpCircle size={16} className="text-gray-500 group-hover/help:text-coral-500 transition-colors" />
                <span className="hidden sm:inline">Aide</span>
                <ChevronDown size={14} className={`hidden sm:inline transition-transform duration-300 ${helpMenuOpen ? "rotate-180" : ""}`} />
              </button>

              <div className={`absolute right-0 top-full pt-2 w-64 origin-top-right transition-all duration-300 z-50 ${helpMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden p-2">
                  <div className="flex flex-col gap-1">
                    <a 
                      href="/faq" 
                      onClick={() => setHelpMenuOpen(false)} 
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-coral-50 rounded-xl text-gray-700 hover:text-coral-600 transition-all group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center text-coral-500 group-hover/item:bg-white shadow-xs shrink-0">
                        <FileQuestion size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold">Questions fréquentes (FAQ)</span>
                        <span className="text-[10px] text-gray-400 font-medium">Réponses instantanées</span>
                      </div>
                    </a>

                    <a 
                      href="/centre-aide" 
                      onClick={() => setHelpMenuOpen(false)} 
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-amber-50 rounded-xl text-gray-700 hover:text-amber-600 transition-all group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover/item:bg-white shadow-xs shrink-0">
                        <HelpCircle size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold">Centre d'assistance</span>
                        <span className="text-[10px] text-gray-400 font-medium">Guides & assistance client</span>
                      </div>
                    </a>

                    <a 
                      href="/politique-livraison" 
                      onClick={() => setHelpMenuOpen(false)} 
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-teal-50 rounded-xl text-gray-700 hover:text-teal-600 transition-all group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover/item:bg-white shadow-xs shrink-0">
                        <QrCode size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold">Livraison & Code secret</span>
                        <span className="text-[10px] text-gray-400 font-medium">Validation sécurisée de réception</span>
                      </div>
                    </a>

                    <a 
                      href="/politique-remboursement" 
                      onClick={() => setHelpMenuOpen(false)} 
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-rose-50 rounded-xl text-gray-700 hover:text-rose-600 transition-all group/item"
                    >
                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 group-hover/item:bg-white shadow-xs shrink-0">
                        <ShieldCheck size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold">Paiement & Retours</span>
                        <span className="text-[10px] text-gray-400 font-medium">Garantie Escrow & Remboursement</span>
                      </div>
                    </a>

                    <a 
                      href="/contact" 
                      onClick={() => setHelpMenuOpen(false)} 
                      className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-gray-50 rounded-xl text-gray-700 hover:text-gray-900 transition-all group/item border-t border-gray-100 mt-1 pt-3"
                    >
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover/item:bg-white shadow-xs shrink-0">
                        <MessageSquare size={16} />
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-xs font-bold">Nous contacter</span>
                        <span className="text-[10px] text-gray-400 font-medium">Formulaire de support</span>
                      </div>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            <button onClick={openCart} className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors duration-200" aria-label="Voir le panier">
              <ShoppingCart size={20} className="text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-400 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {!user && (
              <button onClick={() => setAuthModalOpen(true)} className="bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl px-5 py-2 text-sm transition-all duration-200 active:scale-95 shadow-md shadow-coral-500/20 cursor-pointer">
                Connexion
              </button>
            )}

            {user && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setUserMenuOpen((v) => !v)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all duration-300"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-coral-50 border border-coral-100 flex items-center justify-center shrink-0">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                    ) : (
                      <User size={16} className="text-coral-400" />
                    )}
                  </div>
                  <span className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-gray-700 max-w-[90px] truncate">{displayName}</span>
                    {roleBadge && (
                      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
                        {roleBadge.label}
                      </span>
                    )}
                  </span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute right-0 top-full pt-2 w-56 origin-top-right transition-all duration-300 ${userMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="px-4 py-4 bg-gray-50/50 border-b border-gray-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full overflow-hidden bg-coral-50 border border-coral-100 flex items-center justify-center shrink-0">
                          {profile?.avatar_url ? (
                            <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                          ) : (
                            <User size={18} className="text-coral-400" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-medium">{profile?.phone || user?.phone || ""}</p>
                        </div>
                      </div>
                      {roleBadge && (
                        <span className={`inline-block mt-2.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
                          {roleBadge.label}
                        </span>
                      )}
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      {/* Pour un client, "Accueil" (la redirection de rôle) pointe
                          désormais vers "/" — déjà la page courante la plupart du
                          temps et déjà accessible via le logo, donc pas de lien
                          dédié ici. Les autres rôles gardent leur propre dashboard. */}
                      {userRole !== "client" && (
                        <a href={userRole && isValidRole(userRole) ? getRedirectPathForRole(userRole) : "/"} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                          <LayoutDashboard size={18} className="text-gray-400" />
                          <span>Mon dashboard</span>
                        </a>
                      )}
                      {userRole === "vendeur" ? (
                        <>
                          <a href="/commandes" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                            <ShoppingBag size={18} className="text-gray-400" />
                            <span>Mes achats</span>
                          </a>
                          <a href="/vendeur/commandes" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                            <Store size={18} className="text-gray-400" />
                            <span>Mes ventes</span>
                          </a>
                        </>
                      ) : (
                        <a href="/commandes" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                          <ShoppingBag size={18} className="text-gray-400" />
                          <span>Mes commandes</span>
                        </a>
                      )}
                      {userRole === "client" && (
                        <>
                          <a href="/favoris" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                            <Heart size={18} className="text-gray-400" />
                            <span>Favoris</span>
                          </a>
                          <a href="/messages" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                            <MessageSquare size={18} className="text-gray-400" />
                            <span>Messages</span>
                          </a>
                        </>
                      )}
                      {userRole === "client" ? (
                        <a href="/menu" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                          <Settings size={18} className="text-gray-400" />
                          <span>Compte</span>
                        </a>
                      ) : (
                        <a href="/profil" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                          <Settings size={18} className="text-gray-400" />
                          <span>Mon profil</span>
                        </a>
                      )}
                    </div>
                    <div className="h-px bg-gray-100 mx-2" />
                    <div className="p-2">
                      <button onClick={() => { setUserMenuOpen(false); setShowLogoutModal(true); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 rounded-xl transition-all text-left text-sm text-red-500 font-bold">
                        <LogOut size={18} />
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-1 shrink-0">
            {/* Bouton Aide Mobile avec menu déroulant */}
            <div className="relative">
              <button
                onClick={() => setHelpMenuOpen((v) => !v)}
                className="p-1.5 text-gray-700 hover:text-coral-500 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                aria-label="Aide"
              >
                <HelpCircle size={19} />
              </button>

              {helpMenuOpen && (
                <div className="absolute right-0 top-full pt-2 w-64 origin-top-right z-50 shadow-2xl">
                  <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden p-2">
                    <div className="flex flex-col gap-1">
                      <a 
                        href="/faq" 
                        onClick={() => setHelpMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-coral-50 rounded-xl text-gray-700 hover:text-coral-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center text-coral-500 group-hover/item:bg-white shadow-xs shrink-0">
                          <FileQuestion size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Questions fréquentes (FAQ)</span>
                          <span className="text-[10px] text-gray-400 font-medium">Réponses instantanées</span>
                        </div>
                      </a>

                      <a 
                        href="/centre-aide" 
                        onClick={() => setHelpMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-amber-50 rounded-xl text-gray-700 hover:text-amber-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 group-hover/item:bg-white shadow-xs shrink-0">
                          <HelpCircle size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Centre d'assistance</span>
                          <span className="text-[10px] text-gray-400 font-medium">Guides & assistance client</span>
                        </div>
                      </a>

                      <a 
                        href="/politique-livraison" 
                        onClick={() => setHelpMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-teal-50 rounded-xl text-gray-700 hover:text-teal-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover/item:bg-white shadow-xs shrink-0">
                          <QrCode size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Livraison & Code secret</span>
                          <span className="text-[10px] text-gray-400 font-medium">Validation sécurisée de réception</span>
                        </div>
                      </a>

                      <a 
                        href="/politique-remboursement" 
                        onClick={() => setHelpMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-rose-50 rounded-xl text-gray-700 hover:text-rose-600 transition-all group/item"
                      >
                        <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 group-hover/item:bg-white shadow-xs shrink-0">
                          <ShieldCheck size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Paiement & Retours</span>
                          <span className="text-[10px] text-gray-400 font-medium">Garantie Escrow & Remboursement</span>
                        </div>
                      </a>

                      <a 
                        href="/contact" 
                        onClick={() => setHelpMenuOpen(false)} 
                        className="flex items-center gap-3 w-full px-3.5 py-2.5 hover:bg-gray-50 rounded-xl text-gray-700 hover:text-gray-900 transition-all group/item border-t border-gray-100 mt-1 pt-3"
                      >
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 group-hover/item:bg-white shadow-xs shrink-0">
                          <MessageSquare size={16} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-xs font-bold">Nous contacter</span>
                          <span className="text-[10px] text-gray-400 font-medium">Formulaire de support</span>
                        </div>
                      </a>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Bouton Panier Mobile */}
            <button onClick={openCart} className="relative p-1.5 text-gray-700 hover:text-coral-500 rounded-lg hover:bg-gray-50 transition-colors" aria-label="Voir le panier">
              <ShoppingCart size={19} />
              {itemCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-coral-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {/* Icône compte mobile (Pilule d'origine) */}
            <button
              onClick={handleAccountIconClick}
              className="h-10 flex items-center justify-center rounded-full border border-coral-200 hover:border-coral-300 transition-colors overflow-hidden shrink-0 ml-1 cursor-pointer"
              aria-label={!user ? "Connexion ou inscription" : "Menu du compte"}
            >
              <span className="flex items-center justify-center px-3 h-full">
                <User size={19} strokeWidth={2} className="text-gray-900" />
              </span>
              <span className="w-px h-5 bg-coral-200" />
              <span className="flex items-center justify-center px-2.5 h-full">
                <ChevronDown size={14} strokeWidth={2.25} className="text-gray-900" />
              </span>
            </button>
          </div>
        </div>

        {/* Ligne 2 mobile : barre de recherche dynamique pleine largeur */}
        <div className="md:hidden px-4 pb-3">
          <LiveSearchBar />
        </div>
      </header>

      {showSearchOverlay && (
        <div className="fixed inset-0 z-[70] md:hidden bg-white flex flex-col">
          <div className="h-14 border-b flex items-center px-4 bg-white">
            <button onClick={() => { setShowSearchOverlay(false); setSearchQuery(""); }} className="mr-3 p-2 -ml-2">
              <X size={24} className="text-gray-600" />
            </button>
            <form onSubmit={handleSearch} className="flex-1 relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-coral-500">
                <Search size={20} />
              </div>
              <input
                ref={mobileSearchInputRef}
                type="text"
                placeholder="Que cherchez-vous ?"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-gray-100 rounded-full py-3 pl-12 pr-4 text-base outline-none"
                autoFocus
              />
            </form>
          </div>

          <div className="flex-1 p-4 overflow-auto">
            {searchQuery.length === 0 ? (
              <>
                <p className="text-xs uppercase tracking-widest text-gray-400 mb-3">Recherches récentes</p>
                <div className="space-y-1">
                  {["iPhone 13", "Moto neuve", "Pagne wax", "Riz local", "Chaussures"].map((item, i) => (
                    <button key={i} onClick={() => handleSuggestionClick(item)} className="flex items-center gap-3 w-full p-3 hover:bg-gray-50 rounded-xl text-left">
                      <Clock size={18} className="text-gray-400" />
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-gray-500">Recherche...</div>
            )}
          </div>
        </div>
      )}

      {/* Drawer mobile : ne s'ouvre plus que pour un utilisateur connecté (voir handleAccountIconClick).
          Le contenu "visiteur non connecté" a été retiré : ces liens (CGU, Confidentialité) vivent déjà
          dans le footer, et l'action de connexion ouvre désormais l'AuthModal directement. */}
      <div className={`fixed inset-0 z-[60] md:hidden transition-opacity duration-300 ${mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        <div className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className={`absolute top-0 right-0 h-full w-[85%] max-w-xs bg-white shadow-xl transition-transform duration-300 ease-out flex flex-col ${mobileOpen ? "translate-x-0" : "translate-x-full"}`}>
          <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100">
            <LogoAyiba className="h-8 w-auto" />
            <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50" aria-label="Fermer le menu">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
            {!user ? (
              <div className="flex flex-col gap-5">
                {/* Section Devenir Partenaire */}
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-2 px-1">
                    Rejoindre Ayiba (Partenaire)
                  </p>
                  <div className="flex flex-col gap-2">
                    <a
                      href="/devenir-vendeur"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-coral-50 text-coral-600 flex items-center justify-center shrink-0">
                          <Store size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">Devenir Vendeur</p>
                          <p className="text-xs text-gray-500 truncate">Ouvrez votre boutique en ligne</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </a>

                    <a
                      href="/devenir-livreur"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center justify-between p-3.5 rounded-2xl bg-gray-50/80 border border-gray-100 hover:bg-gray-100 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
                          <Bike size={20} />
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-gray-900 truncate">Devenir Livreur</p>
                          <p className="text-xs text-gray-500 truncate">Livrez des commandes et gagnez des revenus</p>
                        </div>
                      </div>
                      <ChevronRight size={16} className="text-gray-300 shrink-0" />
                    </a>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <a href={userRole && isValidRole(userRole) ? getRedirectPathForRole(userRole) : "/"} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <LayoutDashboard size={20} className="text-gray-400" />
                  <span>{userRole === "client" ? "Découvrir la boutique" : "Mon dashboard"}</span>
                </a>
                {userRole === "vendeur" ? (
                  <>
                    <a href="/commandes" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                      <ShoppingBag size={20} className="text-gray-400" />
                      <span>Mes achats</span>
                    </a>
                    <a href="/vendeur/commandes" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                      <Store size={20} className="text-gray-400" />
                      <span>Mes ventes</span>
                    </a>
                  </>
                ) : (
                  <a href="/commandes" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                    <ShoppingBag size={20} className="text-gray-400" />
                    <span>Mes commandes</span>
                  </a>
                )}
                <a href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <MessageSquare size={20} className="text-gray-400" />
                  <span>Messages</span>
                </a>

                <div className="h-px bg-gray-100 my-2 mx-4" />
                <button
                  onClick={() => { setMobileOpen(false); setLocationModalOpen(true); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-coral-50 text-coral-600 transition-colors text-sm font-bold text-left"
                >
                  <MapPin size={20} className="text-coral-500" />
                  <span>Lieu : {userLocation}</span>
                </button>
                <a href="/faq" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <FileQuestion size={20} className="text-gray-400" />
                  <span>Questions fréquentes (FAQ)</span>
                </a>
                <a href="/centre-aide" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <HelpCircle size={20} className="text-gray-400" />
                  <span>Centre d'assistance</span>
                </a>
                <a href="/cgu" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <FileText size={20} className="text-gray-400" />
                  <span>Conditions générales</span>
                </a>
                <a href="/privacy" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                  <ShieldCheck size={20} className="text-gray-400" />
                  <span>Confidentialité</span>
                </a>

                <button onClick={() => { setMobileOpen(false); setShowLogoutModal(true); }} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-sm font-medium text-left mt-2">
                  <LogOut size={20} />
                  <span>Déconnexion</span>
                </button>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            {user ? (
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full overflow-hidden bg-coral-50 border border-coral-100 flex items-center justify-center shrink-0">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-full h-full object-cover" />
                  ) : (
                    <User size={16} className="text-coral-400" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 px-0 truncate">{displayName}</p>
                  {roleBadge && (
                    <span className={`inline-block mt-0.5 text-[9px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${roleBadge.className}`}>
                      {roleBadge.label}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => { setMobileOpen(false); setAuthModalOpen(true); }}
                className="w-full bg-coral-500 hover:bg-coral-600 text-white font-bold rounded-xl py-3 px-4 text-sm flex items-center justify-center gap-2 shadow-md shadow-coral-500/20 active:scale-95 transition-all cursor-pointer"
              >
                <LogIn size={18} />
                <span>Se connecter / S'inscrire</span>
              </button>
            )}
          </div>
        </div>
      </div>


      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      <CartDrawer />
      <LogoutConfirmModal
        open={showLogoutModal}
        onCancel={() => setShowLogoutModal(false)}
        onConfirm={confirmLogout}
      />

      {/* Modale Choix de localisation (Style Amazon) */}
      <AnimatePresence>
        {locationModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4"
            onClick={() => setLocationModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full relative shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setLocationModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-coral-50 flex items-center justify-center text-coral-500 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Choisir votre lieu de livraison</h3>
                  <p className="text-xs text-gray-500">Les offres et délais seront adaptés à votre zone</p>
                </div>
              </div>

              {/* Bouton Géolocalisation automatique */}
              <button
                onClick={() => {
                  if (navigator.geolocation) {
                    navigator.geolocation.getCurrentPosition(
                      () => {
                        const loc = "Cotonou (détecté)";
                        setUserLocation(loc);
                        localStorage.setItem("ayiba_user_location", loc);
                        setLocationModalOpen(false);
                      },
                      () => {
                        setUserLocation("Cotonou, Bénin");
                        localStorage.setItem("ayiba_user_location", "Cotonou, Bénin");
                        setLocationModalOpen(false);
                      }
                    );
                  }
                }}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-coral-500 text-white font-bold text-sm hover:bg-coral-600 transition-colors mb-4 shadow-md shadow-coral-500/20 cursor-pointer"
              >
                <MapPin size={16} />
                Détecter ma position actuelle
              </button>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-100"></div>
                <span className="shrink mx-3 text-xs text-gray-400 font-semibold uppercase">ou choisir une commune</span>
                <div className="flex-grow border-t border-gray-100"></div>
              </div>

              {/* Liste des communes principales */}
              <div className="grid grid-cols-2 gap-2 mt-3 max-h-60 overflow-y-auto no-scrollbar">
                {["Cotonou", "Abomey-Calavi", "Porto-Novo", "Parakou", "Bohicon", "Ouidah", "Sèmè-Kpodji", "Natitingou", "Djougou", "Lokossa"].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      const fullLoc = `${city}, Bénin`;
                      setUserLocation(fullLoc);
                      localStorage.setItem("ayiba_user_location", fullLoc);
                      setLocationModalOpen(false);
                    }}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold text-left transition-all cursor-pointer ${
                      userLocation.startsWith(city)
                        ? "border-coral-500 bg-coral-50 text-coral-600"
                        : "border-gray-100 hover:border-gray-200 bg-gray-50/50 text-gray-700"
                    }`}
                  >
                    📍 {city}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
