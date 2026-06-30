import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, BarChart3, ChevronLeft, ChevronRight,
  CircleDollarSign, CreditCard, FileText, Gauge, Landmark, LogOut,
  Eye, Languages, Menu, Pencil, Plus, ReceiptText, Scale, Search, ShieldCheck,
  UserCog, Users, WalletCards, X,
} from 'lucide-react'
import { session } from '@/utils/storage'
import { api } from '@/services/api'
import type {
  AdminAnalytics, AdminErrorLog, AdminLegalReview, AdminLegalStatus, AdminLegalUser,
  AdminLegalWorkload, AdminMerchant, AdminMerchantStatus, AdminOverview, AdminPayment,
  AdminPolicy, AdminPolicyDetail, AdminPolicyStatus, AdminSubscription,
} from '@/services/api'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { marked } from 'marked'
import { normalizePolicyMarkdown } from '@/utils/policyMarkdown'
import './Portal.css'

type AdminView = 'overview' | 'merchants' | 'subscriptions' | 'payments' | 'policies' | 'assignments' | 'legal' | 'logs' | 'analytics'
type Merchant = AdminMerchant
type Policy = AdminPolicy
type LegalUser = AdminLegalUser
type Subscription = AdminSubscription
type Payment = AdminPayment
type ErrorLog = AdminErrorLog
type MerchantStatus = AdminMerchantStatus
type PolicyStatus = AdminPolicyStatus
type LegalStatus = AdminLegalStatus

const formatDate = (value: string | null) => value ? new Date(value).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'
const money = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 2 }).format(amount / 100)

const badgeMeta: Record<string, { color: string; bg: string }> = {
  active: { color: '#087a5b', bg: '#e8f4ef' }, paid: { color: '#087a5b', bg: '#e8f4ef' }, approved: { color: '#087a5b', bg: '#e8f4ef' },
  pending: { color: '#a86207', bg: '#fff6e5' }, pending_review: { color: '#a86207', bg: '#fff6e5' }, past_due: { color: '#a86207', bg: '#fff6e5' },
  suspended: { color: '#b42318', bg: '#fdf0ef' }, failed: { color: '#b42318', bg: '#fdf0ef' }, rejected: { color: '#b42318', bg: '#fdf0ef' }, critical: { color: '#b42318', bg: '#fdf0ef' },
  inactive: { color: '#667085', bg: '#f2f4f7' }, archived: { color: '#667085', bg: '#f2f4f7' }, free: { color: '#667085', bg: '#f2f4f7' },
  edited: { color: '#2457a6', bg: '#eaf0fa' }, warning: { color: '#a86207', bg: '#fff6e5' }, error: { color: '#c2410c', bg: '#fff0e8' },
}

function Badge({ value }: { value: string }) {
  const meta = badgeMeta[value] || { color: '#475467', bg: '#f2f4f7' }
  return <span className="portal-badge" style={{ color: meta.color, background: meta.bg }}>{value.replaceAll('_', ' ')}</span>
}

const ADMIN_PAGE_SIZE = 10

