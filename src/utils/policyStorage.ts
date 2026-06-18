export type PolicyStatus = 'Draft' | 'pending_review' | 'approved' | 'rejected' | 'edited'

export interface SavedPolicy {
  id: string
  slug: string
  type: string
  typeName: string
  typeIcon: string
  websiteName: string
  domain: string
  language: string
  status: PolicyStatus
  createdAt: string
  updatedAt: string
  htmlContent: string
  ownerEmail: string
  ownerName?: string
  reviewComment?: string
  reviewedAt?: string
  approvalDeadline?: string
  googleDocId?: string
  googleDocUrl?: string
}

const PREFIX = 'flowpdpa_policies_'

export const policyStorage = {
  getAll: (ownerEmail: string): SavedPolicy[] => {
    try {
      const raw = localStorage.getItem(PREFIX + ownerEmail)
      return raw ? JSON.parse(raw) : []
    } catch { return [] }
  },

  getAllSubmissions: (): SavedPolicy[] => {
    const results: SavedPolicy[] = []
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(PREFIX)) {
          const items: SavedPolicy[] = JSON.parse(localStorage.getItem(key) || '[]')
          results.push(...items)
        }
      }
    } catch { /* ignore */ }
    return results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  },

  getBySlug: (slug: string): SavedPolicy | null => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(PREFIX)) {
          const items: SavedPolicy[] = JSON.parse(localStorage.getItem(key) || '[]')
          const found = items.find(p => p.slug === slug)
          if (found) return found
        }
      }
    } catch { /* ignore */ }
    return null
  },

  save: (policy: SavedPolicy): void => {
    const key = PREFIX + policy.ownerEmail
    const existing = policyStorage.getAll(policy.ownerEmail)
    const idx = existing.findIndex(p => p.id === policy.id)
    if (idx >= 0) existing[idx] = policy
    else existing.unshift(policy)
    localStorage.setItem(key, JSON.stringify(existing))
  },

  updateBySlug: (slug: string, updates: Partial<SavedPolicy>): void => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith(PREFIX)) {
          const items: SavedPolicy[] = JSON.parse(localStorage.getItem(key) || '[]')
          const idx = items.findIndex(p => p.slug === slug)
          if (idx >= 0) {
            items[idx] = { ...items[idx], ...updates, updatedAt: new Date().toISOString() }
            localStorage.setItem(key, JSON.stringify(items))
            return
          }
        }
      }
    } catch { /* ignore */ }
  },

  delete: (id: string, ownerEmail: string): void => {
    const key = PREFIX + ownerEmail
    const existing = policyStorage.getAll(ownerEmail)
    localStorage.setItem(key, JSON.stringify(existing.filter(p => p.id !== id)))
  },
}

export function generateSlug(websiteUrl: string, type: string): string {
  const domain = websiteUrl
    .replace(/https?:\/\//, '')
    .replace(/\/$/, '')
    .replace(/[^a-z0-9]/gi, '-')
    .toLowerCase()
    .slice(0, 25)
  const rand = Math.random().toString(36).slice(2, 8)
  return `${domain}-${type}-${rand}`
}

export function generatePolicyId(): string {
  return 'pol_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}
