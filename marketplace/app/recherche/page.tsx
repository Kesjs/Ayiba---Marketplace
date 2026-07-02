'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ProductCard } from '@/components/ui/ProductCard'
import { ProductCardSkeleton } from '@/components/ui/Skeleton'
import { Button } from '@/components/ui/Button'
import { Navbar } from '@/components/ui/Navbar'
import { Footer } from '@/components/home/Footer'
import { Search, ArrowLeft } from 'lucide-react'

interface Product {
  id: string
  nom: string
  description: string
  prix: number
  ancien_prix: number | null
  categorie: string
  photos: string[]
  vendeur_id: string
}

function SearchResults() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const query = searchParams.get('q') || ''
  const supabase = createClient()

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (query) {
      fetchProducts()
    } else {
      setLoading(false)
      setProducts([])
    }
  }, [query])

  const fetchProducts = async () => {
    setLoading(true)
    try {
      // Simple search using ilike on name and description
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('statut', 'actif')
        .or(`nom.ilike.%${query}%,description.ilike.%${query}%,categorie.ilike.%${query}%`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setProducts(data || [])
    } catch (error) {
      console.error('Error searching products:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-8 lg:px-12 py-8">
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {query ? `Résultats pour "${query}"` : 'Recherche'}
          </h1>
          <p className="text-gray-500 text-sm">
            {products.length} {products.length > 1 ? 'produits trouvés' : 'produit trouvé'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
            <Search size={32} className="text-gray-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Aucun résultat trouvé</h2>
          <p className="text-gray-500 max-w-md mx-auto mb-8 text-sm">
            Nous n'avons trouvé aucun produit correspondant à votre recherche. Essayez avec d'autres mots-clés ou parcourez le catalogue complet.
          </p>
          <div className="flex gap-4">
            <Button variant="secondary" onClick={() => router.push('/')}>
              Retour à l'accueil
            </Button>
            <Button onClick={() => router.push('/catalogue')}>
              Voir le catalogue
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              image={product.photos?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop'}
              category={product.categorie}
              name={product.nom}
              rating={4.5}
              reviewCount={12}
              price={product.prix}
              oldPrice={product.ancien_prix || undefined}
              onAddToCart={() => {}}
              onToggleFavorite={() => {}}
              onClick={() => router.push(`/produits/${product.id}`)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Navbar />
      <Suspense fallback={<div className="flex-1 flex items-center justify-center">Chargement...</div>}>
        <SearchResults />
      </Suspense>
      <Footer />
    </div>
  )
}
