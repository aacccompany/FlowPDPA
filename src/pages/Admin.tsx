import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Activity, AlertTriangle, BarChart3, ChevronLeft, ChevronRight,
  CircleDollarSign, CreditCard, FileText, Gauge, Landmark, LogOut,
  Menu, Plus, ReceiptText, Scale, Search, ShieldCheck,
  UserCog, Users, WalletCards, X,
} from 'lucide-react'
import { session } from '@/utils/storage'
import './Portal.css'

type AdminView = 'overview' | 'merchants' | 'subscriptions' | 'payments' | 'policies' | 'legal' | 'logs' | 'analytics'
type MerchantStatus = 'active' | 'pending' | 'suspended' | 'inactive'
type PolicyStatus = 'pending_review' | 'approved' | 'edited' | 'rejected' | 'archived'
type LegalStatus = 'active' | 'suspended' | 'inactive'

interface Merchant {
  id: string; name: string; email: string; plan: string; status: MerchantStatus
  policyCount: number; subscriptionStatus: string; createdAt: string
}
interface Policy {
  id: string; slug: string; websiteName: string; merchantName: string; type: string
  language: string; status: PolicyStatus; assignedLegalUserId: string | null; updatedAt: string
}
interface LegalUser {
  id: string; name: string; email: string; phone: string; status: LegalStatus
  pendingReviews: number; approvedCount: number; rejectedCount: number; averageReviewHours: number
}
interface Subscription {
  id: string; merchantName: string; policyType: string; status: string; amount: number; interval: string; currentPeriodEnd: string
}
interface Payment {
  id: string; merchantName: string; amount: number; currency: string; status: string; invoiceNumber: string; paidAt: string
}
interface ErrorLog {
  id: string; level: 'critical' | 'error' | 'warning'; service: string; code: string; message: string; createdAt: string
}

const merchantSeed: Merchant[] = [
  { id: 'm-1001', name: 'Baan Aroon Co., Ltd.', email: 'privacy@baanaroon.co.th', plan: 'Free', status: 'active', policyCount: 2, subscriptionStatus: 'free', createdAt: '2026-06-01T08:00:00Z' },
  { id: 'm-1002', name: 'Northstar Health Co., Ltd.', email: 'dpo@northstarclinic.com', plan: 'Premium', status: 'active', policyCount: 4, subscriptionStatus: 'active', createdAt: '2026-05-18T09:20:00Z' },
  { id: 'm-1003', name: 'Siam Supply Partnership', email: 'contact@siamsupply.co.th', plan: 'Free', status: 'pending', policyCount: 1, subscriptionStatus: 'free', createdAt: '2026-06-19T11:05:00Z' },
  { id: 'm-1004', name: 'Paperplane Studio', email: 'hello@paperplane.studio', plan: 'Premium', status: 'suspended', policyCount: 3, subscriptionStatus: 'past_due', createdAt: '2026-04-12T15:40:00Z' },
  { id: 'm-1005', name: 'River Market', email: 'owner@rivermarket.co.th', plan: 'Free', status: 'active', policyCount: 1, subscriptionStatus: 'free', createdAt: '2026-06-11T04:30:00Z' },
]

const policySeed: Policy[] = [
  { id: 'p-2001', slug: 'baan-aroon-privacy-f2ddc823', websiteName: 'Baan Aroon Living', merchantName: 'Baan Aroon Co., Ltd.', type: 'privacy', language: 'both', status: 'pending_review', assignedLegalUserId: 'l-3001', updatedAt: '2026-06-20T08:12:00Z' },
  { id: 'p-2002', slug: 'northstar-clinic-privacy-a40c16d5', websiteName: 'Northstar Clinic', merchantName: 'Northstar Health Co., Ltd.', type: 'privacy', language: 'th', status: 'pending_review', assignedLegalUserId: 'l-3002', updatedAt: '2026-06-19T11:40:00Z' },
  { id: 'p-2003', slug: 'siam-supply-privacy-e3f4620f', websiteName: 'Siam Supply', merchantName: 'Siam Supply Partnership', type: 'privacy', language: 'both', status: 'approved', assignedLegalUserId: 'l-3001', updatedAt: '2026-06-19T10:00:00Z' },
  { id: 'p-2004', slug: 'paperplane-privacy-cf50353f', websiteName: 'Paperplane Studio', merchantName: 'Paperplane Studio', type: 'privacy', language: 'en', status: 'rejected', assignedLegalUserId: 'l-3002', updatedAt: '2026-06-18T10:00:00Z' },
]

