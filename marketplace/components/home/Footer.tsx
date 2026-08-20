"use client";

import { useState } from "react";
import LogoAyiba from "@/components/ui/LogoAyiba";
import Link from "next/link";
import { Share, PlusSquare, Store, Bike, ArrowRight } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useInstallApp } from "@/context/InstallAppContext";

const footerLinks = {
  acheter: [
    { label: "Toutes les catégories", href: "/catalogue" },
    { label: "Produits populaires", href: "/catalogue" },
    { label: "Nouveautés", href: "/catalogue" },
    { label: "Comment acheter", href: "/comment-ca-marche" },
  ],
  vendre: [
    { label: "Devenir vendeur", href: "/devenir-vendeur" },
    { label: "Comment ça marche", href: "/comment-ca-marche" },
    { label: "Politique de commission", href: "/politique-commission" },
    { label: "Devenir livreur", href: "/devenir-livreur" },
  ],
  aide: [
    { label: "Centre d'aide", href: "/centre-aide" },
    { label: "FAQ", href: "/faq" },
    { label: "Nous contacter", href: "/contact" },
    { label: "Politique de livraison", href: "/politique-livraison" },
    { label: "Politique de remboursement", href: "/politique-remboursement" },
    { label: "Conditions d'utilisation", href: "/cgu" },
    { label: "Politique de confidentialité", href: "/privacy" },
    { label: "À propos", href: "/a-propos" },
  ],
};

