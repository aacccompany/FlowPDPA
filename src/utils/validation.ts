const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const THAI_MOBILE_PATTERN = /^0[689]\d{8}$/
const THAI_LANDLINE_PATTERN = /^0[2-7]\d{7}$/

export function isValidEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim())
}

export function sanitizeThaiPhone(value: string): string {
  return value.replace(/\D/g, '').slice(0, 10)
}

export function isValidThaiPhone(value: string): boolean {
  const phone = value.replace(/\D/g, '')
  return THAI_MOBILE_PATTERN.test(phone) || THAI_LANDLINE_PATTERN.test(phone)
}

export function normalizeWebsiteUrl(value: string): string {
  const normalized = value.trim()
  if (!normalized) return ''
  return /^https?:\/\//i.test(normalized)
    ? normalized
    : `https://${normalized.replace(/^\/+/, '')}`
}

export function isValidWebsiteUrl(value: string): boolean {
  try {
    const parsed = new URL(normalizeWebsiteUrl(value))
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:') && Boolean(parsed.hostname)
  } catch {
    return false
  }
}