const legalSeed: LegalUser[] = [
  { id: 'l-3001', name: 'Nicha Rattanakul', email: 'nicha.legal@flowpdpa.co.th', phone: '0812345678', status: 'active', pendingReviews: 4, approvedCount: 38, rejectedCount: 3, averageReviewHours: 16 },
  { id: 'l-3002', name: 'Kittisak Wongchai', email: 'kittisak.legal@flowpdpa.co.th', phone: '0898765432', status: 'active', pendingReviews: 5, approvedCount: 31, rejectedCount: 5, averageReviewHours: 21 },
  { id: 'l-3003', name: 'Ploy Chantarangsu', email: 'ploy.legal@flowpdpa.co.th', phone: '0861122334', status: 'suspended', pendingReviews: 0, approvedCount: 16, rejectedCount: 1, averageReviewHours: 19 },
]

const subscriptions: Subscription[] = [
  { id: 'sub-4001', merchantName: 'Northstar Health Co., Ltd.', policyType: 'dpa', status: 'active', amount: 1290, interval: 'month', currentPeriodEnd: '2026-07-18T00:00:00Z' },
  { id: 'sub-4002', merchantName: 'Paperplane Studio', policyType: 'hr', status: 'past_due', amount: 890, interval: 'month', currentPeriodEnd: '2026-06-12T00:00:00Z' },
  { id: 'sub-4003', merchantName: 'River Market', policyType: 'privacy', status: 'free', amount: 0, interval: 'none', currentPeriodEnd: '2027-06-11T00:00:00Z' },
]

const payments: Payment[] = [
  { id: 'in_40929', merchantName: 'Northstar Health Co., Ltd.', amount: 1290, currency: 'THB', status: 'paid', invoiceNumber: 'FP-2026-0061', paidAt: '2026-06-18T07:20:00Z' },
  { id: 'in_40912', merchantName: 'Paperplane Studio', amount: 890, currency: 'THB', status: 'failed', invoiceNumber: 'FP-2026-0058', paidAt: '2026-06-12T03:10:00Z' },
  { id: 'in_40881', merchantName: 'Northstar Health Co., Ltd.', amount: 1290, currency: 'THB', status: 'paid', invoiceNumber: 'FP-2026-0049', paidAt: '2026-05-18T07:20:00Z' },
]

const logs: ErrorLog[] = [
  { id: 'err-5001', level: 'critical', service: 'stripe_billing', code: 'WEBHOOK_SIGNATURE_INVALID', message: 'Stripe webhook signature verification failed.', createdAt: '2026-06-20T11:28:00Z' },
  { id: 'err-5002', level: 'error', service: 'policy_export', code: 'PDF_EXPORT_FAILED', message: 'PDF renderer timed out while generating an approved policy.', createdAt: '2026-06-20T09:45:00Z' },
  { id: 'err-5003', level: 'warning', service: 'email', code: 'SMTP_QUIT_TIMEOUT', message: 'Message sent but SMTP connection timed out during quit.', createdAt: '2026-06-19T16:02:00Z' },
]

const formatDate = (value: string) => new Date(value).toLocaleString('th-TH', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const money = (amount: number) => new Intl.NumberFormat('th-TH', { style: 'currency', currency: 'THB', maximumFractionDigits: 0 }).format(amount)

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

const ADMIN_PAGE_SIZE = 3

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
    { label: 'Operations', items: [{ id: 'legal' as const, text: 'Legal management', Icon: Scale }, { id: 'logs' as const, text: 'Error logs', Icon: AlertTriangle }, { id: 'analytics' as const, text: 'Analytics', Icon: BarChart3 }] },
  ]
  return <>{open && <button className="portal-overlay" onClick={close} aria-label="Close navigation" />}<aside className="portal-sidebar" data-open={open}>
    <div className="portal-brand"><span className="portal-brand-mark"><ShieldCheck className="w-4 h-4" /></span><div><p className="text-sm font-bold">FlowPDPA</p><p className="text-[10px] text-gray-400">ADMIN CONSOLE</p></div></div>
    <nav className="portal-nav flex-1 overflow-y-auto">{groups.map(group => <div key={group.label}><p className="portal-nav-label">{group.label}</p>{group.items.map(({ id, text, Icon }) => <button key={id} className="portal-nav-item" data-active={view === id} onClick={() => { change(id); close() }}><Icon />{text}</button>)}</div>)}</nav>
    <div className="portal-account"><div className="flex items-center gap-3 mb-3"><span className="w-8 h-8 grid place-items-center rounded bg-green-50 text-green-700"><UserCog className="w-4 h-4" /></span><div><p className="text-xs font-semibold">Platform Admin</p><p className="text-[11px] text-gray-400">admin@flowpdpa.co.th</p></div></div><button className="portal-nav-item" onClick={logout}><LogOut />Sign out</button></div>
  </aside></>
}

