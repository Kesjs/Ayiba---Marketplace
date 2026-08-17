'use client'

import { useState } from 'react'
import { Minus, Plus, Trash2, ShoppingBag, X } from 'lucide-react'
import { Sidebar } from '@/components/dashboard/Sidebar'
import { useCart } from '@/context/CartContext'
import { useUser } from '@/lib/hooks/useUser'
import { Button } from '@/components/ui/Button'

// Sidebar is provided by shared component `Sidebar`

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const { isOpen, openCart, closeCart, items, total, itemCount, updateQty, removeItem } = useCart()
  // Contrairement à DashboardLayout (vendeur/livreur/admin), ce layout
  // n'allait pas chercher le profil : la sidebar recevait role="client"
  // seul, sans avatarUrl ni userName, donc le bloc identité en bas de
  // sidebar affichait toujours l'icône par défaut sur desktop même avec
  // une photo de profil définie.
  const { profile } = useUser()

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        role="client"
        userName={profile?.full_name || undefined}
        avatarUrl={profile?.avatar_url}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        onCartClick={openCart}
        cartItemCount={itemCount}
      />

      <div className={`flex-1 flex flex-col min-h-0 transition-all ${sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'}`}>
        {children}
      </div>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={closeCart}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Mon panier</h2>
              <button onClick={closeCart} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <ShoppingBag size={40} className="text-gray-400 mb-4" />
                  <p className="text-gray-600">Ton panier est vide</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 bg-gray-50 rounded-lg">
                      <img
                        src={item.photos[0]}
                        alt={item.nom}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900 mb-1">{item.nom}</h3>
                        <p className="text-sm font-medium text-coral-400 mb-2">
                          {item.prix.toLocaleString()} FCFA
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQty(item.id, item.quantite - 1)}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
                          >
                            <Minus size={12} />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantite}</span>
                          <button
                            onClick={() => updateQty(item.id, item.quantite + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
                          >
                            <Plus size={12} />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100">
              <div className="flex justify-between mb-4">
                <span className="text-base font-medium text-gray-900">Total</span>
                <span className="text-base font-medium text-coral-400">{total.toLocaleString()} FCFA</span>
              </div>
              <Button variant="primary" className="w-full" disabled={items.length === 0}>
                Passer la commande
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClientLayoutContent>{children}</ClientLayoutContent>
  )
}
