import React, { createContext, useContext, useEffect, useState } from 'react'
import { storage, session } from '@/utils/storage'

interface AuthContextType {
  isAuthenticated: boolean
  user: {
    email: string
    name: string
    plan: string
    company?: string
    phone?: string
  } | null
  loading: boolean
  login: (email: string, name: string, plan: string) => void
  logout: () => void
  updateUser: (userData: Partial<AuthContextType['user']>) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [user, setUser] = useState<AuthContextType['user']>(null)
  const [loading, setLoading] = useState(true)

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = () => {
      const authData = storage.auth.get()
      if (authData && authData.email && authData.token) {
        setIsAuthenticated(true)
        setUser({
          email: authData.email,
          name: authData.name || '',
          plan: authData.plan || 'Free',
          company: authData.company,
          phone: authData.phone,
        })
      }
      setLoading(false)
    }

    checkAuth()
  }, [])

  const login = (email: string, name: string, plan: string) => {
    const authData = storage.auth.get()
    if (authData) {
      setUser({
        email,
        name,
        plan,
        company: authData.company,
        phone: authData.phone,
      })
      setIsAuthenticated(true)
    }
  }

  const logout = () => {
    session.logout()
    setIsAuthenticated(false)
    setUser(null)
  }

  const updateUser = (userData: Partial<AuthContextType['user']>) => {
    if (user) {
      const updatedUser = { ...user, ...userData }
      setUser(updatedUser)
      // Update storage
      const authData = storage.auth.get()
      if (authData) {
        storage.auth.set({
          ...authData,
          ...userData,
        })
      }
    }
  }

  const value = {
    isAuthenticated,
    user,
    loading,
    login,
    logout,
    updateUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}