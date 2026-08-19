import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useState } from "react";
import { reportArticle } from "@/lib/queries/signalements";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@/lib/hooks/useUser";

interface ReportProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
}

export function ReportProductModal({ open, onOpenChange, productId, productName }: ReportProductModalProps) {
  const { user } = useUser();
  const { showToast } = useToast();
  const [motif, setMotif] = useState("");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motif) return;

    try {
      setSubmitting(true);
      await reportArticle(productId, user?.id || null, motif, details);
      showToast("Signalement envoyé avec succès. Merci !", "success");
      onOpenChange(false);
      setMotif("");
      setDetails("");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de l'envoi du signalement.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const motifs = [
    "Contrefaçon",
    "Produit illicite ou interdit",
    "Image trompeuse ou non conforme",
    "Arnaque ou vendeur suspect",
    "Autre",
  ];

  return (
    <Modal isOpen={open} onClose={() => onOpenChange(false)} title="Signaler un article">
      <p className="text-sm text-gray-500 mb-4">
        Aidez-nous à garder la plateforme sûre en signalant les anomalies concernant : <strong className="text-gray-700">{productName}</strong>.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Motif du signalement
          </label>
          <select
            required
            value={motif}
            onChange={(e) => setMotif(e.target.value)}
            className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:border-coral-500 focus:ring-1 focus:ring-coral-500 transition-colors"
          >
            <option value="" disabled>Sélectionnez un motif...</option>
            {motifs.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Détails supplémentaires
          </label>
          <textarea
            rows={4}
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            placeholder="Expliquez brièvement le problème..."
            className="w-full p-4 rounded-xl border border-gray-200 bg-gray-50 text-sm focus:border-coral-500 focus:ring-1 focus:ring-coral-500 transition-colors resize-none"
          />
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            type="submit"
            disabled={submitting || !motif}
            className="flex-1 bg-coral-500 hover:bg-coral-600 text-white"
          >
            {submitting ? "Envoi..." : "Envoyer"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
