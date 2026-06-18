import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, Users, CreditCard, Activity, BarChart3,
  LogOut, ShieldAlert, Search, ChevronLeft, CheckCircle,
  XCircle, Clock, AlertCircle, TrendingUp, DollarSign,
  Eye, Ban, Play, X, Menu, RefreshCw, Loader,
  ArrowUpRight, ArrowDownRight, FileText, Scale,
} from 'lucide-react'

// ── Admin credentials ─────────────────────────────────────────
const ADMIN_EMAIL    = 'admin@flowpdpa.co.th'
const ADMIN_PASSWORD = 'admin2025'

// ── Types ─────────────────────────────────────────────────────
type AdminView = 'overview' | 'merchants' | 'subscriptions' | 'payments' | 'monitoring' | 'analytics'

type MerchantStatus = 'active' | 'suspended' | 'pending'
type SubStatus      = 'active' | 'suspended' | 'cancelled' | 'expired'
type PayStatus      = 'success' | 'pending' | 'failed'
type LogLevel       = 'error' | 'warning' | 'critical'

interface Merchant {
  id: string
  shop_name: string
  owner_email: string
  subscription_status: MerchantStatus
  plan: string
  total_scans: number
  created_at: string
  line_connected: boolean
  quota: number
  used: number
}

interface Subscription {
  id: string
  merchant_name: string
  plan: string
  status: SubStatus
  billing_cycle: string
  expires_at: string
  started_at: string
  amount: number
}

interface Payment {
  id: string
  merchant_name: string
  amount: number
  gateway: string
  status: PayStatus
  created_at: string
  plan: string
}

interface ErrorLog {
  id: string
  level: LogLevel
  service: string
  message: string
  merchant_id: string
  created_at: string
}

// ── Mock Data ─────────────────────────────────────────────────
const mockMerchants: Merchant[] = [
  { id: 'M001', shop_name: 'ร้านดอกไม้ขอนแก่น',   owner_email: 'flower@shop.th',   subscription_status: 'active',    plan: 'Pro',     total_scans: 342,  created_at: '2024-01-15', line_connected: true,  quota: 1000, used: 342 },
  { id: 'M002', shop_name: 'คาเฟ่สุขใจ',            owner_email: 'cafe@sujai.th',    subscription_status: 'active',    plan: 'Starter', total_scans: 128,  created_at: '2024-02-03', line_connected: true,  quota: 200,  used: 128 },
  { id: 'M003', shop_name: 'Tech Startup Co.',      owner_email: 'hello@techco.th',  subscription_status: 'suspended', plan: 'Pro',     total_scans: 890,  created_at: '2023-11-22', line_connected: false, quota: 1000, used: 890 },
  { id: 'M004', shop_name: 'ออนไลน์ช็อปปิ้ง 99',   owner_email: 'shop99@mail.com',  subscription_status: 'active',    plan: 'Free',    total_scans: 38,   created_at: '2024-04-10', line_connected: false, quota: 50,   used: 38  },
  { id: 'M005', shop_name: 'คลินิกสุขภาพดี',        owner_email: 'health@clinic.th', subscription_status: 'active',    plan: 'Pro',     total_scans: 1205, created_at: '2023-09-01', line_connected: true,  quota: 1000, used: 1000 },
  { id: 'M006', shop_name: 'บริษัท นำเข้าสินค้า',  owner_email: 'import@biz.co.th', subscription_status: 'pending',   plan: 'Starter', total_scans: 0,    created_at: '2025-05-17', line_connected: false, quota: 200,  used: 0   },
  { id: 'M007', shop_name: 'ร้านอาหารไทยแท้',       owner_email: 'thai@food.th',     subscription_status: 'active',    plan: 'Starter', total_scans: 76,   created_at: '2024-03-28', line_connected: true,  quota: 200,  used: 76  },
  { id: 'M008', shop_name: 'Studio Photo Art',      owner_email: 'studio@photo.th',  subscription_status: 'active',    plan: 'Free',    total_scans: 12,   created_at: '2025-01-09', line_connected: false, quota: 50,   used: 12  },
]

const mockSubscriptions: Subscription[] = [
  { id: 'SUB001', merchant_name: 'ร้านดอกไม้ขอนแก่น', plan: 'Pro',     status: 'active',    billing_cycle: 'monthly', expires_at: '2025-06-15', started_at: '2025-05-15', amount: 799  },
  { id: 'SUB002', merchant_name: 'คาเฟ่สุขใจ',          plan: 'Starter', status: 'active',    billing_cycle: 'monthly', expires_at: '2025-06-03', started_at: '2025-05-03', amount: 299  },
  { id: 'SUB003', merchant_name: 'Tech Startup Co.',    plan: 'Pro',     status: 'suspended', billing_cycle: 'yearly',  expires_at: '2025-11-22', started_at: '2024-11-22', amount: 7990 },
  { id: 'SUB004', merchant_name: 'คลินิกสุขภาพดี',      plan: 'Pro',     status: 'active',    billing_cycle: 'yearly',  expires_at: '2025-09-01', started_at: '2024-09-01', amount: 7990 },
  { id: 'SUB005', merchant_name: 'บริษัท นำเข้าสินค้า', plan: 'Starter', status: 'cancelled', billing_cycle: 'monthly', expires_at: '2025-04-28', started_at: '2025-03-28', amount: 299  },
  { id: 'SUB006', merchant_name: 'ร้านอาหารไทยแท้',     plan: 'Starter', status: 'active',    billing_cycle: 'monthly', expires_at: '2025-06-28', started_at: '2025-05-28', amount: 299  },
]

