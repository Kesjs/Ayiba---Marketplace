"use client";

import { ArticleModeration } from "@/lib/hooks/useAdmin";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { X, ImageOff, ShieldCheck, ShieldAlert, ShieldQuestion, Store, Mail, Tag, Package } from "lucide-react";

interface ArticleDetailModalProps {
  article: ArticleModeration | null;
  onClose: () => void;
  onPublier?: (id: string) => void;
  onRefuser?: (article: ArticleModeration) => void;
}

function formatFCFA(n: number) {
  return new Intl.NumberFormat("fr-FR").format(Math.round(n)) + " F";
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Badge du statut KYC du vendeur, calculé en direct (jointure live vendeurs.statut)
 * — jamais à partir de raison_rejet, qui n'est qu'un texte figé au moment de la
 * création de l'article et qui ne reflète plus forcément la réalité. */
function VendeurStatutBadge({ statut }: { statut: string | null }) {
  if (statut === "valide") {
    return (
      <StatusBadge variant="success" icon={<ShieldCheck size={12} />}>
        Vendeur vérifié
      </StatusBadge>
    );
  }
  if (statut === "refuse") {
    return (
      <StatusBadge variant="error" icon={<ShieldAlert size={12} />}>
        KYC vendeur refusé
      </StatusBadge>
    );
  }
  return (
    <StatusBadge variant="pending" icon={<ShieldQuestion size={12} />}>
      Vendeur non encore vérifié
    </StatusBadge>
  );
}

export function ArticleDetailModal({ article, onClose, onPublier, onRefuser }: ArticleDetailModalProps) {
  if (!article) return null;

  const photos = [...(article.article_images ?? [])].sort((a, b) => (a.ordre ?? 0) - (b.ordre ?? 0));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      <div className="relative bg-white rounded-[28px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-start justify-between gap-4 rounded-t-[28px] z-10">
          <div className="min-w-0">
            <h2 className="font-bold text-gray-900 text-lg break-words">{article.nom}</h2>
            <p className="text-sm text-gray-400">Publié le {formatDate(article.created_at)}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Photos */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">
              Photos {photos.length > 0 && `(${photos.length})`}
            </h3>
            {photos.length === 0 ? (
              <div className="rounded-2xl border border-gray-100 bg-gray-50 flex flex-col items-center justify-center gap-2 min-h-[160px] text-red-500">
                <ImageOff size={24} />
                <span className="text-sm font-semibold">Aucune photo fournie</span>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {photos.map((img) => (
                  <a key={img.id} href={img.image_url} target="_blank" rel="noreferrer" className="block aspect-square rounded-2xl overflow-hidden bg-gray-50">
                    <img src={img.image_url} alt={article.nom} className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            )}
          </div>

          {/* Description complète */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Description</h3>
            <div className="rounded-2xl border border-gray-100 p-4 text-sm text-gray-700 whitespace-pre-wrap">
              {article.description || "Pas de description fournie."}
            </div>
          </div>

          {/* Détails article */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Détails</h3>
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span className="text-gray-400">Prix</span>
                <span className="font-bold text-gray-900">
                  {formatFCFA(article.prix)}
                  {article.prix_promo ? <span className="text-teal-600 ml-2">(promo : {formatFCFA(article.prix_promo)})</span> : null}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Tag size={15} className="text-gray-400 shrink-0" />
                <span>{article.categories?.nom || "Sans catégorie"}</span>
              </div>
              <div className="flex items-center gap-2">
                <Package size={15} className="text-gray-400 shrink-0" />
                <span>{article.stock == null ? "Stock illimité" : `${article.stock} en stock`}</span>
              </div>
            </div>
          </div>

          {/* Vendeur */}
          <div>
            <h3 className="text-xs font-bold uppercase text-gray-400 mb-2">Vendeur</h3>
            <div className="rounded-2xl border border-gray-100 p-4 space-y-3 text-sm text-gray-700">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Store size={15} className="text-gray-400 shrink-0" />
                  <span className="font-bold text-gray-900 truncate">
                    {article.vendeur?.nom_boutique || article.vendeur?.nom_complet || "Vendeur inconnu"}
                  </span>
                </div>
                <VendeurStatutBadge statut={article.vendeur?.statut ?? null} />
              </div>
              {article.vendeur?.email && (
                <div className="flex items-center gap-2">
                  <Mail size={15} className="text-gray-400 shrink-0" />
                  <span>{article.vendeur.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Motif initial de mise en attente (figé à la création, informatif seulement) */}
          {article.raison_rejet && article.statut !== "refuse" && (
            <div className="bg-amber-50 text-amber-700 text-xs font-medium p-3 rounded-2xl">
              Motif initial de mise en attente (au moment de la création) : {article.raison_rejet}
              {article.vendeur?.statut === "valide" && article.raison_rejet.includes("vérifié") && (
                <span className="block mt-1 text-amber-600">
                  Ce motif date d'avant la vérification du vendeur — le badge ci-dessus reflète son statut actuel.
                </span>
              )}
            </div>
          )}
          {article.statut === "refuse" && article.raison_rejet && (
            <div className="bg-red-50 text-red-700 text-sm font-medium p-4 rounded-2xl">
              Motif du refus : {article.raison_rejet}
            </div>
          )}
        </div>

        {article.statut === "en_attente" && (onPublier || onRefuser) && (
          <div className="sticky bottom-0 bg-white border-t border-gray-100 p-4 flex gap-3 rounded-b-[28px]">
            {onRefuser && (
              <button
                onClick={() => onRefuser(article)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
              >
                Refuser
              </button>
            )}
            {onPublier && (
              <button
                onClick={() => onPublier(article.id)}
                className="flex-1 py-3 rounded-2xl text-sm font-bold bg-teal-500 text-white hover:bg-teal-600 transition-colors"
              >
                Publier
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