function Overview({ merchants, policies, legalUsers, change }: { merchants: Merchant[]; policies: Policy[]; legalUsers: LegalUser[]; change: (view: AdminView) => void }) {
  const revenue = payments.filter(row => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0)
  const stats = [
    { label: 'Active merchants', value: merchants.filter(row => row.status === 'active').length, Icon: Users, color: '#2457a6' },
    { label: 'Pending reviews', value: policies.filter(row => row.status === 'pending_review').length, Icon: FileText, color: '#a86207' },
    { label: 'Active legal users', value: legalUsers.filter(row => row.status === 'active').length, Icon: Scale, color: '#087a5b' },
    { label: 'Revenue this period', value: money(revenue), Icon: CircleDollarSign, color: '#087a5b' },
  ]
  return <><PageTitle eyebrow="PLATFORM OPERATIONS" title="Admin overview" description="Account, policy, billing, and legal-workflow health." />
    <section className="portal-kpis">{stats.map(({ label, value, Icon, color }) => <div className="portal-kpi" key={label}><Icon className="w-4 h-4 mb-4" style={{ color }} /><p className="text-2xl font-semibold">{value}</p><p className="text-xs text-gray-500 mt-1">{label}</p></div>)}</section>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
      <section className="portal-panel"><div className="portal-panel-head"><div><h2 className="text-sm font-semibold">Policy workflow</h2><p className="text-xs text-gray-400 mt-1">Current status distribution</p></div><button className="portal-button" onClick={() => change('policies')}>Open policies <ChevronRight className="w-3.5 h-3.5" /></button></div><div className="p-5 space-y-4">{(['pending_review', 'approved', 'edited', 'rejected'] as const).map(status => { const count = policies.filter(row => row.status === status).length; return <div key={status}><div className="flex justify-between text-xs mb-2"><span>{status.replaceAll('_', ' ')}</span><strong>{count}</strong></div><div className="h-1.5 bg-gray-100"><div className="h-full bg-green-700" style={{ width: Math.max(8, count / policies.length * 100) + '%' }} /></div></div> })}</div></section>
      <section className="portal-panel"><div className="portal-panel-head"><div><h2 className="text-sm font-semibold">Attention required</h2><p className="text-xs text-gray-400 mt-1">Operational items needing action</p></div></div><div className="divide-y divide-gray-100">{[
        { label: 'Past-due subscriptions', value: subscriptions.filter(row => row.status === 'past_due').length, Icon: CreditCard, view: 'subscriptions' as const },
        { label: 'Critical system errors', value: logs.filter(row => row.level === 'critical').length, Icon: AlertTriangle, view: 'logs' as const },
        { label: 'Suspended merchants', value: merchants.filter(row => row.status === 'suspended').length, Icon: Users, view: 'merchants' as const },
      ].map(item => <button key={item.label} className="w-full p-5 flex items-center justify-between text-left hover:bg-gray-50" onClick={() => change(item.view)}><span className="flex items-center gap-3 text-sm"><item.Icon className="w-4 h-4 text-gray-400" />{item.label}</span><span className="font-semibold">{item.value}</span></button>)}</div></section>
    </div>
  </>
}

function MerchantView({ rows, setRows }: { rows: Merchant[]; setRows: React.Dispatch<React.SetStateAction<Merchant[]>> }) {
  const [query, setQuery] = useState('')
  const visible = rows.filter(row => (row.name + row.email).toLowerCase().includes(query.toLowerCase()))
  const pagination = usePagination(visible)
  const update = (id: string, status: MerchantStatus) => setRows(current => current.map(row => row.id === id ? { ...row, status } : row))
  return <><PageTitle eyebrow="ACCOUNT MANAGEMENT" title="Merchants" description="Search accounts and control platform access." action={<SearchBox value={query} setValue={setQuery} placeholder="Search merchants" />} />
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Merchant</th><th>Plan</th><th>Policies</th><th>Subscription</th><th>Joined</th><th>Status</th><th /></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.name}</p><p className="text-xs text-gray-400">{row.email}</p></td><td>{row.plan}</td><td>{row.policyCount}</td><td><Badge value={row.subscriptionStatus} /></td><td>{formatDate(row.createdAt)}</td><td><Badge value={row.status} /></td><td><select className="portal-filter" value={row.status} onChange={event => update(row.id, event.target.value as MerchantStatus)}>{['active', 'pending', 'suspended', 'inactive'].map(value => <option key={value}>{value}</option>)}</select></td></tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
  </>
}

