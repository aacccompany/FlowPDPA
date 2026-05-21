import { useState } from 'react'
import {
  CheckCircle, Clock, XCircle, AlertCircle, ChevronLeft,
  LogOut, FileText, Scale, Eye, EyeOff,
} from 'lucide-react'

// ── Credentials ───────────────────────────────────────────────
const LEGAL_EMAIL = 'legal@flowpdpa.co.th'
const LEGAL_PASSWORD = 'legal2025'

// ── Types ─────────────────────────────────────────────────────
type SubmissionStatus = 'pending' | 'approved' | 'rejected' | 'correction_needed'
type QueueFilter = 'all' | 'pending' | 'approved' | 'rejected' | 'correction_needed'
type ReviewAction = 'approve' | 'reject' | 'correction' | null

interface Submission {
  id: string
  customerName: string
  customerEmail: string
  businessName: string
  businessType: string
  websiteUrl: string
  policyType: string
  language: string
  submittedAt: string
  reviewedAt?: string
  status: SubmissionStatus
  comment?: string
  dataTypes: string[]
  purposes: string[]
  thirdParties: string[]
  hasCookies: string
  hasUserAccounts: string
  retentionPeriod: string
  dpoEmail: string
}

// ── Mock data ─────────────────────────────────────────────────
const initSubmissions: Submission[] = [
  {
    id: 'POL-2026-001',
    customerName: 'สมชาย มั่นคง',
    customerEmail: 'somchai@myshop.co.th',
    businessName: 'MyShop Online',
    businessType: 'ร้านค้าออนไลน์ (E-Commerce)',
    websiteUrl: 'https://www.myshop.co.th',
    policyType: 'Privacy + Cookies Policy',
    language: 'ไทย + อังกฤษ',
    submittedAt: '21 พ.ค. 2569, 09:15',
    status: 'pending',
    dataTypes: ['ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'ที่อยู่', 'ข้อมูลการชำระเงิน'],
    purposes: ['ให้บริการหลักแก่ผู้ใช้งาน', 'ดำเนินการคำสั่งซื้อและจัดส่งสินค้า', 'ดำเนินการชำระเงิน'],
    thirdParties: ['Google Analytics', 'Facebook Pixel / Meta Ads', 'Omise / GB Prime Pay'],
    hasCookies: 'ใช่',
    hasUserAccounts: 'ใช่',
    retentionPeriod: '3 ปี',
    dpoEmail: 'dpo@myshop.co.th',
  },
  {
    id: 'POL-2026-002',
    customerName: 'วิภา ดีเสมอ',
    customerEmail: 'wipa@clinic-care.com',
    businessName: 'Clinic Care',
    businessType: 'คลินิก / โรงพยาบาล',
    websiteUrl: 'https://www.clinic-care.com',
    policyType: 'Privacy + Cookies Policy',
    language: 'ภาษาไทย',
    submittedAt: '20 พ.ค. 2569, 14:32',
    reviewedAt: '21 พ.ค. 2569, 08:00',
    status: 'approved',
    dataTypes: ['ชื่อ-นามสกุล', 'อีเมล', 'เบอร์โทรศัพท์', 'ข้อมูลสุขภาพ (ข้อมูลอ่อนไหว)'],
    purposes: ['ให้บริการหลักแก่ผู้ใช้งาน', 'ติดต่อกลับและตอบคำถามลูกค้า', 'ปฏิบัติตามข้อกำหนดทางกฎหมาย'],
    thirdParties: ['Google Analytics'],
    hasCookies: 'ใช่',
    hasUserAccounts: 'ไม่ใช่',
    retentionPeriod: '7 ปี (ตามกฎหมายภาษี)',
    dpoEmail: '',
  },
  {
    id: 'POL-2026-003',
    customerName: 'ธนกร สุขใจ',
    customerEmail: 'thanakorn@techstart.io',
    businessName: 'TechStart.io',
    businessType: 'สตาร์ทอัป (Startup)',
    websiteUrl: 'https://www.techstart.io',
    policyType: 'Privacy + Cookies Policy',
    language: 'ไทย + อังกฤษ',
    submittedAt: '19 พ.ค. 2569, 11:20',
    reviewedAt: '20 พ.ค. 2569, 10:15',
    status: 'correction_needed',
    comment: 'กรุณาระบุที่อยู่บริษัทให้ครบถ้วน และยืนยันว่าบริษัทจดทะเบียนในประเทศไทยเพื่อระบุในนโยบาย',
    dataTypes: ['ชื่อ-นามสกุล', 'อีเมล', 'IP Address / Device Info', 'พฤติกรรมการใช้งานเว็บไซต์'],
    purposes: ['ให้บริการหลักแก่ผู้ใช้งาน', 'วิเคราะห์และปรับปรุงคุณภาพบริการ', 'ส่งข้อเสนอและข่าวสารการตลาด'],
    thirdParties: ['Google Analytics', 'Google Tag Manager', 'Mailchimp / Klaviyo'],
    hasCookies: 'ใช่',
    hasUserAccounts: 'ใช่',
    retentionPeriod: '2 ปี',
    dpoEmail: '',
  },
  {
    id: 'POL-2026-004',
    customerName: 'มาลี รัตนา',
    customerEmail: 'malee@edu-school.ac.th',
    businessName: 'EduSchool',
    businessType: 'สถาบันการศึกษา',
    websiteUrl: 'https://www.edu-school.ac.th',
    policyType: 'Privacy + Cookies Policy',
    language: 'ภาษาไทย',
    submittedAt: '18 พ.ค. 2569, 09:00',
    reviewedAt: '19 พ.ค. 2569, 14:00',
    status: 'rejected',
    comment: 'ข้อมูลที่เลือกรวมถึงข้อมูลผู้เยาว์ซึ่งต้องการเงื่อนไขพิเศษตาม PDPA มาตรา 20 กรุณาติดต่อทีมงานเพื่อดำเนินการเฉพาะกรณี',
    dataTypes: ['ชื่อ-นามสกุล', 'อีเมล', 'วันเดือนปีเกิด / อายุ'],
    purposes: ['ให้บริการหลักแก่ผู้ใช้งาน', 'ปฏิบัติตามข้อกำหนดทางกฎหมาย'],
    thirdParties: ['ไม่มีบุคคลที่สาม'],
    hasCookies: 'ไม่ใช่',
    hasUserAccounts: 'ใช่',
    retentionPeriod: '5 ปี',
    dpoEmail: 'dpo@edu-school.ac.th',
  },
]

// ── Helpers ───────────────────────────────────────────────────
const statusConfig: Record<SubmissionStatus, { label: string; color: string; bg: string; Icon: React.FC<{ className?: string }> }> = {
  pending:          { label: 'รอตรวจสอบ',    color: '#d97706', bg: 'rgba(217,119,6,0.1)',   Icon: Clock },
  approved:         { label: 'อนุมัติแล้ว',   color: '#059669', bg: 'rgba(5,150,105,0.1)',   Icon: CheckCircle },
  correction_needed:{ label: 'ต้องแก้ไข',     color: '#2563eb', bg: 'rgba(37,99,235,0.1)',   Icon: AlertCircle },
  rejected:         { label: 'ปฏิเสธ',        color: '#dc2626', bg: 'rgba(220,38,38,0.1)',   Icon: XCircle },
}

function StatusBadge({ status }: { status: SubmissionStatus }) {
  const cfg = statusConfig[status]
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

// ── Login screen ──────────────────────────────────────────────
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
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: '#1d4ed8' }}
          >
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
                type="email"
                required
                value={email}
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
                  type={showPw ? 'text' : 'password'}
                  required
                  value={pw}
                  onChange={e => { setPw(e.target.value); setErr('') }}
                  placeholder="••••••••"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 pr-11 text-sm text-gray-800 focus:outline-none transition-colors"
                  onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                  onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {err && <p className="text-xs text-red-500">{err}</p>}
            <button
              type="submit"
              className="w-full py-3 text-sm font-bold text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#1d4ed8' }}
              onMouseOver={e => (e.currentTarget.style.backgroundColor = '#1e40af')}
              onMouseOut={e => (e.currentTarget.style.backgroundColor = '#1d4ed8')}
            >
              เข้าสู่ระบบ Legal Portal
            </button>
          </form>

          <div className="mt-4 rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.12)' }}>
            <span className="font-semibold" style={{ color: '#2563eb' }}>Demo: </span>
            <span className="text-gray-500">legal@flowpdpa.co.th / legal2025</span>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          ระบบนี้สำหรับทีมกฎหมายภายในเท่านั้น
        </p>
      </div>
    </div>
  )
}

