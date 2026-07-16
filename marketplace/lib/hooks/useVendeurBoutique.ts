"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type Jour = "lundi" | "mardi" | "mercredi" | "jeudi" | "vendredi" | "samedi" | "dimanche";

export interface CreneauJour {
  ouvert: boolean;
  debut: string; // "08:00"
  fin: string; // "18:00"
}

export type Horaires = Record<Jour, CreneauJour>;

export interface Boutique {
  id: string;
  nom_boutique: string | null;
  description: string | null;
  quartier: string | null;
  commune: string | null;
  mobile_money_network: string | null;
  mobile_money_number: string | null;
  photo_profil_url: string | null;
  photo_couverture_url: string | null;
  horaires: Horaires | null;
  statut: "en_attente" | "valide" | "refuse";
}

export interface BoutiqueFormInput {
  nom_boutique: string;
  description: string;
  quartier: string;
  commune: string;
  mobile_money_network: string;
  mobile_money_number: string;
  horaires: Horaires;
}

const supabase = createClient();

export function useVendeurBoutique() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boutique, setBoutique] = useState<Boutique | null>(null);

  const fetchBoutique = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Utilisateur non authentifié.");

      const { data, error: fetchError } = await supabase
        .from("vendeurs")
        .select(
          "id, nom_boutique, description, quartier, commune, mobile_money_network, mobile_money_number, photo_profil_url, photo_couverture_url, horaires, statut"
        )
        .eq("id", user.id)
        .single();

      if (fetchError) throw fetchError;
      setBoutique(data as Boutique);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Impossible de charger la boutique.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBoutique();
  }, [fetchBoutique]);

  const updateBoutique = useCallback(async (form: BoutiqueFormInput) => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) throw new Error("Utilisateur non authentifié.");

      const { data, error: updateError } = await supabase
        .from("vendeurs")
        .update({
          nom_boutique: form.nom_boutique,
          description: form.description,
          quartier: form.quartier,
          commune: form.commune,
          mobile_money_network: form.mobile_money_network || null,
          mobile_money_number: form.mobile_money_number,
          horaires: form.horaires,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id)
        .select(
          "id, nom_boutique, description, quartier, commune, mobile_money_network, mobile_money_number, photo_profil_url, photo_couverture_url, horaires, statut"
        )
        .single();

      if (updateError) throw updateError;
      setBoutique(data as Boutique);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Échec de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }, []);

  const uploadImage = useCallback(
    async (file: File, kind: "logo" | "cover") => {
      setError(null);
      try {
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) throw new Error("Utilisateur non authentifié.");

        const bucket = kind === "logo" ? "avatars" : "boutique-covers";
        const column = kind === "logo" ? "photo_profil_url" : "photo_couverture_url";
        const ext = file.name.split(".").pop();
        const path = `${user.id}/${kind}-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(path, file, { upsert: true });
        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from(bucket).getPublicUrl(path);

        const { data, error: updateError } = await supabase
          .from("vendeurs")
          .update({ [column]: publicUrl })
          .eq("id", user.id)
          .select(
            "id, nom_boutique, description, quartier, commune, mobile_money_network, mobile_money_number, photo_profil_url, photo_couverture_url, horaires, statut"
          )
          .single();
        if (updateError) throw updateError;

        setBoutique(data as Boutique);
        return publicUrl as string;
      } catch (err) {
        setError(err instanceof Error ? err.message : "Échec de l'envoi de l'image.");
        return null;
      }
    },
    []
  );

  return { loading, saving, saved, error, boutique, updateBoutique, uploadImage };
}
