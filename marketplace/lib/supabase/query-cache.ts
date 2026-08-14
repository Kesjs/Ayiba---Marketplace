import { createClient } from '@/lib/supabase/server';

/**
 * Utilitaires pour cacher les requêtes Supabase côté serveur
 * Utilise React Cache pour déduplication automatique dans une requête
 */

interface CacheOptions {
  ttl?: number; // Time to live en secondes (par défaut 60)
  revalidate?: number; // Pour ISR (On-Demand Revalidation)
}

// Cache simple en mémoire pour les données fréquemment accédées
const queryCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 secondes par défaut

/**
 * Récupère les données avec caching
 */
export async function getCachedQuery<T>(
  key: string,
  queryFn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const now = Date.now();
  const ttl = (options.ttl || 60) * 1000;

  // Vérifier le cache
  const cached = queryCache.get(key);
  if (cached && now - cached.timestamp < ttl) {
    return cached.data as T;
  }

  // Exécuter la requête
  const data = await queryFn();

  // Stocker en cache
  queryCache.set(key, { data, timestamp: now });

  return data;
}

/**
 * Récupère une liste de boutiques avec caching
 */
export async function getCachedShopList(
  limit = 20,
  offset = 0
): Promise<Array<any>> {
  return getCachedQuery(`shops:${limit}:${offset}`, async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('boutiques')
      .select('*')
      .limit(limit)
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Erreur récupération boutiques:', error);
      return [];
    }
    return data || [];
  });
}

/**
 * Récupère une liste de produits avec caching
 */
export async function getCachedProductList(
  limit = 20,
  offset = 0,
  filters?: {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
  }
): Promise<Array<any>> {
  const filterKey = JSON.stringify(filters || {});
  return getCachedQuery(
    `products:${limit}:${offset}:${filterKey}`,
    async () => {
      const supabase = await createClient();
      let query = supabase
        .from('produits')
        .select('*');

      if (filters?.category) {
        query = query.eq('categorie', filters.category);
      }
      if (filters?.minPrice) {
        query = query.gte('prix', filters.minPrice);
      }
      if (filters?.maxPrice) {
        query = query.lte('prix', filters.maxPrice);
      }

      const { data, error } = await query
        .limit(limit)
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur récupération produits:', error);
        return [];
      }
      return data || [];
    },
    { ttl: 120 } // Cache 2 minutes pour les produits
  );
}

/**
 * Invalide le cache pour une clé
 */
export function invalidateCache(keyPattern?: string): void {
  if (!keyPattern) {
    queryCache.clear();
    return;
  }

  for (const key of queryCache.keys()) {
    if (key.includes(keyPattern)) {
      queryCache.delete(key);
    }
  }
}

/**
 * Récupère les statistiques de cache
 */
export function getCacheStats() {
  return {
    size: queryCache.size,
    keys: Array.from(queryCache.keys()),
  };
}
