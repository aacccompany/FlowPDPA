import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, FileText, Plus, Settings, LogOut, Bell,
  ChevronRight, Download, Copy, Pencil,
  Trash2, CheckCircle, Clock, Globe, Lock, X, ShieldCheck,
} from 'lucide-react'

// ── Auth helper ───────────────────────────────────────────────
type AuthUser = { name: string; email: string; plan: string }

function getCurrentUser(): AuthUser {
  try {
    const raw = localStorage.getItem('flowpdpa_auth')
    if (raw) return JSON.parse(raw)
  } catch { /* ignore */ }
  return { name: 'User', email: '', plan: 'Free' }
}

// ── Mock data ────────────────────────────────────────────────

const policies = [
  {
    id: 1,
    name: 'Privacy + Cookies Policy',
    domain: 'mysite.com',
    lang: 'TH + EN',
    status: 'Active',
    updated: '12 May 2025',
    type: 'privacy',
  },
  {
    id: 3,
    name: 'HR Privacy Policy',
    domain: 'hr.mycompany.co.th',
    lang: 'TH',
    status: 'Draft',
    updated: '—',
    type: 'hr',
  },
]


// ── Sidebar nav items ─────────────────────────────────────────
const navItems = [
  { key: 'overview',  label: 'ภาพรวม',       Icon: LayoutDashboard },
  { key: 'policies',  label: 'นโยบายของฉัน',  Icon: FileText },
  { key: 'new',       label: 'สร้าง Policy ใหม่', Icon: Plus },
  { key: 'settings',  label: 'ตั้งค่าบัญชี',  Icon: Settings },
]

// ── Helpers ───────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const active = status === 'Active'
  return (
    <span
      className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{
        backgroundColor: active ? 'rgba(5,150,105,0.12)' : 'rgba(100,116,139,0.12)',
        color: active ? 'var(--green)' : '#64748b',
      }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: active ? 'var(--green)' : '#64748b' }} />
      {status}
    </span>
  )
}

// ── Sub-views ─────────────────────────────────────────────────
function Overview({ setView, user }: { setView: (v: string) => void; user: AuthUser }) {
  const stats = [
    { label: 'นโยบายทั้งหมด', value: '3', Icon: FileText, color: 'var(--blue)' },
    { label: 'Active Policies', value: '2', Icon: CheckCircle, color: 'var(--green)' },
    { label: 'PDPA Status', value: 'Compliant', Icon: ShieldCheck, color: 'var(--green)' },
    { label: 'อัปเดตล่าสุด', value: '12 May 2025', Icon: Clock, color: '#f59e0b' },
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
        <div className="divide-y divide-gray-50">
          {policies.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-6 py-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                  style={{ backgroundColor: '#f8fafc' }}
                >
                  {p.type === 'privacy' ? '🔒' : '👥'}
                </div>
                <div>
                  <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                  <div className="text-xs text-gray-400 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> {p.domain}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-gray-400 hidden sm:block">{p.lang}</span>
                <StatusBadge status={p.status} />
              </div>
            </div>
          ))}
        </div>
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

function PoliciesList() {
  const [copied, setCopied] = useState<number | null>(null)

  const handleCopy = (id: number) => {
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
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
                {p.type === 'privacy' ? '🔒' : '👥'}
              </div>
              <div>
                <div className="text-sm font-semibold text-gray-900">{p.name}</div>
                <div className="text-xs text-gray-400 md:hidden">{p.domain}</div>
              </div>
            </div>

            {/* Domain */}
            <div className="hidden md:flex md:col-span-2 items-center gap-1 text-xs text-gray-500">
              <Globe className="w-3 h-3 shrink-0" /> {p.domain}
            </div>

            {/* Lang */}
            <div className="hidden md:block md:col-span-1 text-xs text-gray-500">{p.lang}</div>

            {/* Status */}
            <div className="md:col-span-2">
              <StatusBadge status={p.status} />
            </div>

            {/* Updated */}
            <div className="hidden md:block md:col-span-2 text-xs text-gray-400">{p.updated}</div>

            {/* Actions */}
            <div className="col-span-1 flex items-center justify-end gap-1">
              <button
                title="คัดลอกลิงก์"
                onClick={() => handleCopy(p.id)}
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: copied === p.id ? 'var(--green)' : '#9ca3af' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#f3f4f6')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <Copy className="w-3.5 h-3.5" />
              </button>
              <button
                title="ดาวน์โหลด"
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
              >
                <Download className="w-3.5 h-3.5" />
              </button>
              <button
                title="แก้ไข"
                className="w-7 h-7 flex items-center justify-center rounded-md transition-colors"
                style={{ color: '#9ca3af' }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#f3f4f6'; e.currentTarget.style.color = '#374151' }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#9ca3af' }}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
              <button
                title="ลบ"
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

      {/* Export formats note */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <span className="text-xs text-gray-400">รูปแบบดาวน์โหลดที่รองรับ:</span>
        {['PDF', 'Word (.docx)', 'TXT', 'HTML Embed'].map((f) => (
          <span
            key={f}
            className="text-xs font-medium px-2.5 py-1 rounded-full border"
            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
          >
            {f}
          </span>
        ))}
      </div>
    </div>
  )
}


function AccountSettings({ user }: { user: AuthUser }) {
  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-900 mb-1">ตั้งค่าบัญชี</h1>
        <p className="text-sm text-gray-400">จัดการข้อมูลบัญชีและแผนการใช้งานของคุณ</p>
      </div>

      <div className="space-y-4">
        {/* Profile card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4">ข้อมูลโปรไฟล์</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { label: 'ชื่อ-นามสกุล', value: user.name },
              { label: 'อีเมล', value: user.email },
              { label: 'บริษัท', value: 'Demo Company Co., Ltd.' },
              { label: 'เบอร์โทรศัพท์', value: '081-234-5678' },
            ].map(({ label, value }) => (
              <div key={label}>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">{label}</label>
                <input
                  defaultValue={value}
                  className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors"
                />
              </div>
            ))}
          </div>
          <button className="mt-5 btn-green text-sm px-6 py-2.5" style={{ borderRadius: '8px' }}>
            บันทึกการเปลี่ยนแปลง
          </button>
        </div>

        {/* Plan card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 mb-1">แผนปัจจุบัน</h2>
              <div className="flex items-center gap-2">
                <span
                  className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)' }}
                >
                  {user.plan}
                </span>
                <span className="text-xs text-gray-400">ชำระครั้งเดียว ตลอดชีพ</span>
              </div>
            </div>
            <Link
              to="/#contact"
              className="text-sm font-semibold transition-colors"
              style={{ color: 'var(--blue)' }}
            >
              อัปเกรดแผน →
            </Link>
          </div>
        </div>

        {/* Security card */}
        <div className="bg-white rounded-xl border border-gray-100 p-6">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Lock className="w-4 h-4 text-gray-400" /> ความปลอดภัย
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">รหัสผ่านปัจจุบัน</label>
              <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">รหัสผ่านใหม่</label>
                <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                <input type="password" placeholder="••••••••" className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm text-gray-800 focus:outline-none focus:border-green-400 transition-colors" />
              </div>
            </div>
          </div>
          <button className="mt-4 text-sm font-bold px-6 py-2.5 border-2 rounded-lg transition-colors" style={{ borderColor: 'var(--green)', color: 'var(--green)', borderRadius: '8px' }}>
            เปลี่ยนรหัสผ่าน
          </button>
        </div>
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
            {activeView === 'policies'  && <PoliciesList />}
            {activeView === 'settings'  && <AccountSettings user={user} />}
          </main>

        </div>
      </div>
    </div>
  )
}