function usePagination<T>(rows: T[], pageSize = ADMIN_PAGE_SIZE) {
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

function PageTitle({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <header className="mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"><div><p className="text-[11px] font-medium text-green-700 mb-2">{eyebrow}</p><h1 className="text-2xl font-bold">{title}</h1><p className="text-sm text-gray-500 mt-1">{description}</p></div>{action}</header>
}

function Sidebar({ view, change, open, close, logout }: { view: AdminView; change: (view: AdminView) => void; open: boolean; close: () => void; logout: () => void }) {
  const groups = [
    { label: 'Platform', items: [{ id: 'overview' as const, text: 'Overview', Icon: Gauge }, { id: 'merchants' as const, text: 'Merchants', Icon: Users }, { id: 'policies' as const, text: 'Policies', Icon: FileText }] },
    { label: 'Billing', items: [{ id: 'subscriptions' as const, text: 'Subscriptions', Icon: WalletCards }, { id: 'payments' as const, text: 'Payments', Icon: ReceiptText }] },
    { label: 'Operations', items: [{ id: 'assignments' as const, text: 'Review assignments', Icon: FileText }, { id: 'legal' as const, text: 'Legal management', Icon: Scale }, { id: 'logs' as const, text: 'Error logs', Icon: AlertTriangle }, { id: 'analytics' as const, text: 'Analytics', Icon: BarChart3 }] },
  ]
  return <>{open && <button className="portal-overlay" onClick={close} aria-label="Close navigation" />}<aside className="portal-sidebar" data-open={open}>
    <div className="portal-brand"><span className="portal-brand-mark"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-sm font-bold">FlowPDPA</p><p className="text-[10px] text-gray-400">ADMIN CONSOLE</p></div></div>
    <nav className="portal-nav flex-1 overflow-y-auto">{groups.map(group => <div key={group.label}><p className="portal-nav-label">{group.label}</p>{group.items.map(({ id, text, Icon }) => <button key={id} className="portal-nav-item" data-active={view === id} onClick={() => { change(id); close() }}><Icon />{text}</button>)}</div>)}</nav>
    <div className="portal-account"><div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 grid place-items-center rounded bg-green-50 text-green-700"><UserCog className="w-4 h-4" /></span><div><p className="text-xs font-semibold">Platform Admin</p><p className="text-[11px] text-gray-400">admin@flowpdpa.co.th</p></div></div><button className="portal-nav-item" onClick={logout}><LogOut />Sign out</button></div>
  </aside></>
}

function Overview({ overview, legalUsers, change }: { overview: AdminOverview; legalUsers: LegalUser[]; change: (view: AdminView) => void }) {
  const stats = [
    { label: 'Active merchants', value: overview.kpi.activeMerchants, Icon: Users, color: '#2457a6' },
    { label: 'Pending reviews', value: overview.kpi.pendingLegalReviews, Icon: FileText, color: '#a86207' },
    { label: 'Active legal users', value: legalUsers.filter(row => row.status === 'active').length, Icon: Scale, color: '#087a5b' },
    { label: 'Total collected', value: money(overview.kpi.totalRevenue), Icon: CircleDollarSign, color: '#087a5b' },
  ]
  return <><PageTitle eyebrow="PLATFORM OPERATIONS" title="Admin overview" description="Account, policy, billing, and legal-workflow health." />
    <section className="portal-kpis">{stats.map(({ label, value, Icon, color }) => <div className="portal-kpi" key={label}><Icon className="w-4 h-4 mb-4" style={{ color }} /><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>)}</section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="portal-panel"><div className="portal-panel-head"><div><h2 className="text-sm font-semibold">Recent payments</h2><p className="text-xs text-gray-400 mt-1">Latest Stripe invoice activity</p></div><button className="portal-button" onClick={() => change('payments')}>View payments <ChevronRight className="w-3.5 h-3.5" /></button></div>{overview.recentPayments.length ? <div className="divide-y divide-gray-100">{overview.recentPayments.map(payment => <div className="flex items-center justify-between gap-4 px-5 py-3.5" key={payment.id}><div className="min-w-0"><p className="truncate text-sm font-semibold">{payment.merchantName || payment.merchantEmail || 'Unknown merchant'}</p><p className="mt-1 text-[11px] text-gray-400">{payment.policyType || 'Subscription'} · {formatDate(payment.paidAt || payment.createdAt)}</p></div><div className="flex shrink-0 items-center gap-3"><span className="text-sm font-semibold">{money(payment.amountPaid)}</span><Badge value={payment.status} /></div></div>)}</div> : <div className="portal-empty">No payment activity yet.</div>}</section>
      <section className="portal-panel"><div className="portal-panel-head"><div><h2 className="text-sm font-semibold">Attention required</h2><p className="text-xs text-gray-400 mt-1">Operational items needing action</p></div></div><div className="divide-y divide-gray-100">{[
        { label: 'Pending payments', value: overview.kpi.pendingPayments, Icon: CreditCard, view: 'payments' as const },
        { label: 'Active system errors', value: overview.kpi.activeErrors, Icon: AlertTriangle, view: 'logs' as const },
        { label: 'Unassigned legal reviews', value: overview.kpi.unassignedLegalReviews, Icon: Users, view: 'policies' as const },
      ].map(item => <button key={item.label} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50" onClick={() => change(item.view)}><span className="flex items-center gap-3 text-sm"><item.Icon className="w-4 h-4 text-gray-400" />{item.label}</span><span className="font-semibold">{item.value}</span></button>)}</div></section>
    </div>
  </>
}

function MerchantView({ rows, setRows }: { rows: Merchant[]; setRows: React.Dispatch<React.SetStateAction<Merchant[]>> }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | MerchantStatus>('all')
  const [error, setError] = useState('')
  const visible = rows.filter(row => {
    const matchesQuery = `${row.name} ${row.email} ${row.companyName || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'all' || row.status === statusFilter)
  })
  const pagination = usePagination(visible)
  const update = async (id: string, status: MerchantStatus) => {
    setError('')
    const response = await api.admin.updateMerchantStatus(id, status)
    if (!response.success) { setError(response.error?.message || 'Unable to update merchant status.'); return }
    setRows(current => current.map(row => row.id === id ? { ...row, status } : row))
  }
  return <><PageTitle eyebrow="ACCOUNT MANAGEMENT" title="Merchants" description="Search accounts and control platform access." />
    <div className="flex flex-wrap items-center gap-2 mb-4"><SearchBox value={query} setValue={setQuery} placeholder="Search merchants" /><select className="portal-filter h-9" value={statusFilter} onChange={event => setStatusFilter(event.target.value as 'all' | MerchantStatus)}><option value="all">All statuses</option>{(['active', 'pending', 'suspended', 'inactive'] as const).map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Merchant</th><th>Company</th><th>Policies</th><th>Active subscriptions</th><th>Joined</th><th>Status</th><th /></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.name}</p><p className="text-xs text-gray-400">{row.email}</p></td><td>{row.companyName || '-'}</td><td>{row.policyCount}</td><td>{row.activeSubscriptions}</td><td>{formatDate(row.createdAt)}</td><td><Badge value={row.status} /></td><td><select className="portal-filter" value={row.status} onChange={event => void update(row.id, event.target.value as MerchantStatus)}>{['active', 'pending', 'suspended', 'inactive'].map(value => <option key={value}>{value}</option>)}</select></td></tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
  </>
}

function PolicyView({ rows, legalUsers, setRows }: { rows: Policy[]; legalUsers: LegalUser[]; setRows: React.Dispatch<React.SetStateAction<Policy[]>> }) {
  const [filter, setFilter] = useState<'all' | PolicyStatus>('all')
  const [query, setQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [error, setError] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<AdminPolicyDetail | null>(null)
  const [contentOpen, setContentOpen] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const visible = rows.filter(row => {
    const matchesQuery = `${row.websiteName} ${row.slug} ${row.merchantName || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (filter === 'all' || row.status === filter) && (typeFilter === 'all' || row.type === typeFilter)
  })
  const pagination = usePagination(visible)
  const assign = async (id: string, legalId: string) => {
    if (!legalId) return
    setError('')
    const response = await api.admin.assignLegal(id, legalId)
    if (!response.success) { setError(response.error?.message || 'Unable to assign legal reviewer.'); return }
    setRows(current => current.map(row => row.id === id ? { ...row, assignedLegalUserId: legalId } : row))
  }
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null); setContentOpen(true); setContentLoading(true); setError('')
    const response = await api.admin.getPolicy(policyId)
    setContentLoading(false)
    if (!response.success || !response.data) { setError(response.error?.message || 'Unable to load policy content.'); return }
    setSelectedPolicy(response.data.policy)
  }
  return <><PageTitle eyebrow="POLICY OPERATIONS" title="All policies" description="Inspect workflow state and override automatic legal assignment." />
    <div className="flex flex-wrap items-center gap-2 mb-4">{(['all', 'pending_review', 'approved', 'edited', 'rejected', 'archived'] as const).map(value => <button key={value} className="portal-filter" data-active={filter === value} onClick={() => setFilter(value)}>{value.replaceAll('_', ' ')}</button>)}<div className="sm:ml-auto"><SearchBox value={query} setValue={setQuery} placeholder="Search policies" /></div><select className="portal-filter h-9" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All types</option>{Array.from(new Set(rows.map(row => row.type))).map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Website / policy</th><th>Merchant</th><th>Language</th><th>Status</th><th>Legal reviewer</th><th>Updated</th><th>Content</th></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.slug}</p></td><td>{row.merchantName || '-'}</td><td>{row.language.toUpperCase()}</td><td><Badge value={row.status} /></td><td><select className="portal-filter" value={row.assignedLegalUserId || ''} onChange={event => void assign(row.id, event.target.value)}><option value="" disabled>Unassigned</option>{legalUsers.filter(user => user.status === 'active').map(user => <option value={user.id} key={user.id}>{user.name}</option>)}</select></td><td>{formatDate(row.updatedAt)}</td><td><button type="button" className="portal-button" onClick={() => void openContent(row.id)}><Eye className="w-3.5 h-3.5" />View</button></td></tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
    {contentOpen && <PolicyContentModal policy={selectedPolicy} loading={contentLoading} close={() => { setContentOpen(false); setSelectedPolicy(null) }} />}
  </>
}

function BillingView({ mode, subscriptions, payments }: { mode: 'subscriptions' | 'payments'; subscriptions: Subscription[]; payments: Payment[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const visibleSubscriptions = subscriptions.filter(row => {
    const matchesQuery = `${row.id} ${row.merchantName || ''} ${row.merchantEmail || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'all' || row.status === statusFilter) && (typeFilter === 'all' || row.policyType === typeFilter)
  })
  const visiblePayments = payments.filter(row => {
    const matchesQuery = `${row.id} ${row.stripeInvoiceId || ''} ${row.merchantName || ''} ${row.merchantEmail || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery && (statusFilter === 'all' || row.status === statusFilter) && (typeFilter === 'all' || row.policyType === typeFilter)
  })
  const subscriptionPagination = usePagination(visibleSubscriptions)
  const paymentPagination = usePagination(visiblePayments)
  const source = mode === 'subscriptions' ? subscriptions : payments
  const statuses = Array.from(new Set(source.map(row => row.status)))
  const policyTypes = Array.from(new Set(source.map(row => row.policyType).filter((value): value is string => Boolean(value))))
  return <><PageTitle eyebrow="STRIPE MONITORING" title={mode === 'subscriptions' ? 'Subscriptions' : 'Payments'} description="Read-only billing state synchronized from Stripe." />
    <div className="flex flex-wrap items-center gap-2 mb-4"><SearchBox value={query} setValue={setQuery} placeholder={`Search ${mode}`} /><select className="portal-filter h-9" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option>{statuses.map(value => <option key={value} value={value}>{value}</option>)}</select><select className="portal-filter h-9" value={typeFilter} onChange={event => setTypeFilter(event.target.value)}><option value="all">All policy types</option>{policyTypes.map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    <section className="portal-panel"><div className="portal-table-wrap">{mode === 'subscriptions' ? <table className="portal-table"><thead><tr><th>Subscription</th><th>Merchant</th><th>Policy type</th><th>Period start</th><th>Period end</th><th>Cancellation</th><th>Status</th></tr></thead><tbody>{subscriptionPagination.pageRows.map(row => <tr key={row.id}><td className="font-mono text-xs">{row.id}</td><td><p className="font-semibold">{row.merchantName || '-'}</p><p className="text-xs text-gray-400">{row.merchantEmail}</p></td><td>{row.policyType}</td><td>{formatDate(row.currentPeriodStart)}</td><td>{formatDate(row.currentPeriodEnd)}</td><td>{row.cancelAtPeriodEnd ? 'At period end' : '-'}</td><td><Badge value={row.status} /></td></tr>)}</tbody></table> :
      <table className="portal-table"><thead><tr><th>Invoice</th><th>Merchant</th><th>Policy type</th><th>Amount</th><th>Paid at</th><th>Status</th></tr></thead><tbody>{paymentPagination.pageRows.map(row => <tr key={row.id}><td className="font-mono text-xs">{row.stripeInvoiceId || row.id}</td><td>{row.merchantName || '-'}</td><td>{row.policyType || '-'}</td><td>{money(row.amountPaid)} {row.currency.toUpperCase()}</td><td>{formatDate(row.paidAt)}</td><td><Badge value={row.status} /></td></tr>)}</tbody></table>}</div>{mode === 'subscriptions' ? <Pagination {...subscriptionPagination} total={visibleSubscriptions.length} /> : <Pagination {...paymentPagination} total={visiblePayments.length} />}</section>
  </>
}

function policyPreviewDocument(content: string) {
  const source = /<(?:!doctype|html|body|h[1-6]|p|div|ul|ol)\b/i.test(content)
    ? content
    : marked.parse(normalizePolicyMarkdown(content), { async: false }) as string
  const parsed = new DOMParser().parseFromString(source, 'text/html')
  parsed.querySelectorAll('script, iframe, object, embed, form, meta[http-equiv], base').forEach(node => node.remove())
  parsed.querySelectorAll('*').forEach(node => {
    Array.from(node.attributes).forEach(attribute => {
      if (attribute.name.toLowerCase().startsWith('on') || /javascript:/i.test(attribute.value)) node.removeAttribute(attribute.name)
    })
  })
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:"><style>body{max-width:850px;margin:0 auto;padding:40px 48px;color:#172033;font:15px/1.75 Arial,'Noto Sans Thai',sans-serif}h1{font-size:30px}h2{font-size:22px;margin-top:32px;padding-top:18px;border-top:1px solid #dce1e8}h3{font-size:18px}a{color:#087a5b}li{margin:6px 0}blockquote{margin:18px 0;padding:12px 16px;border-left:3px solid #087a5b;background:#edf5f2}table{width:100%;border-collapse:collapse}th,td{border:1px solid #dce1e8;padding:8px;text-align:left}@media(max-width:640px){body{padding:24px 18px}}</style></head><body>${parsed.body.innerHTML}</body></html>`
}

function PolicyContentModal({ policy, loading, close }: { policy: AdminPolicyDetail | null; loading: boolean; close: () => void }) {
  const availableLanguages = policy
    ? ([['th', policy.contentTh], ['en', policy.contentEn]] as const).filter((entry): entry is readonly ['th' | 'en', string] => Boolean(entry[1]))
    : []
  const [language, setLanguage] = useState<'th' | 'en'>('th')
  const selectedLanguage = availableLanguages.some(([value]) => value === language) ? language : availableLanguages[0]?.[0]
  const content = selectedLanguage === 'en' ? policy?.contentEn : policy?.contentTh

  return <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-3 sm:p-6" role="dialog" aria-modal="true" aria-label="Policy content">
    <section className="portal-panel flex h-[92vh] w-full max-w-6xl flex-col overflow-hidden">
      <header className="portal-panel-head shrink-0">
        <div className="min-w-0"><p className="text-sm font-semibold">{policy?.websiteName || 'Policy content'}</p><p className="mt-1 truncate text-xs text-gray-400">{policy?.slug || 'Loading document...'}</p></div>
        <button type="button" className="portal-button px-2" onClick={close} aria-label="Close policy content"><X className="w-4 h-4" /></button>
      </header>
      {loading ? <div className="portal-empty flex-1">Loading policy content...</div> : policy ? <>
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-gray-200 px-5 py-3">
          <Badge value={policy.status} />
          <span className="text-xs text-gray-500">Version {policy.version}</span>
          <span className="text-xs text-gray-300">|</span>
          <span className="text-xs text-gray-500">Reviewed {formatDate(policy.reviewedAt)}</span>
          <div className="ml-auto flex gap-2">{availableLanguages.map(([value]) => <button type="button" className="portal-filter" data-active={selectedLanguage === value} onClick={() => setLanguage(value)} key={value}><Languages className="w-3.5 h-3.5" />{value === 'th' ? 'Thai' : 'English'}</button>)}</div>
        </div>
        {content ? <iframe className="min-h-0 flex-1 w-full bg-white" sandbox="" srcDoc={policyPreviewDocument(content)} title={`${policy.websiteName} ${selectedLanguage || ''} policy`} /> : <div className="portal-empty flex-1">No policy content is available.</div>}
      </> : <div className="portal-empty flex-1">Unable to load policy content.</div>}
    </section>
  </div>
}

function LegalAssignments({ users, policies }: { users: LegalUser[]; policies: Policy[] }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [reviewerFilter, setReviewerFilter] = useState('all')
  const [error, setError] = useState('')
  const [selectedPolicy, setSelectedPolicy] = useState<AdminPolicyDetail | null>(null)
  const [contentOpen, setContentOpen] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const visible = policies.filter(row => {
    if (!row.assignedLegalUserId) return false
    const reviewer = users.find(user => user.id === row.assignedLegalUserId)
    const matchesQuery = `${row.websiteName} ${row.slug} ${row.merchantName || ''} ${reviewer?.name || ''} ${reviewer?.email || ''}`.toLowerCase().includes(query.toLowerCase())
    return matchesQuery
      && (statusFilter === 'all' || row.status === statusFilter)
      && (reviewerFilter === 'all' || row.assignedLegalUserId === reviewerFilter)
  })
  const pagination = usePagination(visible)
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null); setContentOpen(true); setContentLoading(true); setError('')
    const response = await api.admin.getPolicy(policyId)
    setContentLoading(false)
    if (!response.success || !response.data) { setError(response.error?.message || 'Unable to load policy content.'); return }
    setSelectedPolicy(response.data.policy)
  }

  return <><PageTitle eyebrow="LEGAL OPERATIONS" title="Review assignments" description="Track every assigned policy by reviewer and review status." />
    <div className="mb-4 flex flex-wrap items-center gap-2">
      {(['all', 'pending_review', 'approved', 'rejected'] as const).map(value => <button key={value} className="portal-filter" data-active={statusFilter === value} onClick={() => setStatusFilter(value)}>{value === 'all' ? 'All reviews' : value.replaceAll('_', ' ')}</button>)}
      <div className="sm:ml-auto"><SearchBox value={query} setValue={setQuery} placeholder="Search assigned policies" /></div>
      <select className="portal-filter h-9" value={reviewerFilter} onChange={event => setReviewerFilter(event.target.value)} aria-label="Filter by legal reviewer"><option value="all">All legal reviewers</option>{users.map(user => <option value={user.id} key={user.id}>{user.name} ({user.email})</option>)}</select>
    </div>
    {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Policy</th><th>Legal reviewer</th><th>Merchant</th><th>Status</th><th>Deadline</th><th>Content</th></tr></thead><tbody>{pagination.pageRows.map(row => { const reviewer = users.find(user => user.id === row.assignedLegalUserId); return <tr key={row.id}><td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.slug}</p></td><td><p className="font-semibold">{reviewer?.name || 'Unknown reviewer'}</p><p className="text-xs text-gray-400">{reviewer?.email}</p></td><td>{row.merchantName || row.merchantEmail || '-'}</td><td><Badge value={row.status} /></td><td>{formatDate(row.approvalDeadline)}</td><td><button type="button" className="portal-button" onClick={() => void openContent(row.id)}><Eye className="w-3.5 h-3.5" />View</button></td></tr>})}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
    {contentOpen && <PolicyContentModal policy={selectedPolicy} loading={contentLoading} close={() => { setContentOpen(false); setSelectedPolicy(null) }} />}
  </>
}

function LegalManagement({ users, setUsers, workload, reviews }: {
  users: LegalUser[]
  setUsers: React.Dispatch<React.SetStateAction<LegalUser[]>>
  workload: AdminLegalWorkload[]
  reviews: AdminLegalReview[]
}) {
  const [tab, setTab] = useState<'users' | 'workload' | 'history'>('users')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', password: '', phone: '' })
  const [editing, setEditing] = useState<LegalUser | null>(null)
  const [editDraft, setEditDraft] = useState({ name: '', email: '', phone: '' })
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [selectedPolicy, setSelectedPolicy] = useState<AdminPolicyDetail | null>(null)
  const [contentOpen, setContentOpen] = useState(false)
  const [contentLoading, setContentLoading] = useState(false)
  const visibleUsers = users.filter(row => `${row.name} ${row.email} ${row.phone || ''}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || row.status === statusFilter))
  const visibleWorkload = workload.filter(row => row.name.toLowerCase().includes(query.toLowerCase()) && (statusFilter !== 'overdue' || row.overdue > 0))
  const visibleReviews = reviews.filter(row => `${row.legalUserEmail} ${row.websiteName} ${row.policySlug} ${row.comment || ''}`.toLowerCase().includes(query.toLowerCase()) && (statusFilter === 'all' || row.status === statusFilter))
  const userPagination = usePagination(visibleUsers)
  const workloadPagination = usePagination(visibleWorkload)
  const reviewPagination = usePagination(visibleReviews)
  const refreshUsers = async () => {
    const response = await api.admin.listLegalUsers()
    if (response.success && response.data) setUsers(response.data.legalUsers)
  }
  const create = async () => {
    if (!draft.name || !draft.email || draft.password.length < 8) { setError('Name, email, and a password of at least 8 characters are required.'); return }
    setError('')
    const response = await api.admin.createLegalUser({ ...draft, status: 'active' })
    if (!response.success) { setError(response.error?.message || 'Unable to create legal user.'); return }
    await refreshUsers()
    setDraft({ name: '', email: '', password: '', phone: '' }); setCreating(false)
  }
  const startEdit = (row: LegalUser) => {
    setError('')
    setEditing(row)
    setEditDraft({ name: row.name, email: row.email, phone: row.phone || '' })
  }
  const saveEdit = async () => {
    if (!editing) return
    if (!editDraft.name.trim() || !editDraft.email.trim()) { setError('Name and email are required.'); return }
    setError('')
    const response = await api.admin.updateLegalUser(editing.id, {
      name: editDraft.name,
      email: editDraft.email,
      phone: editDraft.phone,
    })
    if (!response.success || !response.data) { setError(response.error?.message || 'Unable to update legal user.'); return }
    setUsers(current => current.map(row => row.id === editing.id ? { ...row, ...response.data } : row))
    setEditing(null)
  }
  const updateStatus = async (id: string, status: LegalStatus) => {
    setError('')
    const response = await api.admin.updateLegalUserStatus(id, status)
    if (!response.success) { setError(response.error?.message || 'Unable to update legal user.'); return }
    setUsers(current => current.map(row => row.id === id ? { ...row, status } : row))
  }
  const openContent = async (policyId: string) => {
    setSelectedPolicy(null); setContentOpen(true); setContentLoading(true); setError('')
    const response = await api.admin.getPolicy(policyId)
    setContentLoading(false)
    if (!response.success || !response.data) { setError(response.error?.message || 'Unable to load policy content.'); return }
    setSelectedPolicy(response.data.policy)
  }
  return <><PageTitle eyebrow="LEGAL MANAGEMENT" title="Legal team" description="Manage reviewers, workload, assignments, and review history." action={<button className="portal-button primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" />Create legal user</button>} />
    <div className="flex flex-wrap items-center gap-2 mb-4">{(['users', 'workload', 'history'] as const).map(value => <button key={value} className="portal-filter" data-active={tab === value} onClick={() => { setTab(value); setStatusFilter('all') }}>{value}</button>)}<div className="sm:ml-auto"><SearchBox value={query} setValue={setQuery} placeholder={tab === 'history' ? 'Search review history' : 'Search legal team'} /></div><select className="portal-filter h-9" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All {tab === 'history' ? 'actions' : tab === 'workload' ? 'workload' : 'statuses'}</option>{tab === 'users' ? (['active', 'suspended', 'inactive'] as const).map(value => <option key={value} value={value}>{value}</option>) : tab === 'workload' ? <option value="overdue">Overdue only</option> : (['approved', 'rejected', 'edited'] as const).map(value => <option key={value} value={value}>{value}</option>)}</select></div>
    {error && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
    <section className="portal-panel"><div className="portal-table-wrap">{tab === 'users' ? <table className="portal-table"><thead><tr><th>Legal user</th><th>Phone</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Status</th><th>Manage</th></tr></thead><tbody>{userPagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.name}</p><p className="text-xs text-gray-400">{row.email}</p></td><td>{row.phone || '-'}</td><td>{row.pendingReviews}</td><td>{row.approvedCount}</td><td>{row.rejectedCount}</td><td><Badge value={row.status} /></td><td><div className="flex flex-wrap items-center gap-2"><button type="button" className="portal-button" onClick={() => startEdit(row)}><Pencil className="w-3.5 h-3.5" />Edit</button><select className="portal-filter" value={row.status} onChange={event => void updateStatus(row.id, event.target.value as LegalStatus)} aria-label={`Update ${row.name} status`}>{['active', 'suspended', 'inactive'].map(value => <option key={value}>{value}</option>)}</select></div></td></tr>)}</tbody></table> :
      tab === 'workload' ? <table className="portal-table"><thead><tr><th>Reviewer</th><th>Pending</th><th>Overdue</th><th>Approved this month</th><th>Average review</th><th>Load</th></tr></thead><tbody>{workloadPagination.pageRows.map(row => <tr key={row.legalUserId}><td className="font-semibold">{row.name}</td><td>{row.pending}</td><td>{row.overdue}</td><td>{row.approvedThisMonth}</td><td>{row.averageReviewHours}h</td><td><div className="w-32 h-1.5 bg-gray-100"><div className="h-full bg-green-700" style={{ width: Math.min(100, row.pending * 12) + '%' }} /></div></td></tr>)}</tbody></table> :
      <table className="portal-table"><thead><tr><th>Reviewer</th><th>Policy</th><th>Action</th><th>Comment</th><th>Reviewed at</th><th>Content</th></tr></thead><tbody>{reviewPagination.pageRows.map(row => <tr key={row.reviewId}><td>{row.legalUserEmail}</td><td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.policySlug}</p></td><td><Badge value={row.status} /></td><td>{row.comment || '-'}</td><td>{formatDate(row.reviewedAt)}</td><td><button type="button" className="portal-button" onClick={() => void openContent(row.policyId)}><Eye className="w-3.5 h-3.5" />View</button></td></tr>)}</tbody></table>}</div>{tab === 'users' ? <Pagination {...userPagination} total={visibleUsers.length} /> : tab === 'workload' ? <Pagination {...workloadPagination} total={visibleWorkload.length} /> : <Pagination {...reviewPagination} total={visibleReviews.length} />}</section>
    {creating && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"><div className="portal-panel w-full max-w-md"><div className="portal-panel-head"><h2 className="text-sm font-semibold">Create legal user</h2><button className="portal-button px-2" onClick={() => setCreating(false)} aria-label="Close"><X className="w-4 h-4" /></button></div><div className="p-5 space-y-4">{(['name', 'email', 'password', 'phone'] as const).map(field => <label className="block text-xs font-semibold text-gray-600 capitalize" key={field}>{field}<input className="mt-2 w-full h-10 border border-gray-300 rounded px-3 text-sm font-normal" type={field === 'password' ? 'password' : field === 'email' ? 'email' : 'text'} value={draft[field]} onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} /></label>)}<button className="portal-button primary w-full" onClick={() => void create()}>Create account</button></div></div></div>}
    {editing && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"><div className="portal-panel w-full max-w-md"><div className="portal-panel-head"><h2 className="text-sm font-semibold">Edit legal user</h2><button className="portal-button px-2" onClick={() => setEditing(null)} aria-label="Close"><X className="w-4 h-4" /></button></div><div className="p-5 space-y-4">{(['name', 'email', 'phone'] as const).map(field => <label className="block text-xs font-semibold text-gray-600 capitalize" key={field}>{field}<input className="mt-2 w-full h-10 border border-gray-300 rounded px-3 text-sm font-normal" type={field === 'email' ? 'email' : 'text'} value={editDraft[field]} onChange={event => setEditDraft(current => ({ ...current, [field]: event.target.value }))} /></label>)}<button className="portal-button primary w-full" onClick={() => void saveEdit()}>Save changes</button></div></div></div>}
    {contentOpen && <PolicyContentModal policy={selectedPolicy} loading={contentLoading} close={() => { setContentOpen(false); setSelectedPolicy(null) }} />}
  </>
}

function LogsView({ logs }: { logs: ErrorLog[] }) {
  const pagination = usePagination(logs)
  return <><PageTitle eyebrow="SYSTEM MONITORING" title="Error logs" description="Sanitized operational failures from backend services." />
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Level</th><th>Service</th><th>Request</th><th>Message</th><th>Time</th></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><Badge value={row.level} /></td><td>{row.service}</td><td className="font-mono text-xs">{String(row.context?.method || '')} {String(row.context?.path || '-')}</td><td>{row.message}</td><td>{formatDate(row.createdAt)}</td></tr>)}</tbody></table></div><Pagination {...pagination} total={logs.length} /></section>
  </>
}

function AnalyticsView({ analytics }: { analytics: AdminAnalytics }) {
  const metrics = [{ label: 'Revenue this month', value: money(analytics.revenue.currentMonth), hint: analytics.revenue.currencyUnit }, { label: 'Merchant growth', value: `${analytics.merchantGrowth.monthOverMonthPercent}%`, hint: 'Month over month' }, { label: 'New merchants', value: analytics.merchantGrowth.newThisMonth, hint: 'Current month' }, { label: 'Subscription churn', value: analytics.merchantGrowth.churnedSubscriptionsThisMonth, hint: 'Current month' }]
  return <><PageTitle eyebrow="PLATFORM INTELLIGENCE" title="Analytics" description="Revenue, growth, policy, and operational risk indicators." /><section className="portal-kpis">{metrics.map(row => <div className="portal-kpi" key={row.label}><Activity className="w-4 h-4 text-blue-700 mb-4" /><p className="text-2xl font-semibold">{row.value}</p><p className="text-xs text-gray-600 mt-1">{row.label}</p><p className="text-[11px] text-gray-400 mt-1">{row.hint}</p></div>)}</section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-5">Revenue by policy type</h2>{Object.entries(analytics.revenue.byPolicyType).map(([type, value]) => <MetricBar key={type} label={type} value={value} max={analytics.revenue.total} />)}</section><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-5">Policy status</h2>{Object.entries(analytics.policies.byStatus).map(([status, count]) => <MetricBar key={status} label={status.replaceAll('_', ' ')} value={count} max={Object.values(analytics.policies.byStatus).reduce((sum, value) => sum + value, 0)} />)}</section></div>
  </>
}

function MetricBar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 && value > 0 ? Math.max(5, value / max * 100) : 0
  return <div className="mb-4 last:mb-0"><div className="flex justify-between text-xs mb-2"><span className="capitalize">{label}</span><strong>{value}</strong></div><div className="h-2 bg-gray-100"><div className="h-full bg-blue-700" style={{ width: width + '%' }} /></div></div>
}

function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input className="portal-search" value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} /></div>
}

export default function Admin() {
  const navigate = useNavigate()
  const [view, setView] = useState<AdminView>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmLogout, setConfirmLogout] = useState(false)
  const [merchants, setMerchants] = useState<Merchant[]>([])
  const [policies, setPolicies] = useState<Policy[]>([])
  const [legalUsers, setLegalUsers] = useState<LegalUser[]>([])
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [payments, setPayments] = useState<Payment[]>([])
  const [logs, setLogs] = useState<ErrorLog[]>([])
  const [workload, setWorkload] = useState<AdminLegalWorkload[]>([])
  const [reviews, setReviews] = useState<AdminLegalReview[]>([])
  const [overview, setOverview] = useState<AdminOverview | null>(null)
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  useEffect(() => {
    let active = true
    void Promise.all([
      api.admin.overview(), api.admin.listMerchants({ limit: 200 }), api.admin.listPolicies({ limit: 200 }),
      api.admin.listLegalUsers(), api.admin.listSubscriptions({ limit: 200 }), api.admin.listPayments({ limit: 200 }),
      api.admin.listLogs({ limit: 200 }), api.admin.analytics(), api.admin.legalWorkload(), api.admin.legalReviews({ limit: 200 }),
    ]).then(([overviewResponse, merchantsResponse, policiesResponse, legalUsersResponse, subscriptionsResponse, paymentsResponse, logsResponse, analyticsResponse, workloadResponse, reviewsResponse]) => {
      if (!active) return
      if (overviewResponse.success && overviewResponse.data) setOverview(overviewResponse.data)
      if (merchantsResponse.success && merchantsResponse.data) setMerchants(merchantsResponse.data.merchants)
      if (policiesResponse.success && policiesResponse.data) setPolicies(policiesResponse.data.policies)
      if (legalUsersResponse.success && legalUsersResponse.data) setLegalUsers(legalUsersResponse.data.legalUsers)
      if (subscriptionsResponse.success && subscriptionsResponse.data) setSubscriptions(subscriptionsResponse.data.subscriptions)
      if (paymentsResponse.success && paymentsResponse.data) setPayments(paymentsResponse.data.payments)
      if (logsResponse.success && logsResponse.data) setLogs(logsResponse.data.logs)
      if (analyticsResponse.success && analyticsResponse.data) setAnalytics(analyticsResponse.data)
      if (workloadResponse.success && workloadResponse.data) setWorkload(workloadResponse.data.workload)
      if (reviewsResponse.success && reviewsResponse.data) setReviews(reviewsResponse.data.reviews)
      const failed = [overviewResponse, merchantsResponse, policiesResponse, legalUsersResponse, subscriptionsResponse, paymentsResponse, logsResponse, analyticsResponse, workloadResponse, reviewsResponse].find(response => !response.success)
      setLoadError(failed?.error?.message || '')
      setLoading(false)
    })
    return () => { active = false }
  }, [])
  const activeTitle = useMemo(() => view.charAt(0).toUpperCase() + view.slice(1), [view])
  const logout = () => setConfirmLogout(true)
  const confirmSignOut = () => { session.logout(); navigate('/login', { replace: true }) }
  let content: React.ReactNode
  if (loading) content = <div className="portal-empty">Loading admin portal...</div>
  else if (view === 'overview' && overview) content = <Overview overview={overview} legalUsers={legalUsers} change={setView} />
  else if (view === 'merchants') content = <MerchantView rows={merchants} setRows={setMerchants} />
  else if (view === 'policies') content = <PolicyView rows={policies} legalUsers={legalUsers} setRows={setPolicies} />
  else if (view === 'subscriptions' || view === 'payments') content = <BillingView mode={view} subscriptions={subscriptions} payments={payments} />
  else if (view === 'assignments') content = <LegalAssignments users={legalUsers} policies={policies} />
  else if (view === 'legal') content = <LegalManagement users={legalUsers} setUsers={setLegalUsers} workload={workload} reviews={reviews} />
  else if (view === 'logs') content = <LogsView logs={logs} />
  else if (view === 'analytics' && analytics) content = <AnalyticsView analytics={analytics} />
  else content = <div className="portal-empty">This admin view could not be loaded.</div>
  return <div className="portal-shell"><ConfirmDialog open={confirmLogout} title="Sign out of Admin?" description="You will need to sign in again to access platform administration." confirmLabel="Sign out" onConfirm={confirmSignOut} onCancel={() => setConfirmLogout(false)} /><Sidebar view={view} change={setView} open={menuOpen} close={() => setMenuOpen(false)} logout={logout} /><div className="portal-main"><header className="portal-topbar"><div className="flex items-center gap-3"><button className="portal-button portal-mobile-menu px-2" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu className="w-4 h-4" /></button><div><p className="text-sm font-semibold">{activeTitle}</p><p className="text-[11px] text-gray-400">Platform administration</p></div></div><span className="inline-flex items-center gap-2 text-xs text-gray-500"><Landmark className="w-4 h-4 text-green-700" />Administrator</span></header><main className="portal-content portal-content-admin">{loadError && <p className="mb-4 border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">{loadError}</p>}{content}</main></div></div>
}
