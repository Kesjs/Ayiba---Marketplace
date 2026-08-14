/**
 * Utilitaires pour gérer les images Supabase avec caching intelligent
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const IMAGE_CACHE_TIME = 7 * 24 * 60 * 60; // 7 jours

/**
 * Génère une URL Supabase optimisée avec transformation d'image
 * @param bucket - Le bucket Supabase (ex: 'produits', 'avatars')
 * @param path - Le chemin du fichier dans le bucket
 * @param width - Largeur de l'image (optionnel)
 * @param height - Hauteur de l'image (optionnel)
 */
export function getSupabaseImageUrl(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  if (!SUPABASE_URL || !path) return '';

  const baseUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;

  // Ajouter les paramètres de cache
  const params = new URLSearchParams();
  params.append('t', Date.now().toString());

  // Ajouter les transformations si disponibles (pour Supabase CDN)
  if (options?.width || options?.height) {
    params.append('width', (options.width || 'auto').toString());
    params.append('height', (options.height || 'auto').toString());
    params.append('quality', (options.quality || 75).toString());
  }

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Récupère les headers de cache pour les images Supabase
 */
export function getImageCacheHeaders(): Record<string, string> {
  return {
    'Cache-Control': `public, max-age=${IMAGE_CACHE_TIME}, immutable`,
    'CDN-Cache-Control': `public, max-age=${IMAGE_CACHE_TIME}`,
  };
}

/**
 * Précharge une image dans le navigateur
 */
export function preloadImage(src: string): void {
  if (typeof window === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = src;
  document.head.appendChild(link);
}

/**
 * Cache local pour les URLs de transformations
 */
const imageUrlCache = new Map<string, string>();

export function cachedSupabaseImageUrl(
  bucket: string,
  path: string,
  options?: {
    width?: number;
    height?: number;
    quality?: number;
  }
): string {
  const cacheKey = `${bucket}/${path}/${JSON.stringify(options || {})}`;

  if (imageUrlCache.has(cacheKey)) {
    return imageUrlCache.get(cacheKey)!;
  }

  const url = getSupabaseImageUrl(bucket, path, options);
  imageUrlCache.set(cacheKey, url);

  return url;
}
