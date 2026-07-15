"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MessagePartner {
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

interface PartnerRow {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
}

export interface ConversationMessage {
  id: string;
  expediteur_id: string;
  destinataire_id: string;
  contenu: string;
  lu: boolean;
  commande_id: string | null;
  created_at: string;
}

export interface Conversation {
  partnerId: string;
  partner: MessagePartner | null;
  messages: ConversationMessage[];
  dernierMessage: ConversationMessage | null; // null = fil ouvert sans message envoyé pour l'instant
  nonLus: number;
  commandeId: string | null;
}

export function useVendeurMessages() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [sending, setSending] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);

  const fetchPartner = useCallback(async (partnerId: string): Promise<MessagePartner | null> => {
    const supabase = createClient();
    const { data } = await supabase
      .from("users")
      .select("id, full_name, avatar_url, phone")
      .eq("id", partnerId)
      .single();
    if (!data) return null;
    const row = data as PartnerRow;
    return { full_name: row.full_name, avatar_url: row.avatar_url, phone: row.phone };
  }, []);

  const fetchMessages = useCallback(async () => {
    setLoading(true);
    setError(null);
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Utilisateur non connecté");
      setLoading(false);
      return;
    }
    setUserId(user.id);
    userIdRef.current = user.id;

    const { data, error: fetchError } = await supabase
      .from("messages")
      .select("id, expediteur_id, destinataire_id, contenu, lu, commande_id, created_at")
      .or(`expediteur_id.eq.${user.id},destinataire_id.eq.${user.id}`)
      .order("created_at", { ascending: true });

    if (fetchError) {
      console.error("Erreur lors du chargement des messages:", fetchError);
      setError("Impossible de charger les messages");
      setLoading(false);
      return;
    }

    const allMessages = (data as ConversationMessage[]) || [];

    const partnerIds = Array.from(
      new Set(
        allMessages.map((m) => (m.expediteur_id === user.id ? m.destinataire_id : m.expediteur_id))
      )
    );

    let partnersById = new Map<string, MessagePartner>();
    if (partnerIds.length > 0) {
      const { data: partnersData } = await supabase
        .from("users")
        .select("id, full_name, avatar_url, phone")
        .in("id", partnerIds);

      const partnersList = (partnersData || []) as PartnerRow[];
      partnersById = new Map(
        partnersList.map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url, phone: p.phone }])
      );
    }

    const grouped = new Map<string, ConversationMessage[]>();
    allMessages.forEach((m) => {
      const partnerId = m.expediteur_id === user.id ? m.destinataire_id : m.expediteur_id;
      if (!grouped.has(partnerId)) grouped.set(partnerId, []);
      grouped.get(partnerId)!.push(m);
    });

    const convs: Conversation[] = Array.from(grouped.entries())
      .map(([partnerId, msgs]) => {
        const dernierMessage = msgs[msgs.length - 1];
        const nonLus = msgs.filter((m) => m.destinataire_id === user.id && !m.lu).length;
        return {
          partnerId,
          partner: partnersById.get(partnerId) || null,
          messages: msgs,
          dernierMessage,
          nonLus,
          commandeId: dernierMessage.commande_id,
        };
      })
      .sort(
        (a, b) =>
          new Date(b.dernierMessage!.created_at).getTime() -
          new Date(a.dernierMessage!.created_at).getTime()
      );

    setConversations(convs);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // --- Temps réel : nouveaux messages + statut de lecture en live ---
  useEffect(() => {
    if (!userId) return;
    const supabase = createClient();

    const upsertIncoming = (msg: ConversationMessage) => {
      setConversations((prev) => {
        const partnerId = msg.expediteur_id === userId ? msg.destinataire_id : msg.expediteur_id;
        const idx = prev.findIndex((c) => c.partnerId === partnerId);

        if (idx === -1) {
          // Nouveau partenaire jamais vu : on l'ajoute avec profil chargé en arrière-plan
          fetchPartner(partnerId).then((partner) => {
            setConversations((cur) =>
              cur.map((c) => (c.partnerId === partnerId ? { ...c, partner } : c))
            );
          });
          return [
            {
              partnerId,
              partner: null,
              messages: [msg],
              dernierMessage: msg,
              nonLus: msg.destinataire_id === userId && !msg.lu ? 1 : 0,
              commandeId: msg.commande_id,
            },
            ...prev,
          ];
        }

        const next = [...prev];
        const conv = next[idx];
        if (conv.messages.some((m) => m.id === msg.id)) return prev; // déjà présent (évite le doublon avec l'ajout optimiste local)
        next[idx] = {
          ...conv,
          messages: [...conv.messages, msg],
          dernierMessage: msg,
          nonLus: conv.nonLus + (msg.destinataire_id === userId && !msg.lu ? 1 : 0),
        };
        // remonte la conversation en haut de liste
        next.splice(idx, 1);
        return [next[idx] ?? { ...conv, messages: [...conv.messages, msg], dernierMessage: msg }, ...next];
      });
    };

    const applyReadUpdate = (msg: ConversationMessage) => {
      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === (msg.expediteur_id === userId ? msg.destinataire_id : msg.expediteur_id)
            ? {
                ...c,
                messages: c.messages.map((m) => (m.id === msg.id ? { ...m, lu: msg.lu } : m)),
                nonLus: c.messages.filter((m) => m.destinataire_id === userId && !m.lu && m.id !== msg.id)
                  .length + (msg.destinataire_id === userId && !msg.lu ? 1 : 0),
              }
            : c
        )
      );
    };

    const channel = supabase
      .channel(`messages-realtime-${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `destinataire_id=eq.${userId}` },
        (payload) => upsertIncoming(payload.new as ConversationMessage)
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages", filter: `expediteur_id=eq.${userId}` },
        (payload) => upsertIncoming(payload.new as ConversationMessage)
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "messages", filter: `expediteur_id=eq.${userId}` },
        (payload) => applyReadUpdate(payload.new as ConversationMessage) // le client a lu mon message → statut "vu"
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchPartner]);

  const marquerCommeLu = useCallback(
    async (partnerId: string) => {
      if (!userId) return;
      const supabase = createClient();

      const { error: updateError } = await supabase
        .from("messages")
        .update({ lu: true })
        .eq("expediteur_id", partnerId)
        .eq("destinataire_id", userId)
        .eq("lu", false);

      if (updateError) {
        console.error("Erreur lors du marquage comme lu:", updateError);
        return;
      }

      setConversations((prev) =>
        prev.map((c) =>
          c.partnerId === partnerId
            ? {
                ...c,
                nonLus: 0,
                messages: c.messages.map((m) => (m.destinataire_id === userId ? { ...m, lu: true } : m)),
              }
            : c
        )
      );
    },
    [userId]
  );

  const envoyerMessage = useCallback(
    async (partnerId: string, contenu: string, commandeId?: string | null) => {
      if (!userId) return;
      setSending(true);
      const supabase = createClient();

      const { data, error: insertError } = await supabase
        .from("messages")
        .insert({
          expediteur_id: userId,
          destinataire_id: partnerId,
          contenu,
          commande_id: commandeId ?? null,
        })
        .select()
        .single();

      if (insertError) {
        console.error("Erreur lors de l'envoi du message:", insertError);
        setError("Impossible d'envoyer le message");
        setSending(false);
        return;
      }

      const nouveauMessage = data as ConversationMessage;

      setConversations((prev) => {
        const existe = prev.find((c) => c.partnerId === partnerId);
        if (existe) {
          return prev.map((c) =>
            c.partnerId === partnerId
              ? { ...c, messages: [...c.messages, nouveauMessage], dernierMessage: nouveauMessage }
              : c
          );
        }
        return [
          {
            partnerId,
            partner: null,
            messages: [nouveauMessage],
            dernierMessage: nouveauMessage,
            nonLus: 0,
            commandeId: nouveauMessage.commande_id,
          },
          ...prev,
        ];
      });

      setSending(false);
    },
    [userId]
  );

  // Ouvre un fil pour un client donné, même si aucun message n'existe encore
  // (utilisé par la redirection depuis une commande)
  const openConversationWith = useCallback(
    async (partnerId: string, commandeId?: string | null) => {
      setConversations((prev) => {
        if (prev.some((c) => c.partnerId === partnerId)) return prev;
        return [
          {
            partnerId,
            partner: null,
            messages: [],
            dernierMessage: null,
            nonLus: 0,
            commandeId: commandeId ?? null,
          },
          ...prev,
        ];
      });

      const partner = await fetchPartner(partnerId);
      setConversations((prev) =>
        prev.map((c) => (c.partnerId === partnerId ? { ...c, partner } : c))
      );
    },
    [fetchPartner]
  );

  return {
    loading,
    error,
    conversations,
    sending,
    marquerCommeLu,
    envoyerMessage,
    openConversationWith,
    refresh: fetchMessages,
  };
}
