"use client";

import { useState } from "react";
import { Star, Package, Bike, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/context/ToastContext";

export interface AvisExistant {
  id: string;
  note: number;
  commentaire: string | null;
}

interface LaisserAvisCardProps {
  type: "article" | "livreur";
  cibleId: string;
  label: string;
  commandeId: string;
  userId: string;
  avisExistant: AvisExistant | null;
  onSaved: (avis: AvisExistant) => void;
}

function StarPicker({ note, onChange, readOnly }: { note: number; onChange?: (n: number) => void; readOnly?: boolean }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(n)}
          className={readOnly ? "cursor-default" : "cursor-pointer"}
        >
          <Star
            size={readOnly ? 14 : 22}
            className={n <= note ? "fill-amber-400 text-amber-400" : "text-gray-200"}
          />
        </button>
      ))}
    </div>
  );
}

export function LaisserAvisCard({
  type,
  cibleId,
  label,
  commandeId,
  userId,
  avisExistant,
  onSaved,
}: LaisserAvisCardProps) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(avisExistant?.note || 0);
  const [commentaire, setCommentaire] = useState(avisExistant?.commentaire || "");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (note < 1) {
      showToast("Choisis une note avant d'envoyer", "warning");
      return;
    }
    setSaving(true);
    try {
      if (avisExistant) {
        const { error } = await supabase
          .from("avis")
          .update({ note, commentaire: commentaire.trim() || null })
          .eq("id", avisExistant.id);
        if (error) throw error;
        onSaved({ id: avisExistant.id, note, commentaire: commentaire.trim() || null });
      } else {
        const payload: Record<string, any> = {
          utilisateur_id: userId,
          commande_id: commandeId,
          note,
          commentaire: commentaire.trim() || null,
        };
        if (type === "article") payload.article_id = cibleId;
        if (type === "livreur") payload.livreur_id = cibleId;

        const { data, error } = await supabase.from("avis").insert(payload).select("id, note, commentaire").single();
        if (error) throw error;
        onSaved(data as AvisExistant);
      }
      showToast("Avis envoyé, merci !", "success");
      setEditing(false);
    } catch (error) {
      console.error("Error saving avis:", error);
      showToast("Erreur lors de l'envoi de l'avis", "error");
    } finally {
      setSaving(false);
    }
  };

  const dejaEnvoye = !!avisExistant && !editing;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 shrink-0">
          {type === "livreur" ? <Bike size={16} /> : <Package size={16} />}
        </div>
        <p className="text-sm font-semibold text-gray-800 truncate flex-1">{label}</p>
        {dejaEnvoye && (
          <span className="flex items-center gap-1 text-[11px] font-bold text-teal-600 shrink-0">
            <Check size={12} /> Envoyé
          </span>
        )}
      </div>

      {dejaEnvoye ? (
        <div>
          <StarPicker note={avisExistant!.note} readOnly />
          {avisExistant!.commentaire && (
            <p className="text-sm text-gray-600 mt-2">{avisExistant!.commentaire}</p>
          )}
          <button
            onClick={() => setEditing(true)}
            className="text-xs font-bold text-coral-400 mt-2"
          >
            Modifier mon avis
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <StarPicker note={note} onChange={setNote} />
          <textarea
            value={commentaire}
            onChange={(e) => setCommentaire(e.target.value)}
            placeholder="Ton commentaire (facultatif)..."
            className="w-full h-16 rounded-lg border border-gray-100 px-3 py-2 text-sm focus:border-coral-400 outline-none resize-none"
          />
          <div className="flex gap-2">
            {avisExistant && (
              <button
                onClick={() => {
                  setEditing(false);
                  setNote(avisExistant.note);
                  setCommentaire(avisExistant.commentaire || "");
                }}
                className="h-9 px-4 rounded-xl border border-gray-200 text-xs font-bold text-gray-600"
              >
                Annuler
              </button>
            )}
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 h-9 rounded-xl bg-coral-500 text-white text-xs font-bold disabled:opacity-50"
            >
              {saving ? "Envoi..." : "Envoyer l'avis"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
