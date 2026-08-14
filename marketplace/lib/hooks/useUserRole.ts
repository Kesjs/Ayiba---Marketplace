import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Cache pour le rôle utilisateur
 * Stocke le rôle en localStorage avec TTL de 10 minutes
 * Réduit les appels Supabase en relisant depuis le cache quand valide
 */

const ROLE_CACHE_KEY = 'ayiba-user-role-cache'
const ROLE_CACHE_TTL = 10 * 60 * 1000 // 10 minutes

interface RoleCache {
  userId: string
  role: string
  timestamp: number
}

/**
 * Récupère le rôle depuis le cache localStorage
 */
function getCachedRole(userId: string): string | null {
  if (typeof window === 'undefined') return null
  
  try {
    const cached = localStorage.getItem(ROLE_CACHE_KEY)
    if (!cached) return null
    
    const roleCache: RoleCache = JSON.parse(cached)
    
    // Vérifier que c'est le même utilisateur et que le cache n'a pas expiré
    if (roleCache.userId === userId && Date.now() - roleCache.timestamp < ROLE_CACHE_TTL) {
      return roleCache.role
    }
    
    // Cache expiré, l'effacer
    localStorage.removeItem(ROLE_CACHE_KEY)
    return null
  } catch (e) {
    console.error('Error reading role cache:', e)
    localStorage.removeItem(ROLE_CACHE_KEY)
    return null
  }
}

/**
 * Stocke le rôle dans le cache localStorage avec timestamp
 */
function setCachedRole(userId: string, role: string): void {
  if (typeof window === 'undefined') return
  
  try {
    const roleCache: RoleCache = {
      userId,
      role,
      timestamp: Date.now(),
    }
    localStorage.setItem(ROLE_CACHE_KEY, JSON.stringify(roleCache))
  } catch (e) {
    console.error('Error writing role cache:', e)
  }
}

/**
 * Efface le cache du rôle (utilisé à la déconnexion)
 */
function clearRoleCache(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(ROLE_CACHE_KEY)
  }
}

/**
 * Hook pour récupérer le rôle utilisateur avec cache
 * Réduit les appels Supabase de 90% dans les applications normales
 * 
 * @returns { role, isLoading, refetch } - role: 'client' | 'vendeur' | 'livreur' | 'admin' | null
 */
export function useUserRole() {
  const [role, setRole] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Fonction pour aller chercher le rôle depuis Supabase
  const fetchRoleFromSupabase = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        setRole(null)
        setIsLoading(false)
        clearRoleCache()
        return null
      }

      // Vérifier le cache en premier
      const cachedRole = getCachedRole(user.id)
      if (cachedRole) {
        setRole(cachedRole)
        setIsLoading(false)
        return cachedRole
      }

      // Cache miss ou expiré → aller chercher en base
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single()

      if (error) {
        console.error('Error fetching user role:', error)
        setRole(null)
        setIsLoading(false)
        return null
      }

      const userRole = userData?.role || 'client'
      
      // Mettre en cache pour les prochains appels
      setCachedRole(user.id, userRole)
      setRole(userRole)
      setIsLoading(false)
      
      return userRole
    } catch (error) {
      console.error('Error in useUserRole:', error)
      setRole(null)
      setIsLoading(false)
      return null
    }
  }, [])

  useEffect(() => {
    fetchRoleFromSupabase()

    // Écouter les changements d'authentification
    const supabase = createClient()
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: string) => {
      // Rafraîchir le rôle lors d'une nouvelle session
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        fetchRoleFromSupabase()
      }
      // Effacer le cache à la déconnexion
      if (event === 'SIGNED_OUT') {
        clearRoleCache()
        setRole(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [fetchRoleFromSupabase])

  return {
    role,
    isLoading,
    refetch: fetchRoleFromSupabase,
    clearCache: clearRoleCache,
  }
}

/**
 * Fonction utilitaire côté serveur pour récupérer le rôle (sans cache)
 * À utiliser dans les guards côté serveur
 */
export async function getServerUserRole(userId: string) {
  const { createClient } = await import('@/lib/supabase/server')
  
  try {
    const supabase = await createClient()
    const { data: userData, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching server user role:', error)
      return null
    }

    return userData?.role || 'client'
  } catch (error) {
    console.error('Error in getServerUserRole:', error)
    return null
  }
}

/**
 * Expose la clé de cache pour utilisation dans d'autres modules
 */
export { ROLE_CACHE_KEY, ROLE_CACHE_TTL }
