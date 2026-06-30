import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, BarChart3, CalendarClock, CheckCircle2,
  ChevronLeft, ChevronRight, FileEdit, FileText, Inbox, Languages, LogOut, Menu,
  MessageSquareText, Search, ShieldCheck, UserRound, XCircle,
} from 'lucide-react'
import { session } from '@/utils/storage'
import { api } from '@/services/api'
import type { LegalDashboard, PolicyChangeRequest, PolicyReviewStatus, SavedPolicy } from '@/services/api'
import { normalizePolicyMarkdown } from '@/utils/policyMarkdown'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import './Portal.css'

const LegalPolicyEditor = lazy(() => import('@/components/legal/LegalPolicyEditor').then(module => ({ default: module.LegalPolicyEditor })))

type LegalView = 'dashboard' | 'submissions' | 'changes'
type PolicyStatus = 'pending_review' | 'approved' | 'edited' | 'rejected'
type ChangeStatus = 'pending_review' | 'resolved' | 'rejected'

interface Submission {
  id: string
  slug: string
  websiteName: string
  domain: string
  ownerName: string
  ownerEmail: string
  language: 'th' | 'en' | 'both'
  status: PolicyStatus
  approvalDeadline: string
  createdAt: string
  contentTh: string
  contentEn: string
  reviewComment: string
}

interface ChangeRequest {
  id: string
  policySlug: string
  websiteName: string
  sectionTitle: string
  requestedChange: string
  requesterName: string
  status: ChangeStatus
  createdAt: string
  legalComment?: string | null
}

const submissionFromApi = (policy: SavedPolicy): Submission => ({
  id: policy.id,
  slug: policy.slug,
  websiteName: policy.websiteName,
  domain: policy.domain,
  ownerName: policy.ownerName || policy.websiteName,
  ownerEmail: policy.ownerEmail,
  language: policy.language,
  status: policy.status === 'archived' ? 'rejected' : policy.status,
  approvalDeadline: policy.approvalDeadline || policy.updatedAt,
  createdAt: policy.createdAt,
  contentTh: normalizePolicyMarkdown(policy.contentByLanguage?.th || policy.htmlContentByLanguage.th || ''),
  contentEn: normalizePolicyMarkdown(policy.contentByLanguage?.en || policy.htmlContentByLanguage.en || ''),
  reviewComment: policy.reviewComment || '',
})

const changeFromApi = (request: PolicyChangeRequest): ChangeRequest => ({
  id: request.id,
  policySlug: request.policySlug,
  websiteName: request.websiteName || request.policySlug,
  sectionTitle: request.sectionTitle || '-',
  requestedChange: request.requestedChange,
  requesterName: request.requesterName || request.requesterEmail,
  status: request.status,
  createdAt: request.createdAt,
  legalComment: request.legalComment,
})

