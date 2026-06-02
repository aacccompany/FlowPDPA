// Storage utilities for better localStorage management
export const storage = {
  // Generic storage methods
  get: <T = any>(key: string): T | null => {
    try {
      const item = localStorage.getItem(key)
      return item ? JSON.parse(item) : null
    } catch (error) {
      console.error(`Error reading from localStorage for key ${key}:`, error)
      return null
    }
  },

  set: <T = any>(key: string, value: T): void => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error(`Error writing to localStorage for key ${key}:`, error)
    }
  },

  remove: (key: string): void => {
    try {
      localStorage.removeItem(key)
    } catch (error) {
      console.error(`Error removing from localStorage for key ${key}:`, error)
    }
  },

  clear: (): void => {
    try {
      localStorage.clear()
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },

  // Auth-specific methods
  auth: {
    get: () => storage.get('flowpdpa_auth'),
    set: (data: any) => storage.set('flowpdpa_auth', data),
    remove: () => storage.remove('flowpdpa_auth'),
    clearAllAuth: () => {
      storage.remove('flowpdpa_auth')
      storage.remove('flowpdpa_profile')
    },
  },

  // Profile-specific methods
  profile: {
    get: (email?: string) => {
      const key = email ? `flowpdpa_profile_${email}` : 'flowpdpa_profile'
      return storage.get(key)
    },
    set: (email: string, data: any) => {
      const key = `flowpdpa_profile_${email}`
      storage.set(key, data)
    },
    remove: (email: string) => {
      const key = `flowpdpa_profile_${email}`
      storage.remove(key)
    },
  },

  // Registration storage
  registration: {
    get: (email: string) => storage.get(`flowpdpa_reg_${email}`),
    set: (email: string, data: any) => storage.set(`flowpdpa_reg_${email}`, data),
    remove: (email: string) => storage.remove(`flowpdpa_reg_${email}`),
  },
}

// Session management
export const session = {
  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const auth = storage.auth.get()
    return !!auth && !!auth.token
  },

  // Get current user info
  getUser: () => {
    const auth = storage.auth.get()
    return auth ? { email: auth.email, name: auth.name, plan: auth.plan } : null
  },

  // Get authentication token
  getToken: (): string | null => {
    const auth = storage.auth.get()
    return auth?.token || null
  },

  // Check if user is admin
  isAdmin: (): boolean => {
    const auth = storage.auth.get()
    return auth?.plan === 'Admin' || auth?.role === 'admin'
  },

  // Logout with cleanup
  logout: () => {
    storage.auth.clearAllAuth()
    // Clear any other session-specific data
    window.dispatchEvent(new Event('storage'))
  },
}

// Export default for backward compatibility
export default storage