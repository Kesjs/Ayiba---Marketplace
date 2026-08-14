/**
 * Configuration Supabase optimisée pour les performances
 */

export const SUPABASE_CONFIG = {
  // Timeouts
  auth: {
    autoRefreshInterval: 60, // Renouveler le token toutes les 60 secondes
    persistSession: true,
    detectSessionInUrl: true,
  },

  // Requêtes
  global: {
    headers: {
      'x-client-info': 'marketplace@1.0.0',
    },
  },

  // Cache headers par défaut
  cacheHeaders: {
    public: {
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400', // 1h cache, 1j stale
    },
    private: {
      'Cache-Control': 'private, max-age=300, stale-while-revalidate=600', // 5min cache, 10min stale
    },
    images: {
      'Cache-Control': 'public, max-age=604800, immutable', // 7 jours, immutable
    },
  },

  // Limites de requête
  limits: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    timeout: 10000, // 10 secondes
  },

  // Préchargement
  preload: {
    users: true,
    shops: true,
    categories: true,
  },
};

/**
 * Requêtes fréquentes à cacher
 */
export const CACHED_QUERIES = {
  // Utilisateur (5 minutes)
  user: { ttl: 5 * 60 },

  // Boutiques (30 minutes)
  shops: { ttl: 30 * 60 },

  // Produits (30 minutes)
  products: { ttl: 30 * 60 },

  // Catégories (1 heure)
  categories: { ttl: 60 * 60 },

  // Commandes (5 minutes)
  orders: { ttl: 5 * 60 },

  // Paramètres système (1 heure)
  systemParams: { ttl: 60 * 60 },
};

/**
 * Optimisations Supabase RLS (Row Level Security)
 * À implémenter dans les policies Supabase
 */
export const RLS_OPTIMIZATIONS = {
  // Utiliser les indexes sur les colonnes filtrées
  indexes: [
    'CREATE INDEX IF NOT EXISTS idx_products_category ON produits(categorie)',
    'CREATE INDEX IF NOT EXISTS idx_products_vendor ON produits(vendor_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_user ON commandes(user_id)',
    'CREATE INDEX IF NOT EXISTS idx_orders_status ON commandes(statut)',
  ],

  // Optimiser les requêtes courantes
  commonQueries: {
    getProductsByCategory: 'SELECT * FROM produits WHERE categorie = $1 LIMIT $2',
    getShopProducts: 'SELECT * FROM produits WHERE vendor_id = $1 LIMIT $2',
    getUserOrders: 'SELECT * FROM commandes WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2',
  },
};
