"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ShieldCheck, Bike, ArrowRight, CheckCircle2 } from "lucide-react";
import Link from "next/link";

interface HowItWorksModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HowItWorksModal({ isOpen, onClose }: HowItWorksModalProps) {
  const [activeTab, setActiveTab] = useState<"acheteur" | "vendeur" | "livreur">("acheteur");

  if (!isOpen) return null;

  const steps = {
    acheteur: [
      {
        num: "01",
        title: "Explorez & Commandez",
        desc: "Trouvez des vêtements, accessoires ou produits électroniques uniques auprès de vendeurs vérifiés au Bénin.",
        icon: ShoppingBag,
        color: "bg-coral-50 text-coral-500 border-coral-100",
      },
      {
        num: "02",
        title: "Paiement Sécurisé (Escrow)",
        desc: "Votre argent est conservé en toute sécurité par Ayiba. Le vendeur n'est payé qu'une fois votre colis bien reçu !",
        icon: ShieldCheck,
        color: "bg-amber-50 text-amber-600 border-amber-100",
      },
      {
        num: "03",
        title: "Livraison avec Code Secret",
        desc: "Le livreur vous remet votre commande en main propre. Donnez-lui votre code secret à 4 chiffres pour valider la réception.",
        icon: Bike,
        color: "bg-teal-50 text-teal-600 border-teal-100",
      },
    ],
    vendeur: [
      {
        num: "01",
        title: "Créez votre boutique gratuitement",
        desc: "Inscrivez-vous en 2 minutes et publiez vos articles avec photos et prix.",
        icon: ShoppingBag,
        color: "bg-coral-50 text-coral-500 border-coral-100",
      },
      {
        num: "02",
        title: "Recevez les commandes",
        desc: "Soyez notifié dès qu'un client achète. Préparez le colis pour le livreur.",
        icon: ShieldCheck,
        color: "bg-amber-50 text-amber-600 border-amber-100",
      },
      {
        num: "03",
        title: "Encaissez en sécurité",
        desc: "Dès que le client donne le code secret au livreur, vos fonds sont crédités sur votre portefeuille.",
        icon: CheckCircle2,
        color: "bg-teal-50 text-teal-600 border-teal-100",
      },
    ],
    livreur: [
      {
        num: "01",
        title: "Rejoignez la flotte Ayiba",
        desc: "Soumettez votre pièce d'identité et permis pour devenir livreur certifié.",
        icon: Bike,
        color: "bg-teal-50 text-teal-600 border-teal-100",
      },
      {
        num: "02",
        title: "Acceptez des missions à proximité",
        desc: "Recevez les demandes de livraison à Cotonou, Calavi et environs.",
        icon: ShieldCheck,
        color: "bg-amber-50 text-amber-600 border-amber-100",
      },
      {
        num: "03",
        title: "Validez par code secret & gagnez",
        desc: "Saisissez le code secret remis par le client pour valider la livraison et recevoir votre paiement instantané.",
        icon: CheckCircle2,
        color: "bg-coral-50 text-coral-500 border-coral-100",
      },
    ],
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/60 backdrop-blur-md"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-gray-100 z-10 my-auto"
      >
        {/* Header */}
        <div className="p-6 md:p-8 bg-gradient-to-r from-coral-50 via-white to-teal-50/50 border-b border-gray-100 relative">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-full bg-white/80 border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X size={18} />
          </button>
          <span className="text-[11px] font-bold uppercase tracking-wider text-coral-600 bg-coral-100/60 px-3 py-1 rounded-full">
            Guide Ayiba
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900 mt-2">
            Comment ça marche ?
          </h2>
          <p className="text-xs md:text-sm text-gray-500 mt-1">
            Découvrez la simplicité et la sécurité d'Ayiba Marketplace en 3 étapes.
          </p>

          {/* Onglets rôle */}
          <div className="flex gap-2 mt-5 bg-gray-100/80 p-1.5 rounded-2xl w-fit">
            {(["acheteur", "vendeur", "livreur"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                  activeTab === tab
                    ? "bg-white text-gray-900 shadow-sm"
                    : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {tab === "acheteur" ? "Acheter" : tab === "vendeur" ? "Vendre" : "Livrer"}
              </button>
            ))}
          </div>
        </div>

        {/* Steps Content */}
        <div className="p-6 md:p-8 space-y-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {steps[activeTab].map((step, idx) => {
                const Icon = step.icon;
                return (
                  <div
                    key={idx}
                    className="flex items-start gap-4 p-4 rounded-2xl bg-gray-50/70 border border-gray-100 hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className={`w-12 h-12 rounded-2xl ${step.color} border flex items-center justify-center shrink-0 font-extrabold text-sm`}
                    >
                      <Icon size={22} />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          Étape {step.num}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-gray-900 mt-0.5">{step.title}</h4>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                );
              })}
            </motion.div>
          </AnimatePresence>

          {/* Footer Action */}
          <div className="pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs text-gray-400 text-center sm:text-left">
              Une question ? Notre équipe d'assistance est disponible 7j/7.
            </p>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                href={
                  activeTab === "vendeur"
                    ? "/devenir-vendeur"
                    : activeTab === "livreur"
                    ? "/devenir-livreur"
                    : "/catalogue"
                }
                onClick={onClose}
                className="w-full sm:w-auto bg-coral-500 hover:bg-coral-600 text-white text-xs font-bold px-5 py-3 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-coral-500/20 active:scale-95 transition-all"
              >
                <span>
                  {activeTab === "vendeur"
                    ? "Lancer ma boutique"
                    : activeTab === "livreur"
                    ? "Devenir livreur"
                    : "Explorer les pépites"}
                </span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
