'use client'

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";

export default function CGUPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-white">
        {/* Content */}
        <div className="flex-1 py-16 px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 tracking-tight">
              Conditions Générales d'Utilisation
            </h1>

            <div className="space-y-10 text-base text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Introduction</h2>
                <p>
                  Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de la plateforme Ayiba, 
                  une marketplace de proximité permettant aux vendeurs, livreurs et clients d'interagir pour l'achat et 
                  la livraison de produits au Bénin. En utilisant Ayiba, vous acceptez intégralement ces conditions.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. Inscription et Compte</h2>
                <p>
                  L'inscription sur Ayiba nécessite un numéro de téléphone valide (MTN, Moov ou Celtiis). 
                  Chaque utilisateur est responsable de la sécurité de son compte. Les comptes vendeurs et livreurs 
                  font l'objet d'une validation manuelle rigoureuse par nos équipes avant activation.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">3. Rôles et Responsabilités</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                  <div className="p-6 bg-gray-50 rounded-2xl border border-gray-100">
                    <h3 className="font-bold text-gray-900 mb-2">Clients</h3>
                    <p className="text-sm">Passent commande et paient en ligne via Mobile Money. L'argent est sécurisé en escrow jusqu'à la livraison.</p>
                  </div>
                  <div className="p-6 bg-coral-50/50 rounded-2xl border border-coral-100/50">
                    <h3 className="font-bold text-gray-900 mb-2">Vendeurs</h3>
                    <p className="text-sm">Publient des produits authentiques. Une commission de 5% est appliquée sur les ventes réussies.</p>
                  </div>
                  <div className="p-6 bg-teal-50/50 rounded-2xl border border-teal-100/50">
                    <h3 className="font-bold text-gray-900 mb-2">Livreurs</h3>
                    <p className="text-sm">Assurent le transport sécurisé. Perçoivent 100% des frais de livraison au lancement de la plateforme.</p>
                  </div>
                </div>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">4. Paiement Sécurisé (Escrow)</h2>
                <p>
                  Ayiba utilise un système de paiement sécurisé. Les fonds du client sont bloqués par la plateforme et ne sont libérés 
                  au vendeur qu'après confirmation de la livraison par le client via un code OTP unique, assurant une protection totale contre les arnaques.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">5. Livraison et Code OTP</h2>
                <p>
                  La livraison est validée par un code secret (OTP) généré par le client. Le livreur doit saisir ce code sur son application 
                  pour prouver la remise effective du colis. Sans ce code, la transaction n'est pas considérée comme terminée.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">6. Litiges</h2>
                <p>
                  En cas de problème, un système de litige permet à nos équipes d'intervenir. L'argent reste bloqué en séquestre 
                  jusqu'à la résolution amiable ou arbitrée du conflit entre les parties.
                </p>
              </section>

              <section className="pt-8 border-t border-gray-100">
                <p className="text-sm text-gray-400">
                  Dernière mise à jour : Juillet 2026 • Ayiba Marketplace
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
