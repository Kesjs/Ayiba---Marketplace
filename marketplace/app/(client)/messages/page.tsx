"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useClientMessages } from "@/lib/hooks/useClientMessages";
import { useUser } from "@/lib/hooks/useUser";
import { useBadgeCounts } from "@/lib/hooks/useBadgeCounts";
import { ClientDashboardHeader } from "@/components/client/ClientDashboardHeader";
import { MessageCircleOff, Send, User, ArrowLeft, Phone, Store, Bike, LifeBuoy, RotateCcw } from "lucide-react";

const ONGLETS = [
  { id: "vendeur" as const, label: "Vendeurs", icon: Store },
  { id: "livreur" as const, label: "Livreurs", icon: Bike },
  { id: "support" as const, label: "Support", icon: LifeBuoy },
];

function MessagesContent() {
  const router = useRouter()
  const { profile } = useUser()
  const badges = useBadgeCounts(profile?.id, 'client')
  const {
    loading,
    error,
    conversations,
    sending,
    marquerCommeLu,
    envoyerMessage,
    retryMessage,
    openConversationWith,
    refresh,
  } = useClientMessages();

  const searchParams = useSearchParams();
  const vendeurParam = searchParams.get("vendeur");
  const livreurParam = searchParams.get("livreur");
  const commandeParam = searchParams.get("commande");

  const [onglet, setOnglet] = useState<"vendeur" | "livreur" | "support">("vendeur");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    const partnerId = vendeurParam || livreurParam;
    if (partnerId) {
      openConversationWith(partnerId, commandeParam);
      setSelectedId(partnerId);
      setOnglet(vendeurParam ? "vendeur" : "livreur");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendeurParam, livreurParam, commandeParam]);

  const conversationsFiltrees = useMemo(
    () => conversations.filter((c) => c.partner?.role === onglet),
    [conversations, onglet]
  );

  const conversation = conversationsFiltrees.find((c) => c.partnerId === selectedId) || null;

  const compteursNonLus = useMemo(() => {
    const counts: Record<string, number> = { vendeur: 0, livreur: 0, support: 0 };
    conversations.forEach((c) => {
      if (c.partner?.role && c.nonLus > 0) counts[c.partner.role] = (counts[c.partner.role] || 0) + 1;
    });
    return counts;
  }, [conversations]);

  useEffect(() => {
    if (selectedId && conversation?.nonLus) marquerCommeLu(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, conversation?.nonLus]);

  useEffect(() => {
    if (!conversation || conversation.messages.length === 0) return;
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [conversation]);

  useEffect(() => {
    lastMessageIdRef.current = null;
  }, [selectedId]);

  const handleSend = async () => {
    if (!selectedId || !texte.trim()) return;
    const contenu = texte;
    setTexte("");
    await envoyerMessage(selectedId, contenu, conversation?.commandeId);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50/30">
      <ClientDashboardHeader
        title="Messages"
        avatarUrl={profile?.avatar_url}
        fullName={profile?.full_name || undefined}
        notificationsCount={badges.notifications}
        notifications={badges.notificationsList}
        onAvatarClick={() => router.push('/profil')}
        logoHref="/accueil"
      />
      <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
        <div className="flex px-4 gap-1 overflow-x-auto">
          {ONGLETS.map((o) => {
            const actif = onglet === o.id
            const count = compteursNonLus[o.id] || 0
            return (
              <button
                key={o.id}
                onClick={() => {
                  setOnglet(o.id)
                  setSelectedId(null)
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
                  actif ? "border-coral-400 text-coral-600" : "border-transparent text-gray-400"
                }`}
              >
                <o.icon size={15} />
                {o.label}
                {count > 0 && (
                  <span className="w-4 h-4 flex items-center justify-center bg-coral-400 text-white text-[10px] rounded-full">
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {error && (
        <div className="m-4 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {onglet === "support" ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
            <LifeBuoy size={22} className="text-gray-300" />
          </div>
          <p className="font-semibold text-gray-800 mb-1">Centre d'aide à venir</p>
          <p className="text-sm text-gray-400 max-w-xs">
            La messagerie support n'est pas encore disponible. En attendant, contacte-nous directement depuis la page Aide du menu.
          </p>
        </div>
      ) : loading ? (
        <div className="space-y-3 p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white border border-gray-100 rounded-2xl p-4 h-20 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="flex-1 bg-white sm:rounded-3xl sm:border sm:border-gray-100 sm:m-4 overflow-hidden flex h-[calc(100dvh-120px)] sm:h-[calc(100dvh-160px)]">
          <div
            className={`w-full sm:w-80 flex-shrink-0 sm:border-r border-gray-100 flex flex-col ${
              selectedId ? "hidden sm:flex" : "flex"
            }`}
          >
            <div className="flex-1 overflow-y-auto">
              {conversationsFiltrees.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-16">
                  <MessageCircleOff size={36} className="text-gray-300 mb-4" />
                  <p className="font-semibold text-gray-800 mb-1">
                    Aucune conversation {ONGLETS.find((o) => o.id === onglet)?.label.toLowerCase()}
                  </p>
                  <p className="text-sm text-gray-400">
                    Les échanges avec un {onglet === "vendeur" ? "vendeur" : "livreur"} apparaîtront ici.
                  </p>
                </div>
              ) : (
                conversationsFiltrees.map((conv) => {
                  const nonLu = conv.nonLus > 0
                  return (
                    <button
                      key={conv.partnerId}
                      onClick={() => setSelectedId(conv.partnerId)}
                      className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                        selectedId === conv.partnerId ? "bg-coral-50/50" : ""
                      }`}
                    >
                      <div className="w-11 h-11 rounded-2xl bg-coral-50 flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {conv.partner?.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={conv.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <User size={20} className="text-coral-600" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`truncate text-sm ${nonLu ? "font-bold text-gray-900" : "font-medium text-gray-600"}`}>
                            {conv.partner?.full_name || "Utilisateur"}
                          </p>
                          {nonLu && (
                            <span className="min-w-[18px] h-[18px] px-1 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                              {conv.nonLus}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate ${nonLu ? "text-gray-700 font-medium" : "text-gray-400"}`}>
                          {conv.dernierMessage ? conv.dernierMessage.contenu : "Nouvelle conversation"}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          <div className={`flex-1 flex-col ${selectedId ? "flex" : "hidden sm:flex"}`}>
            {!conversation ? (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                Sélectionne une conversation
              </div>
            ) : (
              <>
                <div className="p-4 border-b border-gray-100 flex items-center gap-3">
                  <button onClick={() => setSelectedId(null)} className="sm:hidden p-1 -ml-1 text-gray-400">
                    <ArrowLeft size={20} />
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">{conversation.partner?.full_name || "Utilisateur"}</p>
                  </div>
                  {conversation.partner?.phone && (
                    <a
                      href={`tel:${conversation.partner.phone}`}
                      className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-500 hover:bg-gray-100 flex-shrink-0"
                      aria-label="Appeler"
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation.messages.map((msg) => {
                    const estMoi = msg.expediteur_id !== conversation.partnerId
                    return (
                      <div key={msg.id} className={`flex ${estMoi ? "justify-end" : "justify-start"}`}>
                        <div className="max-w-[75%]">
                          <div
                            className={`px-3.5 py-2 rounded-2xl text-sm ${
                              estMoi
                                ? `bg-coral-500 text-white ${msg._failed ? "opacity-60" : ""}`
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {msg.contenu}
                          </div>
                          {msg._failed && (
                            <button
                              onClick={() => retryMessage(conversation.partnerId, msg)}
                              className="flex items-center gap-1 text-[11px] text-red-500 mt-1"
                            >
                              <RotateCcw size={11} /> Échec — réessayer
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <div className="p-3 border-t border-gray-100 flex items-center gap-2">
                  <input
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    placeholder="Écris un message..."
                    className="flex-1 bg-gray-50 rounded-full px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-coral-200"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!texte.trim() || sending}
                    className="w-10 h-10 rounded-full bg-coral-500 text-white flex items-center justify-center disabled:opacity-40 flex-shrink-0"
                    aria-label="Envoyer"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default function MessagesPage() {
  return (
    <Suspense fallback={null}>
      <MessagesContent />
    </Suspense>
  )
}