// ── Queue screen ──────────────────────────────────────────────
function QueueScreen({
  submissions,
  onSelect,
  onLogout,
}: {
  submissions: Submission[]
  onSelect: (s: Submission) => void
  onLogout: () => void
}) {
  const [filter, setFilter] = useState<QueueFilter>('all')

  const counts = {
    all: submissions.length,
    pending: submissions.filter(s => s.status === 'pending').length,
    approved: submissions.filter(s => s.status === 'approved').length,
    correction_needed: submissions.filter(s => s.status === 'correction_needed').length,
    rejected: submissions.filter(s => s.status === 'rejected').length,
  }

  const filtered = filter === 'all' ? submissions : submissions.filter(s => s.status === filter)

  const stats = [
    { label: 'ทั้งหมด',      value: counts.all,               color: '#64748b', bg: '#f1f5f9' },
    { label: 'รอตรวจสอบ',    value: counts.pending,           color: '#d97706', bg: 'rgba(217,119,6,0.08)' },
    { label: 'อนุมัติแล้ว',   value: counts.approved,          color: '#059669', bg: 'rgba(5,150,105,0.08)' },
    { label: 'ต้องแก้ไข',     value: counts.correction_needed, color: '#2563eb', bg: 'rgba(37,99,235,0.08)' },
  ]

  const filters: { key: QueueFilter; label: string }[] = [
    { key: 'all',               label: `ทั้งหมด (${counts.all})` },
    { key: 'pending',           label: `รอตรวจสอบ (${counts.pending})` },
    { key: 'approved',          label: `อนุมัติแล้ว (${counts.approved})` },
    { key: 'correction_needed', label: `ต้องแก้ไข (${counts.correction_needed})` },
    { key: 'rejected',          label: `ปฏิเสธ (${counts.rejected})` },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#1d4ed8' }}>
              <Scale className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-gray-900 text-sm">Legal Review Portal</span>
            {counts.pending > 0 && (
              <span className="text-xs font-bold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: '#d97706' }}>
                {counts.pending} รอดำเนินการ
              </span>
            )}
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
          >
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
            <button
              key={key}
              onClick={() => setFilter(key)}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-all"
              style={{
                backgroundColor: filter === key ? '#1d4ed8' : 'white',
                color: filter === key ? 'white' : '#64748b',
                border: `1px solid ${filter === key ? '#1d4ed8' : '#e5e7eb'}`,
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Submissions list */}
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-bold uppercase tracking-wider text-gray-400">
            <div className="col-span-1">ID</div>
            <div className="col-span-3">บริษัท / ร้านค้า</div>
            <div className="col-span-2">ลูกค้า</div>
            <div className="col-span-2">ประเภทธุรกิจ</div>
            <div className="col-span-2">ส่งเมื่อ</div>
            <div className="col-span-1">สถานะ</div>
            <div className="col-span-1 text-right">ดู</div>
          </div>

          {filtered.length === 0 ? (
            <div className="py-16 text-center">
              <FileText className="w-10 h-10 text-gray-200 mx-auto mb-3" />
              <p className="text-sm text-gray-400">ไม่มีเอกสารในหมวดนี้</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((s) => (
                <div
                  key={s.id}
                  className="grid grid-cols-2 md:grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-blue-50 transition-colors cursor-pointer"
                  onClick={() => onSelect(s)}
                >
                  <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400">{s.id}</div>
                  <div className="col-span-2 md:col-span-3">
                    <div className="text-sm font-semibold text-gray-900">{s.businessName}</div>
                    <div className="text-xs text-gray-400 md:hidden">{s.submittedAt}</div>
                  </div>
                  <div className="hidden md:block md:col-span-2 text-sm text-gray-600">{s.customerName}</div>
                  <div className="hidden md:block md:col-span-2 text-xs text-gray-500">{s.businessType}</div>
                  <div className="hidden md:block md:col-span-2 text-xs text-gray-400">{s.submittedAt}</div>
                  <div className="col-span-1 md:col-span-1">
                    <StatusBadge status={s.status} />
                  </div>
                  <div className="hidden md:flex md:col-span-1 justify-end">
                    <span className="text-xs font-semibold" style={{ color: '#2563eb' }}>ตรวจสอบ →</span>
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

// ── Detail screen ─────────────────────────────────────────────
function DetailScreen({
  submission,
  onBack,
  onAction,
}: {
  submission: Submission
  onBack: () => void
  onAction: (id: string, action: 'approved' | 'rejected' | 'correction_needed', comment: string) => void
}) {
  const [action, setAction] = useState<ReviewAction>(null)
  const [comment, setComment] = useState(submission.comment ?? '')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const needsComment = action === 'reject' || action === 'correction'
  const alreadyReviewed = submission.status !== 'pending'

  const handleConfirm = () => {
    if (!action) return
    if (needsComment && !comment.trim()) return
    setSaving(true)
    setTimeout(() => {
      const statusMap = { approve: 'approved', reject: 'rejected', correction: 'correction_needed' } as const
      onAction(submission.id, statusMap[action], comment.trim())
      setSaving(false)
      setSaved(true)
    }, 1000)
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f0f4ff' }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <button
            onClick={onBack}
            className="flex items-center gap-1.5 text-sm font-semibold text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> กลับ Queue
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-gray-400">{submission.id}</span>
            <StatusBadge status={submission.status} />
          </div>
          <div className="w-24" />
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {/* Title row */}
        <div className="mb-6">
          <h1 className="text-xl font-black text-gray-900 mb-0.5">{submission.businessName}</h1>
          <p className="text-sm text-gray-400">ส่งเมื่อ {submission.submittedAt} · {submission.policyType}</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Info panels */}
          <div className="lg:col-span-2 space-y-0">
            <SectionCard title="ข้อมูลลูกค้า">
              <InfoRow label="ชื่อ" value={submission.customerName} />
              <InfoRow label="อีเมล" value={submission.customerEmail} />
            </SectionCard>

            <SectionCard title="ข้อมูลธุรกิจ">
              <InfoRow label="ชื่อกิจการ" value={submission.businessName} />
              <InfoRow label="URL" value={submission.websiteUrl} />
              <InfoRow label="ประเภท" value={submission.businessType} />
              <InfoRow label="ภาษา Policy" value={submission.language} />
              <InfoRow label="อีเมล DPO" value={submission.dpoEmail || '(ใช้อีเมลติดต่อ)'} />
              <InfoRow label="ระยะเวลาเก็บ" value={submission.retentionPeriod} />
            </SectionCard>

            <SectionCard title="ข้อมูลที่เก็บรวบรวม">
              <div className="py-3 flex flex-wrap gap-2">
                {submission.dataTypes.map(d => (
                  <span
                    key={d}
                    className="text-xs px-2.5 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: d.includes('อ่อนไหว') ? 'rgba(220,38,38,0.08)' : '#f1f5f9',
                      color: d.includes('อ่อนไหว') ? '#dc2626' : '#475569',
                    }}
                  >
                    {d}
                  </span>
                ))}
              </div>
              <InfoRow label="คุกกี้" value={submission.hasCookies} />
              <InfoRow label="ระบบ Login" value={submission.hasUserAccounts} />
            </SectionCard>

            <SectionCard title="วัตถุประสงค์">
              <div className="py-3 space-y-1.5">
                {submission.purposes.map(p => (
                  <div key={p} className="flex items-center gap-2 text-sm text-gray-700">
                    <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#059669' }} /> {p}
                  </div>
                ))}
              </div>
            </SectionCard>

            <SectionCard title="บุคคลที่สาม">
              <div className="py-3 flex flex-wrap gap-2">
                {submission.thirdParties.map(t => (
                  <span key={t} className="text-xs px-2.5 py-1 rounded-full font-medium bg-gray-100 text-gray-600">{t}</span>
                ))}
              </div>
            </SectionCard>

            {/* Mock generated policy preview */}
            <SectionCard title="ตัวอย่างนโยบายที่ AI สร้าง">
              <div className="py-4 space-y-3 text-sm text-gray-700 leading-relaxed">
                <p className="font-bold text-gray-900">นโยบายความเป็นส่วนตัว (Privacy Policy)<br />{submission.businessName}</p>
                <p className="text-xs text-gray-400">อัปเดตล่าสุด: {submission.submittedAt}</p>
                <p>
                  {submission.businessName} (&quot;เรา&quot;) ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคลของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) นโยบายนี้อธิบายวิธีที่เราเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคลผ่านเว็บไซต์ {submission.websiteUrl}
                </p>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">1. ข้อมูลที่เราเก็บรวบรวม</p>
                  <p>เราเก็บรวบรวมข้อมูลส่วนบุคคลต่อไปนี้: {submission.dataTypes.join(', ')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">2. วัตถุประสงค์ในการใช้ข้อมูล</p>
                  <p>เราใช้ข้อมูลของท่านเพื่อ: {submission.purposes.join('; ')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">3. การเปิดเผยข้อมูลแก่บุคคลที่สาม</p>
                  <p>เราอาจแบ่งปันข้อมูลของท่านกับ: {submission.thirdParties.join(', ')}</p>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 mb-1">4. ระยะเวลาการเก็บรักษาข้อมูล</p>
                  <p>เราจะเก็บรักษาข้อมูลส่วนบุคคลของท่านเป็นระยะเวลา {submission.retentionPeriod} นับจากวันที่ท่านสิ้นสุดการใช้บริการ</p>
                </div>
                <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
                  * นโยบายฉบับนี้สร้างโดย AI ของ FlowPDPA และอยู่ระหว่างการตรวจสอบโดยทีมกฎหมาย
                </p>
              </div>
            </SectionCard>
          </div>

          {/* Right: Action panel */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl border border-gray-100 p-5 sticky top-20">
              <h3 className="font-bold text-gray-900 text-sm mb-4">ผลการตรวจสอบ</h3>

              {alreadyReviewed && !saved ? (
                <div
                  className="rounded-lg px-4 py-3 mb-4 text-sm"
                  style={{ backgroundColor: statusConfig[submission.status].bg, color: statusConfig[submission.status].color }}
                >
                  <p className="font-semibold mb-1">{statusConfig[submission.status].label}</p>
                  {submission.reviewedAt && <p className="text-xs opacity-75">ตรวจสอบเมื่อ {submission.reviewedAt}</p>}
                  {submission.comment && <p className="text-xs mt-2 opacity-90">{submission.comment}</p>}
                </div>
              ) : null}

              {saved ? (
                <div className="rounded-lg px-4 py-4 text-center" style={{ backgroundColor: 'rgba(5,150,105,0.08)' }}>
                  <CheckCircle className="w-8 h-8 mx-auto mb-2" style={{ color: '#059669' }} />
                  <p className="text-sm font-bold text-gray-900 mb-0.5">บันทึกสำเร็จ</p>
                  <p className="text-xs text-gray-500">ระบบแจ้งลูกค้าทางอีเมลแล้ว</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {/* Action buttons */}
                  {([
                    { key: 'approve',    label: '✅ อนุมัติ',          color: '#059669', bg: 'rgba(5,150,105,0.1)' },
                    { key: 'correction', label: '✏️ ขอแก้ไขเพิ่มเติม', color: '#2563eb', bg: 'rgba(37,99,235,0.1)' },
                    { key: 'reject',     label: '❌ ปฏิเสธ',           color: '#dc2626', bg: 'rgba(220,38,38,0.1)' },
                  ] as const).map(({ key, label, color, bg }) => (
                    <button
                      key={key}
                      onClick={() => setAction(a => a === key ? null : key)}
                      className="w-full py-2.5 px-4 rounded-lg text-sm font-semibold text-left transition-all"
                      style={{
                        backgroundColor: action === key ? bg : '#f8fafc',
                        color: action === key ? color : '#64748b',
                        border: `1.5px solid ${action === key ? color : '#e5e7eb'}`,
                      }}
                    >
                      {label}
                    </button>
                  ))}

                  {/* Comment box */}
                  {(action === 'reject' || action === 'correction') && (
                    <div className="pt-2">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                        หมายเหตุถึงลูกค้า {needsComment && <span className="text-red-400 normal-case font-normal">*จำเป็น</span>}
                      </label>
                      <textarea
                        rows={4}
                        value={comment}
                        onChange={e => setComment(e.target.value)}
                        placeholder="อธิบายเหตุผลหรือสิ่งที่ต้องแก้ไข..."
                        className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm text-gray-800 focus:outline-none resize-none transition-colors"
                        onFocus={e => (e.currentTarget.style.borderColor = '#2563eb')}
                        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
                      />
                    </div>
                  )}

                  {action && (
                    <button
                      onClick={handleConfirm}
                      disabled={saving || (needsComment && !comment.trim())}
                      className="w-full py-3 text-sm font-bold text-white rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed mt-1"
                      style={{ backgroundColor: '#1d4ed8' }}
                    >
                      {saving ? 'กำลังบันทึก...' : 'ยืนยันผลการตรวจสอบ'}
                    </button>
                  )}
                </div>
              )}

              <div className="mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400 space-y-1">
                <p>ประเภท: {submission.policyType}</p>
                <p>ภาษา: {submission.language}</p>
                <p>ระยะเก็บ: {submission.retentionPeriod}</p>
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
  const [loggedIn, setLoggedIn] = useState(() => localStorage.getItem('flowpdpa_legal') === '1')
  const [submissions, setSubmissions] = useState<Submission[]>(initSubmissions)
  const [selected, setSelected] = useState<Submission | null>(null)

  const handleLogout = () => {
    localStorage.removeItem('flowpdpa_legal')
    setLoggedIn(false)
    setSelected(null)
  }

  const handleAction = (id: string, status: 'approved' | 'rejected' | 'correction_needed', comment: string) => {
    setSubmissions(prev =>
      prev.map(s =>
        s.id === id
          ? { ...s, status, comment: comment || undefined, reviewedAt: '21 พ.ค. 2569 (ตอนนี้)' }
          : s
      )
    )
    const updated = submissions.find(s => s.id === id)
    if (updated) setSelected({ ...updated, status, comment: comment || undefined })
  }

  if (!loggedIn) return <LoginScreen onLogin={() => setLoggedIn(true)} />

  if (selected) {
    return (
      <DetailScreen
        submission={selected}
        onBack={() => setSelected(null)}
        onAction={handleAction}
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
