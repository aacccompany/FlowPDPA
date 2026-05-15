// ── Odoo configuration (shared with helpdesk) ──────────────────────────────
// VITE_ODOO_URL, VITE_ODOO_DB, VITE_ODOO_API_KEY

const ODOO_URL     = import.meta.env.VITE_ODOO_URL     ?? ''
const ODOO_DB      = import.meta.env.VITE_ODOO_DB      ?? ''
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY ?? ''

const isOdooConfigured = () => Boolean(ODOO_URL && ODOO_DB && ODOO_API_KEY)

// ── Odoo 19 res.partner fields ──────────────────────────────────────────────

export interface ContactProfile {
  // Identity
  name:          string   // ชื่อ-นามสกุล *
  function:      string   // ตำแหน่งงาน (Job Position)
  email:         string   // อีเมล *
  phone:         string   // โทรศัพท์
  mobile:        string   // มือถือ
  website:       string   // เว็บไซต์

  // Company
  company_name:  string   // ชื่อบริษัท / องค์กร
  vat:           string   // เลขประจำตัวผู้เสียภาษี (Tax ID)

  // Address
  street:        string   // ที่อยู่
  street2:       string   // ที่อยู่ (เพิ่มเติม)
  city:          string   // เมือง / อำเภอ / เขต
  zip:           string   // รหัสไปรษณีย์
  state_name:    string   // จังหวัด
  country_name:  string   // ประเทศ

  // Preferences
  lang:          string   // 'th_TH' | 'en_US'

  // Internal Odoo ID (set after first sync)
  odoo_id?:      number
}

export const defaultProfile = (): ContactProfile => ({
  name: '', function: '', email: '', phone: '', mobile: '', website: '',
  company_name: '', vat: '',
  street: '', street2: '', city: '', zip: '', state_name: '', country_name: 'ประเทศไทย',
  lang: 'th_TH',
})

// ── Odoo JSON-RPC helper ────────────────────────────────────────────────────

async function odooCall(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
) {
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': ODOO_API_KEY },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1, method: 'call',
      params: { model, method, args, kwargs, context: { lang: 'th_TH', db: ODOO_DB } },
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.data?.message ?? data.error.message)
  return data.result
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function fetchContact(email: string): Promise<ContactProfile | null> {
  if (!isOdooConfigured()) return loadLocalProfile(email)

  try {
    const results = await odooCall('res.partner', 'search_read',
      [[['email', '=', email]]],
      {
        fields: [
          'name', 'function', 'email', 'phone', 'mobile', 'website',
          'company_name', 'vat',
          'street', 'street2', 'city', 'zip',
          'state_id', 'country_id', 'lang',
        ],
        limit: 1,
      },
    )
    if (!results?.length) return loadLocalProfile(email)

    const p = results[0]
    const profile: ContactProfile = {
      name:         p.name          ?? '',
      function:     p.function      ?? '',
      email:        p.email         ?? '',
      phone:        p.phone         ?? '',
      mobile:       p.mobile        ?? '',
      website:      p.website       ?? '',
      company_name: p.company_name  ?? '',
      vat:          p.vat           ?? '',
      street:       p.street        ?? '',
      street2:      p.street2       ?? '',
      city:         p.city          ?? '',
      zip:          p.zip           ?? '',
      state_name:   p.state_id?.[1] ?? '',
      country_name: p.country_id?.[1] ?? 'ประเทศไทย',
      lang:         p.lang          ?? 'th_TH',
      odoo_id:      p.id,
    }
    saveLocalProfile(email, profile)
    return profile
  } catch {
    return loadLocalProfile(email)
  }
}

export async function updateContact(email: string, profile: ContactProfile): Promise<void> {
  saveLocalProfile(email, profile)
  if (!isOdooConfigured()) return

  const payload: Record<string, unknown> = {
    name:         profile.name,
    function:     profile.function,
    phone:        profile.phone,
    mobile:       profile.mobile,
    website:      profile.website,
    company_name: profile.company_name,
    vat:          profile.vat,
    street:       profile.street,
    street2:      profile.street2,
    city:         profile.city,
    zip:          profile.zip,
    lang:         profile.lang,
  }

  if (profile.odoo_id) {
    await odooCall('res.partner', 'write', [[profile.odoo_id], payload])
  } else {
    // Create new contact linked to this email
    await odooCall('res.partner', 'create', [{ ...payload, email }])
  }
}

// ── Local profile cache (used when Odoo is not configured) ──────────────────

const profileKey = (email: string) => `flowpdpa_profile_${email}`

export function saveLocalProfile(email: string, profile: ContactProfile) {
  localStorage.setItem(profileKey(email), JSON.stringify(profile))
  // Keep flowpdpa_auth in sync for name used across the app
  try {
    const raw  = localStorage.getItem('flowpdpa_auth')
    const auth = raw ? JSON.parse(raw) : {}
    localStorage.setItem('flowpdpa_auth', JSON.stringify({
      ...auth,
      name:    profile.name,
      email:   profile.email,
      company: profile.company_name,
      phone:   profile.phone,
    }))
  } catch { /* ignore */ }
}

export function loadLocalProfile(email: string): ContactProfile | null {
  try {
    const raw = localStorage.getItem(profileKey(email))
    if (raw) return JSON.parse(raw)

    // Fall back to basic info from flowpdpa_auth
    const authRaw = localStorage.getItem('flowpdpa_auth')
    if (!authRaw) return null
    const auth = JSON.parse(authRaw)
    return { ...defaultProfile(), name: auth.name ?? '', email: auth.email ?? email }
  } catch {
    return null
  }
}
