import { useState, useEffect } from 'react'
import {
  CheckCircle, Clock, XCircle, ChevronLeft, ChevronRight,
  LogOut, FileText, Scale, Eye, EyeOff, Pencil, CalendarClock, AlertTriangle,
  ExternalLink, Link2, Link2Off,
} from 'lucide-react'
import { policyStorage, type SavedPolicy, type PolicyStatus } from '@/utils/policyStorage'
import { extractDocId, getDocEditorUrl, getDocShortLabel, getDocPreviewUrl } from '@/utils/googleDocs'

// ── Credentials ───────────────────────────────────────────────
const LEGAL_EMAIL = 'legal@flowpdpa.co.th'
const LEGAL_PASSWORD = 'legal2025'

// ── Types ─────────────────────────────────────────────────────
type ReviewStatus = 'pending_review' | 'approved' | 'rejected' | 'edited'
type QueueFilter  = 'all' | ReviewStatus
type ReviewAction = 'approve' | 'reject' | 'edit' | null

// ── Status config (shared with queue + detail) ────────────────
const statusConfig: Record<ReviewStatus, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
  pending_review: { label: 'Review',   color: '#d97706', bg: 'rgba(217,119,6,0.1)',  Icon: Clock },
  approved:       { label: 'Reviewed', color: '#059669', bg: 'rgba(5,150,105,0.1)',  Icon: CheckCircle },
  rejected:       { label: 'Rejected', color: '#dc2626', bg: 'rgba(220,38,38,0.1)',  Icon: XCircle },
  edited:         { label: 'Edited',   color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', Icon: Pencil },
}

// ── Mock fallback (shown when no real submissions exist) ───────
const MOCK_SUBMISSIONS: SavedPolicy[] = [
  {
    id: 'POL-2026-001', slug: 'mock-myshop-001',
    type: 'privacy', typeName: 'Privacy + Cookies Policy', typeIcon: '🔒',
    websiteName: 'MyShop Online', domain: 'myshop.co.th',
    language: 'both', status: 'pending_review',
    createdAt: '2026-05-21T09:15:00.000Z', updatedAt: '2026-05-21T09:15:00.000Z',
    htmlContent: '', ownerEmail: 'somchai@myshop.co.th', ownerName: 'สมชาย มั่นคง',
    approvalDeadline: '2026-05-23T09:15:00.000Z',
  },
  {
    id: 'POL-2026-002', slug: 'mock-clinic-002',
    type: 'privacy', typeName: 'Privacy + Cookies Policy', typeIcon: '🔒',
    websiteName: 'Clinic Care', domain: 'clinic-care.com',
    language: 'th', status: 'approved',
    createdAt: '2026-05-20T14:32:00.000Z', updatedAt: '2026-05-21T08:00:00.000Z',
    htmlContent: '', ownerEmail: 'wipa@clinic-care.com', ownerName: 'วิภา ดีเสมอ',
    reviewedAt: '2026-05-21T08:00:00.000Z',
  },
  {
    id: 'POL-2026-003', slug: 'mock-techstart-003',
    type: 'privacy', typeName: 'Privacy + Cookies Policy', typeIcon: '🔒',
    websiteName: 'TechStart.io', domain: 'techstart.io',
    language: 'both', status: 'pending_review',
    createdAt: '2026-05-19T11:20:00.000Z', updatedAt: '2026-05-20T10:15:00.000Z',
    htmlContent: '', ownerEmail: 'thanakorn@techstart.io', ownerName: 'ธนกร สุขใจ',
    approvalDeadline: '2026-06-10T11:20:00.000Z',
  },
  {
    id: 'POL-2026-004', slug: 'mock-edu-004',
    type: 'privacy', typeName: 'Privacy + Cookies Policy', typeIcon: '🔒',
    websiteName: 'EduSchool', domain: 'edu-school.ac.th',
    language: 'th', status: 'rejected',
    createdAt: '2026-05-18T09:00:00.000Z', updatedAt: '2026-05-19T14:00:00.000Z',
    htmlContent: '', ownerEmail: 'malee@edu-school.ac.th', ownerName: 'มาลี รัตนา',
    reviewedAt: '2026-05-19T14:00:00.000Z',
    reviewComment: 'ข้อมูลที่เลือกรวมถึงข้อมูลผู้เยาว์ซึ่งต้องการเงื่อนไขพิเศษตาม PDPA มาตรา 20',
  },
]

