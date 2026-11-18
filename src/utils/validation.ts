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
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    if (parsed.username || parsed.password || !parsed.hostname) return false
    const hostname = parsed.hostname.toLowerCase()
    const isLocalhost = hostname === 'localhost'
    const isIpv4 = /^(?:\d{1,3}\.){3}\d{1,3}$/.test(hostname)
      && hostname.split('.').every(part => Number(part) <= 255)
    const isDomain = hostname.includes('.')
      && !hostname.startsWith('.')
      && !hostname.endsWith('.')
      && hostname.split('.').every(label => /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i.test(label))
    return isLocalhost || isIpv4 || isDomain
  } catch {
    return false
  }
}

export function isValidThaiNationalId(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (!/^\d{13}$/.test(digits) || /^(\d)\1{12}$/.test(digits)) return false
  const total = digits
    .slice(0, 12)
    .split('')
    .reduce((sum, digit, index) => sum + Number(digit) * (13 - index), 0)
  const checksum = (11 - (total % 11)) % 10
  return checksum === Number(digits[12])
}
