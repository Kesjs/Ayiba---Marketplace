'use client'

import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <div className="flex flex-col min-h-screen bg-white">
        {/* Content */}
        <div className="flex-1 py-16 px-4 md:px-8 lg:px-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8 tracking-tight">
              Politique de Confidentialité
            </h1>

            <div className="space-y-10 text-base text-gray-600 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">1. Collecte des Données</h2>
                <p>
                  Pour garantir la sécurité des transactions sur Ayiba, nous collectons uniquement les informations nécessaires : 
                  numéro de téléphone, nom complet, et données de localisation pour la livraison. Vos documents d'identité (vendeurs/livreurs) 
                  sont stockés de manière sécurisée et servent uniquement à la validation manuelle de votre profil.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">2. Utilisation de vos Informations</h2>
                <p>
                  Vos données sont utilisées pour traiter vos commandes, sécuriser les paiements via FedaPay (MTN, Moov, Celtiis) 
                  et permettre aux livreurs de vous contacter pour la remise de vos colis. Nous n'utilisons pas vos données à des fins publicitaires intrusives.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">3. Protection et Sécurité</h2>
                <p>
                  La protection de votre vie privée est au cœur de notre modèle de confiance. Les transactions sont chiffrées, 
                  et l'accès aux informations est strictement cloisonné entre les rôles (le livreur ne voit pas votre paiement, 
                  le vendeur ne voit pas votre code OTP).
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">4. Partage avec des Tiers</h2>
                <p>
                  Nous ne vendons ni ne louons jamais vos données personnelles. Le partage se limite strictement aux partenaires 
                  logistiques et financiers nécessaires à la réalisation de votre achat ou de votre mission de livraison.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-gray-900 mb-4 tracking-tight">5. Vos Droits</h2>
                <p>
                  Conformément à la législation béninoise, vous disposez d'un droit d'accès, de rectification et de suppression 
                  de vos données. Vous pouvez exercer ces droits à tout moment depuis votre dashboard ou en contactant notre support.
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
