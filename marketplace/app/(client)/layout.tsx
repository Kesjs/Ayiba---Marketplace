'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search, Package, Home, MessageSquare, Menu as MenuIcon,
  ShoppingCart, LogOut, Minus, Plus, Trash2, ShoppingBag, X,
} from 'lucide-react'
import { CartProvider, useCart } from '@/context/CartContext'
import { ToastProvider } from '@/context/ToastContext'
import { Toast } from '@/components/ui/Toast'
import LogoAyiba from '@/components/ui/LogoAyiba'
import { Button } from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

// 5 points d'entrée du Dashboard Client — voir dashboard-client.md, Décision 1.
// Explorer fusionne Catalogue+Boutiques (Décision 3). Accueil n'est PAS élevé
// visuellement (Décision 2) : actif par couleur, comme les autres.
const NAV_ITEMS = [
  { href: '/explorer', icon: Search, label: 'Explorer' },
  { href: '/commandes', icon: Package, label: 'Commandes' },
  { href: '/accueil', icon: Home, label: 'Accueil' },
  { href: '/messages', icon: MessageSquare, label: 'Messages' },
  { href: '/menu', icon: MenuIcon, label: 'Menu' },
]

function estActif(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`)
}

function ClientLayoutContent({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
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
          {NAV_ITEMS.map((item) => {
            const actif = estActif(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium transition-all ${
                  actif
                    ? 'bg-coral-50 text-coral-800 border-l-2 border-coral-400'
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <item.icon size={18} />
                {!sidebarCollapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        {/* Cart Button */}
        <div className="p-4 border-t border-gray-50">
          <button
            onClick={closeCart}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all cursor-pointer relative"
          >
            <ShoppingCart size={18} />
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
            <LogOut size={18} />
            {!sidebarCollapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-h-0 pb-16 md:pb-0">
        {children}
      </div>

      {/* Mobile Bottom Navigation — mêmes 5 items que la sidebar, navigation réelle via Link */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40">
        <div className="flex items-center justify-around h-16">
          {NAV_ITEMS.map((item) => {
            const actif = estActif(pathname, item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  actif ? 'text-coral-800' : 'text-gray-400'
                }`}
              >
                <item.icon size={20} strokeWidth={actif ? 2.5 : 2} />
                <span className="text-[10px] font-bold uppercase tracking-wide">{item.label}</span>
              </Link>
            )
          })}
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
                <X size={18} />
              </button>
            </div>

            {/* Items */}
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