const mockPayments: Payment[] = [
  { id: 'PAY001', merchant_name: 'ร้านดอกไม้ขอนแก่น', amount: 799,  gateway: 'promptpay', status: 'success', created_at: '2025-05-15T10:22:00Z', plan: 'Pro'     },
  { id: 'PAY002', merchant_name: 'คาเฟ่สุขใจ',          amount: 299,  gateway: 'promptpay', status: 'success', created_at: '2025-05-03T09:14:00Z', plan: 'Starter' },
  { id: 'PAY003', merchant_name: 'บริษัท นำเข้าสินค้า', amount: 299,  gateway: 'promptpay', status: 'pending', created_at: '2025-05-17T14:05:00Z', plan: 'Starter' },
  { id: 'PAY004', merchant_name: 'Tech Startup Co.',    amount: 7990, gateway: 'bank_transfer', status: 'failed',  created_at: '2025-04-10T16:33:00Z', plan: 'Pro'     },
  { id: 'PAY005', merchant_name: 'ร้านอาหารไทยแท้',     amount: 299,  gateway: 'promptpay', status: 'success', created_at: '2025-05-28T11:00:00Z', plan: 'Starter' },
  { id: 'PAY006', merchant_name: 'Studio Photo Art',    amount: 0,    gateway: 'free',      status: 'success', created_at: '2025-01-09T08:45:00Z', plan: 'Free'    },
]

const mockErrorLogs: ErrorLog[] = [
  { id: 'LOG001', level: 'error',    service: 'slip_verification', message: 'Timeout connecting to bank validation API',   merchant_id: 'M003', created_at: '2025-05-19T09:15:00Z' },
  { id: 'LOG002', level: 'warning',  service: 'line_notify',       message: 'LINE channel token expired for merchant',      merchant_id: 'M003', created_at: '2025-05-19T08:30:00Z' },
  { id: 'LOG003', level: 'critical', service: 'payment_gateway',   message: 'PromptPay QR generation failed (3 retries)',   merchant_id: 'M006', created_at: '2025-05-19T07:55:00Z' },
  { id: 'LOG004', level: 'error',    service: 'slip_verification', message: 'Invalid EMVCo QR format received',             merchant_id: 'M005', created_at: '2025-05-18T22:10:00Z' },
  { id: 'LOG005', level: 'warning',  service: 'quota_checker',     message: 'Merchant reached 100% quota limit',            merchant_id: 'M005', created_at: '2025-05-18T20:00:00Z' },
  { id: 'LOG006', level: 'error',    service: 'auth',              message: 'JWT verification failed — expired token',      merchant_id: 'M001', created_at: '2025-05-18T18:44:00Z' },
]

// ── Shared UI helpers ─────────────────────────────────────────
function Badge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span
      className="inline-flex items-center text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
      style={{ color, backgroundColor: bg }}
    >
      {label}
    </span>
  )
}