export function Footer() {
  const { canInstallNative, isIOS, isStandalone, promptInstall } = useInstallApp();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const showInstallBanner = !isStandalone && (canInstallNative || isIOS);

  return (
    <footer className="py-12 px-4 bg-gray-50 border-t border-gray-100 md:px-8 lg:px-12">
      <div className="max-w-7xl mx-auto">

        {/* --- Cartes CTA Vendeur & Livreur Compactes & Remarquables --- */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/devenir-vendeur"
            className="group relative overflow-hidden bg-gradient-to-r from-coral-500 via-coral-500 to-coral-600 rounded-2xl p-5 text-white shadow-md shadow-coral-500/10 hover:shadow-xl hover:shadow-coral-500/20 hover:scale-[1.01] transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shrink-0 group-hover:scale-110 transition-transform">
                <Store size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm sm:text-base leading-snug truncate">Ouvrir une boutique sur Ayiba</h4>
                <p className="text-xs text-white/85 font-medium truncate">Vendez vos produits en toute sécurité</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-white text-coral-600 font-extrabold text-xs px-3.5 py-2 rounded-xl shrink-0 group-hover:bg-coral-50 transition-colors shadow-xs z-10">
              <span>Commencer</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>

          <Link
            href="/devenir-livreur"
            className="group relative overflow-hidden bg-gradient-to-r from-gray-900 via-gray-900 to-slate-800 rounded-2xl p-5 text-white shadow-md shadow-gray-900/10 hover:shadow-xl hover:shadow-gray-900/25 hover:scale-[1.01] transition-all duration-300 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0 z-10">
              <div className="w-10 h-10 rounded-xl bg-teal-500/25 border border-teal-400/30 backdrop-blur-md flex items-center justify-center text-teal-300 shrink-0 group-hover:scale-110 transition-transform">
                <Bike size={20} />
              </div>
              <div className="min-w-0">
                <h4 className="font-extrabold text-sm sm:text-base leading-snug truncate">Devenir Livreur partenaire</h4>
                <p className="text-xs text-slate-300 font-medium truncate">Livrez des courses et gagnez à votre rythme</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 bg-teal-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl shrink-0 group-hover:bg-teal-400 transition-colors shadow-xs z-10">
              <span>Rejoindre</span>
              <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
            </div>
          </Link>
        </div>

        {/* PWA / App Banner - Section responsive mobile-first */}
        {showInstallBanner && (
        <div className="mb-16 p-6 md:p-10 bg-white rounded-[32px] border border-gray-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-coral-50 text-coral-600 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider mb-4">
              Expérience Mobile-First
            </div>
            <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-3 tracking-tight">Utilisez Ayiba comme une application</h3>
            <p className="text-sm text-gray-500 font-medium max-w-md leading-relaxed">
              Installez Ayiba sur votre écran d'accueil pour une expérience ultra-fluide,
              même sans passer par le Play Store.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full md:w-auto">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Disponible sur</p>
              <p className="text-xs font-bold text-gray-600">Navigateurs & Mobile</p>
            </div>
            <button
              className="flex items-center gap-3 bg-gray-900 text-white px-6 py-3 rounded-2xl hover:bg-black transition-all duration-300 w-full sm:w-auto justify-center group active:scale-95"
              onClick={() => (canInstallNative ? promptInstall() : setShowIOSInstructions(true))}
            >
              <i className="ti ti-device-mobile text-xl group-hover:scale-110 transition-transform" />
              <span className="text-sm font-bold">Installer l'Application</span>
            </button>
          </div>
        </div>
        )}

        <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 md:grid-cols-4 lg:gap-16">

          {/* Colonne 1 — Marque */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <LogoAyiba className="h-8 w-auto mb-6" />
            <p className="text-[14px] text-gray-500 leading-relaxed max-w-[260px] font-medium">
              La marketplace de confiance qui connecte Cotonou et Calavi. Sécurité, Proximité, Qualité.
            </p>
            <div className="flex items-center gap-4 mt-6">
              {[
                { icon: "ti-brand-facebook", href: "#", bg: "bg-blue-50 text-blue-600" },
                { icon: "ti-brand-instagram", href: "#", bg: "bg-pink-50 text-pink-600" },
                { icon: "ti-brand-whatsapp", href: "#", bg: "bg-green-50 text-green-600" },
              ].map((s, i) => (
                <a
                  key={i}
                  href={s.href}
                  className={`w-9 h-9 rounded-full ${s.bg} flex items-center justify-center hover:scale-110 transition-transform duration-200`}
                >
                  <i className={`ti ${s.icon} text-base`} />
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 2 — Acheter */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5">Acheter</h3>
            <div className="flex flex-col gap-3">
              {footerLinks.acheter.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  className="text-[14px] text-gray-500 hover:text-coral-500 font-medium transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 3 — Vendre */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5">Partenaires</h3>
            <div className="flex flex-col gap-3">
              {footerLinks.vendre.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  className="text-[14px] text-gray-500 hover:text-coral-500 font-medium transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

          {/* Colonne 4 — Aide */}
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-widest mb-5">Aide & Légal</h3>
            <div className="flex flex-col gap-3">
              {footerLinks.aide.map((l, i) => (
                <a
                  key={i}
                  href={l.href}
                  className="text-[14px] text-gray-500 hover:text-coral-500 font-medium transition-colors"
                >
                  {l.label}
                </a>
              ))}
            </div>
          </div>

        </div>

        {/* Bas du footer */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-sm text-gray-400 font-medium flex items-center gap-1.5">
              © 2026 Ayiba • Marketplace 100% Béninoise 🇧🇯
            </p>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-xs">
                  <i className="ti ti-shield-check text-teal-500 text-base" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Paiement Sécurisé</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partenaire :</span>
                  <div className="px-3 py-1 bg-white rounded border border-gray-100 flex items-center shadow-xs">
                    <span className="text-xs font-black text-coral-600">Genius</span>
                    <span className="text-xs font-black text-gray-900">Pay</span>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>
      <Modal
        isOpen={showIOSInstructions}
        onClose={() => setShowIOSInstructions(false)}
        title="Installer Ayiba"
      >
        <div className="space-y-4 text-sm text-gray-700">
          <p>Sur iPhone, l&apos;installation se fait en 2 étapes depuis Safari :</p>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-7 h-7 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center text-xs font-bold shrink-0">
              1
            </div>
            <div className="flex items-center gap-2">
              <span>Appuie sur</span>
              <Share size={16} className="text-coral-500" />
              <span>(Partager) en bas de l&apos;écran</span>
            </div>
          </div>
          <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
            <div className="w-7 h-7 rounded-full bg-coral-100 text-coral-600 flex items-center justify-center text-xs font-bold shrink-0">
              2
            </div>
            <div className="flex items-center gap-2">
              <span>Choisis</span>
              <PlusSquare size={16} className="text-coral-500" />
              <span>&quot;Sur l&apos;écran d&apos;accueil&quot;</span>
            </div>
          </div>
          <p className="text-xs text-gray-400">
            L&apos;icône Ayiba apparaîtra alors sur ton écran d&apos;accueil, comme une vraie application.
          </p>
        </div>
      </Modal>
    </footer>
  );
}