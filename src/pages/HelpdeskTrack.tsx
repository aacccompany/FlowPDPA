import { useState, useEffect } from 'react'
import { Search, CheckCircle, Clock, Loader, XCircle, ChevronRight, ArrowLeft, AlertCircle } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import FadeUp from '@/components/ui/FadeUp'
import { fetchTicket, type TicketRecord } from '@/api/helpdesk'
import { categories, priorities, ticketTypes } from './Helpdesk'

const statuses: Record<TicketRecord['status'], { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  open:        { label: 'รับเรื่องแล้ว',    color: '#2563eb', bg: '#dbeafe', Icon: Clock },
  in_progress: { label: 'กำลังดำเนินการ', color: '#d97706', bg: '#fef3c7', Icon: Loader },
  resolved:    { label: 'แก้ไขแล้ว',       color: '#059669', bg: '#d1fae5', Icon: CheckCircle },
  closed:      { label: 'ปิดแล้ว',          color: '#64748b', bg: '#f1f5f9', Icon: XCircle },
}

const timeline: { status: TicketRecord['status']; label: string }[] = [
  { status: 'open',        label: 'รับเรื่องแล้ว' },
  { status: 'in_progress', label: 'กำลังดำเนินการ' },
  { status: 'resolved',    label: 'แก้ไขแล้ว' },
  { status: 'closed',      label: 'ปิดแล้ว' },
]