function merchantStatusBadge(status: MerchantStatus) {
  const map: Record<MerchantStatus, { label: string; color: string; bg: string }> = {
    active:    { label: 'Active',    color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
    suspended: { label: 'Suspended', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
    pending:   { label: 'Pending',   color: '#d97706', bg: 'rgba(217,119,6,0.12)'  },
  }
  const s = map[status]
  return <Badge label={s.label} color={s.color} bg={s.bg} />
}

function subStatusBadge(status: SubStatus) {
  const map: Record<SubStatus, { label: string; color: string; bg: string }> = {
    active:    { label: 'Active',    color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
    suspended: { label: 'Suspended', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
    cancelled: { label: 'Cancelled', color: '#64748b', bg: '#f1f5f9'                },
    expired:   { label: 'Expired',   color: '#9ca3af', bg: '#f8fafc'               },
  }
  const s = map[status]
  return <Badge label={s.label} color={s.color} bg={s.bg} />
}

function payStatusBadge(status: PayStatus) {
  const map: Record<PayStatus, { label: string; color: string; bg: string }> = {
    success: { label: 'Success', color: '#059669', bg: 'rgba(5,150,105,0.12)'  },
    pending: { label: 'Pending', color: '#d97706', bg: 'rgba(217,119,6,0.12)'  },
    failed:  { label: 'Failed',  color: '#dc2626', bg: 'rgba(220,38,38,0.1)'   },
  }
  const s = map[status]
  return <Badge label={s.label} color={s.color} bg={s.bg} />
}

function logLevelBadge(level: LogLevel) {
  const map: Record<LogLevel, { label: string; color: string; bg: string }> = {
    critical: { label: 'Critical', color: '#dc2626', bg: 'rgba(220,38,38,0.1)'  },
    error:    { label: 'Error',    color: '#ea580c', bg: 'rgba(234,88,12,0.1)'  },
    warning:  { label: 'Warning',  color: '#d97706', bg: 'rgba(217,119,6,0.1)'  },
  }
  const s = map[level]
  return <Badge label={s.label} color={s.color} bg={s.bg} />
}

function planBadge(plan: string) {
  const color = plan === 'Pro' ? '#7c3aed' : plan === 'Starter' ? 'var(--blue-mid)' : '#64748b'
  const bg    = plan === 'Pro' ? 'rgba(124,58,237,0.1)' : plan === 'Starter' ? 'rgba(37,99,235,0.1)' : '#f1f5f9'
  return <Badge label={plan} color={color} bg={bg} />
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('th-TH', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

function KpiCard({ label, value, sub, Icon, color, trend }: {
  label: string; value: string; sub?: string
  Icon: React.ElementType; color: string; trend?: 'up' | 'down'
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-5">
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: color + '18' }}>
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
        {trend && (
          trend === 'up'
            ? <ArrowUpRight className="w-4 h-4 text-green-500" />
            : <ArrowDownRight className="w-4 h-4 text-red-400" />
        )}
      </div>
      <div className="text-2xl font-black text-gray-900 mb-0.5">{value}</div>
      <div className="text-xs font-medium text-gray-400">{label}</div>
      {sub && <div className="text-xs text-gray-300 mt-1">{sub}</div>}
    </div>
  )
}

// ── Views ─────────────────────────────────────────────────────

function Overview() {
  const activeMerchants  = mockMerchants.filter(m => m.subscription_status === 'active').length
  const totalRevenue     = mockPayments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0)
  const pendingPayments  = mockPayments.filter(p => p.status === 'pending').length
  const openErrors       = mockErrorLogs.filter(l => l.level === 'critical' || l.level === 'error').length

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900 mb-1">Admin Overview</h1>
        <p className="text-sm text-gray-400">Platform-wide summary — FlowPDPA Backoffice</p>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Active Merchants"   value={String(activeMerchants)}       Icon={Users}         color="#2563eb" trend="up" />
        <KpiCard label="Total Revenue (฿)"  value={totalRevenue.toLocaleString()}  Icon={DollarSign}    color="#059669" trend="up" />
        <KpiCard label="Pending Payments"   value={String(pendingPayments)}        Icon={Clock}         color="#d97706" />
        <KpiCard label="Active Errors"      value={String(openErrors)}             Icon={AlertCircle}   color="#dc2626" trend="down" />
      </div>

      {/* Usage snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <div
          className="lg:col-span-2 rounded-xl p-6"
          style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--green)' }}>Scan Activity (This Month)</p>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Scans Today', value: '1,204' },
              { label: 'Total Scans / Month', value: '28,450' },
              { label: 'Error Rate', value: '1.2%' },
            ].map(({ label, value }) => (
              <div key={label}>
                <div className="text-2xl font-black text-white mb-1">{value}</div>
                <div className="text-xs" style={{ color: '#64748b' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-4">Plan Distribution</p>
          {[
            { plan: 'Pro',     count: mockMerchants.filter(m => m.plan === 'Pro').length,     color: '#7c3aed' },
            { plan: 'Starter', count: mockMerchants.filter(m => m.plan === 'Starter').length, color: 'var(--blue-mid)' },
            { plan: 'Free',    count: mockMerchants.filter(m => m.plan === 'Free').length,    color: '#94a3b8' },
          ].map(({ plan, count, color }) => (
            <div key={plan} className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
                <span className="text-sm text-gray-700">{plan}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{count} merchants</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Recent payments */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Payments</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {mockPayments.slice(0, 4).map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[160px]">{p.merchant_name}</p>
                  <p className="text-xs text-gray-400">{formatDate(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-gray-800">฿{p.amount.toLocaleString()}</span>
                  {payStatusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent errors */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Recent Errors</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {mockErrorLogs.slice(0, 4).map(log => (
              <div key={log.id} className="px-5 py-3">
                <div className="flex items-start justify-between gap-3 mb-1">
                  {logLevelBadge(log.level)}
                  <span className="text-xs text-gray-300 shrink-0">{formatDateTime(log.created_at)}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed truncate">{log.message}</p>
                <p className="text-xs text-gray-300 mt-0.5">{log.service}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MerchantsView() {
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | MerchantStatus>('all')
  const [detail, setDetail] = useState<Merchant | null>(null)

  const filtered = mockMerchants.filter(m => {
    const matchSearch = m.shop_name.toLowerCase().includes(search.toLowerCase()) || m.owner_email.includes(search)
    const matchStatus = filterStatus === 'all' || m.subscription_status === filterStatus
    return matchSearch && matchStatus
  })

  if (detail) return <MerchantDetail merchant={detail} onBack={() => setDetail(null)} />

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">Merchants</h1>
          <p className="text-sm text-gray-400">{mockMerchants.length} merchants registered</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
          <input
            type="text"
            placeholder="ค้นหา ชื่อร้าน หรือ อีเมล..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none text-gray-800"
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'active', 'suspended', 'pending'] as const).map(s => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize"
              style={{
                backgroundColor: filterStatus === s ? 'var(--navy)' : 'white',
                color: filterStatus === s ? 'white' : '#6b7280',
                borderColor: filterStatus === s ? 'var(--navy)' : '#e5e7eb',
              }}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400 gap-3">
          <div className="col-span-3">ร้านค้า</div>
          <div className="col-span-3">อีเมล</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1">Scans</div>
          <div className="col-span-1 text-right">ดู</div>
        </div>

        {filtered.length === 0 ? (
          <div className="py-14 text-center text-sm text-gray-400">ไม่พบผลลัพธ์</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {filtered.map(m => (
              <div key={m.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
                <div className="col-span-2 md:col-span-3">
                  <p className="text-sm font-semibold text-gray-900">{m.shop_name}</p>
                  <p className="text-xs text-gray-400 md:hidden">{m.owner_email}</p>
                </div>
                <div className="hidden md:block md:col-span-3 text-xs text-gray-500 truncate">{m.owner_email}</div>
                <div className="hidden md:block md:col-span-2">{planBadge(m.plan)}</div>
                <div className="col-span-1 md:col-span-2">{merchantStatusBadge(m.subscription_status)}</div>
                <div className="hidden md:block md:col-span-1 text-xs text-gray-500">{m.total_scans.toLocaleString()}</div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => setDetail(m)}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function MerchantDetail({ merchant, onBack }: { merchant: Merchant; onBack: () => void }) {
  const sub = mockSubscriptions.find(s => s.merchant_name === merchant.shop_name)
  const pays = mockPayments.filter(p => p.merchant_name === merchant.shop_name)
  const quotaPct = Math.round((merchant.used / merchant.quota) * 100)

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-gray-700 transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Back to Merchants
      </button>

      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-1">{merchant.shop_name}</h1>
          <p className="text-sm text-gray-400">{merchant.owner_email} · Joined {formatDate(merchant.created_at)}</p>
        </div>
        <div className="flex gap-2">
          {merchantStatusBadge(merchant.subscription_status)}
          {planBadge(merchant.plan)}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Usage */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Quota Usage</p>
          <div className="flex items-end gap-2 mb-2">
            <span className="text-2xl font-black text-gray-900">{merchant.used}</span>
            <span className="text-sm text-gray-400 mb-0.5">/ {merchant.quota} scans</span>
          </div>
          <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(quotaPct, 100)}%`,
                backgroundColor: quotaPct >= 90 ? '#dc2626' : quotaPct >= 70 ? '#d97706' : 'var(--green)',
              }}
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">{quotaPct}% used</p>
        </div>

        {/* Subscription */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">Subscription</p>
          {sub ? (
            <>
              <div className="flex items-center gap-2 mb-2">{subStatusBadge(sub.status)}</div>
              <p className="text-sm text-gray-700 mb-1">Plan: <strong>{sub.plan}</strong> ({sub.billing_cycle})</p>
              <p className="text-sm text-gray-700">Expires: <strong>{formatDate(sub.expires_at)}</strong></p>
              <p className="text-xs text-gray-400 mt-2">฿{sub.amount.toLocaleString()} / cycle</p>
            </>
          ) : (
            <p className="text-sm text-gray-400">No active subscription</p>
          )}
        </div>

        {/* LINE */}
        <div className="bg-white rounded-xl border border-gray-100 p-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-3">LINE Integration</p>
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ backgroundColor: merchant.line_connected ? 'var(--green)' : '#dc2626' }}
            />
            <span className="text-sm font-semibold text-gray-700">
              {merchant.line_connected ? 'Connected' : 'Not connected'}
            </span>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            {merchant.line_connected
              ? 'Webhook active, notifications enabled'
              : 'Merchant has not set up LINE integration'}
          </p>
        </div>
      </div>

      {/* Payment history */}
      <div className="bg-white rounded-xl border border-gray-100">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Payment History</h2>
        </div>
        {pays.length === 0 ? (
          <div className="py-10 text-center text-sm text-gray-400">No payments found</div>
        ) : (
          <div className="divide-y divide-gray-50">
            {pays.map(p => (
              <div key={p.id} className="flex items-center justify-between px-5 py-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{p.plan} plan</p>
                  <p className="text-xs text-gray-400">{p.gateway} · {formatDateTime(p.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold">฿{p.amount.toLocaleString()}</span>
                  {payStatusBadge(p.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SubscriptionsView() {
  const [filterStatus, setFilterStatus] = useState<'all' | SubStatus>('all')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const filtered = mockSubscriptions.filter(
    s => filterStatus === 'all' || s.status === filterStatus
  )

  function handleAction(id: string, action: 'activate' | 'suspend') {
    setActionFeedback(`${action === 'activate' ? 'Activated' : 'Suspended'} subscription ${id}`)
    setTimeout(() => setActionFeedback(null), 3000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-0.5">Subscriptions</h1>
        <p className="text-sm text-gray-400">{mockSubscriptions.length} subscriptions total</p>
      </div>

      {actionFeedback && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm font-semibold"
          style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)', border: '1px solid rgba(5,150,105,0.2)' }}
        >
          <CheckCircle className="w-4 h-4" /> {actionFeedback}
        </div>
      )}

      {/* Filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        {(['all', 'active', 'suspended', 'cancelled', 'expired'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize"
            style={{
              backgroundColor: filterStatus === s ? 'var(--navy)' : 'white',
              color: filterStatus === s ? 'white' : '#6b7280',
              borderColor: filterStatus === s ? 'var(--navy)' : '#e5e7eb',
            }}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400 gap-3">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">ร้านค้า</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2">Expires</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-1 text-right">Actions</div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(s => (
            <div key={s.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-4 items-center hover:bg-gray-50 transition-colors">
              <div className="hidden md:block md:col-span-1">
                <span className="text-xs font-mono text-gray-400">{s.id}</span>
              </div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm font-semibold text-gray-900">{s.merchant_name}</p>
                <p className="text-xs text-gray-400">{s.billing_cycle}</p>
              </div>
              <div className="hidden md:block md:col-span-2">{planBadge(s.plan)}</div>
              <div className="col-span-1 md:col-span-2">{subStatusBadge(s.status)}</div>
              <div className="hidden md:block md:col-span-2 text-xs text-gray-500">{formatDate(s.expires_at)}</div>
              <div className="hidden md:block md:col-span-1 text-sm font-bold text-gray-800">฿{s.amount.toLocaleString()}</div>
              <div className="col-span-1 flex items-center justify-end gap-1">
                {s.status === 'suspended' && (
                  <button
                    title="Activate"
                    onClick={() => handleAction(s.id, 'activate')}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-green-50 hover:text-green-600 transition-colors"
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                )}
                {s.status === 'active' && (
                  <button
                    title="Suspend"
                    onClick={() => handleAction(s.id, 'suspend')}
                    className="w-7 h-7 flex items-center justify-center rounded-md text-gray-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                  >
                    <Ban className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function PaymentsView() {
  const [filterStatus, setFilterStatus] = useState<'all' | PayStatus>('all')
  const [actionFeedback, setActionFeedback] = useState<string | null>(null)

  const filtered = mockPayments.filter(
    p => filterStatus === 'all' || p.status === filterStatus
  )

  function handleApprove(id: string) {
    setActionFeedback(`Payment ${id} approved successfully.`)
    setTimeout(() => setActionFeedback(null), 3000)
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-0.5">Payments</h1>
        <p className="text-sm text-gray-400">{mockPayments.length} payment records</p>
      </div>

      {actionFeedback && (
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-lg mb-4 text-sm font-semibold"
          style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)', border: '1px solid rgba(5,150,105,0.2)' }}
        >
          <CheckCircle className="w-4 h-4" /> {actionFeedback}
        </div>
      )}

      {/* KPI row */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Collected',  value: '฿' + mockPayments.filter(p => p.status === 'success').reduce((s,p) => s+p.amount, 0).toLocaleString(), color: '#059669' },
          { label: 'Pending Review',   value: String(mockPayments.filter(p => p.status === 'pending').length),  color: '#d97706' },
          { label: 'Failed',           value: String(mockPayments.filter(p => p.status === 'failed').length),   color: '#dc2626' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-100 p-4 text-center">
            <div className="text-xl font-black mb-0.5" style={{ color }}>{value}</div>
            <div className="text-xs text-gray-400">{label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-5">
        {(['all', 'success', 'pending', 'failed'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className="text-xs font-semibold px-3 py-2 rounded-lg border transition-colors capitalize"
            style={{
              backgroundColor: filterStatus === s ? 'var(--navy)' : 'white',
              color: filterStatus === s ? 'white' : '#6b7280',
              borderColor: filterStatus === s ? 'var(--navy)' : '#e5e7eb',
            }}
          >
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold uppercase tracking-wider text-gray-400 gap-3">
          <div className="col-span-1">ID</div>
          <div className="col-span-3">ร้านค้า</div>
          <div className="col-span-2">Plan</div>
          <div className="col-span-2">Gateway</div>
          <div className="col-span-1">Amount</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-1 text-right">Action</div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(p => (
            <div key={p.id} className="grid grid-cols-2 md:grid-cols-12 gap-3 px-5 py-3.5 items-center hover:bg-gray-50 transition-colors">
              <div className="hidden md:block md:col-span-1 text-xs font-mono text-gray-400">{p.id}</div>
              <div className="col-span-2 md:col-span-3">
                <p className="text-sm font-semibold text-gray-900">{p.merchant_name}</p>
                <p className="text-xs text-gray-400">{formatDateTime(p.created_at)}</p>
              </div>
              <div className="hidden md:block md:col-span-2">{planBadge(p.plan)}</div>
              <div className="hidden md:block md:col-span-2 text-xs text-gray-500 capitalize">{p.gateway.replace('_', ' ')}</div>
              <div className="hidden md:block md:col-span-1 text-sm font-bold text-gray-800">
                {p.amount === 0 ? <span className="text-gray-400">Free</span> : `฿${p.amount.toLocaleString()}`}
              </div>
              <div className="col-span-1 md:col-span-2">{payStatusBadge(p.status)}</div>
              <div className="col-span-1 flex justify-end">
                {p.status === 'pending' && (
                  <button
                    onClick={() => handleApprove(p.id)}
                    className="text-xs font-bold px-3 py-1.5 rounded-lg transition-colors"
                    style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)' }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(5,150,105,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(5,150,105,0.1)')}
                  >
                    Approve
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MonitoringView() {
  const [filterLevel, setFilterLevel] = useState<'all' | LogLevel>('all')
  const [refreshing, setRefreshing] = useState(false)

  const filtered = mockErrorLogs.filter(l => filterLevel === 'all' || l.level === filterLevel)

  function handleRefresh() {
    setRefreshing(true)
    setTimeout(() => setRefreshing(false), 1000)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-black text-gray-900 mb-0.5">Monitoring</h1>
          <p className="text-sm text-gray-400">System health and error logs</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* System health cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Scans Today',      value: '1,204', color: '#059669', Icon: Activity },
          { label: 'Scans This Month', value: '28,450', color: 'var(--blue-mid)', Icon: BarChart3 },
          { label: 'Active Merchants', value: String(mockMerchants.filter(m => m.subscription_status === 'active').length), color: '#7c3aed', Icon: Users },
          { label: 'Error Rate',       value: '1.2%',  color: '#dc2626', Icon: AlertCircle },
        ].map(({ label, value, color, Icon }) => (
          <KpiCard key={label} label={label} value={value} Icon={Icon} color={color} />
        ))}
      </div>

      {/* Error logs */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-bold text-gray-900">Error Logs</h2>
          <div className="flex gap-2">
            {(['all', 'critical', 'error', 'warning'] as const).map(l => (
              <button
                key={l}
                onClick={() => setFilterLevel(l)}
                className="text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors capitalize"
                style={{
                  backgroundColor: filterLevel === l ? 'var(--navy)' : 'white',
                  color: filterLevel === l ? 'white' : '#6b7280',
                  borderColor: filterLevel === l ? 'var(--navy)' : '#e5e7eb',
                }}
              >
                {l === 'all' ? 'All' : l}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-gray-50">
          {filtered.map(log => (
            <div key={log.id} className="px-5 py-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {logLevelBadge(log.level)}
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded"
                    style={{ backgroundColor: '#f1f5f9', color: '#475569' }}
                  >
                    {log.service}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{log.merchant_id}</span>
                </div>
                <span className="text-xs text-gray-300 shrink-0">{formatDateTime(log.created_at)}</span>
              </div>
              <p className="text-sm text-gray-700">{log.message}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function AnalyticsView() {
  const totalRevenue = mockPayments.filter(p => p.status === 'success').reduce((s, p) => s + p.amount, 0)
  const revenueByPlan = [
    { plan: 'Pro',     revenue: mockPayments.filter(p => p.plan === 'Pro'     && p.status === 'success').reduce((s, p) => s + p.amount, 0) },
    { plan: 'Starter', revenue: mockPayments.filter(p => p.plan === 'Starter' && p.status === 'success').reduce((s, p) => s + p.amount, 0) },
    { plan: 'Free',    revenue: 0 },
  ]

  const topMerchants = [...mockMerchants].sort((a, b) => b.total_scans - a.total_scans).slice(0, 5)
  const lowUsage     = mockMerchants.filter(m => m.total_scans < 50 && m.subscription_status === 'active')

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-0.5">Analytics</h1>
        <p className="text-sm text-gray-400">Platform revenue and merchant performance</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <KpiCard label="Total Revenue"    value={`฿${totalRevenue.toLocaleString()}`}  Icon={DollarSign}  color="#059669" trend="up" />
        <KpiCard label="MRR (Est.)"       value="฿63,500"                              Icon={TrendingUp}  color="var(--blue-mid)" trend="up" />
        <KpiCard label="Churn Rate"       value="3.1%"                                 Icon={XCircle}     color="#dc2626" />
        <KpiCard label="Renewal Rate"     value="96.9%"                                Icon={CheckCircle} color="#059669" trend="up" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Revenue by plan */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-5">Revenue by Plan</h2>
          {revenueByPlan.map(({ plan, revenue }) => {
            const pct = totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 100) : 0
            return (
              <div key={plan} className="mb-4 last:mb-0">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    {planBadge(plan)}
                  </div>
                  <span className="text-sm font-bold text-gray-800">฿{revenue.toLocaleString()}</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-100 overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: plan === 'Pro' ? '#7c3aed' : plan === 'Starter' ? 'var(--blue-mid)' : '#e5e7eb',
                    }}
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">{pct}% of total revenue</p>
              </div>
            )
          })}
        </div>

        {/* Growth snapshot */}
        <div
          className="rounded-xl p-6"
          style={{ background: 'linear-gradient(135deg, var(--navy) 0%, var(--navy-light) 100%)', border: '1px solid rgba(255,255,255,0.06)' }}
        >
          <h2 className="text-sm font-bold text-white mb-5">Growth Snapshot</h2>
          <div className="space-y-4">
            {[
              { label: 'Month-over-month growth', value: '+12.4%', positive: true  },
              { label: 'New merchants (this month)', value: '+3',   positive: true  },
              { label: 'Churned merchants',          value: '1',    positive: false },
              { label: 'Avg. scans per merchant',    value: '374',  positive: true  },
            ].map(({ label, value, positive }) => (
              <div key={label} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                <span className="text-sm" style={{ color: '#94a3b8' }}>{label}</span>
                <span
                  className="text-sm font-black"
                  style={{ color: positive ? 'var(--green)' : '#f87171' }}
                >
                  {value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Merchant performance tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top active merchants */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Top Active Merchants</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {topMerchants.map((m, i) => (
              <div key={m.id} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black text-gray-300 w-4">#{i + 1}</span>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.shop_name}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">{planBadge(m.plan)}</div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-gray-900">{m.total_scans.toLocaleString()}</p>
                  <p className="text-xs text-gray-400">scans</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Low usage merchants */}
        <div className="bg-white rounded-xl border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900">Low Usage (Active Plan)</h2>
            <p className="text-xs text-gray-400 mt-0.5">Active subscription but &lt;50 scans — may churn</p>
          </div>
          {lowUsage.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No at-risk merchants</div>
          ) : (
            <div className="divide-y divide-gray-50">
              {lowUsage.map(m => (
                <div key={m.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{m.shop_name}</p>
                    <p className="text-xs text-gray-400">{m.owner_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold" style={{ color: '#d97706' }}>{m.total_scans} scans</p>
                    <p className="text-xs text-gray-400">{planBadge(m.plan)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Admin Login Gate ──────────────────────────────────────────
function AdminLoginGate({ onSuccess }: { onSuccess: () => void }) {
  const [email, setEmail]   = useState('')
  const [pw, setPw]         = useState('')
  const [error, setError]   = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (email === ADMIN_EMAIL && pw === ADMIN_PASSWORD) {
      localStorage.setItem('flowpdpa_admin', '1')
      onSuccess()
    } else {
      setError('Invalid admin credentials')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--navy)' }}>
      <div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: '#0f1f38', border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.5)' }}
      >
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center mb-6"
          style={{ backgroundColor: 'rgba(220,38,38,0.15)' }}
        >
          <ShieldAlert className="w-6 h-6 text-red-400" />
        </div>
        <h1 className="text-xl font-black text-white mb-1">Admin Access</h1>
        <p className="text-sm mb-7" style={{ color: '#64748b' }}>FlowPDPA Backoffice — restricted area</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {['email', 'password'].map(field => (
            <div key={field}>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#64748b' }}>
                {field === 'email' ? 'Admin Email' : 'Password'}
              </label>
              <input
                type={field === 'password' ? 'password' : 'email'}
                required
                placeholder={field === 'email' ? 'admin@flowpdpa.co.th' : '••••••••'}
                value={field === 'email' ? email : pw}
                onChange={e => { field === 'email' ? setEmail(e.target.value) : setPw(e.target.value); setError('') }}
                className="w-full rounded-lg px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none transition-colors"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                onFocus={e => (e.currentTarget.style.borderColor = '#dc2626')}
                onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
              />
            </div>
          ))}

          {error && (
            <div className="text-xs px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'rgba(239,68,68,0.1)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)' }}>
              {error}
            </div>
          )}

          <button type="submit" className="w-full py-3 rounded-lg text-sm font-bold text-white transition-colors" style={{ backgroundColor: '#dc2626' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#b91c1c')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#dc2626')}
          >
            Access Backoffice
          </button>
        </form>

        <div className="mt-5 px-3 py-2.5 rounded-lg text-xs" style={{ backgroundColor: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.15)' }}>
          <p className="font-semibold text-red-400 mb-0.5">Demo Credentials</p>
          <p style={{ color: '#475569' }}>Email: <span className="text-white">admin@flowpdpa.co.th</span></p>
          <p style={{ color: '#475569' }}>Pass: <span className="text-white">admin2025</span></p>
        </div>

        <div className="mt-6 text-center">
          <Link to="/" className="text-xs transition-colors" style={{ color: '#334155' }}
            onMouseEnter={e => (e.currentTarget.style.color = '#64748b')}
            onMouseLeave={e => (e.currentTarget.style.color = '#334155')}
          >
            ← Back to FlowPDPA
          </Link>
        </div>
      </div>
    </div>
  )
}

// ── Sidebar nav ───────────────────────────────────────────────
const navItems: { key: AdminView; label: string; Icon: React.ElementType }[] = [
  { key: 'overview',       label: 'Overview',       Icon: LayoutDashboard },
  { key: 'merchants',      label: 'Merchants',       Icon: Users           },
  { key: 'subscriptions',  label: 'Subscriptions',   Icon: FileText        },
  { key: 'payments',       label: 'Payments',        Icon: CreditCard      },
  { key: 'monitoring',     label: 'Monitoring',      Icon: Activity        },
  { key: 'analytics',      label: 'Analytics',       Icon: BarChart3       },
]

// ── Main Admin ────────────────────────────────────────────────
export default function Admin() {
  const navigate          = useNavigate()
  const [authed, setAuthed]           = useState(false)
  const [view, setView]               = useState<AdminView>('overview')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loading, setLoading]         = useState(true)

  useEffect(() => {
    const ok = localStorage.getItem('flowpdpa_admin') === '1'
    setAuthed(ok)
    setLoading(false)
  }, [])

  function handleLogout() {
    localStorage.removeItem('flowpdpa_admin')
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--navy)' }}>
        <Loader className="w-6 h-6 animate-spin text-gray-500" />
      </div>
    )
  }

  if (!authed) return <AdminLoginGate onSuccess={() => setAuthed(true)} />

  const pending = mockPayments.filter(p => p.status === 'pending').length
  const errors  = mockErrorLogs.filter(l => l.level === 'critical').length

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: '#f8fafc' }}>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 flex flex-col transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}
        style={{ width: '240px', backgroundColor: 'var(--navy)', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Logo */}
        <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <div className="flex items-center gap-0.5">
              <span className="font-black text-base text-white tracking-tight">Flow</span>
              <span className="font-black text-base tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
            </div>
            <span
              className="text-xs font-bold px-2 py-0.5 rounded mt-1 inline-block"
              style={{ backgroundColor: 'rgba(220,38,38,0.2)', color: '#f87171' }}
            >
              Admin
            </span>
          </div>
          <button className="lg:hidden text-gray-500 hover:text-white" onClick={() => setSidebarOpen(false)}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {navItems.map(({ key, label, Icon }) => {
            const active = view === key
            const badge = key === 'payments' && pending > 0 ? pending
                        : key === 'monitoring' && errors > 0 ? errors
                        : null
            return (
              <button
                key={key}
                onClick={() => { setView(key); setSidebarOpen(false) }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left"
                style={{
                  backgroundColor: active ? 'rgba(220,38,38,0.15)' : 'transparent',
                  color: active ? '#f87171' : '#475569',
                }}
                onMouseEnter={e => { if (!active) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {badge !== null && (
                  <span
                    className="text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center"
                    style={{ backgroundColor: 'rgba(220,38,38,0.25)', color: '#f87171' }}
                  >
                    {badge}
                  </span>
                )}
              </button>
            )
          })}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center gap-3 px-3 py-2.5 mb-1">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ backgroundColor: '#dc2626' }}>
              A
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-semibold text-white truncate">Admin</div>
              <div className="text-xs truncate" style={{ color: '#334155' }}>admin@flowpdpa.co.th</div>
            </div>
          </div>
          <Link
            to="/legal"
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors mb-0.5"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(37,99,235,0.1)'; e.currentTarget.style.color = '#60a5fa' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569' }}
          >
            <Scale className="w-4 h-4 shrink-0" />
            Legal Portal
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors"
            style={{ color: '#475569' }}
            onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#ef4444' }}
            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#475569' }}
          >
            <LogOut className="w-4 h-4 shrink-0" /> Logout
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-60">

        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-white" style={{ borderBottom: '1px solid #e5e7eb' }}>
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 transition-colors"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-bold text-gray-900 capitalize">{navItems.find(n => n.key === view)?.label}</h1>
              <p className="text-xs text-gray-400 hidden sm:block">FlowPDPA Admin Backoffice</p>
            </div>
          </div>
          <Link
            to="/dashboard"
            className="text-xs font-semibold transition-colors px-3 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            ← User Dashboard
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-6">
          {view === 'overview'      && <Overview />}
          {view === 'merchants'     && <MerchantsView />}
          {view === 'subscriptions' && <SubscriptionsView />}
          {view === 'payments'      && <PaymentsView />}
          {view === 'monitoring'    && <MonitoringView />}
          {view === 'analytics'     && <AnalyticsView />}
        </main>
      </div>
    </div>
  )
}
