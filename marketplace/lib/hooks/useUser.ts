import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  phone: string
  full_name: string | null
  avatar_url: string | null
  role: string
  note_moyenne: number
  nb_avis: number
  created_at: string
  notif_push: boolean
  notif_whatsapp: boolean
  notif_email: boolean
}

const DEMO_ROLE_KEY = 'ayiba-demo-role'
const DEMO_NAME_KEY = 'ayiba-demo-name'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Mode démo — uniquement en développement, ignoré en production
    if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
      const demoRole = localStorage.getItem(DEMO_ROLE_KEY)
      if (demoRole) {
        const demoName = localStorage.getItem(DEMO_NAME_KEY) || 'Utilisateur Démo'
        setProfile({
          id: 'demo-user',
          phone: '',
          full_name: demoName,
          avatar_url: null,
          role: demoRole,
          note_moyenne: 4.8,
          nb_avis: 0,
          created_at: new Date().toISOString(),
          notif_push: true,
          notif_whatsapp: true,
          notif_email: false,
        })
        setLoading(false)
        return
      }
    }

    const supabase = createClient()

    // Get initial user (getUser() est vérifié côté serveur, contrairement à
    // getSession() qui peut renvoyer null juste après l'hydratation avant
    // que le storage local du client Supabase soit prêt — c'est ce qui
    // causait l'affichage de "Utilisateur" à la place du vrai nom).
    supabase.auth.getUser().then(({ data: { user } }: any) => {
      setUser(user ?? null)
      if (user) {
        fetchProfile(user.id)
      } else {
        setLoading(false)
      }
    })

    // Listen for auth changes (INITIAL_SESSION est ignoré : déjà couvert
    // par le getUser() ci-dessus, l'inclure ici doublait fetchProfile()
    // au montage et donc fetchAddresses() côté page Profil).
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event: any, session: any) => {
      if (event === "INITIAL_SESSION") return
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchProfile = async (userId: string) => {
    const supabase = createClient()
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      console.error('Error fetching profile:', error)
    } else {
      setProfile(data)
    }
    setLoading(false)
  }

  const exitDemoMode = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(DEMO_ROLE_KEY)
      localStorage.removeItem(DEMO_NAME_KEY)
    }
    setProfile(null)
    setUser(null)
  }

  return { user, profile, loading, exitDemoMode }
}
