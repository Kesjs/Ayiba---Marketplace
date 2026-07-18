"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, ShoppingCart, User, Settings, LogOut, LayoutDashboard, X, ChevronDown, Store, Bike, Clock, ShoppingBag, MessageSquare, FileText, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/ui/AuthModal";
import { CartDrawer } from "@/components/ui/CartDrawer";
import LogoAyiba from "@/components/ui/LogoAyiba";
import { useCart } from "@/context/CartContext";
import { createClient } from "@/lib/supabase/client";
import { getRedirectPathForRole, isValidRole } from "@/lib/auth-utils";

const supabase = createClient();

export function Navbar() {
  const router = useRouter();
  const { itemCount, openCart } = useCart();
  
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [partnerMenuOpen, setPartnerMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intendedRole, setIntendedRole] = useState<"vendeur" | "livreur" | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileSearchInputRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    async function fetchUser() {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        const { data: userData } = await supabase
          .from("users")
          .select("role, nom")
          .eq("id", session.user.id)
          .single();
        setUserRole(userData?.role || null);
      }
    }
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event: any, session: any) => {
        if (session?.user) {
          setUser(session.user);
          const { data: userData } = await supabase
            .from("users")
            .select("role, nom")
            .eq("id", session.user.id)
            .single();
          setUserRole(userData?.role || null);
        } else {
          setUser(null);
          setUserRole(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/auth/inscription";
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

  // Icône compte mobile : visiteur non connecté -> ouvre l'AuthModal directement.
  // Utilisateur connecté -> ouvre le drawer (dashboard, commandes, messages, déconnexion).
  const handleAccountIconClick = () => {
    if (!user) {
      setIntendedRole(null);
      setAuthModalOpen(true);
    } else {
      setMobileOpen(true);
    }
  };

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-14 md:h-16 transition-all duration-300 ${
          scrolled
            ? "bg-white/90 backdrop-blur-md shadow-[0_4px_20px_rgba(0,0,0,0.03)]"
            : "bg-coral-50/60 backdrop-blur-sm"
        }`}
      >
        <div className="flex items-center justify-between h-full px-4 md:px-8 lg:px-12 max-w-7xl mx-auto w-full gap-4 md:gap-8">
          <a href="/" className="flex items-center shrink-0 opacity-100 hover:opacity-80 transition-opacity duration-200">
            <LogoAyiba className="h-8 w-auto md:h-10" />
          </a>

          <form 
            onSubmit={handleSearch} 
            className={`hidden md:flex relative group items-center transition-all duration-300 ease-in-out ${
              isSearchFocused ? "flex-[2] max-w-3xl" : "flex-1 max-w-lg"
            }`}
          >
            <div className={`absolute left-4 transition-colors pointer-events-none ${
              isSearchFocused ? "text-coral-500" : "text-gray-400"
            }`}>
              <Search size={18} />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Que cherchez-vous ?"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
              className="w-full bg-gray-50/50 border border-gray-100 rounded-full py-2.5 pl-11 pr-12 text-sm outline-none focus:bg-white focus:border-coral-300 focus:ring-4 focus:ring-coral-50/50 transition-all duration-300"
            />
            
            <div className="absolute right-3 flex items-center gap-1.5">
              {searchQuery ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <div className={`flex items-center justify-center w-5 h-5 border border-gray-200 rounded text-[10px] text-gray-400 font-medium ${isSearchFocused ? "opacity-0" : "opacity-100"}`}>
                  /
                </div>
              )}
            </div>
          </form>

          <div className="hidden md:flex items-center gap-4 shrink-0">
            {!user && (
              <div 
                className="relative group/partner" 
                onMouseEnter={() => setPartnerMenuOpen(true)}
                onMouseLeave={() => setPartnerMenuOpen(false)}
              >
                <button
                  className="text-[13px] font-semibold text-gray-700 hover:text-coral-500 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gray-50/50 hover:bg-coral-50 transition-all duration-300 border border-transparent hover:border-coral-100"
                >
                  <span>Devenir partenaire</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${partnerMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute left-0 top-full pt-2 w-56 origin-top-left transition-all duration-300 ${partnerMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="p-2 flex flex-col gap-1">
                      <button onClick={() => { setIntendedRole("vendeur"); setPartnerMenuOpen(false); setAuthModalOpen(true); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-coral-50 rounded-xl text-gray-700 hover:text-coral-500 transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-coral-50 flex items-center justify-center text-coral-500 group-hover/item:bg-white shadow-xs">
                          <Store size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold">Ouvrir ma boutique</span>
                          <span className="text-[10px] text-gray-400 font-medium">Vendez vos produits en ligne</span>
                        </div>
                      </button>
                      <button onClick={() => { setIntendedRole("livreur"); setPartnerMenuOpen(false); setAuthModalOpen(true); }} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-teal-50 rounded-xl text-gray-700 hover:text-teal-600 transition-all group/item">
                        <div className="w-8 h-8 rounded-lg bg-teal-50 flex items-center justify-center text-teal-600 group-hover/item:bg-white shadow-xs">
                          <Bike size={18} />
                        </div>
                        <div className="flex flex-col text-left">
                          <span className="text-sm font-bold">Devenir livreur</span>
                          <span className="text-[10px] text-gray-400 font-medium">Gagnez de l'argent en livrant</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <button onClick={openCart} className="relative w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50 transition-colors duration-200" aria-label="Voir le panier">
              <ShoppingCart size={20} className="text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-coral-400 text-white text-[10px] font-semibold rounded-full flex items-center justify-center">
                  {itemCount > 9 ? '9+' : itemCount}
                </span>
              )}
            </button>

            {!user && (
              <button onClick={() => { setIntendedRole(null); setAuthModalOpen(true); }} className="bg-coral-400 text-white rounded-lg px-4 py-2 text-sm font-semibold hover:bg-coral-500 transition-all duration-300 active:scale-[0.97] shadow-lg shadow-coral-400/20">
                Connexion
              </button>
            )}

            {user && (
              <div className="relative group/user" onMouseEnter={() => setUserMenuOpen(true)} onMouseLeave={() => setUserMenuOpen(false)}>
                <button className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg hover:bg-gray-50 transition-all duration-300">
                  <div className="w-8 h-8 bg-coral-50 border border-coral-100 rounded-full flex items-center justify-center">
                    <User size={16} className="text-coral-400" />
                  </div>
                  <span className="text-sm font-semibold text-gray-700 max-w-[100px] truncate">{user?.user_metadata?.nom || "Mon compte"}</span>
                  <ChevronDown size={14} className={`transition-transform duration-300 ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>

                <div className={`absolute right-0 top-full pt-2 w-56 origin-top-right transition-all duration-300 ${userMenuOpen ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 -translate-y-2 pointer-events-none"}`}>
                  <div className="bg-white border border-gray-100 shadow-2xl rounded-2xl overflow-hidden">
                    <div className="px-4 py-4 bg-gray-50/50 border-b border-gray-100">
                      <p className="text-sm font-bold text-gray-900 truncate">{user?.user_metadata?.nom || "Mon compte"}</p>
                      <p className="text-[11px] text-gray-400 mt-1 font-medium">{user?.phone || ""}</p>
                    </div>
                    <div className="p-2 flex flex-col gap-1">
                      <a href={userRole && isValidRole(userRole) ? getRedirectPathForRole(userRole) : "/"} className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                        <LayoutDashboard size={18} className="text-gray-400" />
                        <span>Mon dashboard</span>
                      </a>
                      <a href="/profil" className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 rounded-xl transition-all text-sm text-gray-700 font-medium">
                        <Settings size={18} className="text-gray-400" />
                        <span>Mon profil</span>
                      </a>
                    </div>
                    <div className="h-px bg-gray-100 mx-2" />
                    <div className="p-2">
                      <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 hover:bg-red-50 rounded-xl transition-all text-left text-sm text-red-500 font-bold">
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
            <button
              onClick={() => {
                setShowSearchOverlay(true);
                setTimeout(() => mobileSearchInputRef.current?.focus(), 80);
              }}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50"
            >
              <Search size={20} className="text-gray-600" />
            </button>

            <button onClick={openCart} className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-50">
              <ShoppingCart size={20} className="text-gray-600" />
              {itemCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-coral-400 border border-white rounded-full" />
              )}
            </button>

            {/* Visiteur non connecté : tap -> ouvre directement l'AuthModal (tabs Se connecter / S'inscrire).
                Utilisateur connecté : tap -> ouvre le drawer (dashboard, commandes, messages...).
                Le chevron reste car un user connecté a un vrai menu déroulant derrière. */}
            <button
              onClick={handleAccountIconClick}
              className="w-10 h-10 flex items-center justify-center gap-0.5 rounded-lg hover:bg-gray-50 transition-colors"
              aria-label={!user ? "Connexion ou inscription" : "Menu du compte"}
            >
              <User size={20} className="text-gray-900" />
              <ChevronDown size={14} className="text-gray-900" />
            </button>
          </div>
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
            <button onClick={() => setMobileOpen(false)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50">
              <X size={20} className="text-gray-600" />
            </button>
          </div>

          <div className="p-4 flex flex-col gap-6 overflow-y-auto flex-1">
            <div className="flex flex-col gap-1">
              <a href={userRole && isValidRole(userRole) ? getRedirectPathForRole(userRole) : "/"} className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <LayoutDashboard size={20} className="text-gray-400" />
                <span>Mon dashboard</span>
              </a>
              <a href="/commandes" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <ShoppingBag size={20} className="text-gray-400" />
                <span>Mes commandes</span>
              </a>
              <a href="/messages" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <MessageSquare size={20} className="text-gray-400" />
                <span>Messages</span>
              </a>

              <div className="h-px bg-gray-100 my-2 mx-4" />
              <a href="/cgu" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <FileText size={20} className="text-gray-400" />
                <span>Conditions générales</span>
              </a>
              <a href="/privacy" className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                <ShieldCheck size={20} className="text-gray-400" />
                <span>Confidentialité</span>
              </a>

              <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-3 rounded-lg hover:bg-red-50 text-red-500 transition-colors text-sm font-medium text-left mt-2">
                <LogOut size={20} />
                <span>Déconnexion</span>
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <p className="text-sm font-semibold text-gray-900 px-2">{user?.user_metadata?.nom || "Mon compte"}</p>
          </div>
        </div>
      </div>

      <AuthModal isOpen={authModalOpen} onClose={() => { setAuthModalOpen(false); setIntendedRole(null); }} intendedRole={intendedRole} />
      <CartDrawer />
    </>
  );
}
