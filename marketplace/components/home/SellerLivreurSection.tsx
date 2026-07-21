"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthModal } from "@/components/ui/AuthModal";

export function SellerLivreurSection() {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [intendedRole, setIntendedRole] = useState<"vendeur" | "livreur" | null>(null);

  const openAuth = (role: "vendeur" | "livreur") => {
    setIntendedRole(role);
    setAuthModalOpen(true);
  };

  return (
    <section className="py-12 px-4 bg-gray-50 md:px-8 lg:px-12 lg:py-20">
      <div className="max-w-5xl mx-auto">
        <h2
          className="text-lg text-gray-900 text-center mb-8 md:text-xl lg:text-2xl lg:mb-12"
          style={{ fontFamily: "var(--font-serif)", fontWeight: 500 }}
        >
          Tu es vendeur ou livreur ?
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-8">
          <div className="bg-white border border-gray-100 rounded-lg p-6 text-center transition-shadow hover:shadow-md lg:p-10">
            <div className="w-16 h-16 rounded-full bg-coral-50 flex items-center justify-center mx-auto mb-4 lg:w-20 lg:h-20">
              <i className="ti ti-building-store text-3xl text-coral-600 lg:text-4xl" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2 lg:text-lg">
              Vendeur
            </h3>
            <p className="text-sm text-gray-600 mb-4 lg:text-base lg:max-w-xs lg:mx-auto">
              Publie tes articles, gère tes commandes et reçois tes
              paiements sécurisés.
            </p>
            <div className="mb-4 p-3 bg-coral-50 rounded-lg">
              <p className="text-sm font-medium text-coral-800">
                "J'ai gagné 120 000 FCFA le premier mois"
              </p>
              <p className="text-xs text-coral-600 mt-1">
                — Aminata, vendeur de vêtements
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full lg:w-auto lg:px-8"
              onClick={() => openAuth("vendeur")}
            >
              Ouvrir ma boutique
            </Button>
          </div>
          <div className="bg-white border border-gray-100 rounded-lg p-6 text-center transition-shadow hover:shadow-md lg:p-10">
            <div className="w-16 h-16 rounded-full bg-coral-50 flex items-center justify-center mx-auto mb-4 lg:w-20 lg:h-20">
              <i className="ti ti-motorbike text-3xl text-coral-600 lg:text-4xl" />
            </div>
            <h3 className="text-base font-medium text-gray-900 mb-2 lg:text-lg">
              Livreur
            </h3>
            <p className="text-sm text-gray-600 mb-4 lg:text-base lg:max-w-xs lg:mx-auto">
              Reçois des missions de livraison et gagne à chaque course.
            </p>
            <div className="mb-4 p-3 bg-coral-50 rounded-lg">
              <p className="text-sm font-medium text-coral-800">
                "Gagne jusqu'à 50 000 FCFA/mois"
              </p>
              <p className="text-xs text-coral-600 mt-1">
                — Kofi, livreur à Cotonou
              </p>
            </div>
            <Button
              variant="secondary"
              className="w-full lg:w-auto lg:px-8"
              onClick={() => openAuth("livreur")}
            >
              Devenir livreur
            </Button>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => { setAuthModalOpen(false); setIntendedRole(null); }}
        intendedRole={intendedRole}
      />
    </section>
  );
}
