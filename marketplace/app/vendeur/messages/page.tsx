"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useVendeurMessages, ConversationMessage } from "@/lib/hooks/useVendeurMessages";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Send, User, ArrowLeft, Phone, RotateCcw } from "lucide-react";

const GROUP_WINDOW_MS = 2 * 60 * 1000; // messages du même expéditeur à moins de 2 min = groupés visuellement

function VendeurMessagesContent() {
  const {
    loading,
    error,
    conversations,
    sending,
    loadingOlder,
    marquerCommeLu,
    envoyerMessage,
    retryMessage,
    loadOlderMessages,
    openConversationWith,
    refresh,
  } = useVendeurMessages();

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const commandeParam = searchParams.get("commande");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (clientParam) {
      openConversationWith(clientParam, commandeParam);
      setSelectedId(clientParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientParam, commandeParam]);

  const conversation = conversations.find((c) => c.partnerId === selectedId) || null;

  useEffect(() => {
    if (selectedId && conversation?.nonLus) marquerCommeLu(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, conversation?.nonLus]);

  // Scroll auto vers le bas — seulement quand un message est AJOUTÉ À LA FIN
  // (nouvel envoi, réception temps réel, ouverture d'un fil), jamais quand on
  // charge l'historique (ça insère au DÉBUT, pas à la fin).
  useEffect(() => {
    if (!conversation || conversation.messages.length === 0) return;
    const lastMsg = conversation.messages[conversation.messages.length - 1];
    if (lastMsg.id !== lastMessageIdRef.current) {
      lastMessageIdRef.current = lastMsg.id;
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [conversation]);

  useEffect(() => {
    lastMessageIdRef.current = null; // reset au changement de conversation pour forcer le scroll initial
  }, [selectedId]);

  const handleSend = async () => {
    if (!selectedId || !texte.trim()) return;
    const contenu = texte;
    setTexte("");
    await envoyerMessage(selectedId, contenu, conversation?.commandeId);
  };

  return (
    <DashboardLayout role="vendeur" title="Messages">
      {error && (
        <div className="mb-6 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
          <p className="text-sm text-red-600 font-medium">{error}</p>
          <button
            onClick={refresh}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )}

      {loading ? (
        <DashboardSkeleton />
      ) : (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[calc(100dvh-220px)] min-h-[400px] flex">
          {/* Liste des conversations */}
          <div
            className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto ${
              selectedId ? "hidden sm:block" : "block"
            }`}
          >
            {conversations.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-16">
                <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                  <Send size={22} className="text-gray-300" />
                </div>
                <p className="font-semibold text-gray-800 mb-1">Aucune conversation pour l'instant</p>
                <p className="text-sm text-gray-400">
                  Les échanges avec tes clients apparaîtront ici, notamment quand tu réponds depuis une commande.
                </p>
              </div>
            ) : (
              conversations.map((conv) => (
                <button
                  key={conv.partnerId}
                  onClick={() => setSelectedId(conv.partnerId)}
                  className={`w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-50 ${
                    selectedId === conv.partnerId ? "bg-coral-50/50" : ""
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-teal-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {conv.partner?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={conv.partner.avatar_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User size={20} className="text-teal-600" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-semibold text-gray-900 truncate text-sm">
                        {conv.partner?.full_name || "Utilisateur"}
                      </p>
                      {conv.nonLus > 0 && (
                        <span className="min-w-[18px] h-[18px] px-1 bg-coral-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
                          {conv.nonLus}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">
                      {conv.dernierMessage ? conv.dernierMessage.contenu : "Nouvelle conversation"}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Thread */}
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

                <div className="flex-1 overflow-y-auto p-4 space-y-1">
                  {!conversation.noMoreOlder && conversation.messages.length > 0 && (
                    <div className="flex justify-center pb-3">
                      <button
                        onClick={() => loadOlderMessages(conversation.partnerId)}
                        disabled={loadingOlder[conversation.partnerId]}
                        className="text-xs font-semibold text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        {loadingOlder[conversation.partnerId] ? "Chargement…" : "Charger les messages précédents"}
                      </button>
                    </div>
                  )}

                  {conversation.messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-center px-6">
                      <p className="text-sm text-gray-400">
                        Aucun message échangé pour l'instant. Écris le premier message ci-dessous.
                      </p>
                    </div>
                  ) : (
                    conversation.messages.map((m, i) => {
                      const isMine = m.expediteur_id !== conversation.partnerId;
                      const prev = conversation.messages[i - 1];
                      const next = conversation.messages[i + 1];

                      const groupedWithPrev =
                        !!prev &&
                        prev.expediteur_id === m.expediteur_id &&
                        new Date(m.created_at).getTime() - new Date(prev.created_at).getTime() < GROUP_WINDOW_MS;
                      const groupedWithNext =
                        !!next &&
                        next.expediteur_id === m.expediteur_id &&
                        new Date(next.created_at).getTime() - new Date(m.created_at).getTime() < GROUP_WINDOW_MS;

                      return (
                        <div
                          key={m.id}
                          className={`flex ${isMine ? "justify-end" : "justify-start"} ${
                            groupedWithPrev ? "mt-0.5" : "mt-3"
                          }`}
                        >
                          <div
                            onClick={() => m._failed && retryMessage(conversation.partnerId, m)}
                            className={`max-w-[85%] sm:max-w-[75%] px-4 py-2.5 text-sm rounded-2xl ${
                              m._failed
                                ? "bg-red-50 text-red-700 border border-red-200 cursor-pointer"
                                : isMine
                                ? "bg-coral-500 text-white"
                                : "bg-gray-100 text-gray-900"
                            } ${m._pending ? "opacity-60" : ""} ${
                              isMine
                                ? `${groupedWithPrev ? "rounded-tr-md" : ""} ${groupedWithNext ? "rounded-br-md" : ""}`
                                : `${groupedWithPrev ? "rounded-tl-md" : ""} ${groupedWithNext ? "rounded-bl-md" : ""}`
                            }`}
                          >
                            {m.contenu}
                            {isMine && !groupedWithNext && (
                              <span
                                className={`flex items-center gap-1 text-[10px] mt-1 ${
                                  m._failed ? "text-red-600 font-semibold" : "text-white/70"
                                }`}
                              >
                                {m._failed ? (
                                  <>
                                    <RotateCcw size={10} /> Échec — toucher pour réessayer
                                  </>
                                ) : m._pending ? (
                                  "Envoi…"
                                ) : m.lu ? (
                                  "Vu"
                                ) : (
                                  "Envoyé"
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={bottomRef} />
                </div>

                <div className="p-4 border-t border-gray-100 flex items-center gap-2">
                  <input
                    value={texte}
                    onChange={(e) => setTexte(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSend()}
                    placeholder="Écrire un message..."
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-coral-200"
                  />
                  <button
                    onClick={handleSend}
                    disabled={sending || !texte.trim()}
                    className="w-11 h-11 rounded-2xl bg-coral-500 text-white flex items-center justify-center disabled:opacity-40 hover:bg-coral-600 transition-colors flex-shrink-0"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}

export default function VendeurMessagesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <VendeurMessagesContent />
    </Suspense>
  );
}
