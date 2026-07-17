"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export type TypeVehicule = "motocyclette" | "velo" | "tricycle" | "a_pied";
export type MobileMoneyNetwork = "mtn" | "moov" | "celtiis";

export interface LivreurParametres {
  fullName: string;
  phone: string;
  avatarUrl: string | null;
  quartier: string;
  commune: string;
  typeVehicule: TypeVehicule | "";
  plaqueImmatriculation: string;
  mobileMoneyNetwork: MobileMoneyNetwork | "";
  mobileMoneyNumber: string;
  notifPush: boolean;
  notifWhatsapp: boolean;
  notifEmail: boolean;
}

const EMPTY: LivreurParametres = {
  fullName: "",
  phone: "",
  avatarUrl: null,
  quartier: "",
  commune: "",
  typeVehicule: "",
  plaqueImmatriculation: "",
  mobileMoneyNetwork: "",
  mobileMoneyNumber: "",
  notifPush: true,
  notifWhatsapp: true,
  notifEmail: false,
};

export function useLivreurParametres() {
  const supabase = createClient();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [data, setData] = useState<LivreurParametres>(EMPTY);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();
      if (authError || !user) throw new Error("Utilisateur non authentifié");

      const [{ data: userRow, error: userError }, { data: livreurRow, error: livreurError }] =
        await Promise.all([
          supabase
            .from("users")
            .select("full_name, phone, avatar_url, notif_push, notif_whatsapp, notif_email")
            .eq("id", user.id)
            .single(),
          supabase
            .from("livreurs")
            .select(
              "quartier, commune, type_vehicule, plaque_immatriculation, mobile_money_network, mobile_money_number, photo_profil_url"
            )
            .eq("id", user.id)
            .single(),
        ]);

      if (userError) throw userError;
      if (livreurError) throw livreurError;

      setData({
        fullName: userRow?.full_name ?? "",
        phone: userRow?.phone ?? "",
        avatarUrl: livreurRow?.photo_profil_url ?? userRow?.avatar_url ?? null,
        quartier: livreurRow?.quartier ?? "",
        commune: livreurRow?.commune ?? "",
        typeVehicule: (livreurRow?.type_vehicule as TypeVehicule) ?? "",
        plaqueImmatriculation: livreurRow?.plaque_immatriculation ?? "",
        mobileMoneyNetwork: (livreurRow?.mobile_money_network as MobileMoneyNetwork) ?? "",
        mobileMoneyNumber: livreurRow?.mobile_money_number ?? "",
        notifPush: userRow?.notif_push ?? true,
        notifWhatsapp: userRow?.notif_whatsapp ?? true,
        notifEmail: userRow?.notif_email ?? false,
      });
    } catch (err) {
      console.error("[useLivreurParametres] load error:", err);
      setError(err instanceof Error ? err.message : "Erreur lors du chargement du profil");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    load();
  }, [load]);

  const save = useCallback(
    async (updates: Partial<LivreurParametres>) => {
      setSaving(true);
      setError(null);
      setSuccessMessage(null);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Utilisateur non authentifié");

        const next = { ...data, ...updates };

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({
            full_name: next.fullName,
            phone: next.phone,
            notif_push: next.notifPush,
            notif_whatsapp: next.notifWhatsapp,
            notif_email: next.notifEmail,
          })
          .eq("id", user.id);

        if (userUpdateError) throw userUpdateError;

        const { error: livreurUpdateError } = await supabase
          .from("livreurs")
          .update({
            quartier: next.quartier,
            commune: next.commune,
            type_vehicule: next.typeVehicule || null,
            plaque_immatriculation: next.plaqueImmatriculation,
            mobile_money_network: next.mobileMoneyNetwork || null,
            mobile_money_number: next.mobileMoneyNumber,
          })
          .eq("id", user.id);

        if (livreurUpdateError) throw livreurUpdateError;

        setData(next);
        setSuccessMessage("Profil mis à jour");
        setTimeout(() => setSuccessMessage(null), 2500);
      } catch (err) {
        console.error("[useLivreurParametres] save error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors de l'enregistrement");
      } finally {
        setSaving(false);
      }
    },
    [supabase, data]
  );

  const uploadAvatar = useCallback(
    async (file: File) => {
      setUploadingAvatar(true);
      setError(null);
      try {
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser();
        if (authError || !user) throw new Error("Utilisateur non authentifié");

        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/avatar-${Date.now()}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from("avatars")
          .upload(path, file, { upsert: true });

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(path);

        const { error: userUpdateError } = await supabase
          .from("users")
          .update({ avatar_url: publicUrl })
          .eq("id", user.id);

        if (userUpdateError) throw userUpdateError;

        const { error: livreurUpdateError } = await supabase
          .from("livreurs")
          .update({ photo_profil_url: publicUrl })
          .eq("id", user.id);

        if (livreurUpdateError) throw livreurUpdateError;

        setData((prev) => ({ ...prev, avatarUrl: publicUrl }));
      } catch (err) {
        console.error("[useLivreurParametres] uploadAvatar error:", err);
        setError(err instanceof Error ? err.message : "Erreur lors de l'envoi de la photo");
      } finally {
        setUploadingAvatar(false);
      }
    },
    [supabase]
  );

  return {
    loading,
    saving,
    uploadingAvatar,
    error,
    successMessage,
    data,
    save,
    uploadAvatar,
    reload: load,
  };
}
