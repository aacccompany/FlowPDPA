export type UserRole = 'merchant' | 'legal' | 'admin'

export interface AuthUser {
  id?: string
  email: string
  name: string
  role: UserRole
  plan: string
  company?: string
  phone?: string
  emailVerified: boolean
  privacyNoticeAccepted: boolean
  privacyNoticeVersion?: string | null
  privacyNoticeAcceptedAt?: string | null
}

export interface StoredAuth extends AuthUser {
  token: string
  refreshToken?: string
  expiresAt?: number
}

const AUTH_KEY = 'flowpdpa_auth'
const AUTH_PROFILE_KEY = 'flowpdpa_auth_profile'
const LEGACY_SENSITIVE_PREFIXES = ['flowpdpa_reg_', 'flowpdpa_profile_']
const LEGACY_ROLE_KEYS = ['flowpdpa_admin', 'flowpdpa_legal']
const LEGACY_POLICY_PREFIX = 'flowpdpa_policies_'
export const AUTH_CHANGED_EVENT = 'flowpdpa:auth-changed'

interface PersistedCredentials {
  token: string
  refreshToken?: string
  expiresAt?: number
}

export const cleanupLegacyBrowserStorage = () => {
  for (const key of Object.keys(localStorage)) {
    if (LEGACY_SENSITIVE_PREFIXES.some(prefix => key.startsWith(prefix)) || key.startsWith(LEGACY_POLICY_PREFIX)) {
      localStorage.removeItem(key)
    }
  }
  LEGACY_ROLE_KEYS.forEach(key => localStorage.removeItem(key))

  try {
    const current = JSON.parse(localStorage.getItem(AUTH_KEY) ?? 'null') as Partial<StoredAuth> | null
    if (current?.token) {
      localStorage.setItem(AUTH_KEY, JSON.stringify({
        token: current.token,
        refreshToken: current.refreshToken,
        expiresAt: current.expiresAt,
      }))
    }
  } catch {
    localStorage.removeItem(AUTH_KEY)
  }
}

export const normalizeRole = (role?: string): UserRole => {
  if (role === 'admin') return 'admin'
  if (role === 'legal') return 'legal'
  return 'merchant'
}

export const roleHome = (role?: UserRole | string): string => {
  const normalized = typeof role === 'string' ? normalizeRole(role) : role
  if (normalized === 'admin') return '/admin'
  if (normalized === 'legal') return '/legal'
  return '/dashboard'
}

const notifyAuthChanged = (auth: StoredAuth | null) => {
  window.dispatchEvent(new CustomEvent<StoredAuth | null>(AUTH_CHANGED_EVENT, { detail: auth }))
}

const decodeJwtPayload = (token: string): Record<string, unknown> => {
  try {
    const encoded = token.split('.')[1]
    if (!encoded) return {}
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/')
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
    return JSON.parse(decodeURIComponent(Array.from(atob(padded))
      .map(char => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
      .join(''))) as Record<string, unknown>
  } catch {
    return {}
  }
}

const readAuth = (): StoredAuth | null => {
  try {
    const raw = localStorage.getItem(AUTH_KEY)
    if (!raw) return null

    const value = JSON.parse(raw) as Partial<PersistedCredentials>
    if (!value.token) {
      localStorage.removeItem(AUTH_KEY)
      return null
    }

    const claims = decodeJwtPayload(value.token)
    const email = typeof claims.sub === 'string' ? claims.sub : ''

    const cachedProfile = (() => {
      try {
        const profile = JSON.parse(sessionStorage.getItem(AUTH_PROFILE_KEY) ?? 'null') as Partial<AuthUser> | null
        return profile?.email === email ? profile : null
      } catch {
        sessionStorage.removeItem(AUTH_PROFILE_KEY)
        return null
      }
    })()

    return {
      id: typeof claims.user_id === 'string' ? claims.user_id : undefined,
      email,
      name: cachedProfile?.name ?? '',
      role: normalizeRole(typeof claims.role === 'string' ? claims.role : undefined),
      plan: cachedProfile?.plan ?? (typeof claims.plan === 'string' ? claims.plan : 'Free'),
      company: cachedProfile?.company,
      phone: cachedProfile?.phone,
      emailVerified: cachedProfile?.emailVerified ?? false,
      privacyNoticeAccepted: cachedProfile?.privacyNoticeAccepted ?? false,
      privacyNoticeVersion: cachedProfile?.privacyNoticeVersion,
      privacyNoticeAcceptedAt: cachedProfile?.privacyNoticeAcceptedAt,
      token: value.token,
      refreshToken: value.refreshToken,
      expiresAt: value.expiresAt,
    }
  } catch {
    localStorage.removeItem(AUTH_KEY)
    return null
  }
}

const credentialsOnly = (auth: StoredAuth): PersistedCredentials => ({
  token: auth.token,
  refreshToken: auth.refreshToken,
  expiresAt: auth.expiresAt,
})

export const storage = {
  auth: {
    get: readAuth,
    set: (auth: StoredAuth) => {
      localStorage.setItem(AUTH_KEY, JSON.stringify(credentialsOnly(auth)))
      sessionStorage.setItem(AUTH_PROFILE_KEY, JSON.stringify({
        id: auth.id,
        email: auth.email,
        name: auth.name,
        role: auth.role,
        plan: auth.plan,
        company: auth.company,
        phone: auth.phone,
        emailVerified: auth.emailVerified,
        privacyNoticeAccepted: auth.privacyNoticeAccepted,
        privacyNoticeVersion: auth.privacyNoticeVersion,
        privacyNoticeAcceptedAt: auth.privacyNoticeAcceptedAt,
      }))
      notifyAuthChanged(auth)
    },
    clear: () => {
      localStorage.removeItem(AUTH_KEY)
      sessionStorage.removeItem(AUTH_PROFILE_KEY)
      notifyAuthChanged(null)
    },
  },
}

export const session = {
  logout: () => storage.auth.clear(),
}
