'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CartProvider, useCart } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { Toast } from '@/components/ui/Toast'
import LogoAyiba from '@/components/ui/LogoAyiba'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [activeMenu, setActiveMenu] = useState('accueil')
  const { isOpen, closeCart, items, total, itemCount, updateQty, removeItem } = useCart()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/auth/inscription')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className={`bg-white border-r border-gray-100 flex-col shrink-0 md:flex h-screen sticky top-0 transition-all duration-300 ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        {/* Logo */}
        <div className="p-4 border-b border-gray-50">
          <LogoAyiba />
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {[
            { id: 'accueil', icon: 'ti-home', label: 'Accueil' },
            { id: 'commandes', icon: 'ti-shopping-bag', label: 'Commandes' },
            { id: 'messages', icon: 'ti-message-circle', label: 'Messages' },
            { id: 'favoris', icon: 'ti-heart', label: 'Favoris' },
            { id: 'historique', icon: 'ti-clock', label: 'Historique' },
            { id: 'profil', icon: 'ti-user', label: 'Profil' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                activeMenu === item.id
                  ? 'bg-coral-50 text-coral-800 border-l-2 border-coral-400'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <i className={`ti ${item.icon} text-lg`} />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Cart Button */}
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={closeCart}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer relative"
          >
            <i className="ti ti-shopping-cart text-lg" />
            {!sidebarCollapsed && <span>Panier</span>}
            {itemCount > 0 && (
              <span className="absolute right-3 bg-coral-400 text-white rounded-full text-[11px] w-4 h-4 flex items-center justify-center">
                {itemCount}
              </span>
            )}
          </button>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-red-400 hover:bg-red-50 transition-all cursor-pointer"
          >
            <i className="ti ti-logout text-lg" />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex items-center justify-around h-16">
          {[
            { id: 'accueil', icon: 'ti-home', label: 'Accueil' },
            { id: 'commandes', icon: 'ti-shopping-bag', label: 'Commandes' },
            { id: 'messages', icon: 'ti-message-circle', label: 'Messages' },
            { id: 'favoris', icon: 'ti-heart', label: 'Favoris' },
            { id: 'profil', icon: 'ti-user', label: 'Profil' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveMenu(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                activeMenu === item.id ? 'text-coral-800' : 'text-gray-400'
              }`}
            >
              <i className={`ti ${item.icon} text-xl`} />
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Cart Drawer */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/40 z-50"
            onClick={closeCart}
          />
          <div className="fixed right-0 top-0 bottom-0 w-full md:w-[400px] bg-white z-50 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100">
              <h2 className="text-base font-medium text-gray-900">Mon panier</h2>
              <button onClick={closeCart} className="text-gray-400 hover:text-gray-600">
                <i className="ti ti-x text-lg" />
              </button>
            </div>

            {/* Items */}
            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <i className="ti ti-shopping-cart-off text-4xl text-gray-400 mb-4" />
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
                            <i className="ti ti-minus text-xs" />
                          </button>
                          <span className="w-6 text-center text-sm font-medium">{item.quantite}</span>
                          <button
                            onClick={() => updateQty(item.id, item.quantite + 1)}
                            className="w-7 h-7 flex items-center justify-center rounded border border-gray-200 hover:bg-gray-100 text-gray-600"
                          >
                            <i className="ti ti-plus text-xs" />
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="ml-auto text-red-400 hover:text-red-600"
                          >
                            <i className="ti ti-trash text-lg" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
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
    <CartProvider>
      <ToastProvider>
        <ClientLayoutContent>{children}</ClientLayoutContent>
        <Toast />
      </ToastProvider>
    </CartProvider>
  )
}
