"use client";

import dynamic from "next/dynamic";
import { UserCheck, MapPin, Wallet } from "lucide-react";

const motion = dynamic(() => import("framer-motion").then(mod => ({ default: mod.motion })), {
  ssr: false,
});

// Données des étapes statiques
const STEPS = [
  {
    number: "01",
    illustration: "/illustrations/rider-step-1.svg",
    icon: UserCheck,
    title: "Profil vérifié",
    desc: "Inscrivez-vous en 2 minutes. Notre équipe vérifie votre identité et votre véhicule pour garantir la sécurité et le sérieux des livraisons sur Ayiba.",
  },
  {
    number: "02",
    illustration: "/illustrations/rider-step-2.svg",
    icon: MapPin,
    title: "Missions locales",
    desc: "Recevez des demandes de livraison à proximité. Acceptez les courses qui vous conviennent en un clic via votre application dédiée.",
  },
  {
    number: "03",
    illustration: "/illustrations/rider-step-3.svg",
    icon: Wallet,
    title: "Gains instantanés",
    desc: "Soyez payé dès que le client valide la réception avec son code OTP unique. Vos gains (95%) sont crédités instantanément sur votre compte Mobile Money.",
  },
] as const;

export default function StepsSection() {
  return (
    <section className="py-20 px-4 md:px-8 lg:px-12 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-medium text-gray-900 mb-4">
            Comment ça marche ?
          </h2>
          <p className="text-lg text-gray-600">
            Devenez livreur en 3 étapes simples et sécurisées
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {STEPS.map((step, i) => {
            const Icon = step.icon;
            return (
              <div
                key={i}
                className="relative bg-white border border-gray-100 rounded-2xl p-8 hover:shadow-xl hover:-translate-y-2 transition-all duration-300"
              >
                {/* Numéro */}
                <div className="absolute top-6 left-6 w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center">
                  <span className="text-sm font-medium text-teal-600">{step.number}</span>
                </div>

                {/* Illustration */}
                <div className="relative w-full aspect-square max-w-[160px] mx-auto mb-8 mt-4">
                  <div className="absolute inset-0 bg-teal-100 rounded-full blur-3xl opacity-40" />
                  <img
                    src={step.illustration}
                    alt={step.title}
                    className="relative z-10 w-full h-full object-contain drop-shadow-lg"
                    loading="lazy"
                    decoding="async"
                  />
                </div>

                {/* Icone + titre */}
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-teal-600" strokeWidth={2} />
                  </div>
                  <h3 className="text-xl font-medium text-gray-900">{step.title}</h3>
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
