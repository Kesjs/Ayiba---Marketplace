import { ReactNode } from "react";

type StatusVariant = "success" | "pending" | "error" | "neutral" | "info";

interface StatusBadgeProps {
  variant: StatusVariant;
  children: ReactNode;
  icon?: ReactNode;
}

/**
 * Badge de statut — utilisé pour tout état lié à la confiance ou à la progression
 * d'une commande/transaction (payé, en attente, refusé, brouillon...).
 *
 * variant "success" = teal, exclusivement pour signaler une action de confiance
 * réussie (payé, livré, vérifié, séquestre validé). Ne pas utiliser teal ailleurs.
 * variant "info" = bleu, pour un état intermédiaire "en cours" qui n'est ni une
 * réussite finale ni une attente/erreur (ex: commande confirmée/préparée/expédiée).
 */
export function StatusBadge({ variant, children, icon }: StatusBadgeProps) {
  const variants: Record<StatusVariant, string> = {
    success: "bg-teal-50 text-teal-800",
    pending: "bg-amber-50 text-amber-800",
    error: "bg-red-50 text-red-800",
    neutral: "bg-gray-50 text-gray-600",
    info: "bg-blue-50 text-blue-800",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-[11px] font-medium ${variants[variant]}`}
    >
      {icon}
      {children}
    </span>
  );
}

// Exemple d'usage :
// <StatusBadge variant="success" icon={<i className="ti ti-shield-check text-xs" />}>
//   Paiement sécurisé
// </StatusBadge>
// <StatusBadge variant="pending">En attente de modération</StatusBadge>