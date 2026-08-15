import { ShieldCheck } from "lucide-react";

/**
 * Footer dédié au tunnel de paiement — volontairement minimal.
 * Contrairement au Footer marketing de la home (bannière PWA, réseaux
 * sociaux, "Devenir vendeur", catégories...), on évite ici tout lien qui
 * inviterait le client à quitter la page en plein paiement. On ne garde
 * que ce qui rassure (sécurité, partenaire de paiement) et le strict
 * minimum légal.
 */
export function CheckoutFooter() {
  return (
    <footer className="mt-12 px-4 py-8 border-t border-gray-100 md:px-8">
      <div className="max-w-3xl mx-auto flex flex-col items-center gap-5 text-center">
        <div className="flex flex-wrap items-center justify-center gap-3">
          <div className="flex items-center gap-2 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-100">
            <ShieldCheck size={14} className="text-teal-600" />
            <span className="text-[10px] font-bold text-teal-700 uppercase tracking-tight">
              Paiement sécurisé
            </span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-lg border border-gray-100">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
              Partenaire
            </span>
            <span className="text-xs font-black text-coral-600">Genius</span>
            <span className="text-xs font-black text-gray-900">Pay</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <a href="/cgu" className="text-xs text-gray-400 hover:text-coral-500 font-medium transition-colors">
            CGU
          </a>
          <span className="text-gray-200">•</span>
          <a href="/privacy" className="text-xs text-gray-400 hover:text-coral-500 font-medium transition-colors">
            Confidentialité
          </a>
          <span className="text-gray-200">•</span>
          <a href="/centre-aide" className="text-xs text-gray-400 hover:text-coral-500 font-medium transition-colors">
            Aide
          </a>
        </div>

        <p className="text-[11px] text-gray-300 font-medium">© 2026 Ayiba</p>
      </div>
    </footer>
  );
}
