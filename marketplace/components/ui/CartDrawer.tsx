"use client";

import { useRouter } from "next/navigation";
import { X, Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";

export function CartDrawer() {
  const router = useRouter();
  const { items, isOpen, total, itemCount, removeItem, updateQty, closeCart } = useCart();

  const handleCheckout = () => {
    closeCart();
    router.push("/checkout");
  };

  return (
    <div
      className={`fixed inset-0 z-[80] transition-opacity duration-300 ${
        isOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-gray-900/30 backdrop-blur-sm"
        onClick={closeCart}
      />

      {/* Panneau : plein écran sur mobile, panneau latéral sur desktop */}
      <div
        className={`absolute top-0 right-0 h-full w-full md:w-[420px] bg-white shadow-xl flex flex-col transition-transform duration-300 ease-out ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-100 shrink-0">
          <h2 className="text-base font-bold text-gray-900">
            Mon panier {itemCount > 0 && `(${itemCount})`}
          </h2>
          <button
            onClick={closeCart}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-50"
            aria-label="Fermer le panier"
          >
            <X size={20} className="text-gray-600" />
          </button>
        </div>

        {/* Contenu */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-50 flex items-center justify-center mb-4">
              <ShoppingBag size={28} className="text-gray-300" />
            </div>
            <p className="text-sm font-medium text-gray-900 mb-1">Ton panier est vide</p>
            <p className="text-sm text-gray-400 mb-6">
              Parcours le catalogue pour trouver des produits.
            </p>
            <button
              onClick={() => {
                closeCart();
                router.push("/catalogue");
              }}
              className="bg-coral-400 hover:bg-coral-500 text-white rounded-lg px-5 py-2.5 text-sm font-semibold transition-colors"
            >
              Voir le catalogue
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-4">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 pb-4 border-b border-gray-50 last:border-0">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 shrink-0">
                    {item.photos?.[0] ? (
                      <img
                        src={item.photos[0]}
                        alt={item.nom}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag size={20} className="text-gray-300" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{item.nom}</p>
                    <p className="text-sm font-bold text-gray-900 mt-0.5">
                      {item.prix.toLocaleString("fr-FR")} FCFA
                    </p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 border border-gray-200 rounded-lg">
                        <button
                          onClick={() => updateQty(item.id, item.quantite - 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-l-lg"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="text-xs font-bold w-4 text-center">{item.quantite}</span>
                        <button
                          onClick={() => updateQty(item.id, item.quantite + 1)}
                          className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-50 rounded-r-lg"
                        >
                          <Plus size={13} />
                        </button>
                      </div>

                      <button
                        onClick={() => removeItem(item.id)}
                        className="text-gray-300 hover:text-red-400 transition-colors"
                        aria-label="Retirer du panier"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer avec total + checkout */}
            <div className="border-t border-gray-100 p-4 shrink-0 bg-white">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500 font-medium">Total</span>
                <span className="text-xl font-black text-gray-900">
                  {total.toLocaleString("fr-FR")} <span className="text-sm font-bold">FCFA</span>
                </span>
              </div>
              <button
                onClick={handleCheckout}
                className="w-full h-12 rounded-xl bg-coral-500 hover:bg-coral-600 text-white font-bold text-sm transition-colors"
              >
                Passer la commande
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