const seedSubmissions: Submission[] = [
  {
    id: 'f2ddc823-7fc7-4612-b984-5ecfca8796c7', slug: 'baan-aroon-privacy-f2ddc823',
    websiteName: 'Baan Aroon Living', domain: 'baanaroon.co.th', ownerName: 'Baan Aroon Co., Ltd.',
    ownerEmail: 'privacy@baanaroon.co.th', language: 'both', status: 'pending_review',
    approvalDeadline: '2026-06-22T09:00:00Z', createdAt: '2026-06-20T08:12:00Z',
    contentTh: '# นโยบายความเป็นส่วนตัว\n\nบริษัท บ้านอรุณ จำกัด ให้ความสำคัญกับการคุ้มครองข้อมูลส่วนบุคคล...',
    contentEn: '# Privacy Policy\n\nBaan Aroon Co., Ltd. is committed to protecting personal data...', reviewComment: '',
  },
  {
    id: 'a40c16d5-5598-4565-bcbc-8e780e19cc14', slug: 'northstar-clinic-privacy-a40c16d5',
    websiteName: 'Northstar Clinic', domain: 'northstarclinic.com', ownerName: 'Northstar Health Co., Ltd.',
    ownerEmail: 'dpo@northstarclinic.com', language: 'th', status: 'pending_review',
    approvalDeadline: '2026-06-21T16:30:00Z', createdAt: '2026-06-19T11:40:00Z',
    contentTh: '# นโยบายความเป็นส่วนตัว\n\nคลินิกเก็บรวบรวมข้อมูลเพื่อให้บริการด้านสุขภาพ...',
    contentEn: '', reviewComment: '',
  },
  {
    id: 'e3f4620f-9d57-4218-a749-826f87e23544', slug: 'siam-supply-privacy-e3f4620f',
    websiteName: 'Siam Supply', domain: 'siamsupply.co.th', ownerName: 'Siam Supply Partnership',
    ownerEmail: 'contact@siamsupply.co.th', language: 'both', status: 'approved',
    approvalDeadline: '2026-06-19T10:00:00Z', createdAt: '2026-06-17T07:20:00Z',
    contentTh: '# นโยบายความเป็นส่วนตัว\n\nฉบับตรวจสอบแล้ว...', contentEn: '# Privacy Policy\n\nReviewed version...', reviewComment: '',
  },
  {
    id: 'cf50353f-b282-47e8-af26-32c5468ee438', slug: 'paperplane-privacy-cf50353f',
    websiteName: 'Paperplane Studio', domain: 'paperplane.studio', ownerName: 'Paperplane Studio',
    ownerEmail: 'hello@paperplane.studio', language: 'en', status: 'rejected',
    approvalDeadline: '2026-06-18T10:00:00Z', createdAt: '2026-06-16T06:50:00Z',
    contentTh: '', contentEn: '# Privacy Policy\n\nDraft policy...',
    reviewComment: 'Please clarify the legal basis for marketing communications.',
  },
]

const seedChanges: ChangeRequest[] = [
  {
    id: 'cr-9221a410', policySlug: 'siam-supply-privacy-e3f4620f', websiteName: 'Siam Supply',
    sectionTitle: '3. วัตถุประสงค์ในการประมวลผลข้อมูล',
    requestedChange: 'Remove analytics because the website no longer uses analytics tools.',
    requesterName: 'Narin S.', status: 'pending_review', createdAt: '2026-06-20T10:30:00Z',
  },
  {
    id: 'cr-187cad21', policySlug: 'baan-aroon-privacy-f2ddc823', websiteName: 'Baan Aroon Living',
    sectionTitle: 'Data retention', requestedChange: 'Update retention period from two years to seven years.',
    requesterName: 'Merchant team', status: 'resolved', createdAt: '2026-06-18T14:10:00Z',
  },
]

const statusMeta: Record<PolicyStatus | ChangeStatus, { label: string; color: string; bg: string }> = {
  pending_review: { label: 'Pending review', color: '#a86207', bg: '#fff6e5' },
  approved: { label: 'Approved', color: '#087a5b', bg: '#e8f4ef' },
  edited: { label: 'Edited', color: '#2457a6', bg: '#eaf0fa' },
  rejected: { label: 'Rejected', color: '#b42318', bg: '#fdf0ef' },
  resolved: { label: 'Resolved', color: '#087a5b', bg: '#e8f4ef' },
}

const formatDate = (value: string) => new Date(value).toLocaleString('th-TH', {
  day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
})
const MOCK_NOW = new Date('2026-06-21T12:00:00Z').getTime()

function StatusBadge({ status }: { status: PolicyStatus | ChangeStatus }) {
  const meta = statusMeta[status]
  return <span className="portal-badge" style={{ color: meta.color, background: meta.bg }}>{meta.label}</span>
}

const LEGAL_PAGE_SIZE = 3

function usePagination<T>(rows: T[], pageSize = LEGAL_PAGE_SIZE) {
  const [requestedPage, setRequestedPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize))
  const page = Math.min(requestedPage, pageCount)
  const pageRows = rows.slice((page - 1) * pageSize, page * pageSize)
  return { page, pageCount, pageRows, pageSize, setPage: setRequestedPage }
}

