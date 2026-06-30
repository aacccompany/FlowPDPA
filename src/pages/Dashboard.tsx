import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Plus, Settings, LogOut, Bell,
  ChevronRight, Download, Copy,
  Trash2, CheckCircle, Clock, Globe, Lock, X, ShieldCheck,
  ExternalLink, Loader, MailCheck,
  FileType2, Code2, Search, ChevronLeft, FileEdit,
} from 'lucide-react'
import { fetchContact, updateContact, defaultProfile, type ContactProfile } from '@/api/contact'
import type { SavedPolicy } from '@/utils/policyStorage'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/services/api'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import './Dashboard.css'

// ── Auth helper ───────────────────────────────────────────────
type AuthUser = { name: string; email: string; plan: string; company?: string; phone?: string; emailVerified: boolean }

// ── Policy helpers ───────────────────────────────────────────

const langDisplay: Record<string, string> = {
  th:   'TH',
  en:   'EN',
  both: 'TH + EN',
}

function useMerchantPolicies() {
  const [policies, setPolicies] = useState<SavedPolicy[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    void api.policies.list().then(response => {
      setPolicies(response.success && response.data ? response.data : [])
      setLoading(false)
    })
  }, [])

  return { policies, setPolicies, loading }
}


// ── Sidebar nav items ─────────────────────────────────────────
const navItems = [
  { key: 'overview',  label: 'ภาพรวม',           Icon: LayoutDashboard },
  { key: 'policies',  label: 'นโยบายของฉัน',      Icon: FileText },
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
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded"
      style={{ backgroundColor: cfg.bg, color: cfg.color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  )
}

// ── Sub-views ─────────────────────────────────────────────────
function Overview({ setView, user }: { setView: (v: string) => void; user: AuthUser }) {
  const { policies: userPolicies } = useMerchantPolicies()
  const activePolicies = userPolicies.filter(p => p.status === 'approved').length

  const stats = [
    { label: 'นโยบายทั้งหมด',  value: String(userPolicies.length || 0), Icon: FileText,    color: 'var(--blue)' },
    { label: 'อนุมัติแล้ว',      value: String(activePolicies || 0),       Icon: CheckCircle, color: 'var(--green)' },
    { label: 'PDPA Status',     value: 'Compliant',                        Icon: ShieldCheck, color: 'var(--green)' },
  ]

  return (
    <div>
      {/* Welcome */}
      <div className="mb-7 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
        <div>
        <p className="text-[11px] font-medium uppercase mb-2" style={{ color: '#087a5b', fontFamily: 'IBM Plex Mono, monospace' }}>Merchant workspace</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: 'Noto Serif Thai, serif' }}>
          ภาพรวมของ {user.name}
        </h1>
        <p className="text-sm text-gray-500">ติดตามเอกสาร การตรวจสอบ และคำขอจากที่เดียว</p>
        </div>
        <Link to="/create/policy" className="btn-green text-sm px-5 py-2.5 flex items-center gap-2 self-start sm:self-auto">
          <Plus className="w-4 h-4" /> สร้างนโยบาย
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 bg-white border border-gray-100 mb-8" style={{ borderRadius: '6px' }}>
        {stats.map(({ label, value, Icon, color }) => (
          <div key={label} className="merchant-stat p-5 flex items-start gap-4">
            <Icon className="w-4 h-4 mt-1 shrink-0" style={{ color }} />
            <div>
              <div className="text-xl font-semibold text-gray-900 mb-0.5" style={{ fontFamily: 'IBM Plex Mono, monospace' }}>{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
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
                  <FileText className="w-4 h-4" style={{ color: '#087a5b' }} />
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

      {/* Quick actions */}
      <div
        className="rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
        style={{ background: '#edf5f2', border: '1px solid #c8ded6' }}
      >
        <div>
          <p className="font-semibold text-sm mb-1" style={{ color: '#074f3e' }}>สร้างเอกสารฉบับถัดไป</p>
          <p className="text-xs" style={{ color: '#477064' }}>ข้อมูลจะถูกส่งให้ฝ่ายกฎหมายตรวจสอบก่อนเผยแพร่</p>
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

const downloadFormats = [
  { key: 'pdf', label: 'PDF', description: 'Portable document', Icon: FileText },
  { key: 'docx', label: 'Word (.docx)', description: 'Editable Word file', Icon: FileType2 },
  { key: 'txt', label: 'TXT', description: 'Plain text file', Icon: FileText },
  { key: 'html', label: 'HTML', description: 'Web page file', Icon: Code2 },
] as const

function PolicyDownloadsDialog({ policy, close }: { policy: SavedPolicy; close: () => void }) {
  const languages = [
    { key: 'th', label: 'Thai', downloads: policy.downloadsByLanguage?.th },
    { key: 'en', label: 'English', downloads: policy.downloadsByLanguage?.en },
  ] as const
  const availableLanguages = languages.filter(language =>
    language.downloads && downloadFormats.some(format => Boolean(language.downloads?.[format.key])),
  )

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 p-4" onMouseDown={close}>
      <div className="w-full max-w-2xl rounded-lg border border-gray-200 bg-white shadow-xl" onMouseDown={event => event.stopPropagation()}>
        <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Download policy files</h2>
            <p className="mt-1 text-xs text-gray-500">{policy.typeName} · {policy.websiteName}</p>
          </div>
          <button className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 hover:bg-gray-50" onClick={close} aria-label="Close downloads">
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="p-5">
          {availableLanguages.length === 0 ? (
            <div className="border border-dashed border-gray-300 px-5 py-10 text-center">
              <Clock className="mx-auto mb-3 h-5 w-5 text-gray-400" />
              <p className="text-sm font-semibold text-gray-700">Files are not ready yet</p>
              <p className="mt-1 text-xs text-gray-500">Exports become available after Legal approves the policy.</p>
            </div>
          ) : (
            <div className="space-y-5">
              {availableLanguages.map(language => (
                <section key={language.key}>
                  <div className="mb-2 flex items-center gap-2">
                    <Globe className="h-4 w-4 text-gray-400" />
                    <h3 className="text-sm font-semibold text-gray-900">{language.label}</h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {downloadFormats.map(({ key, label, description, Icon }) => {
                      const url = language.downloads?.[key]
                      return url ? (
                        <a key={key} href={url} download className="flex items-center gap-3 rounded border border-gray-200 px-3 py-3 text-left hover:border-emerald-600 hover:bg-emerald-50/40">
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded bg-gray-100 text-gray-600"><Icon className="h-4 w-4" /></span>
                          <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-gray-900">{label}</span><span className="block text-xs text-gray-500">{description}</span></span>
                          <Download className="h-4 w-4 shrink-0 text-emerald-700" />
                        </a>
                      ) : null
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function PoliciesList() {
  const { policies, setPolicies, loading } = useMerchantPolicies()
  const [copied, setCopied] = useState<string | null>(null)
  const [downloadPolicy, setDownloadPolicy] = useState<SavedPolicy | null>(null)
  const [pendingDelete, setPendingDelete] = useState<SavedPolicy | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [languageFilter, setLanguageFilter] = useState('all')
  const [page, setPage] = useState(1)
  const pageSize = 10
  const search = query.trim().toLowerCase()
  const filteredPolicies = policies.filter(policy => {
    const matchesSearch = !search || [policy.typeName, policy.websiteName, policy.domain, policy.slug]
      .some(value => value?.toLowerCase().includes(search))
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter
    const matchesLanguage = languageFilter === 'all' || policy.language === languageFilter
    return matchesSearch && matchesStatus && matchesLanguage
  })
  const pageCount = Math.max(1, Math.ceil(filteredPolicies.length / pageSize))
  const currentPage = Math.min(page, pageCount)
  const pagePolicies = filteredPolicies.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  const firstResult = filteredPolicies.length ? (currentPage - 1) * pageSize + 1 : 0
  const lastResult = Math.min(currentPage * pageSize, filteredPolicies.length)

  const handleCopy = (p: SavedPolicy) => {
    const url = p.shareUrl ?? `${window.location.origin}/p/${p.slug}`
    navigator.clipboard.writeText(url).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = url
      document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta)
    })
    setCopied(p.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleDelete = (policy: SavedPolicy) => {
    setDeleteError('')
    setPendingDelete(policy)
  }

  const confirmDelete = async () => {
    if (!pendingDelete) return
    setDeleting(true)
    const response = await api.policies.delete(pendingDelete.id)
    setDeleting(false)
    if (!response.success) {
      setDeleteError(response.error?.message || 'ไม่สามารถลบนโยบายได้')
      setPendingDelete(null)
      return
    }
    setPolicies(current => current.filter(policy => policy.id !== pendingDelete.id))
    setPendingDelete(null)
  }

  return (
    <div>
      <ConfirmDialog open={Boolean(pendingDelete)} title="ลบนโยบายนี้หรือไม่?" description={pendingDelete ? `นโยบาย “${pendingDelete.typeName}” ของ ${pendingDelete.websiteName} จะถูกเก็บเป็น archived และหน้าเผยแพร่จะหยุดทำงาน` : ''} confirmLabel="ลบนโยบาย" cancelLabel="ยกเลิก" tone="destructive" loading={deleting} onConfirm={() => void confirmDelete()} onCancel={() => setPendingDelete(null)} />
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

      {deleteError && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{deleteError}</p>}

      {loading ? (
        <div className="py-16 text-center text-sm text-gray-400">Loading policies...</div>
      ) : policies.length === 0 ? (
        <div className="merchant-empty bg-white border border-gray-100 p-10 text-center">
          <FileText className="w-5 h-5 text-gray-400 mx-auto mb-4" />
          <p className="text-sm font-semibold text-gray-500 mb-1">ยังไม่มีนโยบาย</p>
          <p className="text-xs text-gray-400 mb-5">สร้างนโยบาย PDPA สำหรับธุรกิจของคุณใน 5 นาที</p>
          <Link to="/create/policy" className="btn-green text-sm px-6 py-2.5" style={{ borderRadius: '8px' }}>
            สร้างนโยบายแรก
          </Link>
        </div>
      ) : (
        <>
        <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative min-w-0 flex-1 sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              value={query}
              onChange={event => { setQuery(event.target.value); setPage(1) }}
              className="h-9 w-full border border-gray-300 bg-white pl-9 pr-3 text-sm"
              placeholder="ค้นหาชื่อนโยบาย เว็บไซต์ หรือโดเมน"
              aria-label="Search policies"
            />
          </div>
          <select value={statusFilter} onChange={event => { setStatusFilter(event.target.value); setPage(1) }} className="h-9 border border-gray-300 bg-white px-3 text-sm" aria-label="Filter by status">
            <option value="all">ทุกสถานะ</option>
            <option value="pending_review">รอตรวจสอบ</option>
            <option value="approved">อนุมัติแล้ว</option>
            <option value="rejected">ถูกปฏิเสธ</option>
            <option value="edited">แก้ไขแล้ว</option>
          </select>
          <select value={languageFilter} onChange={event => { setLanguageFilter(event.target.value); setPage(1) }} className="h-9 border border-gray-300 bg-white px-3 text-sm" aria-label="Filter by language">
            <option value="all">ทุกภาษา</option>
            <option value="th">ไทย</option>
            <option value="en">English</option>
            <option value="both">ไทย + English</option>
          </select>
        </div>
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          {/* Table header */}
          <div className="hidden md:grid grid-cols-12 gap-3 px-4 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400">
            <div className="col-span-3">ชื่อนโยบาย</div>
            <div className="col-span-2">โดเมน</div>
            <div className="col-span-1">ภาษา</div>
            <div className="col-span-2">สถานะ</div>
            <div className="col-span-2">อัปเดตล่าสุด</div>
            <div className="col-span-2 text-right">จัดการ</div>
          </div>

          {/* Rows */}
          {pagePolicies.length === 0 ? (
            <div className="px-4 py-14 text-center">
              <Search className="mx-auto mb-3 h-5 w-5 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">ไม่พบนโยบายที่ตรงกับตัวกรอง</p>
              <button onClick={() => { setQuery(''); setStatusFilter('all'); setLanguageFilter('all'); setPage(1) }} className="mt-2 text-xs font-semibold text-emerald-700 hover:underline">ล้างตัวกรอง</button>
            </div>
          ) : pagePolicies.map((p, i) => (
            <div
              key={p.id}
              className={`grid grid-cols-2 md:grid-cols-12 gap-3 px-4 py-3.5 items-center ${i < pagePolicies.length - 1 ? 'border-b border-gray-50' : ''} hover:bg-gray-50 transition-colors`}
            >
              {/* Name */}
              <div className="col-span-2 md:col-span-3 flex items-center gap-3">
                <FileText className="w-4 h-4 shrink-0" style={{ color: '#087a5b' }} />
                <div>
                  <Link to={`/dashboard/policies/${p.id}`} className="text-sm font-semibold text-gray-900 hover:underline" style={{ textDecorationColor: 'var(--green)' }}>{p.typeName}</Link>
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
              <div className="col-span-2 flex items-center justify-end gap-1">
                <Link title="Open policy workspace" to={`/dashboard/policies/${p.id}`} className="w-7 h-7 flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-700"><FileEdit className="w-3.5 h-3.5" /></Link>
                {(p.status === 'approved' || p.status === 'edited') && (
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
                      title="Download policy files"
                      onClick={() => setDownloadPolicy(p)}
                      className="flex h-7 items-center gap-1.5 rounded border border-gray-200 px-2 text-xs font-medium text-gray-600 hover:border-emerald-600 hover:text-emerald-700"
                    >
                      <Download className="h-3.5 w-3.5" /> Files
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
        {filteredPolicies.length > 0 && (
          <div className="mt-3 flex flex-col gap-3 border-t border-gray-200 pt-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-gray-500">แสดง <strong className="text-gray-700">{firstResult}-{lastResult}</strong> จาก <strong className="text-gray-700">{filteredPolicies.length}</strong> รายการ</p>
            <div className="flex items-center gap-1">
              <button className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 disabled:opacity-40" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
              {Array.from({ length: pageCount }, (_, index) => index + 1).map(value => <button key={value} onClick={() => setPage(value)} className={`h-8 min-w-8 rounded border px-2 text-xs font-semibold ${currentPage === value ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-gray-200 bg-white text-gray-600'}`} aria-label={`Page ${value}`}>{value}</button>)}
              <button className="grid h-8 w-8 place-items-center rounded border border-gray-200 text-gray-500 disabled:opacity-40" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)} aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            </div>
          </div>
        )}
        </>
      )}

      {downloadPolicy && <PolicyDownloadsDialog policy={downloadPolicy} close={() => setDownloadPolicy(null)} />}
    </div>
  )
}


function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="merchant-settings-section bg-white border border-gray-100 p-6">
      <h2 className="text-sm font-bold text-gray-900 mb-5 pb-3 border-b border-gray-100">{title}</h2>
      {children}
    </section>
  )
}

function AccountSettings({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const [profile,  setProfile]  = useState<ContactProfile>({ ...defaultProfile(), name: user.name, email: user.email })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [saved,    setSaved]    = useState(false)
  const [profileError, setProfileError] = useState('')
  const [pwCurrent, setPwCurrent] = useState('')
  const [pwNew,     setPwNew]     = useState('')
  const [pwConfirm, setPwConfirm] = useState('')
  const [pwError,   setPwError]   = useState('')
  const [pwSaving, setPwSaving] = useState(false)
  const [pwSaved, setPwSaved] = useState(false)

  useEffect(() => {
    let active = true
    void fetchContact(user.email)
      .then(p => { if (active && p) setProfile(p) })
      .catch(error => { if (active) setProfileError(error instanceof Error ? error.message : 'ไม่สามารถโหลดข้อมูลบัญชีได้') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [user.email])

  function set<K extends keyof ContactProfile>(key: K, value: ContactProfile[K]) {
    setProfile(prev => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setSaved(false); setProfileError('')
    try {
      await updateContact(user.email, profile)
      updateUser({ name: profile.name, phone: profile.phone, company: profile.company_name })
      setSaved(true)
    } catch (error) {
      setProfileError(error instanceof Error ? error.message : 'ไม่สามารถบันทึกข้อมูลบัญชีได้')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    setPwSaved(false)
    if (!pwCurrent) { setPwError('กรุณากรอกรหัสผ่านปัจจุบัน'); return }
    if (pwNew.length < 8) { setPwError('รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'); return }
    if (pwNew !== pwConfirm) { setPwError('รหัสผ่านใหม่ไม่ตรงกัน'); return }
    setPwError(''); setPwSaving(true)
    const response = await api.profile.changePassword({ currentPassword: pwCurrent, newPassword: pwNew })
    setPwSaving(false)
    if (!response.success) {
      setPwError(response.error?.code === 'INVALID_CURRENT_PASSWORD'
        ? 'รหัสผ่านปัจจุบันไม่ถูกต้อง'
        : response.error?.message || 'ไม่สามารถเปลี่ยนรหัสผ่านได้')
      return
    }
    setPwCurrent(''); setPwNew(''); setPwConfirm(''); setPwSaved(true)
  }

  function handleVerifyEmail() {
    navigate('/register', { state: { verificationEmail: user.email, requestOtp: true } })
  }

  const inputCls = 'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors bg-white'
  const labelCls = 'block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5'

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

      {profileError && <p className="mb-4 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{profileError}</p>}

      {!user.emailVerified && (
        <section className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border p-5" style={{ backgroundColor: '#f0f8f5', borderColor: '#cfe5dc', borderRadius: '8px' }}>
          <div className="flex items-start gap-3">
            <MailCheck className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} aria-hidden="true" />
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">อีเมลยังไม่ได้รับการยืนยัน</h2>
              <p className="text-xs text-gray-600">ยืนยัน {user.email} เพื่อเริ่มสร้างและจัดการนโยบาย</p>
            </div>
          </div>
          <button type="button" onClick={handleVerifyEmail} className="btn-green px-5 py-2.5 text-sm shrink-0">
            ยืนยันอีเมล
          </button>
        </section>
      )}

      <form onSubmit={handleSave} className="space-y-4">

        {/* ── 1. Personal Info (res.partner: name, function, email, phone, mobile) ── */}
        <SettingsSection title="ข้อมูลส่วนตัว">
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
              <input required readOnly type="email" value={profile.email}
                aria-readonly="true" className={`${inputCls} bg-gray-50 text-gray-500 cursor-not-allowed`} />
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
        </SettingsSection>

        {/* ── 2. Company Info (res.partner: company_name, vat) ── */}
        <SettingsSection title="ข้อมูลบริษัท / องค์กร">
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
        </SettingsSection>

        {/* ── 3. Address (res.partner: street, street2, city, zip, state_id, country_id) ── */}
        <SettingsSection title="ที่อยู่">
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
        </SettingsSection>

        {/* ── 4. Preferences (res.partner: lang) ── */}
        <SettingsSection title="การตั้งค่า">
          <div className="max-w-xs">
            <label className={labelCls}>ภาษา (Language)</label>
            <select value={profile.lang} onChange={e => set('lang', e.target.value)} className={inputCls}>
              <option value="th_TH">ภาษาไทย</option>
              <option value="en_US">English</option>
            </select>
          </div>
        </SettingsSection>

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
          {pwSaved && <p className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: 'var(--green)' }}><CheckCircle className="w-4 h-4" />เปลี่ยนรหัสผ่านสำเร็จ</p>}
          <button type="submit" disabled={pwSaving} className="text-sm font-bold px-6 py-2.5 border-2 rounded-lg transition-colors disabled:opacity-60"
            style={{ borderColor: 'var(--green)', color: 'var(--green)', borderRadius: '8px' }}>
            {pwSaving ? 'กำลังเปลี่ยน...' : 'เปลี่ยนรหัสผ่าน'}
          </button>
        </form>
      </div>
    </div>
  )
}

// ── Main Dashboard ────────────────────────────────────────────
export default function Dashboard() {
  const navigate = useNavigate()
  const { user: sessionUser, logout } = useAuth()
  const location = useLocation()
  const requestedView = (location.state as { view?: string } | null)?.view
  const [activeView, setActiveView] = useState(requestedView === 'settings' || requestedView === 'policies' ? requestedView : 'overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)

  const user: AuthUser = sessionUser ?? {
    name: 'User', email: '', plan: 'Free', emailVerified: false,
  }

  const handleLogout = () => setConfirmLogout(true)
  const confirmSignOut = () => {
    logout()
    navigate('/login')
  }

  const currentNav = navItems.find(n => n.key === activeView)
  const initials = user.name.trim().split(/\s+/).slice(0, 2).map(part => part[0]).join('').toUpperCase() || 'FP'

  return (
    <div className="merchant-shell min-h-screen flex">
      <ConfirmDialog open={confirmLogout} title="ออกจากระบบหรือไม่?" description="คุณจะต้องเข้าสู่ระบบอีกครั้งเพื่อจัดการนโยบายและบัญชีของคุณ" confirmLabel="ออกจากระบบ" cancelLabel="ยกเลิก" onConfirm={confirmSignOut} onCancel={() => setConfirmLogout(false)} />

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
          className={`merchant-sidebar fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        >
          {/* Logo */}
          <div className="merchant-brand flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src="/favicon.svg" alt="FlowPDPA" className="w-8 h-8" style={{ filter: 'brightness(0) invert(1)' }} />
              <span className="font-extrabold text-base" style={{ color: '#ffffff' }}>Flow<span style={{ color: '#4ade80' }}>PDPA</span></span>
            </Link>
            <button className="lg:hidden p-1 rounded" style={{ color: '#94a3b8' }} onClick={() => setSidebarOpen(false)} aria-label="ปิดเมนู">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Nav */}
          <div className="merchant-nav-label">Workspace</div>
          <nav className="flex-1 px-3 py-1 space-y-1 overflow-y-auto">
            {navItems.map(({ key, label, Icon }) => {
              const active = activeView === key
              return (
                <button
                  key={key}
                  onClick={() => {
                    if (key === 'new') { navigate('/create/policy'); return }
                    setActiveView(key); setSidebarOpen(false)
                  }}
                  className="merchant-nav-item w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-colors text-left"
                  data-active={active}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {label}
                  {key === 'new' && (
                    <span className="ml-auto text-xs font-bold" style={{ color: '#4ade80' }}>
                      +
                    </span>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User + Logout */}
          <div className="merchant-user px-3 py-4">
            <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
              <div
                className="merchant-avatar w-8 h-8 flex items-center justify-center text-xs font-medium shrink-0"
              >
                {initials}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-semibold truncate" style={{ color: '#e2e8f0' }}>{user.name}</div>
                <div className="text-xs truncate" style={{ color: '#475569' }}>{user.plan}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ color: '#64748b' }}
              onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#fca5a5' }}
              onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#64748b' }}
            >
              <LogOut className="w-4 h-4 shrink-0" />
              ออกจากระบบ
            </button>
          </div>
        </aside>
      </>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="merchant-main flex flex-col min-h-screen">

          {/* Top bar */}
          <header
            className="merchant-topbar sticky top-0 z-10 flex items-center justify-between px-5 lg:px-8 py-3"
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
                <h1 className="text-base font-semibold" style={{ color: '#172033' }}>{currentNav?.label ?? 'Dashboard'}</h1>
                <p className="text-xs hidden sm:block" style={{ color: '#98a2b3' }}>พื้นที่จัดการเอกสารและการตรวจสอบ</p>
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
                  className="merchant-avatar w-7 h-7 flex items-center justify-center text-xs font-medium"
                >
                  {initials}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user.name}</span>
              </button>
            </div>
          </header>

          {/* Page content */}
          <main className="merchant-content flex-1 px-4 py-5 lg:px-5 lg:py-6">
            {activeView === 'overview'  && <Overview setView={setActiveView} user={user} />}
            {activeView === 'policies'  && <PoliciesList />}
            {activeView === 'settings'  && <AccountSettings user={user} />}
          </main>

        </div>
      </div>
    </div>
  )
}
