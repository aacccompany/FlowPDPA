import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, ArrowLeft, BarChart3, CalendarClock, CheckCircle2,
  ChevronLeft, ChevronRight, FileEdit, FileText, Inbox, Languages, LogOut, Menu,
  MessageSquareText, Scale, Search, ShieldCheck, UserRound, XCircle,
} from 'lucide-react'
import { session } from '@/utils/storage'
import './Portal.css'

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
}

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
      <div className="portal-brand"><span className="portal-brand-mark"><Scale className="w-4 h-4" /></span><div><p className="text-sm font-bold">FlowPDPA</p><p className="text-[10px] text-gray-400">LEGAL WORKSPACE</p></div></div>
      <nav className="portal-nav"><p className="portal-nav-label">Workspace</p>{items.map(({ id, label, Icon }) =>
        <button key={id} className="portal-nav-item" data-active={view === id} onClick={() => { changeView(id); close() }}><Icon />{label}</button>
      )}</nav>
      <div className="portal-account"><div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 grid place-items-center bg-blue-50 text-blue-700 rounded"><UserRound className="w-4 h-4" /></span><div className="min-w-0"><p className="text-xs font-semibold">Legal Reviewer</p><p className="text-[11px] text-gray-400 truncate">legal@flowpdpa.co.th</p></div></div><button className="portal-nav-item" onClick={logout}><LogOut />Sign out</button></div>
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

function Dashboard({ submissions, changes, openQueue, select }: {
  submissions: Submission[]; changes: ChangeRequest[]; openQueue: () => void; select: (row: Submission) => void
}) {
  const pending = submissions.filter(row => row.status === 'pending_review')
  const stats = [
    { label: 'Pending reviews', value: pending.length, Icon: CalendarClock, color: '#a86207' },
    { label: 'Overdue', value: pending.filter(row => new Date(row.approvalDeadline).getTime() < MOCK_NOW).length, Icon: AlertTriangle, color: '#b42318' },
    { label: 'Approved', value: submissions.filter(row => row.status === 'approved').length, Icon: CheckCircle2, color: '#087a5b' },
    { label: 'Change requests', value: changes.filter(row => row.status === 'pending_review').length, Icon: MessageSquareText, color: '#2457a6' },
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

function Changes({ rows, update }: { rows: ChangeRequest[]; update: (id: string, status: ChangeStatus) => void }) {
  const [filter, setFilter] = useState<'all' | ChangeStatus>('pending_review')
  const visible = rows.filter(row => filter === 'all' || row.status === filter)
  const pagination = usePagination(visible)
  return <><PageTitle eyebrow="MERCHANT ESCALATIONS" title="Change requests" description="Requests verified by merchants and sent to Legal for resolution." />
    <div className="flex gap-2 mb-4">{(['pending_review', 'resolved', 'rejected', 'all'] as const).map(item => <button key={item} className="portal-filter" data-active={filter === item} onClick={() => setFilter(item)}>{item === 'all' ? 'All' : statusMeta[item].label}</button>)}</div>
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Policy</th><th>Section</th><th>Request</th><th>Requester</th><th>Status</th><th /></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}>
      <td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.policySlug}</p></td><td>{row.sectionTitle}</td><td className="max-w-sm">{row.requestedChange}</td><td>{row.requesterName}<p className="text-xs text-gray-400">{formatDate(row.createdAt)}</p></td><td><StatusBadge status={row.status} /></td>
      <td>{row.status === 'pending_review' && <div className="flex gap-2"><button className="portal-button primary" onClick={() => update(row.id, 'resolved')}>Resolve</button><button className="portal-button danger" onClick={() => update(row.id, 'rejected')}>Reject</button></div>}</td>
    </tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
  </>
}

