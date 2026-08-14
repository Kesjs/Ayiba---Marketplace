"use client";

import { useEffect, useState } from "react";
import { Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

const supabase = createClient();

/**
 * Affiche une note additionnelle réglée par l'admin (Paramètres système)
 * en tête d'une page légale (CGU / Politique de confidentialité), sans
 * toucher au contenu structuré existant en dessous.
 */
export function LegalNotice({ paramKey }: { paramKey: "cgu_note_admin" | "confidentialite_note_admin" }) {
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("parametres_systeme")
        .select("valeur")
        .eq("cle", paramKey)
        .maybeSingle();
      if (cancelled) return;
      const texte = typeof data?.valeur === "string" ? data.valeur.trim() : "";
      if (texte) setNote(texte);
    })();
    return () => {
      cancelled = true;
    };
  }, [paramKey]);

  if (!note) return null;

  return (
    <div className="max-w-3xl mx-auto mb-6 flex items-start gap-3 bg-teal-50/60 border border-teal-100 rounded-2xl p-4">
      <Info size={16} className="text-teal-600 shrink-0 mt-0.5" />
      <p className="text-sm text-teal-800 whitespace-pre-line">{note}</p>
    </div>
  );
}
