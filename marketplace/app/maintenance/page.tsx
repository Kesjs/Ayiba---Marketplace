import { Wrench } from "lucide-react";

export default function MaintenancePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center">
      <div className="w-16 h-16 rounded-3xl bg-coral-50 text-coral-500 flex items-center justify-center mb-6">
        <Wrench size={28} />
      </div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Ayiba est en maintenance</h1>
      <p className="text-sm text-gray-500 max-w-sm">
        Nous effectuons une mise à jour du service. Le site sera de retour très bientôt — merci de votre patience.
      </p>
    </div>
  );
}