function PolicyView({ rows, legalUsers, setRows }: { rows: Policy[]; legalUsers: LegalUser[]; setRows: React.Dispatch<React.SetStateAction<Policy[]>> }) {
  const [filter, setFilter] = useState<'all' | PolicyStatus>('all')
  const visible = rows.filter(row => filter === 'all' || row.status === filter)
  const pagination = usePagination(visible)
  const assign = (id: string, legalId: string) => setRows(current => current.map(row => row.id === id ? { ...row, assignedLegalUserId: legalId || null } : row))
  return <><PageTitle eyebrow="POLICY OPERATIONS" title="All policies" description="Inspect workflow state and override automatic legal assignment." />
    <div className="flex flex-wrap gap-2 mb-4">{(['all', 'pending_review', 'approved', 'edited', 'rejected', 'archived'] as const).map(value => <button key={value} className="portal-filter" data-active={filter === value} onClick={() => setFilter(value)}>{value.replaceAll('_', ' ')}</button>)}</div>
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Website / policy</th><th>Merchant</th><th>Language</th><th>Status</th><th>Legal reviewer</th><th>Updated</th></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.slug}</p></td><td>{row.merchantName}</td><td>{row.language.toUpperCase()}</td><td><Badge value={row.status} /></td><td><select className="portal-filter" value={row.assignedLegalUserId || ''} onChange={event => assign(row.id, event.target.value)}><option value="">Unassigned</option>{legalUsers.filter(user => user.status === 'active').map(user => <option value={user.id} key={user.id}>{user.name}</option>)}</select></td><td>{formatDate(row.updatedAt)}</td></tr>)}</tbody></table></div><Pagination {...pagination} total={visible.length} /></section>
  </>
}

function BillingView({ mode }: { mode: 'subscriptions' | 'payments' }) {
  const subscriptionPagination = usePagination(subscriptions)
  const paymentPagination = usePagination(payments)
  return <><PageTitle eyebrow="STRIPE MONITORING" title={mode === 'subscriptions' ? 'Subscriptions' : 'Payments'} description="Read-only billing state synchronized from Stripe." />
    <section className="portal-panel"><div className="portal-table-wrap">{mode === 'subscriptions' ? <table className="portal-table"><thead><tr><th>Subscription</th><th>Merchant</th><th>Policy type</th><th>Amount</th><th>Interval</th><th>Period end</th><th>Status</th></tr></thead><tbody>{subscriptionPagination.pageRows.map(row => <tr key={row.id}><td className="font-mono text-xs">{row.id}</td><td className="font-semibold">{row.merchantName}</td><td>{row.policyType}</td><td>{money(row.amount)}</td><td>{row.interval}</td><td>{formatDate(row.currentPeriodEnd)}</td><td><Badge value={row.status} /></td></tr>)}</tbody></table> :
      <table className="portal-table"><thead><tr><th>Invoice</th><th>Merchant</th><th>Amount</th><th>Stripe ID</th><th>Paid at</th><th>Status</th></tr></thead><tbody>{paymentPagination.pageRows.map(row => <tr key={row.id}><td className="font-semibold">{row.invoiceNumber}</td><td>{row.merchantName}</td><td>{money(row.amount)} {row.currency}</td><td className="font-mono text-xs">{row.id}</td><td>{formatDate(row.paidAt)}</td><td><Badge value={row.status} /></td></tr>)}</tbody></table>}</div>{mode === 'subscriptions' ? <Pagination {...subscriptionPagination} total={subscriptions.length} /> : <Pagination {...paymentPagination} total={payments.length} />}</section>
  </>
}