function Pagination({ page, pageCount, total, pageSize, setPage }: { page: number; pageCount: number; total: number; pageSize: number; setPage: (page: number) => void }) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1
  const last = Math.min(page * pageSize, total)
  return <footer className="portal-pagination"><p className="text-xs text-gray-500">Showing <strong className="text-gray-700">{first}-{last}</strong> of <strong className="text-gray-700">{total}</strong> records</p><div className="portal-pagination-pages"><button className="portal-page-button" disabled={page === 1} onClick={() => setPage(page - 1)} aria-label="Previous page"><ChevronLeft className="w-4 h-4" /></button>{Array.from({ length: pageCount }, (_, index) => index + 1).map(value => <button key={value} className="portal-page-button" data-active={page === value} onClick={() => setPage(value)} aria-label={`Page ${value}`}>{value}</button>)}<button className="portal-page-button" disabled={page === pageCount} onClick={() => setPage(page + 1)} aria-label="Next page"><ChevronRight className="w-4 h-4" /></button></div></footer>
}

function Deadline({ row }: { row: Submission }) {
  if (row.status !== 'pending_review') return <span className="text-xs text-gray-400">{formatDate(row.approvalDeadline)}</span>
  const hours = Math.ceil((new Date(row.approvalDeadline).getTime() - MOCK_NOW) / 3600000)
  const overdue = hours < 0
  const text = overdue ? 'Overdue ' + Math.abs(hours) + 'h' : hours + 'h remaining'
  return <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: overdue ? '#b42318' : hours <= 24 ? '#a86207' : '#475467' }}>
    {overdue ? <AlertTriangle className="w-3.5 h-3.5" /> : <CalendarClock className="w-3.5 h-3.5" />}{text}
  </span>
}

function Sidebar({ view, changeView, open, close, logout }: {
  view: LegalView; changeView: (view: LegalView) => void; open: boolean; close: () => void; logout: () => void
}) {
  const items = [
    { id: 'dashboard' as const, label: 'Dashboard', Icon: BarChart3 },
    { id: 'submissions' as const, label: 'Review queue', Icon: Inbox },
    { id: 'changes' as const, label: 'Change requests', Icon: MessageSquareText },
  ]
  return <>
    {open && <button className="portal-overlay" onClick={close} aria-label="Close navigation" />}
    <aside className="portal-sidebar" data-open={open}>
      <div className="portal-brand"><img src="/favicon.svg" alt="FlowPDPA" style={{ width: '32px', height: '32px', filter: 'brightness(0) invert(1)', flexShrink: 0 }} /><div><p className="text-sm font-extrabold" style={{ color: '#ffffff' }}>Flow<span style={{ color: '#4ade80' }}>PDPA</span></p><p className="text-[10px]" style={{ color: '#475569' }}>LEGAL WORKSPACE</p></div></div>
      <nav className="portal-nav"><p className="portal-nav-label">Workspace</p>{items.map(({ id, label, Icon }) =>
        <button key={id} className="portal-nav-item" data-active={view === id} onClick={() => { changeView(id); close() }}><Icon />{label}</button>
      )}</nav>
      <div className="portal-account"><div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 grid place-items-center rounded" style={{ backgroundColor: 'rgba(8,122,91,0.25)', color: '#4ade80' }}><UserRound className="w-4 h-4" /></span><div className="min-w-0"><p className="text-xs font-semibold" style={{ color: '#e2e8f0' }}>Legal Reviewer</p><p className="text-[11px] truncate" style={{ color: '#475569' }}>legal@flowpdpa.co.th</p></div></div><button className="portal-nav-item" onClick={logout}><LogOut />Sign out</button></div>
    </aside>
  </>
}

function SubmissionTable({ rows, select }: { rows: Submission[]; select: (row: Submission) => void }) {
  if (!rows.length) return <div className="portal-empty"><FileText className="w-7 h-7 mx-auto mb-3" /><p className="text-sm">No submissions in this queue</p></div>
  return <table className="portal-table"><thead><tr><th>Website / policy</th><th>Merchant</th><th>Language</th><th>Deadline</th><th>Status</th><th /></tr></thead>
    <tbody>{rows.map(row => <tr key={row.id}>
      <td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400 mt-1">{row.domain} · Privacy + Cookies Policy</p></td>
      <td><p>{row.ownerName}</p><p className="text-xs text-gray-400">{row.ownerEmail}</p></td>
      <td><span className="inline-flex items-center gap-1.5 text-xs"><Languages className="w-3.5 h-3.5 text-gray-400" />{row.language.toUpperCase()}</span></td>
      <td><Deadline row={row} /></td><td><StatusBadge status={row.status} /></td>
      <td><button className="portal-button" onClick={() => select(row)}>Review <ChevronRight className="w-3.5 h-3.5" /></button></td>
    </tr>)}</tbody>
  </table>
}

