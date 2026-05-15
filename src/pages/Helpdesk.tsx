import { useState, useEffect } from 'react'
import {
  Bug, CreditCard, FileQuestion, UserCircle, LifeBuoy, AlertCircle,
  ChevronRight, Paperclip, CheckCircle, Search, Loader, Star,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import FadeUp from '@/components/ui/FadeUp'
import { submitTicket, type TicketRecord } from '@/api/helpdesk'

// ── Category cards (maps to Odoo tag_ids on backend) ───────────────────────

export const categories = [
  { id: 'technical', Icon: Bug,          label: 'ปัญหาทางเทคนิค',          desc: 'ระบบขัดข้อง, บัก, หรือใช้งานไม่ได้' },
  { id: 'billing',   Icon: CreditCard,   label: 'การชำระเงิน / แผนบริการ', desc: 'ใบแจ้งหนี้, การต่ออายุ, อัปเกรดแผน' },
  { id: 'policy',    Icon: FileQuestion, label: 'คำถามเกี่ยวกับ Policy',    desc: 'การสร้าง, แก้ไข หรือนำ Policy ไปใช้' },
  { id: 'account',   Icon: UserCircle,   label: 'บัญชีผู้ใช้',               desc: 'เข้าสู่ระบบไม่ได้, รีเซ็ตรหัสผ่าน' },
  { id: 'pdpa',      Icon: LifeBuoy,     label: 'ปรึกษาด้าน PDPA',           desc: 'ขอคำแนะนำจากผู้เชี่ยวชาญด้านกฎหมาย' },
  { id: 'other',     Icon: AlertCircle,  label: 'อื่นๆ',                     desc: 'ไม่พบหมวดหมู่ที่ตรงกัน' },
]

// ── Ticket types (Odoo ticket_type_id — update IDs once Odoo is configured) ─

export const ticketTypes = [
  { id: null,  label: 'ไม่ระบุ' },
  { id: 1,     label: 'Question / คำถาม' },
  { id: 2,     label: 'Issue / ปัญหาการใช้งาน' },
  { id: 3,     label: 'Feature Request / ขอฟีเจอร์' },
  { id: 4,     label: 'Other / อื่นๆ' },
]

// ── Priority (Odoo 19: 0 Normal · 1 Low · 2 High · 3 Very High) ─────────────

export const priorities = [
  { value: 'normal', label: 'Normal',    stars: 0, color: '#64748b', bg: '#f1f5f9' },
  { value: 'low',    label: 'Low',       stars: 1, color: '#2563eb', bg: '#dbeafe' },
  { value: 'high',   label: 'High',      stars: 2, color: '#d97706', bg: '#fef3c7' },
  { value: 'urgent', label: 'Very High', stars: 3, color: '#dc2626', bg: '#fee2e2' },
]

// ── Star rating widget ───────────────────────────────────────────────────────

function StarPriority({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const current = priorities.find(p => p.value === value)?.stars ?? 0
  const display = hovered ?? current

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {[1, 2, 3].map(star => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHovered(star)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => {
              const picked = priorities.find(p => p.stars === star)
              if (picked) onChange(picked.value)
            }}
          >
            <Star
              className="w-6 h-6 transition-colors"
              fill={display >= star ? '#f59e0b' : 'none'}
              style={{ color: display >= star ? '#f59e0b' : '#d1d5db' }}
            />
          </button>
        ))}
      </div>
      {current > 0 && (
        <button
          type="button"
          onClick={() => onChange('normal')}
          className="text-xs text-gray-400 underline"
        >
          ล้าง
        </button>
      )}
      <span
        className="text-xs font-bold px-2.5 py-1 rounded-full"
        style={{
          backgroundColor: priorities.find(p => p.value === value)?.bg ?? '#f1f5f9',
          color: priorities.find(p => p.value === value)?.color ?? '#64748b',
        }}
      >
        {priorities.find(p => p.value === value)?.label ?? 'Normal'}
      </span>
    </div>
  )
}

