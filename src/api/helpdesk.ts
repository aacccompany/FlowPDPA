// ── Odoo configuration ─────────────────────────────────────────────────────
// Set these environment variables in .env when Odoo is ready:
//   VITE_ODOO_URL=https://yourcompany.odoo.com
//   VITE_ODOO_DB=your_database
//   VITE_ODOO_API_KEY=your_api_key
//   VITE_ODOO_TEAM_ID=1        (optional — default helpdesk team ID)

const ODOO_URL     = import.meta.env.VITE_ODOO_URL     ?? ''
const ODOO_DB      = import.meta.env.VITE_ODOO_DB      ?? ''
const ODOO_API_KEY = import.meta.env.VITE_ODOO_API_KEY ?? ''
const ODOO_TEAM_ID = import.meta.env.VITE_ODOO_TEAM_ID ? Number(import.meta.env.VITE_ODOO_TEAM_ID) : undefined

export const isOdooConfigured = () => Boolean(ODOO_URL && ODOO_DB && ODOO_API_KEY)

// Odoo 19 priority field: '0' Normal · '1' Low · '2' High · '3' Very High
export const PRIORITY_MAP: Record<string, string> = {
  normal: '0',
  low:    '1',
  high:   '2',
  urgent: '3',
}

// ── Types ───────────────────────────────────────────────────────────────────

// Mirrors Odoo 19 helpdesk.ticket fields
export interface TicketPayload {
  // Customer info
  partner_name:         string   // Customer full name
  partner_email:        string   // Customer email
  partner_phone:        string   // Customer phone (optional)
  partner_company_name: string   // Customer company (optional)

  // Ticket info
  name:           string         // Subject / ticket title
  ticket_type_id: number | null  // Odoo ticket type ID (null = not set)
  ticket_type_label: string      // Label shown in UI
  priority:       string         // 'normal' | 'low' | 'high' | 'urgent'
  tag_ids:        string[]       // Category tags (mapped to Odoo tag IDs on backend)
  description:    string         // Detailed description
}

export interface TicketRecord extends TicketPayload {
  id:          string
  status:      'open' | 'in_progress' | 'resolved' | 'closed'
  stageName?:  string
  createdAt:   string
}

// ── Odoo JSON-RPC helper ────────────────────────────────────────────────────

async function odooCall(
  model: string,
  method: string,
  args: unknown[],
  kwargs: Record<string, unknown> = {},
) {
  const res = await fetch(`${ODOO_URL}/web/dataset/call_kw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': ODOO_API_KEY,
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method: 'call',
      params: {
        model, method, args, kwargs,
        context: { lang: 'th_TH', db: ODOO_DB },
      },
    }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.data?.message ?? data.error.message)
  return data.result
}

// ── Public API ──────────────────────────────────────────────────────────────

export async function submitTicket(payload: TicketPayload): Promise<TicketRecord> {
  if (!isOdooConfigured()) return mockSubmit(payload)

  const odooPayload: Record<string, unknown> = {
    name:                 payload.name,
    partner_name:         payload.partner_name,
    partner_email:        payload.partner_email,
    description:          `<p>${payload.description.replace(/\n/g, '<br/>')}</p>`,
    priority:             PRIORITY_MAP[payload.priority] ?? '0',
  }

  if (payload.partner_phone)        odooPayload.partner_phone        = payload.partner_phone
  if (payload.partner_company_name) odooPayload.partner_company_name = payload.partner_company_name
  if (payload.ticket_type_id)       odooPayload.ticket_type_id       = payload.ticket_type_id
  if (ODOO_TEAM_ID)                 odooPayload.team_id              = ODOO_TEAM_ID

  const odooId: number = await odooCall('helpdesk.ticket', 'create', [odooPayload])

  const record: TicketRecord = {
    ...payload,
    id:        `TKT-${odooId}`,
    status:    'open',
    createdAt: new Date().toISOString(),
  }
  cacheTicket(record)
  return record
}

export async function fetchTicket(ticketId: string): Promise<TicketRecord | null> {
  const cached = getCachedTicket(ticketId)
  if (!isOdooConfigured()) return cached

  const numId = parseInt(ticketId.replace(/^TKT-/i, ''), 10)
  if (isNaN(numId)) return null

  try {
    const results = await odooCall('helpdesk.ticket', 'read', [[numId]], {
      fields: [
        'name', 'partner_name', 'partner_email', 'partner_phone',
        'partner_company_name', 'ticket_type_id', 'priority',
        'tag_ids', 'description', 'stage_id', 'create_date',
      ],
    })
    if (!results?.length) return null

    const t         = results[0]
    const stageName = t.stage_id?.[1] ?? ''

    return {
      id:                   ticketId,
      name:                 t.name,
      partner_name:         t.partner_name  ?? '',
      partner_email:        t.partner_email ?? '',
      partner_phone:        t.partner_phone ?? '',
      partner_company_name: t.partner_company_name ?? '',
      ticket_type_id:       t.ticket_type_id?.[0] ?? null,
      ticket_type_label:    t.ticket_type_id?.[1] ?? '',
      priority:             Object.entries(PRIORITY_MAP).find(([, v]) => v === t.priority)?.[0] ?? 'normal',
      tag_ids:              cached?.tag_ids ?? [],
      description:          t.description?.replace(/<[^>]+>/g, '') ?? '',
      status:               mapOdooStage(stageName),
      stageName,
      createdAt:            t.create_date,
    }
  } catch {
    return cached
  }
}

// ── Odoo stage → our status ─────────────────────────────────────────────────

function mapOdooStage(stage: string): TicketRecord['status'] {
  const s = stage.toLowerCase()
  if (s.includes('progress') || s.includes('open')) return 'in_progress'
  if (s.includes('done') || s.includes('solved') || s.includes('resolved')) return 'resolved'
  if (s.includes('cancel') || s.includes('close')) return 'closed'
  return 'open'
}

// ── Local cache (mock mode + post-submit tracking) ──────────────────────────

function cacheTicket(ticket: TicketRecord) {
  const existing: TicketRecord[] = JSON.parse(localStorage.getItem('flowpdpa_tickets') ?? '[]')
  const filtered = existing.filter(t => t.id !== ticket.id)
  localStorage.setItem('flowpdpa_tickets', JSON.stringify([ticket, ...filtered]))
}

function getCachedTicket(id: string): TicketRecord | null {
  try {
    const tickets: TicketRecord[] = JSON.parse(localStorage.getItem('flowpdpa_tickets') ?? '[]')
    return tickets.find(t => t.id.toUpperCase() === id.toUpperCase()) ?? null
  } catch {
    return null
  }
}

// ── Mock (used when Odoo env vars are not set) ──────────────────────────────

function mockSubmit(payload: TicketPayload): TicketRecord {
  const id     = 'TKT-' + Math.random().toString(36).substring(2, 7).toUpperCase()
  const record: TicketRecord = { ...payload, id, status: 'open', createdAt: new Date().toISOString() }
  cacheTicket(record)
  return record
}
