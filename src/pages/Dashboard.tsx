import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Plus, Settings, LogOut, Bell,
  ChevronRight, Download, Copy,
  Trash2, CheckCircle, Clock, Globe, Lock, X, ShieldCheck,
  LifeBuoy, ExternalLink, AlertCircle, Loader, XCircle, ShieldAlert,
} from 'lucide-react'
import { type TicketRecord } from '@/api/helpdesk'
import { fetchContact, updateContact, defaultProfile, type ContactProfile } from '@/api/contact'
import { policyStorage, type SavedPolicy } from '@/utils/policyStorage'

// ── Auth helper ───────────────────────────────────────────────
type AuthUser = { name: string; email: string; plan: string; company?: string; phone?: string }

function getCurrentUser(): AuthUser {
  try {
    const raw = localStorage.getItem('flowpdpa_auth')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { name: 'User', email: '', plan: 'Free' }
}

// ── Policy helpers ───────────────────────────────────────────

const langDisplay: Record<string, string> = {
  th:   'TH',
  en:   'EN',
  both: 'TH + EN',
}

function getUserPolicies(email: string): SavedPolicy[] {
  return policyStorage.getAll(email)
}


// ── Sidebar nav items ─────────────────────────────────────────
const navItems = [
  { key: 'overview',  label: 'ภาพรวม',           Icon: LayoutDashboard },
  { key: 'policies',  label: 'นโยบายของฉัน',      Icon: FileText },
  { key: 'tickets',   label: 'Tickets',            Icon: LifeBuoy },
  { key: 'new',       label: 'สร้าง Policy ใหม่',  Icon: Plus },
  { key: 'settings',  label: 'ตั้งค่าบัญชี',      Icon: Settings },
]

// ── Helpers ───────────────────────────────────────────────────
const statusDisplay: Record<string, { label: string; color: string; bg: string }> = {
  pending_review:    { label: 'Review',             color: '#d97706', bg: 'rgba(217,119,6,0.1)' },
  approved:          { label: 'Reviewed',           color: '#059669', bg: 'rgba(5,150,105,0.12)' },
  rejected:          { label: 'Rejected',           color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
  edited:            { label: 'Edited',             color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
  Draft:             { label: 'Draft',              color: '#64748b', bg: 'rgba(100,116,139,0.1)' },
  Active:            { label: 'Active',             color: '#059669', bg: 'rgba(5,150,105,0.12)' },
}

function StatusBadge({ status }: { status: string }) {
  const cfg = statusDisplay[status] ?? { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.1)' }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

// ── Sub-views ─────────────────────────────────────────────────
function Overview({ setView, user }: { setView: (v: string) => void; user: AuthUser }) {
  const userPolicies  = getUserPolicies(user.email)
  const activePolicies = userPolicies.filter(p => p.status === 'approved').length
  const userTickets   = getUserTickets(user.email)
  const openTickets   = userTickets.filter(t => t.status === 'open' || t.status === 'in_progress').length

  const stats = [
    { label: 'นโยบายทั้งหมด',  value: String(userPolicies.length || 0), Icon: FileText,    color: 'var(--blue)' },
    { label: 'อนุมัติแล้ว',      value: String(activePolicies || 0),       Icon: CheckCircle, color: 'var(--green)' },
    { label: 'PDPA Status',     value: 'Compliant',                        Icon: ShieldCheck, color: 'var(--green)' },
    { label: 'Tickets (เปิด)',  value: String(openTickets),               Icon: LifeBuoy,    color: '#f59e0b' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 mb-1">
          สวัสดี, {user.name} 👋
        </h1>
        <p className="text-sm text-gray-500">นี่คือภาพรวมของ Policy ทั้งหมดในบัญชีของคุณ</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center mb-3"
              style={{ backgroundColor: color + '15' }}
            >
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-xl font-black text-gray-900 mb-0.5">{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Recent policies */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">นโยบายล่าสุด</h2>
          <button
            onClick={() => setView('policies')}
            className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: 'var(--green)' }}
          >
            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {userPolicies.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-xs text-gray-400 mb-3">ยังไม่มีนโยบาย</p>
            <Link to="/create/policy" className="text-xs font-semibold underline" style={{ color: 'var(--green)' }}>
              สร้างนโยบายแรก →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {userPolicies.slice(0, 3).map((p) => (
              <div key={p.id} className="flex items-center justify-between px-6 py-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                    style={{ backgroundColor: '#f8fafc' }}
                  >
                    {p.typeIcon}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-gray-900">{p.typeName}</div>
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Globe className="w-3 h-3" /> {p.domain}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-gray-400 hidden sm:block">{langDisplay[p.language] || p.language}</span>
                  <StatusBadge status={p.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent tickets */}
      <div className="bg-white rounded-xl border border-gray-100 mb-6">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 text-sm">Tickets ล่าสุด</h2>
          <button
            onClick={() => setView('tickets')}
            className="text-xs font-semibold flex items-center gap-1 transition-colors"
            style={{ color: 'var(--green)' }}
          >
            ดูทั้งหมด <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        {userTickets.length === 0 ? (
          <div className="px-6 py-8 text-center">
            <p className="text-xs text-gray-400 mb-3">ยังไม่มี Ticket</p>
            <Link to="/helpdesk" className="text-xs font-semibold underline" style={{ color: 'var(--green)' }}>
              ส่งคำขอแรก →
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {userTickets.slice(0, 3).map(t => (
              <div key={t.id} className="flex items-center justify-between px-6 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: '#f1f5f9' }}>
                    <LifeBuoy className="w-4 h-4 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                    <p className="text-xs text-gray-400 font-mono">{t.id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <TicketStatusBadge status={t.status} />
                  <Link
                    to={`/helpdesk/track?id=${t.id}`}
                    className="text-gray-300 hover:text-green-500 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div
        className="rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
      >
        <div>
          <p className="text-white font-bold text-sm mb-1">ต้องการนโยบายเพิ่มเติม?</p>
          <p className="text-xs" style={{ color: '#64748b' }}>เลือกจากนโยบาย 7 ประเภทที่รองรับ PDPA ไทย, GDPR และ CCPA</p>
        </div>
        <Link
          to="/create/policy"
          className="btn-green text-sm px-6 py-2.5 shrink-0 flex items-center gap-2"
          style={{ borderRadius: '8px' }}
        >
          <Plus className="w-4 h-4" /> สร้าง Policy ใหม่
        </Link>
      </div>
    </div>
  )
}

function PoliciesList({ user }: { user: AuthUser }) {
  const [policies, setPolicies] = useState<SavedPolicy[]>([])
  const [copied, setCopied] = useState<string | null>(null)

  useEffect(() => {
    setPolicies(getUserPolicies(user.email))
  }, [user.email])

  const handleCopy = (p: SavedPolicy) => {
    const url = `${window.location.origin}/p/${p.slug}`
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    })
    setCopied(p.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDownload = (p: SavedPolicy) => {
    const text = p.htmlContent.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, '\n').trim()
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `${p.websiteName}-${p.type}-policy.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  const handleDelete = (p: SavedPolicy) => {
    if (!confirm(`ลบนโยบาย "${p.typeName}" ของ ${p.websiteName}?`)) return
    policyStorage.delete(p.id, user.email)
    setPolicies(getUserPolicies(user.email))
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">นโยบายของฉัน</h1>
          <p className="text-sm text-gray-400">{policies.length} นโยบายในบัญชีของคุณ</p>
        </div>
        <Link
          to="/create/policy"
          className="btn-green text-sm px-5 py-2.5 flex items-center gap-2"
          style={{ borderRadius: '8px' }}
        >
          <Plus className="w-4 h-4" /> สร้างใหม่
        </Link>
      </div>

      {policies.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <FileText className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">ยังไม่มีนโยบาย</p>
          <p className="text-xs text-gray-400 mb-5">สร้างนโยบาย PDPA สำหรับธุรกิจของคุณใน 5 นาที</p>
          <Link to="/create/policy" className="btn-green text-sm px-6 py-2.5" style={{ borderRadius: '8px' }}>
            สร้างนโยบายแรก
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <div className="col-span-4">ชื่อนโยบาย</div>
            <div className="col-span-2">โดเมน</div>
            <div className="col-span-1">ภาษา</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2">อัปเดตล่าสุด</div>
            <div className="col-span-1 text-right">จัดการ</div>
          </div>

          {/* Rows */}
          {policies.map((p, i) => (
            <div
              key={p.id}
              className={`grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center ${i < policies.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}
            >
              {/* Name */}
              <div className="col-span-2 md:col-span-4 flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-base shrink-0"
                  style={{ backgroundColor: '#f1f5f9' }}
                >
                  {p.typeIcon}
                </div>
                <div>
                  {p.status === 'approved' ? (
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-gray-900 hover:underline"
                      style={{ textDecorationColor: 'var(--green)' }}
                    >
                      {p.typeName}
                    </a>
                  ) : (
                    <span className="text-sm font-semibold text-gray-900">{p.typeName}</span>
                  )}
                  <div className="text-xs text-gray-400 md:hidden">{p.domain}</div>
                </div>
              </div>

              {/* Domain */}
              <div className="hidden md:flex md:col-span-2 items-center gap-1 text-xs text-gray-500">
                <Globe className="w-3 h-3 shrink-0" /> {p.domain}
              </div>

              {/* Lang */}
              <div className="hidden md:block md:col-span-1 text-xs text-gray-500">
                {langDisplay[p.language] || p.language}
              </div>

              {/* Status */}
              <div className="md:col-span-2">
                <StatusBadge status={p.status} />
              </div>

              {/* Updated */}
              <div className="hidden md:block md:col-span-2 text-xs text-gray-400">
                {new Date(p.updatedAt).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })}
              </div>

              {/* Actions */}
              <div className="col-span-1 flex items-center justify-end gap-1">
                {p.status === 'approved' && (
                  <>
                    <button
                      title="คัดลอกลิงก์"
                      onClick={() => handleCopy(p)}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: copied === p.id ? 'var(--green)' : '#9ca3af' }}
                      onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                      onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      title="ดาวน์โหลด TXT"
                      onClick={() => handleDownload(p)}
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: '#9ca3af' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={`/p/${p.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="ดูนโยบาย"
                      className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                      style={{ color: '#9ca3af' }}
                      onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                      onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </>
                )}
                <button
                  title="ลบ"
                  onClick={() => handleDelete(p)}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {policies.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="text-xs text-gray-400">รูปแบบดาวน์โหลดที่รองรับ:</span>
          {['TXT', 'HTML Embed (เร็วๆ นี้)', 'PDF (เร็วๆ นี้)', 'Word (เร็วๆ นี้)'].map((f) => (
            <span
              key={f}
              className="text-xs font-medium px-2.5 py-1 rounded-full border"
              style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
            >
              {f}
            </span>
          ))}
        </div>
      )}
    </div>
  )
}


// ── Ticket helpers ────────────────────────────────────────────

const ticketStatusMap = {
  open:        { label: 'รับเรื่องแล้ว',    color: '#2563eb', bg: '#dbeafe', Icon: Clock },
  in_progress: { label: 'กำลังดำเนินการ',  color: '#d97706', bg: '#fef3c7', Icon: Loader },
  resolved:    { label: 'แก้ไขแล้ว',        color: '#059669', bg: '#d1fae5', Icon: CheckCircle },
  closed:      { label: 'ปิดแล้ว',           color: '#64748b', bg: '#f1f5f9', Icon: XCircle },
} satisfies Record<TicketRecord['status'], { label: string; color: string; bg: string; Icon: React.ElementType }>

function TicketStatusBadge({ status }: { status: TicketRecord['status'] }) {
  const s = ticketStatusMap[status]
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: s.bg, color: s.color }}
    >
      <s.Icon className="w-3 h-3" />
      {s.label}
    </span>
  )
}

function getUserTickets(email: string): TicketRecord[] {
  try {
    const all: TicketRecord[] = JSON.parse(localStorage.getItem('flowpdpa_tickets') ?? '[]')
    return all.filter(t => t.partner_email?.toLowerCase() === email.toLowerCase())
  } catch {
    return []
  }
}

function formatShortDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function TicketsList({ user }: { user: AuthUser }) {
  const tickets = getUserTickets(user.email)

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">Tickets ของฉัน</h1>
          <p className="text-sm text-gray-400">{tickets.length} คำขอในบัญชีของคุณ</p>
        </div>
        <Link
          to="/helpdesk"
          className="btn-green text-sm px-5 py-2.5 flex items-center gap-2"
          style={{ borderRadius: '8px' }}
        >
          <Plus className="w-4 h-4" /> ส่งคำขอใหม่
        </Link>
      </div>

      {tickets.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-14 text-center">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#f1f5f9' }}
          >
            <LifeBuoy className="w-6 h-6 text-gray-300" />
          </div>
          <p className="text-sm font-semibold text-gray-500 mb-1">ยังไม่มี Ticket</p>
          <p className="text-xs text-gray-400 mb-5">พบปัญหาหรือต้องการความช่วยเหลือ? ส่งคำขอได้เลย</p>
          <Link to="/helpdesk" className="btn-green text-sm px-6 py-2.5" style={{ borderRadius: '8px' }}>
            ส่งคำขอแรก
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <div className="col-span-1">Ticket</div>
            <div className="col-span-4">หัวข้อ</div>
            <div className="col-span-3">ประเภท</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-1">วันที่</div>
            <div className="col-span-1 text-right">ดู</div>
          </div>

          {tickets.map((t, i) => (
            <div
              key={t.id}
              className={`grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${i < tickets.length - 1 ? 'border-b border-gray-50' : ''}`}
            >
              {/* Ticket ID */}
              <div className="col-span-2 md:col-span-1">
                <span className="text-xs font-mono font-bold text-gray-500">{t.id}</span>
              </div>

              {/* Subject */}
              <div className="col-span-2 md:col-span-4">
                <p className="text-sm font-semibold text-gray-900 truncate">{t.name}</p>
                <p className="text-xs text-gray-400 md:hidden mt-0.5">{formatShortDate(t.createdAt)}</p>
              </div>

              {/* Type */}
              <div className="hidden md:block md:col-span-3">
                <p className="text-xs text-gray-500 truncate">
                  {t.ticket_type_label || t.tag_ids.join(', ') || '—'}
                </p>
              </div>

              {/* Status */}
              <div className="col-span-1 md:col-span-2">
                <TicketStatusBadge status={t.status} />
              </div>

              {/* Date */}
              <div className="hidden md:block md:col-span-1 text-xs text-gray-400 whitespace-nowrap">
                {formatShortDate(t.createdAt)}
              </div>

              {/* Action */}
              <div className="col-span-1 flex justify-end">
                <Link
                  to={`/helpdesk/track?id=${t.id}`}
                  className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                  style={{ color: '#9ca3af' }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = 'var(--green)' }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
                  title="ดูรายละเอียด"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Notice */}
      <div className="mt-4 flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-blue-50">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--blue)' }} />
        <p className="text-xs leading-relaxed" style={{ color: '#334155' }}>
          สถานะ Ticket อัปเดตโดยทีมงาน FlowPDPA ·{' '}
          <Link to="/helpdesk/track" className="font-bold underline" style={{ color: 'var(--blue)' }}>
            ติดตาม Ticket ด้วย ID
          </Link>
        </p>
      </div>
    </div>
  )
}

function AccountSettings({ user }: { user: AuthUser }) {
  const [profile,  setProfile]  = useState<ContactProfile>({ ...defaultProfile(), name: user.name, email: user.email })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew,     setPwNew]     = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError,   setPwError]   = useState('')

  useEffect(() => {
    fetchContact(user.email).then(p => {
      if (p) setProfile(p)
      setLoading(false)
    })
  }, [user.email])

  function set<K extends keyof ContactProfile>(key: K, value: ContactProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await updateContact(user.email, profile)
    setSaving(false)
    setSaved(true)
  }

  function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (pwNew.length < 6) { setPwError('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (pwNew !== pwConfirm) { setPwError('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    setPwError('')
    setPwCurrent(''); setPwNew(''); setPwConfirm('')
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors bg-white'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5'

  function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 p-6">
        <h2 className="text-sm font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{title}</h2>
        {children}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader className="w-6 h-6 animate-spin text-gray-300" />
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-1">ตั้งค่าบัญชี</h1>
        <p className="text-sm text-gray-400">ข้อมูลของคุณจะถูกซิงค์กับระบบ Odoo เมื่อเชื่อมต่อแล้ว</p>
      </div>

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── 1. Personal Info (res.partner: name, function, email, phone, mobile) ── */}
        <Section title="ข้อมูลส่วนตัว">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ชื่อ-นามสกุล (Name) <span className="text-red-400 normal-case">*</span></label>
              <input required value={profile.name} onChange={e => set('name', e.target.value)}
                placeholder="ชื่อ นามสกุล" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ตำแหน่งงาน (Job Position)</label>
              <input value={profile.function} onChange={e => set('function', e.target.value)}
                placeholder="เช่น CEO, Developer" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>อีเมล (Email) <span className="text-red-400 normal-case">*</span></label>
              <input required type="email" value={profile.email} onChange={e => set('email', e.target.value)}
                placeholder="email@company.com" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>โทรศัพท์ (Phone)</label>
              <input type="tel" value={profile.phone} onChange={e => set('phone', e.target.value)}
                placeholder="02-xxx-xxxx" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>มือถือ (Mobile)</label>
              <input type="tel" value={profile.mobile} onChange={e => set('mobile', e.target.value)}
                placeholder="08x-xxx-xxxx" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>เว็บไซต์ (Website)</label>
              <input type="url" value={profile.website} onChange={e => set('website', e.target.value)}
                placeholder="https://yoursite.com" className={inputCls} />
            </div>
          </div>
        </Section>

        {/* ── 2. Company Info (res.partner: company_name, vat) ── */}
        <Section title="ข้อมูลบริษัท / องค์กร">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>ชื่อบริษัท / องค์กร (Company)</label>
              <input value={profile.company_name} onChange={e => set('company_name', e.target.value)}
                placeholder="บริษัท..." className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>เลขประจำตัวผู้เสียภาษี (Tax ID / VAT)</label>
              <input value={profile.vat} onChange={e => set('vat', e.target.value)}
                placeholder="0-0000-00000-00-0" className={inputCls} />
            </div>
          </div>
        </Section>

        {/* ── 3. Address (res.partner: street, street2, city, zip, state_id, country_id) ── */}
        <Section title="ที่อยู่">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelCls}>ที่อยู่ (Street)</label>
              <input value={profile.street} onChange={e => set('street', e.target.value)}
                placeholder="บ้านเลขที่ / ถนน / ซอย" className={inputCls} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>ที่อยู่เพิ่มเติม (Street 2)</label>
              <input value={profile.street2} onChange={e => set('street2', e.target.value)}
                placeholder="อาคาร / ชั้น / หมู่บ้าน" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>เมือง / อำเภอ / เขต (City)</label>
              <input value={profile.city} onChange={e => set('city', e.target.value)}
                placeholder="เมืองขอนแก่น" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>จังหวัด (State)</label>
              <input value={profile.state_name} onChange={e => set('state_name', e.target.value)}
                placeholder="ขอนแก่น" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>รหัสไปรษณีย์ (ZIP)</label>
              <input value={profile.zip} onChange={e => set('zip', e.target.value)}
                placeholder="40000" className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>ประเทศ (Country)</label>
              <input value={profile.country_name} onChange={e => set('country_name', e.target.value)}
                placeholder="ประเทศไทย" className={inputCls} />
            </div>
          </div>
        </Section>

        {/* ── 4. Preferences (res.partner: lang) ── */}
        <Section title="การตั้งค่า">
          <div className="max-w-xs">
            <label className={labelCls}>ภาษา (Language)</label>
            <select value={profile.lang} onChange={e => set('lang', e.target.value)} className={inputCls}>
              <option value="th_TH">ภาษาไทย</option>
              <option value="en_US">English</option>
            </select>
          </div>
        </Section>

        {/* Save button */}
        <div className="flex items-center gap-3">
          <button
            type="submit" disabled={saving}
            className="btn-green text-sm px-8 py-2.5 flex items-center gap-2"
            style={{ borderRadius: '8px', opacity: saving ? 0.7 : 1 }}
          >
            {saving && <Loader className="w-3.5 h-3.5 animate-spin" />}
            {saving ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
          </button>
          {saved && (
            <span className="flex items-center gap-1.5 text-sm font-semibold" style={{ color: 'var(--green)' }}>
              <CheckCircle className="w-4 h-4" /> บันทึกสำเร็จ
            </span>
          )}
        </div>
      </form>

      {/* ── 5. Plan ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-1">แผนปัจจุบัน</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)' }}>
                {user.plan}
              </span>
              <span className="text-xs text-gray-400">ชำระครั้งเดียว ตลอดชีพ</span>
            </div>
          </div>
          <Link to="/#contact" className="text-sm font-semibold transition-colors" style={{ color: 'var(--blue)' }}>
            อัปเกรดแผน →
          </Link>
        </div>
      </div>

      {/* ── 6. Security ── */}
      <div className="bg-white rounded-xl border border-gray-100 p-6 mt-4">
        <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Lock className="w-4 h-4 text-gray-400" /> ความปลอดภัย
        </h2>
        <form onSubmit={handlePasswordChange} className="space-y-3">
          <div>
            <label className={labelCls}>รหัสผ่านปัจจุบัน</label>
            <input type="password" value={pwCurrent} onChange={e => setPwCurrent(e.target.value)}
              placeholder="••••••••"
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>รหัสผ่านใหม่</label>
              <input type="password" value={pwNew} onChange={e => { setPwNew(e.target.value); setPwError('') }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
            </div>
            <div>
              <label className={labelCls}>ยืนยันรหัสผ่านใหม่</label>
              <input type="password" value={pwConfirm} onChange={e => { setPwConfirm(e.target.value); setPwError('') }}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
            </div>
          </div>
          {pwError && <p className="text-xs text-red-500">{pwError}</p>}
          <button type="submit" className="text-sm font-bold px-6 py-2.5 border-2 rounded-lg transition-colors"
            style={{ borderColor: 'var(--green)', color: 'var(--green)', borderRadius: '8px' }}>
            เปลี่ยนรหัสผ่าน
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const [activeView, setActiveView] = useState('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('flowpdpa_auth')) navigate('/login')
  }, [navigate])

  const user = getCurrentUser()

  const handleLogout = () => {
    localStorage.removeItem('flowpdpa_auth')
    navigate('/login')
  }

  const currentNav = navItems.find(n => n.key === activeView)

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>

      {/* ── Sidebar ── */}
      <>
        {/* Mobile overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        <aside
          className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
          style={{
            width: '240px',
            backgroundColor: 'var(--navy)',
            borderRight: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          {/* Logo */}
          <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <Link to="/" className="flex items-center gap-0.5">
              <span className="font-black text-lg text-white tracking-tight">Flow</span>
              <span className="font-black text-lg tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
            </Link>
            <button className="lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeView === key
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'new') { navigate('/create/policy'); return }
                    setActiveView(key); setSidebarOpen(false)
                  }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                  style={{
                    backgroundColor: active ? 'rgba(5,150,105,0.15)' : 'transparent',
                    color: active ? 'var(--green)' : '#475569',
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {key === 'new' && (
                    <span
                      className="ml-auto text-xs font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: 'rgba(5,150,105,0.2)', color: 'var(--green)' }}
                    >
                      +
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
                style={{ backgroundColor: 'var(--blue)' }}
              >
                DU
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold text-white truncate">{user.name}</div>
                <div className="text-xs truncate" style={{ color: '#334155' }}>{user.plan}</div>
              </div>
            </div>
            <Link
              to="/admin"
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5"
              style={{ color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(220,38,38,0.1)'; e.currentTarget.style.color = '#f87171' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569' }}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              Admin Panel
            </Link>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#475569' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ef4444' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569' }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              ออกจากระบบ
            </button>
          </div>
        </aside>
      </>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: '0', paddingLeft: '0' }}>
        <div className="lg:ml-60 flex flex-col min-h-screen">

          {/* Top bar */}
          <header
            className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
            style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}
          >
            <div className="flex items-center gap-3">
              {/* Mobile hamburger */}
              <button
                className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
                onClick={() => setSidebarOpen(true)}
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                  <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
                </svg>
              </button>
              <div>
                <h1 className="text-sm font-bold text-gray-900">{currentNav?.label ?? 'Dashboard'}</h1>
                <p className="text-xs text-gray-400 hidden sm:block">FlowPDPA Dashboard</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                className="relative w-9 h-9 flex items-center justify-center rounded-lg transition-colors text-gray-500 hover:bg-gray-100"
              >
                <Bell className="w-4 h-4" />
                <span
                  className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                  style={{ backgroundColor: 'var(--green)' }}
                />
              </button>
              <button
                onClick={() => setActiveView('settings')}
                className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-lg transition-colors hover:bg-gray-100"
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                  style={{ backgroundColor: 'var(--blue)' }}
                >
                  DU
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="flex-1 p-6">
            {activeView === 'overview'  && <Overview setView={setActiveView} user={user} />}
            {activeView === 'policies'  && <PoliciesList user={user} />}
            {activeView === 'tickets'   && <TicketsList user={user} />}
            {activeView === 'settings'  && <AccountSettings user={user} />}
          </main>

        </div>
      </div>
    </div>
  )
}
