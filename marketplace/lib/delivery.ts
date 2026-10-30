export type DeliveryStatus =
  | "en_attente"
  | "attribuee"
  | "vers_retrait"
  | "recuperee"
  | "vers_destination"
  | "arrivee"
  | "livree"
  | "annulee"
  | "litige";

export type DeliveryPaymentStatus = "non_paye" | "en_attente" | "paye" | "echoue" | "rembourse";

export interface DeliveryCourse {
  id: string;
  numero: string;
  client_id: string;
  livreur_id: string | null;
  statut: DeliveryStatus;
  statut_paiement: DeliveryPaymentStatus;
  mode_paiement: "mobile_money" | "carte" | null;
  reseau: "mtn" | "moov" | null;
  depart_adresse: string;
  depart_commune: string | null;
  depart_latitude: number;
  depart_longitude: number;
  depart_nom: string | null;
  depart_telephone: string | null;
  destination_adresse: string;
  destination_commune: string | null;
  destination_latitude: number;
  destination_longitude: number;
  destination_nom: string | null;
  destination_telephone: string | null;
  type_colis: string;
  description_colis: string | null;
  note_livreur: string | null;
  distance_estimee_km: number;
  distance_finale_km: number | null;
  duree_estimee_min: number | null;
  montant_estime: number;
  montant_final: number | null;
  commission: number;
  montant_net_livreur: number | null;
  prime_prise_en_charge: number;
  livreur_latitude: number | null;
  livreur_longitude: number | null;
  assigned_at: string | null;
  accepted_at: string | null;
  picked_up_at: string | null;
  arrived_at: string | null;
  delivered_at: string | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_at: string;
  updated_at: string;
}

export interface DeliveryQuote {
  distance_km: number;
  montant: number;
  commission: number;
  montant_net_livreur: number;
  disponible: boolean;
  rayon_max_km: number;
}

export const DELIVERY_STATUS_LABELS: Record<DeliveryStatus, string> = {
  en_attente: "Recherche d’un livreur",
  attribuee: "Livreur trouvé",
  vers_retrait: "En route vers le retrait",
  recuperee: "Colis récupéré",
  vers_destination: "En route vers vous",
  arrivee: "Arrivé à destination",
  livree: "Course terminée",
  annulee: "Course annulée",
  litige: "Vérification en cours",
};

export const DELIVERY_STATUS_STEPS: Array<{ key: DeliveryStatus; label: string }> = [
  { key: "en_attente", label: "Livreur recherché" },
  { key: "attribuee", label: "Livreur trouvé" },
  { key: "recuperee", label: "Colis récupéré" },
  { key: "vers_destination", label: "En route" },
  { key: "arrivee", label: "Arrivé" },
  { key: "livree", label: "Terminé" },
];

export function formatFcfa(value: number | null | undefined) {
  return `${Math.round(value ?? 0).toLocaleString("fr-FR")} F`;
}

export function statusTone(status: DeliveryStatus) {
  if (status === "livree") return "success" as const;
  if (status === "annulee" || status === "litige") return "danger" as const;
  if (status === "en_attente") return "warning" as const;
  return "info" as const;
}

export function getDeliveryStepIndex(status: DeliveryStatus) {
  if (status === "vers_retrait") return 1;
  if (status === "recuperee") return 2;
  if (status === "vers_destination") return 3;
  if (status === "arrivee") return 4;
  if (status === "livree") return 5;
  return status === "attribuee" ? 1 : 0;
}
