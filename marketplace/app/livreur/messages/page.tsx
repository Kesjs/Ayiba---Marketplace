"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLivreurMessages } from "@/lib/hooks/useLivreurMessages";
import { useUiChrome } from "@/context/UiChromeContext";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Send, User, ArrowLeft, Phone, RotateCcw } from "lucide-react";

const GROUP_WINDOW_MS = 2 * 60 * 1000;

function LivreurMessagesContent() {
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
  } = useLivreurMessages();

  const searchParams = useSearchParams();
  const clientParam = searchParams.get("client");
  const commandeParam = searchParams.get("commande");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texte, setTexte] = useState("");
  const [filtreListe, setFiltreListe] = useState<"toutes" | "non_lus">("toutes");
  const bottomRef = useRef<HTMLDivElement>(null);
  const lastMessageIdRef = useRef<string | null>(null);
  const { setHideBottomNav } = useUiChrome();

  useEffect(() => {
    if (clientParam) {
      openConversationWith(clientParam, commandeParam);
      setSelectedId(clientParam);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientParam, commandeParam]);

  const conversation = conversations.find((c) => c.partnerId === selectedId) || null;

  const nombreNonLus = useMemo(
    () => conversations.filter((c) => c.nonLus > 0).length,
    [conversations]
  );

  const conversationsAffichees = useMemo(
    () => (filtreListe === "non_lus" ? conversations.filter((c) => c.nonLus > 0) : conversations),
    [conversations, filtreListe]
  );

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

  // Cache la bottom nav globale quand une conversation est ouverte (mobile)
  useEffect(() => {
    setHideBottomNav(!!selectedId);
    return () => setHideBottomNav(false);
  }, [selectedId, setHideBottomNav]);

  const handleSend = async () => {
    if (!selectedId || !texte.trim()) return;
    const contenu = texte;
    setTexte("");
    await envoyerMessage(selectedId, contenu, conversation?.commandeId);
  };

  return (
    <DashboardLayout role="livreur" title="Messages" fullHeight>
      {error && (
        <div className="mb-3 flex-shrink-0 rounded-2xl bg-red-50 border border-red-100 p-4 flex items-center justify-between">
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
        <div
          className={`bg-white lg:rounded-3xl lg:border lg:border-gray-100 lg:shadow-sm overflow-hidden flex-1 min-h-0 flex ${
            selectedId ? "fixed inset-0 z-40 lg:static lg:z-auto" : ""
          }`}
        >
          {/* Liste des conversations */}
          <div
            className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 flex flex-col ${
              selectedId ? "hidden sm:flex" : "flex"
            }`}
          >
            {/* Filtre Toutes / Non lus */}
            <div className="flex gap-2 p-3 border-b border-gray-50 flex-shrink-0">
              <button
                onClick={() => setFiltreListe("toutes")}
                className={`px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filtreListe === "toutes" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500"
                }`}
              >
                Toutes
              </button>
              <button
                onClick={() => setFiltreListe("non_lus")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold transition-colors ${
                  filtreListe === "non_lus" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-500"
                }`}
              >
                Non lus
                {nombreNonLus > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      filtreListe === "non_lus" ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {nombreNonLus}
                  </span>
                )}
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {conversationsAffichees.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center px-6 py-16">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4">
                    <Send size={22} className="text-gray-300" />
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">
                    {filtreListe === "non_lus" ? "Rien de non lu" : "Aucune conversation pour l'instant"}
                  </p>
                  <p className="text-sm text-gray-400">
                    {filtreListe === "non_lus"
                      ? "Tu es à jour sur tous tes messages."
                      : "Les échanges avec tes clients apparaîtront ici, notamment quand tu réponds depuis une commande."}
                  </p>
                </div>
              ) : (
                conversationsAffichees.map((conv) => {
                  const nonLu = conv.nonLus > 0;
                  return (
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
                          <p
                            className={`truncate text-sm ${
                              nonLu ? "font-bold text-gray-900" : "font-medium text-gray-600"
                            }`}
                          >
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
                  );
                })
              )}
            </div>
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
                    <p className="hidden sm:block text-xs text-gray-400 font-medium mb-0.5 truncate">
                      Messages / {conversation.partner?.full_name || "Utilisateur"}
                    </p>
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

export default function LivreurMessagesPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <LivreurMessagesContent />
    </Suspense>
  );
}
