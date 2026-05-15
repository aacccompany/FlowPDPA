const ODOO_URL     = import.meta.env.VITE_ODOO_URL     ?? ''
const ODOO_DB      = import.meta.env.VITE_ODOO_DB      ?? ''
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY ?? ''

const isOdooConfigured = () => Boolean(ODOO_URL && ODOO_DB && ODOO_API_KEY)

export type ConsentChoice = 'all' | 'essential'

export interface ConsentRecord {
  choice: ConsentChoice
  timestamp: string
}

const CONSENT_KEY = 'flowpdpa-cookie-consent'

export function getConsent(): ConsentRecord | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

export function hasConsented(): boolean {
  return getConsent() !== null
}

export function analyticsAllowed(): boolean {
  return getConsent()?.choice === 'all'
}

export async function recordConsent(choice: ConsentChoice): Promise<void> {
  const record: ConsentRecord = { choice, timestamp: new Date().toISOString() }
  localStorage.setItem(CONSENT_KEY, JSON.stringify(record))

  // Log to Odoo partner chatter when user is logged in
  if (!isOdooConfigured()) return
  try {
    const authRaw = localStorage.getItem('flowpdpa_auth')
    if (!authRaw) return
    const auth = JSON.parse(authRaw) as { email?: string }
    if (!auth?.email) return

    const partnerId = await resolvePartnerId(auth.email)
    if (!partnerId) return

    const choiceLabel = choice === 'all'
      ? 'ยอมรับทั้งหมด (Accept All)'
      : 'เฉพาะที่จำเป็น (Essential Only)'
    const dateStr = new Date(record.timestamp).toLocaleString('th-TH', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })

    await odooCall('res.partner', 'message_post', [[partnerId]], {
      body: `<p>🍪 <b>บันทึกการยินยอมคุกกี้ (Cookie Consent)</b><br/>
             ตัวเลือก: ${choiceLabel}<br/>
             วันที่: ${dateStr}</p>`,
      message_type: 'comment',
      subtype_xmlid: 'mail.mt_note',
    })
  } catch { /* consent saved locally regardless */ }
}

async function resolvePartnerId(email: string): Promise<number | null> {
  // Check cached profile first
  try {
    const raw = localStorage.getItem(`flowpdpa_profile_${email}`)
    if (raw) {
      const profile = JSON.parse(raw)
      if (profile.odoo_id) return profile.odoo_id as number
    }
  } catch { /* fall through */ }

  // Search Odoo
  const results = await odooCall('res.partner', 'search_read',
    [[['email', '=', email]]],
    { fields: ['id'], limit: 1 },
  )
  return results?.[0]?.id ?? null
}

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