function Dashboard({ submissions, changes, summary, openQueue, select }: {
  submissions: Submission[]; changes: ChangeRequest[]; summary?: LegalDashboard['summary']; openQueue: () => void; select: (row: Submission) => void
}) {
  const pending = submissions.filter(row => row.status === 'pending_review')
  const stats = [
    { label: 'Pending reviews', value: summary?.pendingPolicies ?? pending.length, Icon: CalendarClock, color: '#a86207' },
    { label: 'Overdue', value: summary?.overduePolicies ?? pending.filter(row => new Date(row.approvalDeadline).getTime() < MOCK_NOW).length, Icon: AlertTriangle, color: '#b42318' },
    { label: 'Approved this month', value: summary?.approvedThisMonth ?? submissions.filter(row => row.status === 'approved').length, Icon: CheckCircle2, color: '#087a5b' },
    { label: 'Change requests', value: summary?.pendingChangeRequests ?? changes.filter(row => row.status === 'pending_review').length, Icon: MessageSquareText, color: '#2457a6' },
  ]
  return <><PageTitle eyebrow="LEGAL OPERATIONS" title="Review dashboard" description="Your assigned policies and customer-requested changes." />
    <section className="portal-kpis">{stats.map(({ label, value, Icon, color }) => <div className="portal-kpi" key={label}><Icon className="w-4 h-4 mb-4" style={{ color }} /><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>)}</section>
    <section className="portal-panel"><div className="portal-panel-head"><div><h2 className="text-sm font-semibold">Priority queue</h2><p className="text-xs text-gray-400 mt-1">Closest deadlines first</p></div><button className="portal-button" onClick={openQueue}>View all <ChevronRight className="w-3.5 h-3.5" /></button></div><div className="portal-table-wrap"><SubmissionTable rows={pending.slice(0, 4)} select={select} /></div></section>
  </>
}

function PageTitle({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <header className="mb-6"><p className="text-[11px] font-medium text-green-700 mb-2">{eyebrow}</p><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-gray-500 mt-1">{description}</p></header>
}

function Queue({ submissions, select }: { submissions: Submission[]; select: (row: Submission) => void }) {
  const [filter, setFilter] = useState<'all' | PolicyStatus>('pending_review')
  const [query, setQuery] = useState('')
  const rows = submissions.filter(row => (filter === 'all' || row.status === filter) && (row.websiteName + row.domain + row.ownerName).toLowerCase().includes(query.toLowerCase()))
  const pagination = usePagination(rows)
  return <><PageTitle eyebrow="ASSIGNED TO YOU" title="Policy review queue" description="Review AI drafts, edit content, and record a legal decision." />
    <div className="flex flex-wrap gap-2 mb-4">{(['pending_review', 'approved', 'edited', 'rejected', 'all'] as const).map(item => <button key={item} className="portal-filter" data-active={filter === item} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : statusMeta[item].label}</button>)}<div className="relative ml-auto w-full sm:w-auto"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input className="portal-search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search website or merchant" /></div></div>
    <section className="portal-panel"><div className="portal-table-wrap"><SubmissionTable rows={pagination.pageRows} select={select} /></div><Pagination {...pagination} total={rows.length} /></section>
  </>
}

