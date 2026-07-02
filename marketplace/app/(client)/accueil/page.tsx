'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'
import { useToast } from '@/context/ToastContext'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import LogoAyiba from '@/components/ui/LogoAyiba'
import { CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data'

export default function AccueilPage() {
  const router = useRouter()
  const { addItem } = useCart()
  const { showToast } = useToast()

  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState('Tout')

  const categories = ['Tout', ...CATEGORIES.map(c => c.label)]

  useEffect(() => {
    // Simulation de chargement
    setLoading(true)
    const timer = setTimeout(() => {
      let filtered = [...MOCK_PRODUCTS]
      
      if (selectedCategory !== 'Tout') {
        filtered = filtered.filter(p => {
          const cat = CATEGORIES.find(c => c.id === p.categorie)
          return cat?.label === selectedCategory
        })
      }

      setProducts(filtered)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [selectedCategory])

  return (
    <div className="flex-1 flex flex-col h-screen overflow-hidden">
      {/* Top Header */}
      <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-4 md:px-8 shrink-0">
        <div className="flex items-center gap-4">
          <LogoAyiba className="h-8 w-auto" />
          <div className="h-8 w-px bg-gray-100 hidden md:block" />
          <h1 className="text-lg font-bold text-gray-900 hidden md:block">Tableau de bord</h1>
        </div>
      </header>

      {/* Categories Bar */}
      <section className="bg-white border-b border-gray-50 flex items-center gap-3 px-4 py-3 overflow-x-auto no-scrollbar shrink-0">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              selectedCategory === cat
                ? 'bg-coral-500 text-white shadow-lg shadow-coral-500/20'
                : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
            }`}
          >
            {cat}
          </button>
        ))}
      </section>

      {/* Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 bg-gray-50/30">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Bienvenue sur Ayiba 👋</h2>
            <p className="text-gray-500 text-sm mt-1">Découvrez les meilleures offres de votre quartier aujourd'hui.</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  image={product.photos[0]}
                  category={CATEGORIES.find(c => c.id === product.categorie)?.label || 'Divers'}
                  name={product.nom}
                  rating={product.rating}
                  reviewCount={product.reviewCount}
                  price={product.prix}
                  onAddToCart={() => {
                    addItem({
                      id: product.id,
                      nom: product.nom,
                      prix: product.prix,
                      photos: [product.photos[0]],
                      vendeur_id: product.vendeur_id
                    })
                    showToast('Produit ajouté au panier !', 'success')
                  }}
                  onToggleFavorite={() => {}}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
