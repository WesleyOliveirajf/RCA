import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) loadProfile(session.user.id)
      else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  async function loadProfile(userId) {
    try {
      const { data, error } = await supabase
        .from('usuarios')
        .select('id, nome, email, perfil, username')
        .eq('id', userId)
        .single()
      if (error) throw error
      setProfile(data)
    } catch {
      setProfile(null)
    }
    setLoading(false)
  }

  async function signIn(username, password) {
    try {
      const trimmed = username.trim()
      let email = `${trimmed.toLowerCase()}@rca.local`
      if (trimmed.toLowerCase() !== 'superadmin') {
        const { data } = await supabase
          .from('usuarios')
          .select('email')
          .eq('username', trimmed)
          .single()
        if (data?.email) email = data.email
      }
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) throw error
    } catch (err) {
      if (err?.message === 'Failed to fetch') {
        throw new Error(
          'Não foi possível conectar ao Supabase. Verifique internet, firewall ou VPN corporativa.'
        )
      }
      if (err?.name === 'AuthRetryableFetchError') {
        const serverMsg = err?.message || ''
        if (serverMsg.includes('Database error') || serverMsg.includes('unexpected_failure')) {
          throw new Error(
            'Erro interno no servidor de autenticação. Tente novamente em alguns instantes.'
          )
        }
        throw new Error(
          'Não foi possível conectar ao Supabase. Verifique internet, firewall ou VPN corporativa.'
        )
      }
      if (err?.message === 'Invalid login credentials') {
        throw new Error('Usuário ou senha incorretos.')
      }
      throw err
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
