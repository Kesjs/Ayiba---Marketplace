"use client";

import { useState } from "react";
import LogoAyiba from "@/components/ui/LogoAyiba";
import Image from "next/image";
import { Share, PlusSquare } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { useInstallApp } from "@/context/InstallAppContext";

const footerLinks = {
  acheter: [
    { label: "Toutes les catégories", href: "/catalogue" },
    { label: "Produits populaires", href: "/catalogue" },
    { label: "Nouveautés", href: "/catalogue" },
    { label: "Comment acheter", href: "/#comment-ca-marche" },
  ],
  vendre: [
    { label: "Devenir vendeur", href: "/devenir-vendeur" },
    { label: "Comment ça marche", href: "/#comment-ca-marche" },
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
            <p className="text-sm text-gray-400 font-medium">
              © 2026 Ayiba • Marketplace Béninoise
            </p>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-gray-100 shadow-xs">
                  <i className="ti ti-shield-check text-teal-500 text-base" />
                  <span className="text-[10px] font-bold text-gray-600 uppercase tracking-tight">Paiement Sécurisé</span>
               </div>
               <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Partenaire :</span>
                  <div className="px-3 py-1 bg-white rounded border border-gray-100 flex items-center shadow-xs">
                    <span className="text-xs font-black text-[#6B46C1]">Feda</span>
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