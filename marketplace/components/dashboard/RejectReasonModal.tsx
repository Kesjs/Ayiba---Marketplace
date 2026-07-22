"use client";

import { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

interface RejectReasonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (raison: string) => Promise<void> | void;
  title?: string;
}

export function RejectReasonModal({ isOpen, onClose, onConfirm, title = "Motif du refus" }: RejectReasonModalProps) {
  const [raison, setRaison] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (!raison.trim()) return;
    setLoading(true);
    await onConfirm(raison.trim());
    setLoading(false);
    setRaison("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <p className="text-sm text-gray-500 mb-3">
        Ce motif sera visible par l'utilisateur concerné — soyez clair et factuel.
      </p>
      <textarea
        value={raison}
        onChange={(e) => setRaison(e.target.value)}
        rows={4}
        placeholder="Ex : photo de CNI illisible, informations incohérentes..."
        className="w-full rounded-xl border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500"
      />
      <div className="flex gap-3 mt-4">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Annuler
        </Button>
        <Button
          variant="destructive"
          onClick={handleConfirm}
          disabled={!raison.trim() || loading}
          className="flex-1"
        >
          {loading ? "Envoi..." : "Confirmer le refus"}
        </Button>
      </div>
    </Modal>
  );
}
