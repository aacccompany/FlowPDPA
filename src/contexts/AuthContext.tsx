/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api } from '@/services/api'
import {
  AUTH_CHANGED_EVENT,
  normalizeRole,
  session,
  storage,
  type AuthUser,
  type StoredAuth,
} from '@/utils/storage'

interface AuthContextType {
  isAuthenticated: boolean
  user: AuthUser | null
  auth: StoredAuth | null
  loading: boolean
  sessionExpiring: boolean
  setSession: (auth: StoredAuth) => void
  logout: () => void
  updateUser: (userData: Partial<AuthUser>) => void
  refreshSession: () => Promise<boolean>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within an AuthProvider')
  return context
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(() => storage.auth.get())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const syncAuth = (event: Event) => {
      const detail = event instanceof CustomEvent ? event.detail as StoredAuth | null : undefined
      if (detail === undefined) {
        setAuth(storage.auth.get())
        return
      }
      setAuth(current => {
        if (!detail || !current || detail.email !== current.email || detail.name) return detail
        return {
          ...current,
          token: detail.token,
          refreshToken: detail.refreshToken,
          expiresAt: detail.expiresAt,
        }
      })
    }
    const syncStorage = () => setAuth(storage.auth.get())
    window.addEventListener(AUTH_CHANGED_EVENT, syncAuth)
    window.addEventListener('storage', syncStorage)
    return () => {
      window.removeEventListener(AUTH_CHANGED_EVENT, syncAuth)
      window.removeEventListener('storage', syncStorage)
    }
  }, [])

  const hydrateUser = (current: StoredAuth, user: {
    id?: string; email: string; name: string; role?: string; plan?: string
    company?: string; phone?: string; email_verified?: boolean
  }): StoredAuth => ({
    ...current,
    id: user.id,
    email: user.email,
    name: user.name,
    role: normalizeRole(user.role),
    plan: user.plan ?? 'Free',
    company: user.company,
    phone: user.phone,
    emailVerified: user.email_verified ?? false,
  })

  useEffect(() => {
    let active = true
    const verifySession = async () => {
      const current = storage.auth.get()
      if (!current) {
        if (active) setLoading(false)
        return
      }

      const result = await api.auth.verify()
      if (result.success && result.data?.user) {
        const latest = storage.auth.get()
        if (latest && active) setAuth(hydrateUser(latest, result.data.user))
      }
      if (active) {
        setLoading(false)
      }
      if (!result.success && result.error?.status === 401) session.logout()
    }
    void verifySession()
    return () => { active = false }
  }, [])

  const refreshSession = async (): Promise<boolean> => {
    const result = await api.auth.verify()
    if (result.success) {
      const latest = storage.auth.get()
      if (latest && result.data?.user) setAuth(hydrateUser(latest, result.data.user))
      return true
    }
    if (result.error?.status === 401) session.logout()
    return false
  }

  const sessionExpiring = false

  const value: AuthContextType = {
    isAuthenticated: Boolean(auth?.token),
    user: auth ? {
      id: auth.id,
      email: auth.email,
      name: auth.name,
      role: auth.role,
      plan: auth.plan,
      company: auth.company,
      phone: auth.phone,
      emailVerified: auth.emailVerified,
    } : null,
    auth,
    loading,
    sessionExpiring,
    setSession: next => {
      storage.auth.set(next)
      setAuth(next)
    },
    logout: session.logout,
    updateUser: userData => {
      setAuth(current => current ? { ...current, ...userData } : current)
    },
    refreshSession,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