function Changes({ rows, editPolicy }: {
  rows: ChangeRequest[]
  editPolicy: (slug: string) => Promise<string | null>
}) {
  const [filter, setFilter] = useState<'all' | ChangeStatus>('pending_review')
  const [openingId, setOpeningId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const visible = rows.filter(row => filter === 'all' || row.status === filter)
  const pagination = usePagination(visible)
  const openEditor = async (row: ChangeRequest) => {
    setOpeningId(row.id); setError('')
    const message = await editPolicy(row.policySlug)
    setOpeningId(null)
    if (message) setError(message)
  }
  return <><PageTitle eyebrow="MERCHANT ESCALATIONS" title="Change requests" description="Requests verified by merchants and sent to Legal for resolution." />
    <div className="flex gap-2 mb-4">{(['pending_review', 'resolved', 'rejected', 'all'] as const).map(item => <button key={item} className="portal-filter" data-active={filter === item} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : statusMeta[item].label}</button>)}</div>
    {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Policy</th><th>Section</th><th>Request</th><th>Requester</th><th>Status</th><th /></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}>
      <td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.policySlug}</p></td><td>{row.sectionTitle}</td><td className="max-w-sm">{row.requestedChange}</td><td>{row.requesterName}<p className="text-xs text-gray-400">{formatDate(row.createdAt)}</p></td><td><StatusBadge status={row.status} /></td>
      <td><button className="portal-button whitespace-nowrap" disabled={openingId === row.id} onClick={() => void openEditor(row)}><FileEdit className="w-3.5 h-3.5" />{openingId === row.id ? 'Opening...' : row.status === 'pending_review' ? 'Review in policy' : 'View policy'}</button></td>
    </tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
  </>
}

