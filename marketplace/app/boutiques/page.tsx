"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MapPin, Star, MessageCircle, ArrowRight } from "lucide-react";
import { Navbar } from "@/components/ui/Navbar";
import { Footer } from "@/components/home/Footer";
import { getBoutiquesPopulaires, type BoutiquePublique } from "@/lib/queries/vendeurs";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { AuthModal } from "@/components/ui/AuthModal";

export default function BoutiquesPage() {
  const router = useRouter();
  const { user } = useUser();
  const [boutiques, setBoutiques] = useState<BoutiquePublique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [contactTarget, setContactTarget] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await getBoutiquesPopulaires(500);
        if (!cancelled) setBoutiques(data);
      } catch (err) {
        console.error("Erreur chargement boutiques:", err);
        if (!cancelled) setError("Impossible de charger les boutiques pour le moment.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  // Contacter directement depuis la carte, sans passer par la page détail —
  // même redirection que le bouton "Contacter" de /boutiques/[id].
  const handleContact = (e: React.MouseEvent, storeId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      setContactTarget(storeId);
      setAuthModalOpen(true);
      return;
    }
    router.push(`/messages?vendeur=${storeId}`);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 md:py-12">
        <div className="mb-8 md:mb-10">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 tracking-tight">
            Toutes les boutiques
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Découvrez les vendeurs vérifiés d'Ayiba, près de chez vous.
          </p>
        </div>

        {error && (
          <div className="mb-8 rounded-2xl bg-red-50 border border-red-100 p-4 text-sm text-red-600 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-50 border border-gray-100 rounded-3xl animate-pulse" />
            ))}
          </div>
        ) : boutiques.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            Aucune boutique disponible pour le moment.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
            {boutiques.map((store) => (
              <Link
                key={store.id}
                href={`/boutiques/${store.id}`}
                className="group flex flex-col p-5 md:p-6 bg-gray-50/50 rounded-3xl border border-gray-100 hover:border-coral-100 hover:bg-white hover:shadow-xl hover:shadow-coral-500/5 transition-all duration-300"
              >
                <div className="relative mb-4 inline-block w-fit">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-white shadow-sm transition-transform duration-300 group-hover:scale-110 bg-coral-50 flex items-center justify-center">
                    {store.logo ? (
                      <img src={store.logo} alt={store.nom} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-coral-500 font-bold text-xl">{store.nom.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-coral-500 transition-colors truncate">
                  {store.nom}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {store.avisCount > 0 && (
                    <div className="flex items-center gap-1">
                      <Star size={12} className="fill-amber-400 text-amber-400" />
                      <span className="text-xs font-bold text-gray-700">{store.note}</span>
                      <span className="text-[11px] text-gray-400">({store.avisCount})</span>
                    </div>
                  )}
                  {(store.quartier || store.commune) && (
                    <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 bg-white px-2 py-1 rounded-md border border-gray-100 w-fit">
                      <MapPin size={11} />
                      {[store.quartier, store.commune].filter(Boolean).join(", ")}
                    </div>
                  )}
                </div>

                {store.description ? (
                  <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{store.description}</p>
                ) : (
                  <div className="flex-1 mb-4" />
                )}

                <div className="flex items-center justify-between gap-2 mt-auto pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-coral-500 group-hover:gap-1.5 transition-all">
                    Voir plus
                    <ArrowRight size={13} />
                  </span>
                  <button
                    onClick={(e) => handleContact(e, store.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-coral-600 px-3 py-1.5 rounded-lg border border-gray-200 hover:border-coral-200 bg-white transition-colors"
                  >
                    <MessageCircle size={13} />
                    Contacter
                  </button>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      <Footer />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        intendedRole={null}
        redirectTo={contactTarget ? `/messages?vendeur=${contactTarget}` : undefined}
      />
    </div>
  );
}

