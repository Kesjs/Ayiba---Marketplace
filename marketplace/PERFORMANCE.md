# Guide d'Optimisation des Performances - Ayiba Marketplace

## 🚀 Optimisations Implémentées

### 1. **Caching Côté Serveur (Proxy)**
- ✅ Cache en mémoire pour `mode_maintenance` (60s)
- ✅ Headers `Cache-Control` pour routes publiques (1h)
- ✅ Headers `Cache-Control` pour routes privées (5min)

**Fichier:** `proxy.ts`

```typescript
// Cache des requêtes fréquentes
const maintenanceCache = new Map<string, { value: boolean; timestamp: number }>();
const CACHE_TTL = 60 * 1000; // 60 secondes
```

### 2. **React Cache pour Déduplication**
- ✅ Cache automatique des requêtes Supabase par requête
- ✅ Évite les appels multiples pour le même utilisateur
- ✅ Cache des données utilisateur, boutiques, produits

**Fichier:** `lib/cache-utils.ts`

```typescript
export const getCachedUser = cache(async () => { ... });
export const getCachedShopList = cache(async () => { ... });
export const getCachedProducts = cache(async () => { ... });
```

### 3. **Lazy Loading des Sections**
- ✅ `CommissionSection` chargée en lazy
- ✅ `DeliveryFlowSection` chargée en lazy
- ✅ `WhyAyibaSection` chargée en lazy
- ✅ `FAQSection` chargée en lazy
- ✅ Placeholders de chargement visibles

**Fichier:** `app/devenir-livreur/page.tsx`

```typescript
const DeliveryFlowSection = dynamic(() => import("@/components/devenir-livreur/DeliveryFlowSection"), {
  loading: () => <div className="h-96 bg-gray-50 rounded-2xl animate-pulse" />,
  ssr: true,
});
```

### 4. **Optimisation des Images**
- ✅ `OptimizedImage` composant pour Next.js Image
- ✅ Lazy loading automatique (`loading="lazy"`)
- ✅ Format WebP automatique
- ✅ Responsive images
- ✅ Placeholder blur disponible
- ✅ Quality optimisée (75 par défaut)

**Fichier:** `components/ui/OptimizedImage.tsx`

```typescript
export function OptimizedImage({
  src,
  alt,
  fill = false,
  objectFit = 'cover',
  quality = 75,
  placeholder = 'empty',
}: OptimizedImageProps)
```

### 5. **Supabase Image Caching**
- ✅ URLs optimisées Supabase Storage
- ✅ Paramètres de transformation
- ✅ Cache long (7 jours, immutable)
- ✅ Cache local des URLs

**Fichier:** `lib/supabase/image-cache.ts`

```typescript
export function getSupabaseImageUrl(bucket: string, path: string, options?: { width; height; quality })
export function cachedSupabaseImageUrl(bucket, path, options)
```

### 6. **Query Caching Supabase**
- ✅ Cache en mémoire pour requêtes fréquentes
- ✅ TTL configurable par type de données
- ✅ Invalidation manuelle possible
- ✅ Statistiques de cache

**Fichier:** `lib/supabase/query-cache.ts`

```typescript
// Caches préconfiguré
users: { ttl: 5 * 60 },        // 5 minutes
shops: { ttl: 30 * 60 },       // 30 minutes
products: { ttl: 30 * 60 },    // 30 minutes
categories: { ttl: 60 * 60 },  // 1 heure
```

### 7. **Optimisation des Dépendances**
- ✅ Framer Motion chargé en lazy (sauf animations critiques)
- ✅ Icônes importées uniquement si nécessaire
- ✅ Composants divisés par section
- ✅ Tree-shaking activé

**Fichier:** `app/devenir-livreur/page.tsx`

```typescript
// Lazy load Framer Motion
const motion = dynamic(() => import("framer-motion").then(...), { ssr: false });

// Import uniquement des icônes utilisées
import { Wallet, Clock, Zap, Bike, ChevronDown, MapPin } from "lucide-react";
```

### 8. **Configuration Supabase Optimisée**
- ✅ Auth token refresh optimisé (60s)
- ✅ Headers de client informatifs
- ✅ Timeouts configurés
- ✅ Retry logic implémentée

**Fichier:** `lib/supabase/config.ts`

---

## 📊 Résultats Attendus

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| FCP (First Contentful Paint) | ~1.2s | ~600ms | 50% ⬇️ |
| LCP (Largest Contentful Paint) | ~2.4s | ~1.2s | 50% ⬇️ |
| TTFB (Time to First Byte) | ~500ms | ~200ms | 60% ⬇️ |
| Cache Hit Rate | 0% | 70%+ | +70% ⬆️ |

---

## 🔧 Comment Utiliser

### Utiliser les Images Optimisées
```typescript
import { OptimizedImage } from '@/components/ui/OptimizedImage';

<OptimizedImage
  src="/images/hero.png"
  alt="Hero"
  width={400}
  height={300}
  quality={80}
  priority={false}
/>
```

### Utiliser le Cache Supabase
```typescript
import { getCachedProductList } from '@/lib/supabase/query-cache';

const products = await getCachedProductList(20, 0, {
  category: 'electronics',
  minPrice: 100,
  maxPrice: 1000,
});
```

### Invalider le Cache
```typescript
import { invalidateCache } from '@/lib/supabase/query-cache';

// Invalider tous les caches produits
invalidateCache('products');

// Invalider tout
invalidateCache();
```

---

## 📈 Monitoring

### Vérifier les Performances
```bash
# Next.js Analytics
npm run build -- --analyze

# Lighthouse
npm run lighthouse

# Vérifier le cache
curl -I https://ayiba.com/illustrations/rider-step-1.svg
# Cache-Control: public, max-age=604800, immutable
```

### Logs de Cache
```typescript
import { getCacheStats } from '@/lib/supabase/query-cache';

console.log(getCacheStats());
// { size: 5, keys: ['users:1', 'products:0', ...] }
```

---

## 🎯 Prochaines Étapes

1. **Profiling:** Utiliser `npm run next analyze` pour identifier les gros bundles
2. **Image Optimization:** Convertir PNG/JPG en WebP dans les assets statiques
3. **Code Splitting:** Séparer les chunks par route
4. **Service Worker:** Implémenter un SW pour le caching offline
5. **CDN:** Déployer sur Vercel ou Netlify pour le caching CDN global

---

## 📚 Références

- [Next.js Image Optimization](https://nextjs.org/docs/app/building-your-application/optimizing/images)
- [Next.js Dynamic Imports](https://nextjs.org/docs/app/building-your-application/optimizing/dynamic-imports)
- [React Cache](https://react.dev/reference/react/cache)
- [Supabase CDN](https://supabase.com/docs/guides/storage/cdn)

---

## ⚡ Performance Checklist

- [ ] Toutes les images utilisent `OptimizedImage`
- [ ] Les sections non-critiques sont lazy-loaded
- [ ] Les requêtes Supabase utilisent le cache
- [ ] Les headers Cache-Control sont configurés
- [ ] Les dépendances non-essentielles sont lazy-loaded
- [ ] Les tests de performance passent
- [ ] Lighthouse score > 90
- [ ] FCP < 1s
- [ ] LCP < 2.5s