function Editor({ initial, back, save, changeRequests, updateChange }: {
  initial: Submission
  back: () => void
  save: (row: Submission, decision: PolicyReviewStatus | null) => Promise<string | null>
  changeRequests: ChangeRequest[]
  updateChange: (id: string, status: 'resolved' | 'rejected', comment: string) => Promise<string | null>
}) {
  const [draft, setDraft] = useState(initial)
  const [language, setLanguage] = useState<'th' | 'en'>(initial.language === 'en' ? 'en' : 'th')
  const [decision, setDecision] = useState<'approved' | 'rejected' | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [requestComments, setRequestComments] = useState<Record<string, string>>({})
  const [requestSavingId, setRequestSavingId] = useState<string | null>(null)
  const [requestError, setRequestError] = useState('')
  const content = language === 'th' ? draft.contentTh : draft.contentEn
  const setContent = (value: string) => setDraft(current => language === 'th' ? { ...current, contentTh: value } : { ...current, contentEn: value })
  const submit = async () => {
    if (decision === 'rejected' && !draft.reviewComment.trim()) {
      setError('A review comment is required when rejecting a policy.')
      return
    }
    setSaving(true); setError('')
    const message = await save(draft, decision)
    setSaving(false)
    if (message) setError(message)
  }
  const declineChangeRequest = async (id: string) => {
    const comment = requestComments[id]?.trim() || ''
    if (!comment) {
      setRequestError('A legal comment is required to resolve or reject a request.')
      return
    }
    setRequestSavingId(id); setRequestError('')
    const message = await updateChange(id, 'rejected', comment)
    setRequestSavingId(null)
    if (message) setRequestError(message)
  }
  return <><button className="portal-button mb-5" onClick={back}><ArrowLeft className="w-4 h-4" />Back to queue</button>
    <div className="flex flex-col xl:flex-row gap-5"><section className="portal-panel flex-1 min-w-0"><div className="portal-panel-head"><div><p className="text-xs text-gray-400">{draft.slug}</p><h1 className="text-lg font-semibold mt-1">{draft.websiteName}</h1></div><StatusBadge status={draft.status} /></div><div className="p-5"><div className="flex gap-2 mb-4">{(['th', 'en'] as const).filter(item => draft.language === 'both' || draft.language === item).map(item => <button key={item} className="portal-filter" data-active={language === item} onClick={() => setLanguage(item)}><Languages className="w-3.5 h-3.5" />{item === 'th' ? 'Thai' : 'English'}</button>)}</div><Suspense fallback={<div className="legal-editor-loading">Loading editor...</div>}><LegalPolicyEditor key={language} value={content} onChange={setContent} /></Suspense></div></section>
      <aside className="w-full xl:w-80 space-y-4"><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-4">Submission details</h2>{[['Merchant', draft.ownerName], ['Contact', draft.ownerEmail], ['Domain', draft.domain], ['Created', formatDate(draft.createdAt)]].map(pair => <div className="py-2.5 border-b border-gray-100 last:border-0" key={pair[0]}><p className="text-[10px] text-gray-400 uppercase">{pair[0]}</p><p className="text-xs mt-1 break-words">{pair[1]}</p></div>)}</section>
        {changeRequests.length > 0 && <section className="portal-panel p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold">Merchant change requests</h2><span className="text-[11px] text-gray-400">{changeRequests.length}</span></div><p className="mt-1 mb-4 text-[11px] leading-4 text-gray-500">Pending requests are resolved automatically when you approve the policy.</p>{requestError && <p className="mb-3 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{requestError}</p>}<div className="space-y-4">{changeRequests.map(request => <article key={request.id} className="border-t border-gray-200 pt-4 first:border-0 first:pt-0"><div className="flex items-start justify-between gap-2"><div><p className="text-[10px] uppercase text-gray-400">Section</p><p className="mt-1 text-xs font-semibold">{request.sectionTitle}</p></div><StatusBadge status={request.status} /></div><p className="mt-3 text-xs leading-5 text-gray-700 whitespace-pre-wrap">{request.requestedChange}</p><p className="mt-2 text-[11px] text-gray-400">{request.requesterName} · {formatDate(request.createdAt)}</p>{request.status === 'pending_review' ? <div className="mt-3"><textarea className="w-full min-h-20 border border-gray-300 rounded p-2.5 text-xs" value={requestComments[request.id] || ''} onChange={event => setRequestComments(current => ({ ...current, [request.id]: event.target.value }))} placeholder="Required reason for declining this request" /><button className="portal-button danger justify-center w-full mt-2" disabled={requestSavingId === request.id} onClick={() => void declineChangeRequest(request.id)}>Decline request</button></div> : <p className="mt-3 border-l-2 border-gray-200 pl-3 text-xs text-gray-500">{request.legalComment || 'No legal comment.'}</p>}</article>)}</div></section>}
        <section className="portal-panel p-5"><h2 className="text-sm font-semibold">Policy decision</h2><p className="mt-1 mb-3 text-[11px] leading-4 text-gray-500">Save your edits as a draft, or decide the status of the whole policy.</p><div className="grid grid-cols-2 gap-2 mb-4">{[
          { id: 'approved' as const, label: 'Approve policy', Icon: ShieldCheck }, { id: 'rejected' as const, label: 'Reject policy', Icon: XCircle },
        ].map(({ id, label, Icon }) => <button key={id} className="portal-filter justify-center px-1" data-active={decision === id} onClick={() => setDecision(current => current === id ? null : id)}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div><label className="text-xs font-semibold text-gray-600">Review comment {decision === 'rejected' && <span className="text-red-600">*</span>}</label><textarea className="w-full min-h-24 mt-2 border border-gray-300 rounded p-3 text-sm" value={draft.reviewComment} onChange={event => setDraft(current => ({ ...current, reviewComment: event.target.value }))} placeholder="Reason, legal notes, or merchant instructions" />{error && <p className="mt-3 text-xs text-red-700">{error}</p>}<button className="portal-button primary w-full mt-4" disabled={saving} onClick={() => void submit()}>{saving ? 'Saving...' : decision === 'approved' ? 'Approve policy' : decision === 'rejected' ? 'Reject policy' : 'Save draft'}</button></section>
      </aside></div>
  </>
}

export default function Legal() {
  const navigate = useNavigate()
  const [view, setView] = useState<LegalView>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [submissions, setSubmissions] = useState(seedSubmissions)
  const [changes, setChanges] = useState(seedChanges)
  const [dashboard, setDashboard] = useState<LegalDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [selectedReturnView, setSelectedReturnView] = useState<LegalView>('submissions')
  const selected = useMemo(() => submissions.find(row => row.id === selectedId) || null, [selectedId, submissions])
  useEffect(() => {
    let active = true
    void Promise.all([api.legal.dashboard(), api.legal.listSubmissions(), api.legal.listChangeRequests()]).then(([dashboardResponse, submissionsResponse, changesResponse]) => {
      if (!active) return
      if (dashboardResponse.success && dashboardResponse.data) setDashboard(dashboardResponse.data)
      if (submissionsResponse.success && submissionsResponse.data) setSubmissions(submissionsResponse.data.map(submissionFromApi))
      else setSubmissions([])
      if (changesResponse.success && changesResponse.data) setChanges(changesResponse.data.map(changeFromApi))
      else setChanges([])
      const error = dashboardResponse.error || submissionsResponse.error || changesResponse.error
      setLoadError(error?.message || '')
      setLoading(false)
    })
    return () => { active = false }
  }, [])
  const select = async (row: Submission) => {
    setLoadError('')
    const response = await api.legal.getSubmission(row.slug)
    if (!response.success || !response.data) { setLoadError(response.error?.message || 'Unable to load submission.'); return }
    const detail = submissionFromApi(response.data)
    setSubmissions(current => current.map(item => item.id === detail.id ? detail : item))
    setSelectedReturnView(view)
    setSelectedId(detail.id)
  }
  const selectBySlug = async (slug: string) => {
    setLoadError('')
    const response = await api.legal.getSubmission(slug)
    if (!response.success || !response.data) return response.error?.message || 'Unable to load the policy document.'
    const detail = submissionFromApi(response.data)
    setSubmissions(current => current.some(item => item.id === detail.id)
      ? current.map(item => item.id === detail.id ? detail : item)
      : [detail, ...current])
    setSelectedReturnView('changes')
    setSelectedId(detail.id)
    return null
  }
  const logout = () => setConfirmLogout(true)
  const confirmSignOut = () => { session.logout(); navigate('/login', { replace: true }) }
  const changeView = (next: LegalView) => { setView(next); setSelectedId(null) }
  const save = async (row: Submission, decision: PolicyReviewStatus | null) => {
    const content = row.language === 'both'
      ? { language: 'both' as const, contentTh: row.contentTh, contentEn: row.contentEn }
      : { language: row.language, text: row.language === 'th' ? row.contentTh : row.contentEn }
    const response = await api.legal.updateSubmission(row.slug, {
      content,
      ...(decision ? { review: { status: decision, reviewComment: row.reviewComment || null } } : {}),
    })
    if (!response.success || !response.data) return response.error?.message || 'Unable to save the submission.'
    const saved = submissionFromApi(response.data)
    setSubmissions(current => current.map(item => item.id === saved.id ? saved : item))
    if (decision === 'approved') {
      const changesResponse = await api.legal.listChangeRequests()
      if (changesResponse.success && changesResponse.data) setChanges(changesResponse.data.map(changeFromApi))
    }
    setSelectedId(null); setView(selectedReturnView)
    return null
  }
  const updateChange = async (id: string, status: 'resolved' | 'rejected', legalComment: string) => {
    const response = await api.legal.reviewChangeRequest(id, { status, legalComment })
    if (!response.success || !response.data) return response.error?.message || 'Unable to update the change request.'
    const saved = changeFromApi(response.data)
    setChanges(current => current.map(row => row.id === saved.id ? saved : row))
    return null
  }
  return <div className="portal-shell"><ConfirmDialog open={confirmLogout} title="Sign out of Legal Portal?" description="You will need to sign in again to continue reviewing policies." confirmLabel="Sign out" onConfirm={confirmSignOut} onCancel={() => setConfirmLogout(false)} /><Sidebar view={view} changeView={changeView} open={menuOpen} close={() => setMenuOpen(false)} logout={logout} /><div className="portal-main">
    <header className="portal-topbar"><div className="flex items-center gap-3"><button className="portal-button portal-mobile-menu px-2" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu className="w-4 h-4" /></button><div><p className="text-sm font-semibold">Legal Review Portal</p><p className="text-[11px] text-gray-400">Assigned workload</p></div></div><span className="inline-flex items-center gap-2 text-xs text-gray-500"><ShieldCheck className="w-4 h-4 text-green-700" />Legal reviewer</span></header>
    <main className="portal-content portal-content-legal">{loadError && <div className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loadError}</div>}{loading ? <div className="portal-empty">Loading legal workspace...</div> : selected ? <Editor initial={selected} back={() => setSelectedId(null)} save={save} changeRequests={changes.filter(row => row.policySlug === selected.slug)} updateChange={updateChange} /> : view === 'dashboard' ? <Dashboard submissions={submissions} changes={changes} summary={dashboard?.summary} openQueue={() => setView('submissions')} select={row => { void select(row) }} /> : view === 'submissions' ? <Queue submissions={submissions} select={row => { void select(row) }} /> : <Changes rows={changes} editPolicy={selectBySlug} />}</main>
  </div></div>
}