// ── Section header helper ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] mb-4" style={{ color: 'var(--green-dark)' }}>
      <span className="block w-4 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
      {children}
    </p>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function Helpdesk() {
  const navigate = useNavigate()

  // Customer info
  const [partnerName,    setPartnerName]    = useState('')
  const [partnerEmail,   setPartnerEmail]   = useState('')
  const [partnerPhone,   setPartnerPhone]   = useState('')
  const [partnerCompany, setPartnerCompany] = useState('')

  // Ticket info
  const [subject,       setSubject]       = useState('')
  const [ticketTypeId,  setTicketTypeId]  = useState<number | null>(null)
  const [priority,      setPriority]      = useState('normal')
  const [selectedTags,  setSelectedTags]  = useState<string[]>([])
  const [description,   setDescription]   = useState('')
  const [fileName,      setFileName]      = useState<string | null>(null)

  // UI state
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [ticket,  setTicket]  = useState<TicketRecord | null>(null)

  // Auto-fill from logged-in session
  useEffect(() => {
    try {
      const raw = localStorage.getItem('flowpdpa_auth')
      if (!raw) return
      const auth = JSON.parse(raw)
      if (auth.name)  setPartnerName(auth.name)
      if (auth.email) setPartnerEmail(auth.email)
    } catch { /* not logged in */ }
  }, [])

  function toggleTag(id: string) {
    setSelectedTags(prev =>
      prev.includes(id) ? prev.filter(t => t !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const result = await submitTicket({
        partner_name:         partnerName,
        partner_email:        partnerEmail,
        partner_phone:        partnerPhone,
        partner_company_name: partnerCompany,
        name:                 subject,
        ticket_type_id:       ticketTypeId,
        ticket_type_label:    ticketTypes.find(t => t.id === ticketTypeId)?.label ?? '',
        priority,
        tag_ids:              selectedTags,
        description,
      })
      setTicket(result)
    } catch {
      setError('เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง หรือติดต่อเราโดยตรง')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setTicket(null); setError(null)
    setPartnerName(''); setPartnerEmail(''); setPartnerPhone(''); setPartnerCompany('')
    setSubject(''); setTicketTypeId(null); setPriority('normal')
    setSelectedTags([]); setDescription(''); setFileName(null)
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors bg-white'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5'

  return (
    <div style={{ paddingTop: '61px' }}>

      {/* Header */}
      <div className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--green)' }}>
            <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
            Helpdesk
          </p>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="text-3xl sm:text-5xl font-black text-white mb-5">ส่งคำขอรับการสนับสนุน</h1>
              <p className="text-base leading-relaxed" style={{ color: '#64748b' }}>
                พบปัญหาหรือต้องการความช่วยเหลือ? กรอกรายละเอียดด้านล่าง
                ทีมงานจะตรวจสอบและตอบกลับภายใน 1 วันทำการ
              </p>
            </div>
            <Link
              to="/helpdesk/track"
              className="shrink-0 flex items-center gap-2 text-sm font-semibold px-5 py-2.5 rounded-lg border transition-colors whitespace-nowrap"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)' }}
            >
              <Search className="w-4 h-4" />
              ติดตาม Ticket
            </Link>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="bg-gray-50 py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Success ── */}
          {ticket ? (
            <FadeUp>
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: 'var(--green-light)' }}>
                  <CheckCircle className="w-9 h-9" style={{ color: 'var(--green)' }} />
                </div>
                <h2 className="text-2xl font-black text-gray-900 mb-2">ส่งคำขอสำเร็จ!</h2>
                <p className="text-gray-400 text-sm mb-6">ทีมงานได้รับคำขอของคุณแล้ว และจะติดต่อกลับตามอีเมลที่ให้ไว้</p>
                <div className="inline-flex items-center gap-3 px-6 py-3 rounded-xl mb-3" style={{ backgroundColor: 'var(--navy)' }}>
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: '#475569' }}>Ticket ID</span>
                  <span className="text-white font-black text-lg tracking-widest">{ticket.id}</span>
                </div>
                <p className="text-xs text-gray-400 mb-8">กรุณาเก็บรหัส Ticket ไว้เพื่อใช้ติดตามสถานะ</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button onClick={() => navigate(`/helpdesk/track?id=${ticket.id}`)} className="btn-green px-8 flex items-center gap-2">
                    <Search className="w-4 h-4" />
                    ติดตาม Ticket นี้
                  </button>
                  <button onClick={resetForm} className="px-8 py-3 text-sm font-bold border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors">
                    ส่งคำขอใหม่
                  </button>
                </div>
              </div>
            </FadeUp>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* ── 1. Category tags ── */}
              <FadeUp>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                  <SectionLabel>หมวดหมู่ปัญหา</SectionLabel>
                  <p className="text-sm text-gray-400 mb-5">เลือกได้มากกว่า 1 หมวดหมู่</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {categories.map(({ id, Icon, label, desc }) => {
                      const active = selectedTags.includes(id)
                      return (
                        <button
                          key={id} type="button" onClick={() => toggleTag(id)}
                          className="text-left p-4 rounded-xl border transition-all"
                          style={{
                            borderColor:     active ? 'var(--green)' : '#e5e7eb',
                            backgroundColor: active ? 'var(--green-light)' : 'white',
                            boxShadow:       active ? '0 0 0 2px var(--green)' : 'none',
                          }}
                        >
                          <div className="w-9 h-9 flex items-center justify-center rounded-lg mb-3"
                            style={{ backgroundColor: active ? 'var(--green)' : '#f1f5f9' }}>
                            <Icon className="w-4 h-4" style={{ color: active ? 'white' : '#64748b' }} />
                          </div>
                          <div className="text-sm font-bold text-gray-900 mb-0.5">{label}</div>
                          <div className="text-xs text-gray-400 leading-snug">{desc}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </FadeUp>

              {/* ── 2. Customer info ── */}
              <FadeUp>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                  <SectionLabel>ข้อมูลผู้แจ้ง</SectionLabel>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>ชื่อ – นามสกุล <span className="text-red-400 normal-case">*</span></label>
                        <input type="text" required value={partnerName} onChange={e => setPartnerName(e.target.value)}
                          placeholder="ชื่อของคุณ" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>อีเมล <span className="text-red-400 normal-case">*</span></label>
                        <input type="email" required value={partnerEmail} onChange={e => setPartnerEmail(e.target.value)}
                          placeholder="email@company.com" className={inputCls} />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>เบอร์โทรศัพท์</label>
                        <input type="tel" value={partnerPhone} onChange={e => setPartnerPhone(e.target.value)}
                          placeholder="0812345678" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>ชื่อบริษัท / องค์กร</label>
                        <input type="text" value={partnerCompany} onChange={e => setPartnerCompany(e.target.value)}
                          placeholder="บริษัท..." className={inputCls} />
                      </div>
                    </div>
                  </div>
                </div>
              </FadeUp>

              {/* ── 3. Ticket info ── */}
              <FadeUp>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-7">
                  <SectionLabel>รายละเอียด Ticket</SectionLabel>
                  <div className="space-y-4">

                    {/* Subject */}
                    <div>
                      <label className={labelCls}>หัวข้อปัญหา (Subject) <span className="text-red-400 normal-case">*</span></label>
                      <input type="text" required value={subject} onChange={e => setSubject(e.target.value)}
                        placeholder="สรุปปัญหาในหนึ่งประโยค..." className={inputCls} />
                    </div>

                    {/* Ticket Type */}
                    <div>
                      <label className={labelCls}>ประเภท Ticket (Ticket Type)</label>
                      <select
                        value={ticketTypeId ?? ''}
                        onChange={e => setTicketTypeId(e.target.value === '' ? null : Number(e.target.value))}
                        className={inputCls}
                      >
                        {ticketTypes.map(t => (
                          <option key={String(t.id)} value={t.id ?? ''}>{t.label}</option>
                        ))}
                      </select>
                    </div>

                    {/* Priority — star rating matching Odoo 19 */}
                    <div>
                      <label className={labelCls}>ความสำคัญ (Priority)</label>
                      <StarPriority value={priority} onChange={setPriority} />
                      <p className="text-xs text-gray-400 mt-1.5">
                        0 ดาว = Normal · 1 ดาว = Low · 2 ดาว = High · 3 ดาว = Very High
                      </p>
                    </div>

                    {/* Description */}
                    <div>
                      <label className={labelCls}>รายละเอียด (Description) <span className="text-red-400 normal-case">*</span></label>
                      <textarea
                        required rows={6} value={description} onChange={e => setDescription(e.target.value)}
                        placeholder="อธิบายปัญหาอย่างละเอียด เช่น ขั้นตอนที่ทำก่อนพบปัญหา, ข้อความ error ที่เห็น, เบราว์เซอร์ที่ใช้..."
                        className={`${inputCls} resize-none`}
                      />
                    </div>

                    {/* Attachment */}
                    <div>
                      <label className={labelCls}>แนบไฟล์ (Attachment)</label>
                      <label className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-200 cursor-pointer transition-colors hover:border-green-400 hover:bg-gray-50">
                        <Paperclip className="w-4 h-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-400">
                          {fileName ?? 'คลิกเพื่อเลือกไฟล์ (PNG, JPG, PDF — ไม่เกิน 10 MB)'}
                        </span>
                        <input type="file" accept=".png,.jpg,.jpeg,.pdf" className="hidden"
                          onChange={e => setFileName(e.target.files?.[0]?.name ?? null)} />
                      </label>
                    </div>
                  </div>
                </div>
              </FadeUp>

              {/* ── 4. Consent + Submit ── */}
              <FadeUp>
                <div className="space-y-4">
                  <div className="flex items-start gap-2.5">
                    <input type="checkbox" required id="helpdesk-consent" className="mt-1" />
                    <label htmlFor="helpdesk-consent" className="text-xs text-gray-400 leading-relaxed">
                      ฉันยอมรับ{' '}
                      <Link to="/terms" style={{ color: 'var(--green)' }} className="underline">เงื่อนไขการใช้บริการ</Link>
                      {' '}และ{' '}
                      <Link to="/privacy-policy" style={{ color: 'var(--green)' }} className="underline">นโยบายความเป็นส่วนตัว</Link>
                      {' '}ของ FlowPDPA
                    </label>
                  </div>

                  {error && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-red-50 border border-red-100">
                      <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                      <p className="text-sm text-red-600">{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3">
                    <button
                      type="submit" disabled={loading}
                      className="btn-green flex-1 py-3.5 text-sm font-bold flex items-center justify-center gap-2"
                      style={{ borderRadius: '8px', opacity: loading ? 0.7 : 1 }}
                    >
                      {loading ? <Loader className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                      {loading ? 'กำลังส่ง...' : 'ส่งคำขอ'}
                    </button>
                    <Link to="/support"
                      className="flex-1 py-3.5 text-sm font-bold text-center border border-gray-200 rounded-lg text-gray-500 hover:bg-gray-50 transition-colors"
                      style={{ borderRadius: '8px' }}>
                      ยกเลิก
                    </Link>
                  </div>

                  <div className="flex items-start gap-3 px-5 py-4 rounded-xl border border-blue-100 bg-blue-50">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--blue)' }} />
                    <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
                      หากปัญหาของคุณเร่งด่วน ติดต่อโดยตรงที่{' '}
                      <a href="tel:043123456" className="font-bold underline" style={{ color: 'var(--blue)' }}>043-123-456</a>
                      {' '}หรือ{' '}
                      <a href="mailto:contact@flowpdpa.co.th" className="font-bold underline" style={{ color: 'var(--blue)' }}>contact@flowpdpa.co.th</a>
                      {' '}จันทร์ – ศุกร์ 09:00 – 18:00 น.
                    </p>
                  </div>
                </div>
              </FadeUp>

            </form>
          )}

        </div>
      </div>

    </div>
  )
}
