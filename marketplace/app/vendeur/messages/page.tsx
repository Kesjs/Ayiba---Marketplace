"use client";

import { useEffect, useState } from "react";
import { useVendeurMessages } from "@/hooks/useVendeurMessages";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DashboardSkeleton } from "@/components/ui/Skeleton";
import { Send, User, ArrowLeft } from "lucide-react";

export default function VendeurMessagesPage() {
  const { loading, error, conversations, sending, marquerCommeLu, envoyerMessage, refresh } =
    useVendeurMessages();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [texte, setTexte] = useState("");

  const conversation = conversations.find((c) => c.partnerId === selectedId) || null;

  useEffect(() => {
    if (selectedId) marquerCommeLu(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, conversations.length]);

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
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-[70vh] flex">
          {/* Liste des conversations */}
          <div
            className={`w-full sm:w-80 flex-shrink-0 border-r border-gray-100 overflow-y-auto ${
              selectedId ? "hidden sm:block" : "block"
            }`}
          >
            {conversations.length === 0 ? (
              <p className="text-gray-400 text-center py-16 px-4">Aucun message pour l'instant</p>
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
                    <p className="text-xs text-gray-500 truncate">{conv.dernierMessage.contenu}</p>
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
                  <button
                    onClick={() => setSelectedId(null)}
                    className="sm:hidden p-1 -ml-1 text-gray-400"
                  >
                    <ArrowLeft size={20} />
                  </button>
                  <p className="font-bold text-gray-900">{conversation.partner?.full_name || "Utilisateur"}</p>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {conversation.messages.map((m) => {
                    const isMine = m.expediteur_id !== conversation.partnerId;
                    return (
                      <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm ${
                            isMine
                              ? "bg-coral-500 text-white rounded-br-md"
                              : "bg-gray-100 text-gray-900 rounded-bl-md"
                          }`}
                        >
                          {m.contenu}
                        </div>
                      </div>
                    );
                  })}
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
