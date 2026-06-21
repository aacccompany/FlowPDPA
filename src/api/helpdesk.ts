export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'

export interface TicketPayload {
  partner_name: string
  partner_email: string
  partner_phone: string
  partner_company_name: string
  name: string
  ticket_type_id: number | null
  ticket_type_label: string
  priority: string
  tag_ids: string[]
  description: string
}

export interface TicketRecord extends TicketPayload {
  id: string
  status: TicketStatus
  stageName?: string
  createdAt: string
}

const TICKETS_KEY = 'flowpdpa_tickets'

const readTickets = (): TicketRecord[] => {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) ?? '[]') as TicketRecord[]
  } catch {
    return []
  }
}

export const submitTicket = async (payload: TicketPayload): Promise<TicketRecord> => {
  const ticket: TicketRecord = {
    ...payload,
    id: `TKT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    status: 'open',
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(TICKETS_KEY, JSON.stringify([ticket, ...readTickets()]))
  return ticket
}

export const fetchTicket = async (ticketId: string): Promise<TicketRecord | null> =>
  readTickets().find(ticket => ticket.id.toLowerCase() === ticketId.toLowerCase()) ?? null