function LegalManagement({ users, setUsers }: { users: LegalUser[]; setUsers: React.Dispatch<React.SetStateAction<LegalUser[]>> }) {
  const [tab, setTab] = useState<'users' | 'workload' | 'history'>('users')
  const [creating, setCreating] = useState(false)
  const [draft, setDraft] = useState({ name: '', email: '', phone: '' })
  const pagination = usePagination(users)
  const create = () => { if (!draft.name || !draft.email) return; setUsers(current => [...current, { id: 'l-' + Date.now(), ...draft, status: 'active', pendingReviews: 0, approvedCount: 0, rejectedCount: 0, averageReviewHours: 0 }]); setDraft({ name: '', email: '', phone: '' }); setCreating(false) }
  const updateStatus = (id: string, status: LegalStatus) => setUsers(current => current.map(row => row.id === id ? { ...row, status } : row))
  return <><PageTitle eyebrow="LEGAL MANAGEMENT" title="Legal team" description="Manage reviewers, workload, assignments, and review history." action={<button className="portal-button primary" onClick={() => setCreating(true)}><Plus className="w-4 h-4" />Create legal user</button>} />
    <div className="flex gap-2 mb-4">{(['users', 'workload', 'history'] as const).map(value => <button key={value} className="portal-filter" data-active={tab === value} onClick={() => setTab(value)}>{value}</button>)}</div>
    <section className="portal-panel"><div className="portal-table-wrap">{tab === 'users' ? <table className="portal-table"><thead><tr><th>Legal user</th><th>Phone</th><th>Pending</th><th>Approved</th><th>Rejected</th><th>Status</th><th /></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><p className="font-semibold">{row.name}</p><p className="text-xs text-gray-400">{row.email}</p></td><td>{row.phone}</td><td>{row.pendingReviews}</td><td>{row.approvedCount}</td><td>{row.rejectedCount}</td><td><Badge value={row.status} /></td><td><select className="portal-filter" value={row.status} onChange={event => updateStatus(row.id, event.target.value as LegalStatus)}>{['active', 'suspended', 'inactive'].map(value => <option key={value}>{value}</option>)}</select></td></tr>)}</tbody></table> :
      tab === 'workload' ? <table className="portal-table"><thead><tr><th>Reviewer</th><th>Pending</th><th>Approved total</th><th>Rejected total</th><th>Average review</th><th>Load</th></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td className="font-semibold">{row.name}</td><td>{row.pendingReviews}</td><td>{row.approvedCount}</td><td>{row.rejectedCount}</td><td>{row.averageReviewHours}h</td><td><div className="w-32 h-1.5 bg-gray-100"><div className="h-full bg-green-700" style={{ width: Math.min(100, row.pendingReviews * 12) + '%' }} /></div></td></tr>)}</tbody></table> :
      <table className="portal-table"><thead><tr><th>Reviewer</th><th>Policy</th><th>Action</th><th>Comment</th><th>Reviewed at</th></tr></thead><tbody>{policySeed.slice(0, 3).map((row, index) => <tr key={row.id}><td>{users[index % users.length].name}</td><td><p className="font-semibold">{row.websiteName}</p><p className="text-xs text-gray-400">{row.slug}</p></td><td><Badge value={row.status} /></td><td>{row.status === 'rejected' ? 'Legal basis requires clarification.' : 'Review completed.'}</td><td>{formatDate(row.updatedAt)}</td></tr>)}</tbody></table>}</div>{tab !== 'history' && <Pagination {...pagination} total={users.length} />}</section>
    {creating && <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/30 p-4"><div className="portal-panel w-full max-w-md"><div className="portal-panel-head"><h2 className="text-sm font-semibold">Create legal user</h2><button className="portal-button px-2" onClick={() => setCreating(false)} aria-label="Close"><X className="w-4 h-4" /></button></div><div className="p-5 space-y-4">{(['name', 'email', 'phone'] as const).map(field => <label className="block text-xs font-semibold text-gray-600 capitalize" key={field}>{field}<input className="mt-2 w-full h-10 border border-gray-300 rounded px-3 text-sm font-normal" type={field === 'email' ? 'email' : 'text'} value={draft[field]} onChange={event => setDraft(current => ({ ...current, [field]: event.target.value }))} /></label>)}<button className="portal-button primary w-full" onClick={create}>Create account</button></div></div></div>}
  </>
}

function LogsView() {
  const pagination = usePagination(logs)
  return <><PageTitle eyebrow="SYSTEM MONITORING" title="Error logs" description="Sanitized operational failures from backend services." />
    <section className="portal-panel"><div className="portal-table-wrap"><table className="portal-table"><thead><tr><th>Level</th><th>Service</th><th>Code</th><th>Message</th><th>Time</th></tr></thead><tbody>{pagination.pageRows.map(row => <tr key={row.id}><td><Badge value={row.level} /></td><td>{row.service}</td><td className="font-mono text-xs">{row.code}</td><td>{row.message}</td><td>{formatDate(row.createdAt)}</td></tr>)}</tbody></table></div><Pagination {...pagination} total={logs.length} /></section>
  </>
}

