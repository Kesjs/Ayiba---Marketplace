'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  nom: string
  prix: number
  quantite: number
  vendeur_id: string
  photos: string[]
  varianteId?: string | null
  varianteNom?: string | null
}

// Un même article avec deux variantes différentes (ex: Noir / Rouge) doit
// pouvoir cohabiter comme deux lignes distinctes dans le panier — la clé
// d'identité combine donc article + variante plutôt que l'article seul.
export function cartKey(item: { id: string; varianteId?: string | null }): string {
  return item.varianteId ? `${item.id}::${item.varianteId}` : item.id
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  total: number
  itemCount: number
  addItem: (item: Omit<CartItem, 'quantite'>) => void
  removeItem: (key: string) => void
  updateQty: (key: string, qty: number) => void
  updatePrix: (key: string, prix: number) => void
  openCart: () => void
  closeCart: () => void
  clearCart: () => void
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  // Load cart from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('ayiba-cart')
    if (saved) {
      setItems(JSON.parse(saved))
    }
  }, [])

  // Save cart to localStorage on change
  useEffect(() => {
    localStorage.setItem('ayiba-cart', JSON.stringify(items))
  }, [items])

  const addItem = (item: Omit<CartItem, 'quantite'>) => {
    setItems(prev => {
      const existing = prev.find(i => cartKey(i) === cartKey(item))
      if (existing) {
        return prev.map(i => cartKey(i) === cartKey(item) ? { ...i, quantite: i.quantite + 1 } : i)
      }
      return [...prev, { ...item, quantite: 1 }]
    })
  }

  const removeItem = (key: string) => {
    setItems(prev => prev.filter(i => cartKey(i) !== key))
  }

  const updateQty = (key: string, qty: number) => {
    if (qty < 1) {
      removeItem(key)
      return
    }
    setItems(prev => prev.map(i => cartKey(i) === key ? { ...i, quantite: qty } : i))
  }

  // Le prix d'un article est capturé au moment de l'ajout au panier et
  // persiste en localStorage — s'il change en base (promo ajoutée/retirée)
  // pendant que l'article reste dans le panier, rien ne le met à jour tout
  // seul. Le checkout appelle ceci après revalidation contre la base, pour
  // ne jamais faire payer un prix obsolète.
  const updatePrix = (key: string, prix: number) => {
    setItems(prev => prev.map(i => cartKey(i) === key ? { ...i, prix } : i))
  }

  const openCart = () => setIsOpen(true)
  const closeCart = () => setIsOpen(false)
  const clearCart = () => setItems([])

  const total = items.reduce((sum, item) => sum + (item.prix * item.quantite), 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantite, 0)

  return (
    <CartContext.Provider value={{
      items,
      isOpen,
      total,
      itemCount,
      addItem,
      removeItem,
      updateQty,
      updatePrix,
      openCart,
      closeCart,
      clearCart
    }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