function Editor({ initial, back, save }: { initial: Submission; back: () => void; save: (row: Submission) => void }) {
  const [draft, setDraft] = useState(initial)
  const [language, setLanguage] = useState<'th' | 'en'>(initial.language === 'en' ? 'en' : 'th')
  const [decision, setDecision] = useState<PolicyStatus | null>(null)
  const content = language === 'th' ? draft.contentTh : draft.contentEn
  const setContent = (value: string) => setDraft(current => language === 'th' ? { ...current, contentTh: value } : { ...current, contentEn: value })
  const submit = () => {
    if ((decision === 'rejected' || decision === 'edited') && !draft.reviewComment.trim()) return
    save({ ...draft, status: decision || 'edited' })
  }
  return <><button className="portal-button mb-5" onClick={back}><ArrowLeft className="w-4 h-4" />Back to queue</button>
    <div className="flex flex-col xl:flex-row gap-5"><section className="portal-panel flex-1 min-w-0"><div className="portal-panel-head"><div><p className="text-xs text-gray-400">{draft.slug}</p><h1 className="text-lg font-semibold mt-1">{draft.websiteName}</h1></div><StatusBadge status={draft.status} /></div><div className="p-5"><div className="flex gap-2 mb-4">{(['th', 'en'] as const).filter(item => draft.language === 'both' || draft.language === item).map(item => <button key={item} className="portal-filter" data-active={language === item} onClick={() => setLanguage(item)}><Languages className="w-3.5 h-3.5" />{item === 'th' ? 'Thai' : 'English'}</button>)}</div><textarea className="w-full min-h-[560px] resize-y border border-gray-300 rounded p-5 font-mono text-sm leading-7 focus:border-green-700 focus:outline-none" value={content} onChange={event => setContent(event.target.value)} /></div></section>
      <aside className="w-full xl:w-80 space-y-4"><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-4">Submission details</h2>{[['Merchant', draft.ownerName], ['Contact', draft.ownerEmail], ['Domain', draft.domain], ['Created', formatDate(draft.createdAt)]].map(pair => <div className="py-2.5 border-b border-gray-100 last:border-0" key={pair[0]}><p className="text-[10px] text-gray-400 uppercase">{pair[0]}</p><p className="text-xs mt-1 break-words">{pair[1]}</p></div>)}</section>
        <section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-3">Review decision</h2><div className="grid grid-cols-3 gap-2 mb-4">{[
          { id: 'approved' as const, label: 'Approve', Icon: ShieldCheck }, { id: 'edited' as const, label: 'Edited', Icon: FileEdit }, { id: 'rejected' as const, label: 'Reject', Icon: XCircle },
        ].map(({ id, label, Icon }) => <button key={id} className="portal-filter justify-center px-1" data-active={decision === id} onClick={() => setDecision(id)}><Icon className="w-3.5 h-3.5" />{label}</button>)}</div><label className="text-xs font-semibold text-gray-600">Review comment {(decision === 'rejected' || decision === 'edited') && <span className="text-red-600">*</span>}</label><textarea className="w-full min-h-24 mt-2 border border-gray-300 rounded p-3 text-sm" value={draft.reviewComment} onChange={event => setDraft(current => ({ ...current, reviewComment: event.target.value }))} placeholder="Reason, legal notes, or merchant instructions" /><button className="portal-button primary w-full mt-4" onClick={submit}>{decision ? 'Save decision' : 'Save draft'}</button></section>
      </aside></div>
  </>
}

export default function Legal() {
  const navigate = useNavigate()
  const [view, setView] = useState<LegalView>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [submissions, setSubmissions] = useState(seedSubmissions)
  const [changes, setChanges] = useState(seedChanges)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const selected = useMemo(() => submissions.find(row => row.id === selectedId) || null, [selectedId, submissions])
  const select = (row: Submission) => setSelectedId(row.id)
  const logout = () => { session.logout(); navigate('/login', { replace: true }) }
  const changeView = (next: LegalView) => { setView(next); setSelectedId(null) }
  const save = (row: Submission) => { setSubmissions(current => current.map(item => item.id === row.id ? row : item)); changeView('submissions') }
  const updateChange = (id: string, status: ChangeStatus) => setChanges(current => current.map(row => row.id === id ? { ...row, status } : row))
  return <div className="portal-shell"><Sidebar view={view} changeView={changeView} open={menuOpen} close={() => setMenuOpen(false)} logout={logout} /><div className="portal-main">
    <header className="portal-topbar"><div className="flex items-center gap-3"><button className="portal-button portal-mobile-menu px-2" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu className="w-4 h-4" /></button><div><p className="text-sm font-semibold">Legal Review Portal</p><p className="text-[11px] text-gray-400">Assigned workload</p></div></div><span className="inline-flex items-center gap-2 text-xs text-gray-500"><ShieldCheck className="w-4 h-4 text-green-700" />Legal reviewer</span></header>
    <main className="portal-content portal-content-legal">{selected ? <Editor initial={selected} back={() => setSelectedId(null)} save={save} /> : view === 'dashboard' ? <Dashboard submissions={submissions} changes={changes} openQueue={() => setView('submissions')} select={select} /> : view === 'submissions' ? <Queue submissions={submissions} select={select} /> : <Changes rows={changes} update={updateChange} />}</main>
  </div></div>
}
