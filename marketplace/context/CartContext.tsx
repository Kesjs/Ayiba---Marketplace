'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface CartItem {
  id: string
  nom: string
  prix: number
  quantite: number
  vendeur_id: string
  photos: string[]
}

interface CartContextType {
  items: CartItem[]
  isOpen: boolean
  total: number
  itemCount: number
  addItem: (item: Omit<CartItem, 'quantite'>) => void
  removeItem: (id: string) => void
  updateQty: (id: string, qty: number) => void
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
      const existing = prev.find(i => i.id === item.id)
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantite: i.quantite + 1 } : i)
      }
      return [...prev, { ...item, quantite: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id))
  }

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) {
      removeItem(id)
      return
    }
    setItems(prev => prev.map(i => i.id === id ? { ...i, quantite: qty } : i))
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