const langLabel: Record<string, string> = { th: 'ภาษาไทย', en: 'English', both: 'ไทย + อังกฤษ' }

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
    })
  } catch { return iso }
}

function formatDateShort(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
  } catch { return iso }
}

type DeadlineInfo = { label: string; subLabel: string; color: string; bg: string; borderColor: string; Icon: React.FC<{ className?: string; style?: React.CSSProperties }> }

function getDeadlineInfo(deadline: string | undefined, status: string): DeadlineInfo {
  if (status !== 'pending_review') {
    return { label: '—', subLabel: '', color: '#94a3b8', bg: 'transparent', borderColor: 'transparent', Icon: Clock }
  }
  if (!deadline) {
    return { label: 'ไม่กำหนด', subLabel: '', color: '#94a3b8', bg: '#f1f5f9', borderColor: '#e5e7eb', Icon: CalendarClock }
  }
  const diff = new Date(deadline).getTime() - Date.now()
  if (diff < 0) {
    const hrs = Math.abs(Math.round(diff / 3600000))
    return { label: 'เกินกำหนด', subLabel: `${hrs >= 24 ? Math.floor(hrs / 24) + ' วัน' : hrs + ' ชม.'}`, color: '#dc2626', bg: 'rgba(220,38,38,0.08)', borderColor: 'rgba(220,38,38,0.3)', Icon: AlertTriangle }
  }
  if (diff < 24 * 3600000) {
    const hrs = Math.round(diff / 3600000)
    return { label: 'ใกล้ครบกำหนด', subLabel: `อีก ${hrs} ชม.`, color: '#d97706', bg: 'rgba(217,119,6,0.08)', borderColor: 'rgba(217,119,6,0.3)', Icon: Clock }
  }
  const days = Math.floor(diff / 86400000)
  return { label: formatDateShort(deadline), subLabel: `อีก ${days} วัน`, color: '#059669', bg: 'rgba(5,150,105,0.06)', borderColor: 'rgba(5,150,105,0.2)', Icon: CalendarClock }
}

// ── Shared UI ─────────────────────────────────────────────────
function StatusBadge({ status }: { status: ReviewStatus }) {
  const cfg = statusConfig[status] ?? { label: status, color: '#64748b', bg: 'rgba(100,116,139,0.1)', Icon: Clock }
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <cfg.Icon className="w-3 h-3" />
      {cfg.label}
    </span>
  )
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-32 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-gray-800 leading-snug">{value || <span className="text-gray-300">ไม่ระบุ</span>}</span>
    </div>
  )
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
      <div className="px-5 py-3 border-b border-gray-100 bg-gray-50">
        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">{title}</h3>
      </div>
      <div className="px-5 py-1">{children}</div>
    </div>
  )
}

// ── Login ─────────────────────────────────────────────────────
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [err, setErr] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (email === LEGAL_EMAIL && pw === LEGAL_PASSWORD) {
      localStorage.setItem('flowpdpa_legal', '1')
      onLogin()
    } else {
      setErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: '#f0f4ff' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#1d4ed8' }}>
            <Scale className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl font-black text-gray-900 mb-1">Legal Review Portal</h1>
          <p className="text-sm text-gray-500">FlowPDPA — สำหรับทีมตรวจสอบเอกสารกฎหมาย</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-7" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.07)' }}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">อีเมล</label>
              <input
                type="email" required value={email}
                onChange={e => { setEmail(e.target.value); setErr('') }}
                placeholder="legal@flowpdpa.co.th"
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors"
                onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">รหัสผ่าน</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'} required value={pw}
                  onChange={e => { setPw(e.target.value); setErr('') }}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm text-gray-800 focus:outline-none transition-colors"
                  onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
                <button type="button" onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button type="submit"
              className="w-full py-3 text-sm font-bold text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#1d4ed8' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#1e40af')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}>
              เข้าสู่ระบบ Legal Portal
            </button>
          </form>
          <div className="mt-4 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <span className="font-semibold" style={{ color: '#2563eb' }}>Demo: </span>
            <span className="text-gray-500">legal@flowpdpa.co.th / legal2025</span>
          </div>
        </div>
        <p className="text-center text-xs text-gray-400 mt-6">ระบบนี้สำหรับทีมกฎหมายภายในเท่านั้น</p>
      </div>
    </div>
  )
}