const statusOrder: Record<TicketRecord['status'], number> = {
  open: 0, in_progress: 1, resolved: 2, closed: 3,
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('th-TH', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function HelpdeskTrack() {
  const [searchParams] = useSearchParams()
  const [query, setQuery]     = useState(searchParams.get('id') ?? '')
  const [ticket, setTicket]   = useState<TicketRecord | null>(null)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [error, setError]     = useState<string | null>(null)

  useEffect(() => {
    const id = searchParams.get('id')
    if (id) {
      setQuery(id)
      lookup(id)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function lookup(id: string) {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchTicket(id.trim())
      setTicket(result)
    } catch {
      setError('เกิดข้อผิดพลาดในการค้นหา กรุณาลองใหม่อีกครั้ง')
      setTicket(null)
    } finally {
      setLoading(false)
      setSearched(true)
    }
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    lookup(query)
  }

  const priorityInfo   = ticket ? priorities.find(p => p.value === ticket.priority)   : null
  const statusInfo     = ticket ? statuses[ticket.status]                              : null
  const ticketTypeInfo = ticket ? ticketTypes.find(t => t.id === ticket.ticket_type_id) : null
  const tagLabels      = ticket
    ? ticket.tag_ids.map(id => categories.find(c => c.id === id)?.label ?? id).filter(Boolean)
    : []

  return (
    <div style={{ paddingTop: '61px' }}>

      {/* Header */}
      <div className="public-light-page-header py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--green)' }}>
            <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
            Helpdesk
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white mb-5">ติดตามสถานะ Ticket</h1>
          <p className="text-base leading-relaxed" style={{ color: '#64748b' }}>
            กรอกรหัส Ticket ที่ได้รับหลังจากส่งคำขอ เพื่อตรวจสอบสถานะการดำเนินการ
          </p>
        </div>
      </div>

      {/* Body */}
      <div className="bg-gray-50 py-14 min-h-screen">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search box */}
          <FadeUp>
            <form onSubmit={handleSearch} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
                รหัส Ticket
              </label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="เช่น TKT-A3X7K"
                  className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors font-mono tracking-widest uppercase"
                />
                <button
                  type="submit" disabled={loading || !query.trim()}
                  className="btn-green px-6 flex items-center gap-2 text-sm"
                  style={{ borderRadius: '8px', opacity: loading ? 0.7 : 1 }}
                >
                  {loading ? <Loader className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  ค้นหา
                </button>
              </div>
            </form>
          </FadeUp>

          {/* Error */}
          {error && (
            <FadeUp>
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-50 border border-red-100 mb-6">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            </FadeUp>
          )}

          {/* Result */}
          {searched && !loading && !error && (
            <FadeUp>
              {ticket && statusInfo ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                  {/* Ticket header */}
                  <div className="px-8 py-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-1">Ticket ID</p>
                      <p className="text-xl font-black tracking-widest" style={{ color: 'var(--navy)' }}>{ticket.id}</p>
                    </div>
                    <span
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold self-start sm:self-auto"
                      style={{ backgroundColor: statusInfo.bg, color: statusInfo.color }}
                    >
                      <statusInfo.Icon className="w-4 h-4" />
                      {ticket.stageName ?? statusInfo.label}
                    </span>
                  </div>

                  {/* Timeline */}
                  <div className="px-8 py-6 border-b border-gray-100">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-5">ความคืบหน้า</p>
                    <div className="flex items-center">
                      {timeline.map((step, i) => {
                        const done    = statusOrder[ticket.status] >= statusOrder[step.status]
                        const current = ticket.status === step.status
                        return (
                          <div key={step.status} className="flex items-center flex-1">
                            <div className="flex flex-col items-center">
                              <div
                                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                                style={{
                                  backgroundColor: done ? 'var(--green)' : '#f1f5f9',
                                  color: done ? 'white' : '#cbd5e1',
                                  boxShadow: current ? '0 0 0 3px var(--green-light)' : 'none',
                                }}
                              >
                                {done ? <CheckCircle className="w-4 h-4" /> : i + 1}
                              </div>
                              <p className="text-xs mt-2 text-center whitespace-nowrap font-semibold"
                                style={{ color: done ? 'var(--green-dark)' : '#cbd5e1' }}>
                                {step.label}
                              </p>
                            </div>
                            {i < timeline.length - 1 && (
                              <div
                                className="flex-1 h-0.5 mb-6 mx-1"
                                style={{
                                  backgroundColor: statusOrder[ticket.status] > statusOrder[step.status]
                                    ? 'var(--green)' : '#e5e7eb',
                                }}
                              />
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Details */}
                  <div className="px-8 py-6 space-y-5">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">รายละเอียด</p>

                    {/* Customer info */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">ชื่อผู้แจ้ง</p>
                        <p className="text-sm font-semibold text-gray-800">{ticket.partner_name}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">อีเมล</p>
                        <p className="text-sm font-semibold text-gray-800">{ticket.partner_email}</p>
                      </div>
                      {ticket.partner_phone && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">เบอร์โทรศัพท์</p>
                          <p className="text-sm font-semibold text-gray-800">{ticket.partner_phone}</p>
                        </div>
                      )}
                      {ticket.partner_company_name && (
                        <div>
                          <p className="text-xs text-gray-400 mb-1">บริษัท / องค์กร</p>
                          <p className="text-sm font-semibold text-gray-800">{ticket.partner_company_name}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-xs text-gray-400 mb-1">วันที่ส่ง</p>
                        <p className="text-sm font-semibold text-gray-800">{formatDate(ticket.createdAt)}</p>
                      </div>
                    </div>

                    {/* Ticket meta */}
                    <div className="grid grid-cols-2 gap-4 pt-2 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-400 mb-1">ประเภท Ticket</p>
                        <p className="text-sm font-semibold text-gray-800">
                          {ticket.ticket_type_label || ticketTypeInfo?.label || '—'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400 mb-1">ความสำคัญ</p>
                        <span
                          className="inline-block px-3 py-0.5 rounded-full text-xs font-bold"
                          style={{ backgroundColor: priorityInfo?.bg ?? '#f1f5f9', color: priorityInfo?.color ?? '#64748b' }}
                        >
                          {priorityInfo?.label ?? ticket.priority}
                        </span>
                      </div>
                      {tagLabels.length > 0 && (
                        <div className="col-span-2">
                          <p className="text-xs text-gray-400 mb-2">หมวดหมู่</p>
                          <div className="flex flex-wrap gap-2">
                            {tagLabels.map(tag => (
                              <span key={tag} className="px-3 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">{tag}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Subject + Description */}
                    <div className="pt-2 border-t border-gray-100">
                      <p className="text-xs text-gray-400 mb-2">หัวข้อปัญหา</p>
                      <p className="text-sm font-bold text-gray-900">{ticket.name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 mb-2">รายละเอียด</p>
                      <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{ticket.description}</p>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-5 border-t border-gray-100 bg-gray-50 flex flex-col sm:flex-row gap-3">
                    <Link to="/helpdesk" className="btn-green flex items-center gap-2 text-sm">
                      <ChevronRight className="w-4 h-4" />
                      ส่งคำขอใหม่
                    </Link>
                    <Link
                      to="/support"
                      className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold border border-gray-200 rounded-lg text-gray-500 hover:bg-white transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      กลับหน้า Support
                    </Link>
                  </div>

                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ backgroundColor: '#fee2e2' }}>
                    <XCircle className="w-7 h-7" style={{ color: '#dc2626' }} />
                  </div>
                  <h3 className="text-lg font-black text-gray-900 mb-2">ไม่พบ Ticket นี้</h3>
                  <p className="text-sm text-gray-400 mb-6">
                    ไม่พบรหัส <span className="font-mono font-bold text-gray-700">{query.toUpperCase()}</span><br />
                    กรุณาตรวจสอบรหัสอีกครั้ง หรือส่งคำขอใหม่
                  </p>
                  <Link to="/helpdesk" className="btn-green px-8 text-sm">ส่งคำขอใหม่</Link>
                </div>
              )}
            </FadeUp>
          )}

        </div>
      </div>

    </div>
  )
}
