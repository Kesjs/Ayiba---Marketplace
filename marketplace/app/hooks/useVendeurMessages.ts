"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profil {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface Conversation {
  partnerId: string;
  partner: Profil | null;
  commandeId: string | null;
  dernierMessage: any;
  nonLus: number;
  messages: any[];
}

export function useVendeurMessages() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sending, setSending] = useState(false);

  const loadMessages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError) throw authError;
      if (!user) throw new Error("Utilisateur non connecté");
      setUserId(user.id);

      const { data: msgs, error: msgsError } = await supabase
        .from("messages")
        .select("*")
        .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
        .order("created_at", { ascending: true });

      if (msgsError) throw msgsError;

      const partnerIds = new Set<string>();
      const grouped = new Map<string, Conversation>();

      (msgs || []).forEach((m) => {
        const partnerId = m.expediteur_id === user.id ? m.destinataire_id : m.expediteur_id;
        partnerIds.add(partnerId);

        const key = partnerId;
        if (!grouped.has(key)) {
          grouped.set(key, {
            partnerId,
            partner: null,
            commandeId: m.commande_id,
            dernierMessage: m,
            nonLus: 0,
            messages: [],
          });
        }
        const conv = grouped.get(key)!;
        conv.messages.push(m);
        conv.dernierMessage = m;
        if (m.destinataire_id === user.id && !m.lu) conv.nonLus += 1;
      });

      let profils: Profil[] = [];
      if (partnerIds.size > 0) {
        const { data: profilsData, error: profilsError } = await supabase
          .from("vue_profils_messagerie")
          .select("*")
          .in("id", Array.from(partnerIds));

        if (profilsError) throw profilsError;
        profils = profilsData || [];
      }

      const profilsMap = new Map(profils.map((p) => [p.id, p]));

      const convList = Array.from(grouped.values())
        .map((c) => ({ ...c, partner: profilsMap.get(c.partnerId) || null }))
        .sort(
          (a, b) =>
            new Date(b.dernierMessage.created_at).getTime() -
            new Date(a.dernierMessage.created_at).getTime()
        );

      setConversations(convList);
    } catch (err: any) {
      console.error("Messages vendeur:", err);
      setError(err.message || "Impossible de charger les messages");
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  const marquerCommeLu = useCallback(
    async (partnerId: string) => {
      if (!userId) return;
      const conv = conversations.find((c) => c.partnerId === partnerId);
      if (!conv || conv.nonLus === 0) return;

      const idsNonLus = conv.messages
        .filter((m) => m.destinataire_id === userId && !m.lu)
        .map((m) => m.id);

      if (idsNonLus.length === 0) return;

      const { error: updateError } = await supabase
        .from("messages")
        .update({ lu: true })
        .in("id", idsNonLus);

      if (updateError) {
        console.error("Marquer comme lu:", updateError);
        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === partnerId
            ? {
                ...c,
                nonLus: 0,
                messages: c.messages.map((m) => (idsNonLus.includes(m.id) ? { ...m, lu: true } : m)),
              }
            : c
        )
      );
    },
    [supabase, userId, conversations]
  );

  const envoyerMessage = useCallback(
    async (partnerId: string, contenu: string, commandeId?: string | null) => {
      if (!userId || !contenu.trim()) return;
      setSending(true);
      try {
        const { data, error: insertError } = await supabase
          .from("messages")
          .insert({
            expediteur_id: userId,
            destinataire_id: partnerId,
            commande_id: commandeId || null,
            contenu: contenu.trim(),
          })
          .select()
          .single();

        if (insertError) throw insertError;

        setConversations((prev) =>
          prev.map((c) =>
            c.partnerId === partnerId
              ? { ...c, messages: [...c.messages, data], dernierMessage: data }
              : c
          )
        );
      } catch (err: any) {
        console.error("Envoi message:", err);
        setError(err.message || "Impossible d'envoyer le message");
      } finally {
        setSending(false);
      }
    },
    [supabase, userId]
  );

  return {
    loading,
    error,
    userId,
    conversations,
    sending,
    marquerCommeLu,
    envoyerMessage,
    refresh: loadMessages,
  };
}