function AnalyticsView({ merchants, policies }: { merchants: Merchant[]; policies: Policy[] }) {
  const metrics = [{ label: 'Merchant growth', value: '+18.4%', hint: 'Last 30 days' }, { label: 'Policy approval rate', value: '81.2%', hint: 'Approved or edited' }, { label: 'Subscription churn', value: '2.8%', hint: 'Current month' }, { label: 'Average legal review', value: '18h', hint: 'Across active reviewers' }]
  return <><PageTitle eyebrow="PLATFORM INTELLIGENCE" title="Analytics" description="Revenue, growth, policy, and operational risk indicators." /><section className="portal-kpis">{metrics.map(row => <div className="portal-kpi" key={row.label}><Activity className="w-4 h-4 text-blue-700 mb-4" /><p className="text-2xl font-semibold">{row.value}</p><p className="text-xs text-gray-600 mt-1">{row.label}</p><p className="text-[11px] text-gray-400 mt-1">{row.hint}</p></div>)}</section>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-5">Merchant status</h2>{(['active', 'pending', 'suspended', 'inactive'] as const).map(status => { const count = merchants.filter(row => row.status === status).length; return <MetricBar key={status} label={status} value={count} max={merchants.length} /> })}</section><section className="portal-panel p-5"><h2 className="text-sm font-semibold mb-5">Policy status</h2>{(['pending_review', 'approved', 'edited', 'rejected'] as const).map(status => { const count = policies.filter(row => row.status === status).length; return <MetricBar key={status} label={status.replaceAll('_', ' ')} value={count} max={policies.length} /> })}</section></div>
  </>
}

function MetricBar({ label, value, max }: { label: string; value: number; max: number }) {
  return <div className="mb-4 last:mb-0"><div className="flex justify-between text-xs mb-2"><span className="capitalize">{label}</span><strong>{value}</strong></div><div className="h-2 bg-gray-100"><div className="h-full bg-blue-700" style={{ width: Math.max(5, value / max * 100) + '%' }} /></div></div>
}

function SearchBox({ value, setValue, placeholder }: { value: string; setValue: (value: string) => void; placeholder: string }) {
  return <div className="relative"><Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" /><input className="portal-search" value={value} onChange={event => setValue(event.target.value)} placeholder={placeholder} /></div>
}

export default function Admin() {
  const navigate = useNavigate()
  const [view, setView] = useState<AdminView>('overview')
  const [menuOpen, setMenuOpen] = useState(false)
  const [merchants, setMerchants] = useState(merchantSeed)
  const [policies, setPolicies] = useState(policySeed)
  const [legalUsers, setLegalUsers] = useState(legalSeed)
  const activeTitle = useMemo(() => view.charAt(0).toUpperCase() + view.slice(1), [view])
  const logout = () => { session.logout(); navigate('/login', { replace: true }) }
  let content: React.ReactNode
  if (view === 'overview') content = <Overview merchants={merchants} policies={policies} legalUsers={legalUsers} change={setView} />
  else if (view === 'merchants') content = <MerchantView rows={merchants} setRows={setMerchants} />
  else if (view === 'policies') content = <PolicyView rows={policies} legalUsers={legalUsers} setRows={setPolicies} />
  else if (view === 'subscriptions' || view === 'payments') content = <BillingView mode={view} />
  else if (view === 'legal') content = <LegalManagement users={legalUsers} setUsers={setLegalUsers} />
  else if (view === 'logs') content = <LogsView />
  else content = <AnalyticsView merchants={merchants} policies={policies} />
  return <div className="portal-shell"><Sidebar view={view} change={setView} open={menuOpen} close={() => setMenuOpen(false)} logout={logout} /><div className="portal-main"><header className="portal-topbar"><div className="flex items-center gap-3"><button className="portal-button portal-mobile-menu px-2" onClick={() => setMenuOpen(true)} aria-label="Open navigation"><Menu className="w-4 h-4" /></button><div><p className="text-sm font-semibold">{activeTitle}</p><p className="text-[11px] text-gray-400">Platform administration</p></div></div><span className="inline-flex items-center gap-2 text-xs text-gray-500"><Landmark className="w-4 h-4 text-green-700" />Administrator</span></header><main className="portal-content portal-content-admin">{content}</main></div></div>
}
