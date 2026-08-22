import { ShieldCheck, QrCode } from "lucide-react";

export function DeliveryAssuranceBanner() {
  return (
    <div className="w-full bg-teal-50 border-y border-teal-100">
      <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-3.5 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
        <div className="flex items-center gap-2 text-teal-700 bg-teal-100/50 p-2 rounded-xl shrink-0">
          <ShieldCheck size={20} className="text-teal-600" />
          <QrCode size={20} className="text-teal-600" />
        </div>
        <p className="text-sm font-medium text-teal-900 leading-snug">
          <span className="font-bold">Faites-vous livrer en toute sérénité :</span> votre paiement est bloqué jusqu'à ce que vous validiez la réception avec votre code secret ou QR code.
        </p>
      </div>
    </div>
  );
}
