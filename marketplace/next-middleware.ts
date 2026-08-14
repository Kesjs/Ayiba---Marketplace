/**
 * Middleware pour ajouter les headers de cache HTTP
 * À fusionner avec proxy.ts
 */

import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export function cacheMiddleware(req: NextRequest) {
  const res = NextResponse.next();

  const path = req.nextUrl.pathname;

  // Routes publiques statiques - cache long (1 semaine)
  if (
    path.startsWith('/illustrations/') ||
    path.startsWith('/public/') ||
    path.endsWith('.svg') ||
    path.endsWith('.png') ||
    path.endsWith('.jpg') ||
    path.endsWith('.jpeg')
  ) {
    res.headers.set(
      'Cache-Control',
      'public, max-age=604800, immutable' // 7 jours
    );
    return res;
  }

  // Pages publiques - cache moyen (1 heure)
  const publicPages = [
    '/catalogue',
    '/devenir-vendeur',
    '/devenir-livreur',
    '/cgu',
    '/privacy',
  ];

  if (publicPages.some(page => path.startsWith(page))) {
    res.headers.set(
      'Cache-Control',
      'public, max-age=3600, stale-while-revalidate=86400'
    );
    return res;
  }

  // Pages API - pas de cache (sauf si statique)
  if (path.startsWith('/api/')) {
    res.headers.set('Cache-Control', 'private, max-age=0, must-revalidate');
    return res;
  }

  return res;
}
