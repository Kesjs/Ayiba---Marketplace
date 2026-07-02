'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { CATEGORIES, MOCK_PRODUCTS } from '@/lib/mock-data'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { Search, SlidersHorizontal, LayoutGrid, List, X, ChevronDown } from 'lucide-react'

function CatalogueContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [products, setProducts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('categorie') || 'Tout')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('popular')
  const [showFilters, setShowFilters] = useState(false)

  const categories = ['Tout', ...CATEGORIES.map(c => c.label)]

  useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => {
      let filtered = [...MOCK_PRODUCTS]
      
      if (selectedCategory !== 'Tout') {
        filtered = filtered.filter(p => {
          const cat = CATEGORIES.find(c => c.id === p.categorie)
          return cat?.label === selectedCategory
        })
      }

      if (searchQuery) {
        filtered = filtered.filter(p => 
          p.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description.toLowerCase().includes(searchQuery.toLowerCase())
        )
      }

      // Sorting
      if (sortBy === 'price-asc') filtered.sort((a, b) => a.prix - b.prix)
      if (sortBy === 'price-desc') filtered.sort((a, b) => b.prix - a.prix)
      if (sortBy === 'rating') filtered.sort((a, b) => b.rating - a.rating)

      setProducts(filtered)
      setLoading(false)
    }, 600)
    return () => clearTimeout(timer)
  }, [selectedCategory, searchQuery, sortBy])

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50/30 pt-14 md:pt-16">
        {/* Page Header */}
        <section className="bg-white border-b border-gray-100 py-12">
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight mb-4">La Grande Boutique</h1>
            <p className="text-gray-500 font-medium max-w-2xl">Parcourez tout le catalogue Ayiba. Sécurité garantie, livraison locale rapide.</p>
            
            <div className="mt-8 flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input 
                  type="text"
                  placeholder="Rechercher un produit, une marque..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-14 pl-12 pr-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-coral-500/20 focus:border-coral-500 transition-all font-medium"
                />
              </div>
              <Button 
                onClick={() => setShowFilters(!showFilters)}
                variant="outline" 
                className={`h-14 px-6 rounded-2xl border-gray-200 flex items-center gap-2 font-bold ${showFilters ? 'bg-gray-100' : 'bg-white'}`}
              >
                <SlidersHorizontal size={18} />
                Filtres
              </Button>
            </div>
          </div>
        </section>

        {/* Toolbar & Filters */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className={`lg:w-64 space-y-8 ${showFilters ? 'block' : 'hidden lg:block'}`}>
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Catégories</h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                        selectedCategory === cat
                          ? 'bg-coral-50 text-coral-600'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Trier par</h3>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-coral-500/10"
                >
                  <option value="popular">Les plus populaires</option>
                  <option value="price-asc">Prix croissant</option>
                  <option value="price-desc">Prix décroissant</option>
                  <option value="rating">Mieux notés</option>
                </select>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-8">
                <p className="text-sm text-gray-500 font-bold">
                  {products.length} <span className="font-medium">produits trouvés</span>
                </p>
                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <LayoutGrid size={18} />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-gray-100 text-gray-900' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List size={18} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                  {[...Array(6)].map((_, i) => (
                    <ProductCardSkeleton key={i} />
                  ))}
                </div>
              ) : products.length > 0 ? (
                <div className={viewMode === 'grid' 
                  ? "grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8" 
                  : "flex flex-col gap-6"
                }>
                  {products.map((product) => (
                    <Link key={product.id} href={`/produits/${product.id}`} className="block transition-transform hover:-translate-y-1 duration-300">
                      <ProductCard
                        image={product.photos[0]}
                        category={CATEGORIES.find(c => c.id === product.categorie)?.label || 'Divers'}
                        name={product.nom}
                        rating={product.rating}
                        reviewCount={product.reviewCount}
                        price={product.prix}
                        onAddToCart={() => {}}
                        onToggleFavorite={() => {}}
                      />
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-gray-200">
                  <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                    <Search size={32} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun résultat</h3>
                  <p className="text-gray-500 mb-8 max-w-xs mx-auto">Nous n'avons trouvé aucun produit correspondant à votre recherche.</p>
                  <Button onClick={() => { setSelectedCategory('Tout'); setSearchQuery(''); }}>Réinitialiser</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}

export default function PublicAccueilPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-white"><div className="w-10 h-10 border-4 border-coral-500 border-t-transparent rounded-full animate-spin" /></div>}>
      <CatalogueContent />
    </Suspense>
  )
}