// ── Queue ─────────────────────────────────────────────────────
function QueueScreen({
  submissions,
  onSelect,
  onLogout,
}: {
  submissions: SavedPolicy[]
  onSelect: (s: SavedPolicy) => void
  onLogout: () => void
}) {
  const [filter, setFilter] = useState<QueueFilter>('all')

  const counts = {
    all:            submissions.length,
    pending_review: submissions.filter(s => s.status === 'pending_review').length,
    approved:       submissions.filter(s => s.status === 'approved').length,
    rejected:       submissions.filter(s => s.status === 'rejected').length,
    edited:         submissions.filter(s => s.status === 'edited').length,
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  const stats = [
    { label: 'All',      value: counts.all,            color: '#64748b', bg: '#f1f5f9' },
    { label: 'Review',   value: counts.pending_review, color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'Reviewed', value: counts.approved,       color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'Rejected', value: counts.rejected,       color: '#dc2626', bg: 'rgba(220,38,38,0.08)' },
  ]

  const filters: { key: QueueFilter; label: string }[] = [
    { key: 'all',           label: `All (${counts.all})` },
    { key: 'pending_review', label: `Review (${counts.pending_review})` },
    { key: 'approved',      label: `Reviewed (${counts.approved})` },
    { key: 'edited',        label: `Edited (${counts.edited})` },
    { key: 'rejected',      label: `Rejected (${counts.rejected})` },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1d4ed8' }}>
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm">Legal Review Portal</span>
            {counts.pending_review > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#d97706' }}>
                {counts.pending_review} Review
              </span>
            )}
          </div>
          <button onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors">
            <LogOut className="w-3.5 h-3.5" /> ออกจากระบบ
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {stats.map(({ label, value, color, bg }) => (
            <div key={label} className="bg-white rounded-xl border border-gray-100 p-5">
              <div className="text-2xl font-black mb-0.5" style={{ color }}>{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
              <div className="h-1 rounded-full mt-3" style={{ backgroundColor: bg }}>
                <div className="h-full rounded-full" style={{ width: `${counts.all ? (value / counts.all) * 100 : 0}%`, backgroundColor: color }} />
              </div>
            </div>
          ))}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 overflow-x-auto pb-1">
          {filters.map(({ key, label }) => (
            <button key={key} onClick={() => setFilter(key)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === key ? '#1d4ed8' : 'white',
                color: filter === key ? 'white' : '#64748b',
                border: `1px solid ${filter === key ? '#1d4ed8' : '#e5e7eb'}`,
              }}>
              {label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-3">เว็บไซต์ / กิจการ</div>
            <div className="col-span-2">เจ้าของ</div>
            <div className="col-span-3">Deadline อนุมัติ</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2 text-right">ดู</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">ไม่มีเอกสารในหมวดนี้</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <div key={s.id}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => onSelect(s)}>
                  <div className="col-span-2 md:col-span-3">
                    <div className="text-sm font-semibold text-gray-900">{s.websiteName}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{s.typeIcon} {s.typeName}</div>
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm text-gray-600">
                    {s.ownerName || s.ownerEmail}
                  </div>
                  <div className="hidden md:block md:col-span-3">
                    {(() => {
                      const dl = getDeadlineInfo(s.approvalDeadline, s.status)
                      return s.status === 'pending_review' ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border"
                          style={{ color: dl.color, backgroundColor: dl.bg, borderColor: dl.borderColor }}>
                          <dl.Icon className="w-3 h-3" />
                          {dl.label}
                          {dl.subLabel && <span className="opacity-75 font-normal">· {dl.subLabel}</span>}
                        </span>
                      ) : <span className="text-xs text-gray-300">—</span>
                    })()}
                  </div>
                  <div className="col-span-1 md:col-span-2">
                    <StatusBadge status={s.status as ReviewStatus} />
                  </div>
                  <div className="hidden md:flex md:col-span-2 justify-end">
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
                      style={{ color: '#2563eb', borderColor: '#bfdbfe', backgroundColor: '#eff6ff' }}>
                      ตรวจสอบ <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// ── Detail ────────────────────────────────────────────────────
function DetailScreen({
  submission,
  onBack,
  onAction,
  onDeadlineUpdate,
  onGoogleDocUpdate,
}: {
  submission: SavedPolicy
  onBack: () => void
  onAction: (slug: string, status: PolicyStatus, comment: string) => void
  onDeadlineUpdate: (slug: string, deadline: string) => void
  onGoogleDocUpdate: (slug: string, docId: string, docUrl: string) => void
}) {
  const [action, setAction] = useState<ReviewAction>(null)
  const [comment, setComment] = useState(submission.reviewComment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState(false)
  const [deadlineValue, setDeadlineValue] = useState(
    submission.approvalDeadline ? new Date(submission.approvalDeadline).toISOString().slice(0, 16) : ''
  )

  // Google Docs linking state
  const [docInput, setDocInput] = useState('')
  const [linkingDoc, setLinkingDoc] = useState(false)
  const [docLinkError, setDocLinkError] = useState('')

  const handleLinkDoc = () => {
    const id = extractDocId(docInput)
    if (!id) { setDocLinkError('ลิงก์หรือ ID ไม่ถูกต้อง กรุณาวาง URL จาก Google Docs'); return }
    setLinkingDoc(true)
    setDocLinkError('')
    // [NEEDS BACKEND] Replace timeout with: GET /api/google/docs/:id to verify doc exists
    setTimeout(() => {
      onGoogleDocUpdate(submission.slug, id, getDocEditorUrl(id))
      setDocInput('')
      setLinkingDoc(false)
    }, 600)
  }

  const handleUnlinkDoc = () => {
    onGoogleDocUpdate(submission.slug, '', '')
  }

  const needsComment    = action === 'reject' || action === 'edit'
  const alreadyReviewed = submission.status !== 'pending_review'

  const handleConfirm = () => {
    if (!action) return
    if (needsComment && !comment.trim()) return
    setSaving(true)
    setTimeout(() => {
      const statusMap = { approve: 'approved', reject: 'rejected', edit: 'edited' } as const
      onAction(submission.slug, statusMap[action], comment.trim())
      setSaving(false)
      setSaved(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors">
            <ChevronLeft className="w-4 h-4" /> กลับ Queue
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{submission.id}</span>
            <StatusBadge status={submission.status as ReviewStatus} />
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900 mb-0.5">{submission.websiteName}</h1>
          <p className="text-sm text-gray-400">
            ส่งเมื่อ {formatDate(submission.createdAt)} · {submission.typeIcon} {submission.typeName}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left */}
          <div className="lg:col-span-2 space-y-0">
            <SectionCard title="ข้อมูลเจ้าของ">
              <InfoRow label="ชื่อ"    value={submission.ownerName || '—'} />
              <InfoRow label="อีเมล"   value={submission.ownerEmail} />
            </SectionCard>

            <SectionCard title="ข้อมูล Policy">
              <InfoRow label="เว็บไซต์"   value={submission.websiteName} />
              <InfoRow label="Domain"     value={submission.domain} />
              <InfoRow label="ประเภท"     value={`${submission.typeIcon} ${submission.typeName}`} />
              <InfoRow label="ภาษา"       value={langLabel[submission.language] || submission.language} />
            </SectionCard>

            {/* Policy content — Google Docs iframe if linked, HTML fallback if not */}
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden mb-4">
              <div className="px-5 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  {submission.googleDocId ? 'เนื้อหานโยบาย' : 'เนื้อหานโยบายที่ AI สร้าง'}
                </h3>
                {submission.googleDocId && (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: 'rgba(26,115,232,0.1)', color: '#1a73e8' }}>
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6z"/>
                        <path d="M14 2v6h6"/>
                      </svg>
                      Google Docs
                    </span>
                    <a
                      href={getDocEditorUrl(submission.googleDocId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-semibold transition-colors"
                      style={{ color: '#1a73e8' }}
                    >
                      <ExternalLink className="w-3 h-3" /> เปิด
                    </a>
                  </div>
                )}
              </div>

              {submission.googleDocId ? (
                <iframe
                  key={submission.googleDocId}
                  src={getDocPreviewUrl(submission.googleDocId)}
                  className="w-full border-0"
                  style={{ height: '520px' }}
                  title="Google Docs Preview"
                />
              ) : submission.htmlContent ? (
                <div
                  className="px-5 py-4 text-sm text-gray-700 leading-relaxed max-h-96 overflow-y-auto prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: submission.htmlContent }}
                />
              ) : (
                <div className="py-10 text-center text-sm text-gray-400">
                  <FileText className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                  <p>ยังไม่มีเนื้อหา</p>
                  <p className="text-xs mt-1 text-gray-300">เชื่อมต่อ Google Docs ในส่วนด้านล่างเพื่อแสดงเนื้อหา</p>
                </div>
              )}
            </div>

            {/* Google Docs */}
            <SectionCard title="Google Docs">
              {submission.googleDocId ? (
                <div className="py-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2" style={{ color: '#059669' }}>
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-sm font-semibold">เชื่อมต่อ Google Docs แล้ว</span>
                    </div>
                    <button
                      onClick={handleUnlinkDoc}
                      className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Link2Off className="w-3.5 h-3.5" /> ยกเลิก
                    </button>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-mono text-gray-500"
                    style={{ backgroundColor: '#f1f5f9' }}>
                    <FileText className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                    <span className="truncate">{getDocShortLabel(submission.googleDocId)}</span>
                  </div>
                  <a
                    href={getDocEditorUrl(submission.googleDocId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm font-bold px-4 py-2.5 rounded-lg transition-opacity hover:opacity-90"
                    style={{ backgroundColor: '#1a73e8', color: 'white' }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    เปิดใน Google Docs
                  </a>
                </div>
              ) : (
                <div className="py-3 space-y-2.5">
                  <p className="text-xs text-gray-400">
                    วางลิงก์ Google Docs เพื่อเชื่อมต่อกับนโยบายนี้
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={docInput}
                      onChange={e => { setDocInput(e.target.value); setDocLinkError('') }}
                      placeholder="https://docs.google.com/document/d/..."
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-800 focus:outline-none transition-colors"
                      onFocus={e => (e.currentTarget.style.borderColor = '#1a73e8')}
                      onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      onKeyDown={e => e.key === 'Enter' && handleLinkDoc()}
                    />
                    <button
                      onClick={handleLinkDoc}
                      disabled={!docInput.trim() || linkingDoc}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white rounded-lg disabled:opacity-40 transition-opacity hover:opacity-90"
                      style={{ backgroundColor: '#1a73e8' }}
                    >
                      <Link2 className="w-3.5 h-3.5" />
                      {linkingDoc ? 'กำลังเชื่อมต่อ...' : 'เชื่อมต่อ'}
                    </button>
                  </div>
                  {docLinkError && (
                    <p className="text-xs text-red-500">{docLinkError}</p>
                  )}
                  <p className="text-xs text-gray-300">
                    รองรับ URL เต็มจาก Google Docs หรือ Document ID
                  </p>
                </div>
              )}
            </SectionCard>

            {/* Review comment if exists */}
            {submission.reviewComment && (
              <SectionCard title="หมายเหตุจากทีมกฎหมาย">
                <div className="py-3 text-sm text-gray-700">{submission.reviewComment}</div>
              </SectionCard>
            )}
          </div>

          {/* Right: Action panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
              <h3 className="font-bold text-gray-900 text-sm mb-4">ผลการตรวจสอบ</h3>

              {alreadyReviewed && !saved && (
                <div
                  className="rounded-lg px-4 py-3 mb-4 text-sm"
                  style={{
                    backgroundColor: (statusConfig[submission.status as ReviewStatus] ?? statusConfig.pending_review).bg,
                    color: (statusConfig[submission.status as ReviewStatus] ?? statusConfig.pending_review).color,
                  }}
                >
                  <p className="font-semibold mb-1">{(statusConfig[submission.status as ReviewStatus] ?? statusConfig.pending_review).label}</p>
                  {submission.reviewedAt && (
                    <p className="text-xs opacity-75">ตรวจสอบเมื่อ {formatDate(submission.reviewedAt)}</p>
                  )}
                  {submission.reviewComment && (
                    <p className="text-xs mt-2 opacity-90">{submission.reviewComment}</p>
                  )}
                </div>
              )}

              {saved ? (
                <div className="rounded-lg px-4 py-4 text-center" style={{ backgroundColor: 'rgba(5,150,105,0.08)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#059669' }} />
                  <p className="text-sm font-bold text-gray-900 mb-0.5">บันทึกสำเร็จ</p>
                  <p className="text-xs text-gray-500">สถานะ Dashboard ลูกค้าอัปเดตแล้ว</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {([
                    { key: 'approve', label: '✅ Approve',       color: '#059669', bg: 'rgba(5,150,105,0.1)' },
                    { key: 'edit',    label: '✏️ Edit by Legal', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)' },
                    { key: 'reject',  label: '❌ Reject',        color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
                  ] as const).map(({ key, label, color, bg }) => (
                    <button key={key}
                      onClick={() => setAction(a => a === key ? null : key)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-left transition-all"
                      style={{
                        backgroundColor: action === key ? bg : '#f8fafc',
                        color: action === key ? color : '#64748b',
                        border: `1.5px solid ${action === key ? color : '#e5e7eb'}`,
                      }}>
                      {label}
                    </button>
                  ))}

                  {action === 'edit' && (
                    <div className="rounded-lg p-3.5 space-y-2.5"
                      style={{ backgroundColor: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.15)' }}>
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7c3aed' }}>
                        ขั้นตอนที่ 1 — แก้ไขเอกสาร
                      </p>
                      {submission.googleDocId ? (
                        <a
                          href={getDocEditorUrl(submission.googleDocId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-bold rounded-lg transition-opacity hover:opacity-90"
                          style={{ backgroundColor: '#1a73e8', color: 'white' }}
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          เปิดแก้ไขใน Google Docs
                        </a>
                      ) : (
                        <div className="rounded-lg px-3 py-2.5 text-xs text-center"
                          style={{ backgroundColor: 'rgba(217,119,6,0.08)', color: '#d97706', border: '1px solid rgba(217,119,6,0.2)' }}>
                          ยังไม่ได้เชื่อมต่อ Google Docs<br />
                          <span className="opacity-75">เชื่อมต่อในส่วน "Google Docs" ด้านล่างก่อน</span>
                        </div>
                      )}
                    </div>
                  )}

                  {(action === 'reject' || action === 'edit') && (
                    <div className="pt-1">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        {action === 'edit' ? 'ขั้นตอนที่ 2 — ' : ''}หมายเหตุถึงลูกค้า
                        {needsComment && <span className="text-red-400 normal-case font-normal"> *จำเป็น</span>}
                      </label>
                      <textarea rows={4} value={comment} onChange={e => setComment(e.target.value)}
                        placeholder={action === 'edit' ? 'สรุปสิ่งที่แก้ไขใน Google Docs...' : 'อธิบายเหตุผลหรือสิ่งที่ต้องแก้ไข...'}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none resize-none transition-colors"
                        onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      />
                    </div>
                  )}

                  {action && (
                    <button onClick={handleConfirm}
                      disabled={saving || (needsComment && !comment.trim())}
                      className="w-full py-3 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                      style={{ backgroundColor: '#1d4ed8' }}>
                      {saving ? 'กำลังบันทึก...' : 'ยืนยันผลการตรวจสอบ'}
                    </button>
                  )}
                </div>
              )}

              {/* Deadline section */}
              {submission.status === 'pending_review' && (
                <div className="mt-5 pt-4 border-t border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1">
                      <CalendarClock className="w-3.5 h-3.5" /> Deadline อนุมัติ
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingDeadline(v => !v)}
                      className="text-xs font-semibold transition-colors"
                      style={{ color: '#2563eb' }}
                    >
                      {editingDeadline ? 'ยกเลิก' : 'แก้ไข'}
                    </button>
                  </div>

                  {!editingDeadline ? (
                    (() => {
                      const dl = getDeadlineInfo(submission.approvalDeadline, submission.status)
                      return (
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border"
                          style={{ backgroundColor: dl.bg, borderColor: dl.borderColor }}>
                          <dl.Icon className="w-4 h-4 shrink-0" style={{ color: dl.color }} />
                          <div>
                            <p className="text-sm font-bold" style={{ color: dl.color }}>{dl.label}</p>
                            {dl.subLabel && <p className="text-xs" style={{ color: dl.color, opacity: 0.75 }}>{dl.subLabel}</p>}
                          </div>
                        </div>
                      )
                    })()
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="datetime-local"
                        value={deadlineValue}
                        onChange={e => setDeadlineValue(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-800 focus:outline-none transition-colors"
                        onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      />
                      <button
                        type="button"
                        disabled={!deadlineValue}
                        onClick={() => {
                          if (!deadlineValue) return
                          onDeadlineUpdate(submission.slug, new Date(deadlineValue).toISOString())
                          setEditingDeadline(false)
                        }}
                        className="w-full py-2 text-xs font-bold text-white rounded-lg transition-colors disabled:opacity-40"
                        style={{ backgroundColor: '#2563eb' }}
                      >
                        บันทึก Deadline
                      </button>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <p>ประเภท: {submission.typeName}</p>
                <p>ภาษา: {langLabel[submission.language] || submission.language}</p>
                <p>สร้างเมื่อ: {formatDate(submission.createdAt)}</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function Legal() {
  const [loggedIn,    setLoggedIn]    = useState(() => localStorage.getItem('flowpdpa_legal') === '1')
  const [submissions, setSubmissions] = useState<SavedPolicy[]>([])
  const [selected,    setSelected]    = useState<SavedPolicy | null>(null)

  useEffect(() => {
    if (!loggedIn) return
    const real = policyStorage.getAllSubmissions()
    setSubmissions(real.length > 0 ? real : MOCK_SUBMISSIONS)
  }, [loggedIn])

  const handleLogout = () => {
    localStorage.removeItem('flowpdpa_legal')
    setLoggedIn(false)
    setSelected(null)
  }

  const handleDeadlineUpdate = (slug: string, deadline: string) => {
    policyStorage.updateBySlug(slug, { approvalDeadline: deadline })
    setSubmissions(prev => prev.map(s => s.slug === slug ? { ...s, approvalDeadline: deadline } : s))
    setSelected(prev => prev?.slug === slug ? { ...prev, approvalDeadline: deadline } : prev)
  }

  const handleGoogleDocUpdate = (slug: string, docId: string, docUrl: string) => {
    policyStorage.updateBySlug(slug, { googleDocId: docId || undefined, googleDocUrl: docUrl || undefined })
    setSubmissions(prev => prev.map(s => s.slug === slug ? { ...s, googleDocId: docId || undefined, googleDocUrl: docUrl || undefined } : s))
    setSelected(prev => prev?.slug === slug ? { ...prev, googleDocId: docId || undefined, googleDocUrl: docUrl || undefined } : prev)
  }

  const handleAction = (slug: string, status: PolicyStatus, comment: string) => {
    const now = new Date().toISOString()

    // [NEEDS BACKEND] When status === 'edited', the Google Doc already has the updated content
    // (legal team edited it directly). Optionally fetch the latest content from Google Docs
    // and sync it back here: GET /api/google/docs/:googleDocId → update htmlContent

    policyStorage.updateBySlug(slug, {
      status,
      reviewComment: comment || undefined,
      reviewedAt: now,
    })

    setSubmissions(prev =>
      prev.map(s =>
        s.slug === slug
          ? { ...s, status, reviewComment: comment || undefined, reviewedAt: now }
          : s
      )
    )

    if (selected?.slug === slug) {
      setSelected(prev => prev
        ? { ...prev, status, reviewComment: comment || undefined, reviewedAt: now }
        : prev
      )
    }
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  if (selected) {
    return (
      <DetailScreen
        submission={selected}
        onBack={() => setSelected(null)}
        onAction={handleAction}
        onDeadlineUpdate={handleDeadlineUpdate}
        onGoogleDocUpdate={handleGoogleDocUpdate}
      />
    )
  }

  return (
    <QueueScreen
      submissions={submissions}
      onSelect={setSelected}
      onLogout={handleLogout}
    />
  )
}
