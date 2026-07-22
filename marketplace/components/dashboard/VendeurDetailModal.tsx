"use client";

import { useEffect, useState } from "react";
import { VendeurKyc } from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  MapPin,
  Wallet,
  Mail,
  Phone,
  Calendar,
  Star,
  Store,
  X,
  ImageOff,
  Loader2,
} from "lucide-react";

interface VendeurDetailModalProps {
  vendeur: VendeurKyc | null;
  onClose: () => void;
}

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function VendeurDetailModal({ vendeur, onClose }: VendeurDetailModalProps) {
  const [cniUrl, setCniUrl] = useState<string | null>(null);
  const [cniLoading, setCniLoading] = useState(false);
  const [cniError, setCniError] = useState<string | null>(null);

  useEffect(() => {
    setCniUrl(null);
    setCniError(null);

    if (!vendeur?.photo_cni_path) return;

    let cancelled = false;
    setCniLoading(true);

    (async () => {
      try {
        const res = await fetch("/api/admin/kyc-document-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: vendeur.photo_cni_path }),
        });
        const json = await res.json();
        if (cancelled) return;
        if (!res.ok) setCniError(json.error || "Impossible de charger le document");
        else setCniUrl(json.url);
      } catch {
        if (!cancelled) setCniError("Impossible de charger le document");
      } finally {
        if (!cancelled) setCniLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [vendeur?.photo_cni_path]);

  if (!vendeur) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-[28px]">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">{vendeur.nom_boutique || "Sans nom de boutique"}</h2>
            <p className="text-sm text-gray-500">{vendeur.nom_complet || "Nom non renseigné"}</p>
          </div>
          <div className="flex items-center gap-3">
            <StatusBadge variant={vendeur.statut === "valide" ? "success" : vendeur.statut === "refuse" ? "error" : "pending"}>
              {vendeur.statut === "valide" ? "Validé" : vendeur.statut === "refuse" ? "Refusé" : "En attente"}
            </StatusBadge>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Photo de couverture boutique, si présente */}
          {vendeur.photo_couverture_url && (
            <img
              src={vendeur.photo_couverture_url}
              alt="Couverture boutique"
              className="w-full h-36 object-cover rounded-2xl"
            />
          )}

          {/* Pièce d'identité */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Pièce d'identité</h3>
            <div className="rounded-2xl border border-gray-100 bg-gray-50 flex items-center justify-center min-h-[220px] overflow-hidden">
              {!vendeur.photo_cni_path ? (
                <div className="flex flex-col items-center gap-2 text-red-500 py-10">
                  <ImageOff size={28} />
                  <span className="text-sm font-semibold">Aucune pièce d'identité fournie</span>
                </div>
              ) : cniLoading ? (
                <div className="flex flex-col items-center gap-2 text-gray-400 py-10">
                  <Loader2 size={24} className="animate-spin" />
                  <span className="text-sm">Chargement du document...</span>
                </div>
              ) : cniError ? (
                <div className="flex flex-col items-center gap-2 text-red-500 py-10 text-center px-4">
                  <ImageOff size={28} />
                  <span className="text-sm font-semibold">{cniError}</span>
                </div>
              ) : cniUrl ? (
                <a href={cniUrl} target="_blank" rel="noreferrer" className="block w-full">
                  <img src={cniUrl} alt="Pièce d'identité" className="w-full max-h-[400px] object-contain" />
                </a>
              ) : null}
            </div>
            {cniUrl && (
              <p className="text-xs text-gray-400 mt-1.5">
                Lien valable 5 minutes · clique sur l'image pour l'ouvrir en plein écran
              </p>
            )}
          </div>

          {/* Boutique */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Boutique</h3>
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-start gap-2 text-sm text-gray-700">
                <Store size={16} className="text-gray-400 mt-0.5 shrink-0" />
                <span>{vendeur.description || "Aucune description fournie"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin size={16} className="text-gray-400 shrink-0" />
                {vendeur.quartier || "—"}, {vendeur.commune || "—"}
              </div>
              {vendeur.en_pause && (
                <div className="text-xs font-semibold text-amber-600 bg-amber-50 rounded-lg px-2.5 py-1 inline-block">
                  Boutique actuellement en pause
                </div>
              )}
            </div>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Contact</h3>
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={16} className="text-gray-400 shrink-0" />
                {vendeur.email || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={16} className="text-gray-400 shrink-0" />
                {vendeur.phone || "—"}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Wallet size={16} className="text-gray-400 shrink-0" />
                {vendeur.mobile_money_network
                  ? `${vendeur.mobile_money_network.toUpperCase()} — ${vendeur.mobile_money_number}`
                  : "Non renseigné"}
              </div>
            </div>
          </div>

          {/* Historique / réputation */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Historique</h3>
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                Compte créé le {formatDate(vendeur.compte_cree_le)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Calendar size={16} className="text-gray-400 shrink-0" />
                Demande KYC soumise le {formatDate(vendeur.created_at)}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Star size={16} className="text-gray-400 shrink-0" />
                {vendeur.note_moyenne
                  ? `${vendeur.note_moyenne.toFixed(1)} / 5 (${vendeur.nb_avis || 0} avis)`
                  : "Aucun avis pour le moment"}
              </div>
            </div>
          </div>

          {vendeur.raison_rejet && (
            <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-2xl">
              Motif du refus : {vendeur.raison_rejet}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
