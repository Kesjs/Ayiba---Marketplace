/**
 * Cache côté serveur pour les rôles utilisateurs
 * Utilisé par les guards et API routes pour réduire les requêtes Supabase
 * 
 * This is a simple in-memory cache with TTL. In production, consider
 * using Redis for distributed caching across instances.
 */

interface RoleCacheEntry {
  role: string
  timestamp: number
}

// In-memory cache map
const roleCacheMap = new Map<string, RoleCacheEntry>()

// Cache TTL: 5 minutes (shorter than client-side 10 min to stay fresh)
const ROLE_CACHE_TTL = 5 * 60 * 1000

/**
 * Récupère le rôle depuis le cache serveur
 * @param userId - ID de l'utilisateur
 * @returns Le rôle en cache, ou null si expiré/absent
 */
export function getCachedServerRole(userId: string): string | null {
  const cached = roleCacheMap.get(userId)
  
  if (!cached) {
    return null
  }

  // Vérifier l'expiration
  if (Date.now() - cached.timestamp > ROLE_CACHE_TTL) {
    roleCacheMap.delete(userId)
    return null
  }

  return cached.role
}

/**
 * Stocke le rôle dans le cache serveur
 * @param userId - ID de l'utilisateur
 * @param role - Le rôle à mettre en cache
 */
export function setCachedServerRole(userId: string, role: string): void {
  roleCacheMap.set(userId, {
    role,
    timestamp: Date.now(),
  })
}

/**
 * Efface un rôle du cache (à la déconnexion ou changement de rôle)
 * @param userId - ID de l'utilisateur
 */
export function invalidateUserRoleCache(userId: string): void {
  roleCacheMap.delete(userId)
}

/**
 * Efface tout le cache des rôles (rarement nécessaire)
 */
export function clearAllRoleCache(): void {
  roleCacheMap.clear()
}

/**
 * Retourne les statistiques du cache
 */
export function getRoleCacheStats() {
  const now = Date.now()
  let validEntries = 0
  let expiredEntries = 0

  for (const [, entry] of roleCacheMap) {
    if (now - entry.timestamp < ROLE_CACHE_TTL) {
      validEntries++
    } else {
      expiredEntries++
    }
  }

  return {
    totalEntries: roleCacheMap.size,
    validEntries,
    expiredEntries,
    ttl: ROLE_CACHE_TTL,
  }
}

/**
 * Fonction helper pour obtenir le rôle avec fallback Supabase
 * À utiliser dans les guards pour réduire les appels
 */
export async function getRoleWithCache(userId: string): Promise<string | null> {
  // 1. Vérifier le cache
  const cachedRole = getCachedServerRole(userId)
  if (cachedRole) {
    return cachedRole
  }

  // 2. Cache miss → requête Supabase
  const { createClient } = await import('@/lib/supabase/server')
  try {
    const supabase = await createClient()
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching user role:', error)
      return null
    }

    const role = userData?.role || 'client'
    
    // 3. Mettre en cache pour les prochains appels
    setCachedServerRole(userId, role)
    
    return role
  } catch (error) {
    console.error('Error in getRoleWithCache:', error)
    return null
  }
}
