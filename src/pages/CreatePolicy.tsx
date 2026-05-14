import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, X, Download, Copy, ExternalLink, CheckCircle } from 'lucide-react'

// ── Auth constants ────────────────────────────────────────────
const DEMO_EMAIL = 'demo@flowpdpa.co.th'
const DEMO_PASSWORD = 'demo1234'

// ── Auth Gate Modal ───────────────────────────────────────────
function AuthGate({ onSuccess, onClose }: { onSuccess: () => void; onClose: () => void }) {
  const [mode, setMode] = useState<'login' | 'register'>('login')

  // Login state
  const [loginEmail, setLoginEmail] = useState('')
  const [loginPw, setLoginPw] = useState('')
  const [loginErr, setLoginErr] = useState('')

  // Register state
  const [regName, setRegName] = useState('')
  const [regEmail, setRegEmail] = useState('')
  const [regPw, setRegPw] = useState('')
  const [regConfirm, setRegConfirm] = useState('')
  const [regErr, setRegErr] = useState('')

  const inputClass = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors"
  const onFocus = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = 'var(--green)')
  const onBlur = (e: React.FocusEvent<HTMLInputElement>) => (e.currentTarget.style.borderColor = '#e5e7eb')

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (loginEmail === DEMO_EMAIL && loginPw === DEMO_PASSWORD) {
      localStorage.setItem('flowpdpa_auth', JSON.stringify({ email: loginEmail, name: 'Demo User', plan: 'Premium' }))
      onSuccess()
      return
    }
    try {
      const raw = localStorage.getItem('flowpdpa_reg_' + loginEmail)
      if (raw) {
        const reg = JSON.parse(raw)
        if (reg.password === loginPw) {
          localStorage.setItem('flowpdpa_auth', JSON.stringify({ email: loginEmail, name: reg.name, plan: 'Free' }))
          onSuccess()
          return
        }
      }
    } catch { /* ignore */ }
    setLoginErr('อีเมลหรือรหัสผ่านไม่ถูกต้อง')
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!regName.trim()) { setRegErr('กรุณาระบุชื่อ'); return }
    if (regPw.length < 6) { setRegErr('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร'); return }
    if (regPw !== regConfirm) { setRegErr('รหัสผ่านไม่ตรงกัน'); return }
    localStorage.setItem('flowpdpa_reg_' + regEmail, JSON.stringify({ name: regName.trim(), password: regPw }))
    localStorage.setItem('flowpdpa_auth', JSON.stringify({ email: regEmail, name: regName.trim(), plan: 'Free' }))
    onSuccess()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'white', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xl">🔐</span>
              <h2 className="font-black text-gray-900 text-lg">เกือบเสร็จแล้ว!</h2>
            </div>
            <p className="text-sm text-gray-400">เข้าสู่ระบบหรือสมัครสมาชิกเพื่อรับนโยบายของคุณ</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-500 transition-colors mt-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex mx-6 mb-5 rounded-xl p-1" style={{ backgroundColor: '#f1f5f9' }}>
          {([['login', 'มีบัญชีแล้ว'], ['register', 'ยังไม่มีบัญชี']] as const).map(([m, label]) => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setLoginErr(''); setRegErr('') }}
              className="flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all"
              style={{
                backgroundColor: mode === m ? 'white' : 'transparent',
                color: mode === m ? 'var(--navy)' : '#94a3b8',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="px-6 pb-6">
          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <input type="email" required placeholder="อีเมล" value={loginEmail}
                onChange={e => { setLoginEmail(e.target.value); setLoginErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              <input type="password" required placeholder="รหัสผ่าน" value={loginPw}
                onChange={e => { setLoginPw(e.target.value); setLoginErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              {loginErr && <p className="text-xs text-red-500">{loginErr}</p>}
              <div className="rounded-lg px-3 py-2.5 text-xs" style={{ backgroundColor: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.12)' }}>
                <span className="font-semibold" style={{ color: 'var(--green)' }}>Demo: </span>
                <span className="text-gray-500">demo@flowpdpa.co.th / demo1234</span>
              </div>
              <button type="submit" className="btn-green w-full py-3 text-sm" style={{ borderRadius: '8px' }}>
                เข้าสู่ระบบและสร้างนโยบาย
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-3">
              <input type="text" required placeholder="ชื่อ-นามสกุล" value={regName}
                onChange={e => { setRegName(e.target.value); setRegErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              <input type="email" required placeholder="อีเมล" value={regEmail}
                onChange={e => { setRegEmail(e.target.value); setRegErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              <input type="password" required placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)" value={regPw}
                onChange={e => { setRegPw(e.target.value); setRegErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              <input type="password" required placeholder="ยืนยันรหัสผ่าน" value={regConfirm}
                onChange={e => { setRegConfirm(e.target.value); setRegErr('') }}
                className={inputClass} onFocus={onFocus} onBlur={onBlur}
              />
              {regErr && <p className="text-xs text-red-500">{regErr}</p>}
              <button type="submit" className="btn-green w-full py-3 text-sm" style={{ borderRadius: '8px' }}>
                สมัครสมาชิกและสร้างนโยบาย
              </button>
              <p className="text-xs text-center text-gray-400">สมัครฟรี · ไม่ต้องใช้บัตรเครดิต</p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────
type PolicyType = 'privacy' | 'hr' | 'cctv' | 'recruitment' | 'vendor' | 'dpa'

interface FormData {
  policyType: PolicyType | null
  agreedToTerms: boolean
  // Step 2
  websiteName: string
  websiteUrl: string
  businessType: string
  contactEmail: string
  contactPhone: string
  address: string
  // Step 3
  dataTypes: string[]
  hasCookies: string
  hasUserAccounts: string
  // Step 4
  purposes: string[]
  thirdParties: string[]
  // Step 5
  language: string
  dpoEmail: string
  retentionPeriod: string
  exportFormat: string[]
}

// ── Constants ─────────────────────────────────────────────────
const policyTypes = [
  { key: 'privacy',     label: 'Privacy + Cookies Policy',       price: 'ฟรี',       icon: '🔒', free: true,  comingSoon: false },
  { key: 'hr',          label: 'HR Privacy Policy',              price: '1,199 ฿',   icon: '👥', free: false, comingSoon: true },
  { key: 'cctv',        label: 'CCTV Policy',                    price: '899 ฿',     icon: '📷', free: false, comingSoon: true },
  { key: 'recruitment', label: 'Recruitment Privacy Policy',     price: '1,299 ฿',   icon: '📋', free: false, comingSoon: true },
  { key: 'vendor',      label: 'Vendor Privacy Policy',          price: '1,299 ฿',   icon: '🤝', free: false, comingSoon: true },
  { key: 'dpa',         label: 'Data Processing Agreement',      price: '1,499 ฿',   icon: '📑', free: false, comingSoon: true },
]

const businessTypes = [
  'ร้านค้าออนไลน์ (E-Commerce)',
  'บริษัทจำกัด / บริษัทมหาชน',
  'SME / วิสาหกิจขนาดกลางและเล็ก',
  'สตาร์ทอัป (Startup)',
  'ฟรีแลนซ์ / บุคคลธรรมดา',
  'หน่วยงานราชการ / NGO',
  'คลินิก / โรงพยาบาล',
  'สถาบันการศึกษา',
  'อื่นๆ',
]

const dataTypeOptions = [
  { key: 'name',       label: 'ชื่อ-นามสกุล' },
  { key: 'email',      label: 'อีเมล' },
  { key: 'phone',      label: 'เบอร์โทรศัพท์' },
  { key: 'address',    label: 'ที่อยู่' },
  { key: 'payment',    label: 'ข้อมูลการชำระเงิน (บัตรเครดิต/โอน)' },
  { key: 'idcard',     label: 'เลขบัตรประชาชน / หนังสือเดินทาง' },
  { key: 'dob',        label: 'วันเดือนปีเกิด / อายุ' },
  { key: 'location',   label: 'ข้อมูลตำแหน่งที่ตั้ง (GPS)' },
  { key: 'behavior',   label: 'พฤติกรรมการใช้งานเว็บไซต์' },
  { key: 'ip',         label: 'IP Address / Device Info' },
  { key: 'health',     label: 'ข้อมูลสุขภาพ (ข้อมูลอ่อนไหว)', sensitive: true },
  { key: 'religion',   label: 'ศาสนา / ความเชื่อ (ข้อมูลอ่อนไหว)', sensitive: true },
  { key: 'biometric',  label: 'ข้อมูลชีวมิติ (ลายนิ้วมือ, ใบหน้า)', sensitive: true },
]

const purposeOptions = [
  { key: 'service',    label: 'ให้บริการหลักแก่ผู้ใช้งาน' },
  { key: 'order',      label: 'ดำเนินการคำสั่งซื้อและจัดส่งสินค้า' },
  { key: 'contact',    label: 'ติดต่อกลับและตอบคำถามลูกค้า' },
  { key: 'payment',    label: 'ดำเนินการชำระเงิน' },
  { key: 'marketing',  label: 'ส่งข้อเสนอและข่าวสารการตลาด (ต้องได้รับความยินยอม)' },
  { key: 'analytics',  label: 'วิเคราะห์และปรับปรุงคุณภาพบริการ' },
  { key: 'legal',      label: 'ปฏิบัติตามข้อกำหนดทางกฎหมาย' },
  { key: 'security',   label: 'ป้องกันการทุจริตและรักษาความปลอดภัย' },
]

const thirdPartyOptions = [
  { key: 'ga',         label: 'Google Analytics' },
  { key: 'gtm',        label: 'Google Tag Manager' },
  { key: 'gads',       label: 'Google Ads' },
  { key: 'fb',         label: 'Facebook Pixel / Meta Ads' },
  { key: 'line',       label: 'LINE Official Account' },
  { key: 'stripe',     label: 'Stripe (การชำระเงิน)' },
  { key: 'omise',      label: 'Omise / GB Prime Pay (การชำระเงิน)' },
  { key: 'aws',        label: 'AWS / Google Cloud (Hosting)' },
  { key: 'mailchimp',  label: 'Mailchimp / Klaviyo (Email Marketing)' },
  { key: 'zendesk',    label: 'Zendesk / Freshdesk (Customer Support)' },
  { key: 'none',       label: 'ไม่มีบุคคลที่สาม' },
]

const retentionOptions = [
  '1 ปี', '2 ปี', '3 ปี', '5 ปี', '7 ปี (ตามกฎหมายภาษี)', '10 ปี', 'ตลอดระยะเวลาการใช้บริการ'
]

// ── Step labels ───────────────────────────────────────────────
const steps = [
  { num: 1, label: 'เลือกประเภท' },
  { num: 2, label: 'ข้อมูลธุรกิจ' },
  { num: 3, label: 'ข้อมูลที่เก็บ' },
  { num: 4, label: 'วัตถุประสงค์' },
  { num: 5, label: 'การตั้งค่า' },
  { num: 6, label: 'ตรวจสอบ' },
]

// ── Reusable UI ───────────────────────────────────────────────
function CheckboxCard({
  label, checked, onChange, tag,
}: { label: string; checked: boolean; onChange: () => void; tag?: string }) {
  return (
    <label
      onClick={onChange}
      className="flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all select-none"
      style={{
        borderColor: checked ? 'var(--green)' : '#e5e7eb',
        backgroundColor: checked ? 'rgba(5,150,105,0.04)' : 'white',
      }}
    >
      <span
        className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-colors"
        style={{ backgroundColor: checked ? 'var(--green)' : 'white', border: checked ? 'none' : '1.5px solid #d1d5db' }}
      >
        {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
      </span>
      <span className="text-sm text-gray-700 leading-snug flex-1">{label}</span>
      {tag && (
        <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#fef9c3', color: '#92400e' }}>
          {tag}
        </span>
      )}
    </label>
  )
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3 flex items-center gap-2">
      <span className="block w-4 h-px bg-gray-300" />{children}
    </h3>
  )
}

// ── Steps ─────────────────────────────────────────────────────
function Step1({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">เลือก Policy ที่ต้องการสร้าง</h2>
      <p className="text-sm text-gray-400 mb-6">เลือกประเภทนโยบายที่ตรงกับความต้องการของธุรกิจคุณ</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
        {policyTypes.map(({ key, label, price, icon, free, comingSoon }) => {
          const selected = data.policyType === key
          return (
            <button
              key={key}
              type="button"
              disabled={comingSoon}
              onClick={() => !comingSoon && setData({ policyType: key as PolicyType })}
              className="text-left p-5 rounded-xl border-2 transition-all relative overflow-hidden"
              style={{
                borderColor: comingSoon ? '#e5e7eb' : selected ? 'var(--green)' : '#e5e7eb',
                backgroundColor: comingSoon ? '#fafafa' : selected ? 'rgba(5,150,105,0.04)' : 'white',
                boxShadow: selected ? '0 0 0 3px rgba(5,150,105,0.1)' : 'none',
                opacity: comingSoon ? 0.6 : 1,
                cursor: comingSoon ? 'not-allowed' : 'pointer',
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {comingSoon ? (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: '#f1f5f9', color: '#64748b' }}>
                    Coming Soon
                  </span>
                ) : (
                  <span
                    className="text-xs font-bold px-2 py-0.5 rounded-full"
                    style={{
                      backgroundColor: free ? 'rgba(5,150,105,0.1)' : '#f3f4f6',
                      color: free ? 'var(--green)' : '#374151',
                    }}
                  >
                    {price}
                  </span>
                )}
              </div>
              <div className="font-bold text-sm mb-1 leading-snug" style={{ color: comingSoon ? '#9ca3af' : '#111827' }}>{label}</div>
              {selected && !comingSoon && (
                <div className="flex items-center gap-1 text-xs font-semibold mt-2" style={{ color: 'var(--green)' }}>
                  <CheckCircle className="w-3.5 h-3.5" /> เลือกแล้ว
                </div>
              )}
            </button>
          )
        })}
      </div>

      <label className="flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-colors" style={{ borderColor: data.agreedToTerms ? 'var(--green)' : '#e5e7eb', backgroundColor: data.agreedToTerms ? 'rgba(5,150,105,0.03)' : '#fafafa' }}>
        <span
          className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
          style={{ backgroundColor: data.agreedToTerms ? 'var(--green)' : 'white', border: data.agreedToTerms ? 'none' : '1.5px solid #d1d5db' }}
        >
          {data.agreedToTerms && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>
        <input type="checkbox" className="hidden" checked={data.agreedToTerms} onChange={e => setData({ agreedToTerms: e.target.checked })} />
        <span className="text-sm text-gray-600 leading-relaxed">
          ฉันยอมรับ{' '}
          <Link to="/terms" className="underline font-semibold" style={{ color: 'var(--green)' }}>เงื่อนไขการใช้งาน</Link>
          {' '}และ{' '}
          <Link to="/privacy-policy" className="underline font-semibold" style={{ color: 'var(--green)' }}>นโยบายความเป็นส่วนตัว</Link>
          {' '}ของ FlowPDPA
        </span>
      </label>
    </div>
  )
}

function Step2({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  const field = (label: string, key: keyof FormData, type = 'text', placeholder = '') => (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
        {label} {['websiteName','websiteUrl','contactEmail'].includes(key as string) && <span className="text-red-400 normal-case font-normal ml-1">*</span>}
      </label>
      <input
        type={type}
        required={['websiteName','websiteUrl','contactEmail'].includes(key as string)}
        placeholder={placeholder}
        value={data[key] as string}
        onChange={e => setData({ [key]: e.target.value })}
        className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors"
        onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
        onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
      />
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">ข้อมูลธุรกิจของคุณ</h2>
      <p className="text-sm text-gray-400 mb-6">ข้อมูลเหล่านี้จะถูกนำไปสร้างนโยบายให้ตรงกับธุรกิจของคุณ</p>

      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('ชื่อเว็บไซต์ / ชื่อแอป', 'websiteName', 'text', 'เช่น ร้านค้า MyShop')}
          {field('URL เว็บไซต์', 'websiteUrl', 'url', 'https://www.example.com')}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
            ประเภทธุรกิจ <span className="text-red-400 normal-case font-normal ml-1">*</span>
          </label>
          <select
            required
            value={data.businessType}
            onChange={e => setData({ businessType: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none bg-white transition-colors"
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          >
            <option value="">เลือกประเภทธุรกิจ...</option>
            {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('อีเมลติดต่อ', 'contactEmail', 'email', 'contact@company.com')}
          {field('เบอร์โทรศัพท์', 'contactPhone', 'tel', '02-xxx-xxxx')}
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">ที่อยู่บริษัท / สำนักงาน</label>
          <textarea
            rows={3}
            placeholder="ที่อยู่สำหรับระบุในนโยบาย"
            value={data.address}
            onChange={e => setData({ address: e.target.value })}
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none transition-colors"
            onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
            onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
          />
        </div>
      </div>
    </div>
  )
}

function Step3({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  const toggleItem = (arr: string[], key: string) =>
    arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]

  const standard = dataTypeOptions.filter(d => !d.sensitive)
  const sensitive = dataTypeOptions.filter(d => d.sensitive)

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">ข้อมูลส่วนบุคคลที่เก็บรวบรวม</h2>
      <p className="text-sm text-gray-400 mb-6">เลือกทุกประเภทข้อมูลที่ธุรกิจของคุณเก็บจากผู้ใช้งาน</p>

      <div className="space-y-5">
        <div>
          <SectionHeading>ข้อมูลทั่วไป</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {standard.map(({ key, label }) => (
              <CheckboxCard
                key={key}
                label={label}
                checked={data.dataTypes.includes(key)}
                onChange={() => setData({ dataTypes: toggleItem(data.dataTypes, key) })}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading>ข้อมูลอ่อนไหว (Sensitive Data)</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {sensitive.map(({ key, label }) => (
              <CheckboxCard
                key={key}
                label={label}
                checked={data.dataTypes.includes(key)}
                onChange={() => setData({ dataTypes: toggleItem(data.dataTypes, key) })}
                tag="อ่อนไหว"
              />
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
          <div>
            <SectionHeading>เว็บไซต์ใช้คุกกี้หรือไม่?</SectionHeading>
            <div className="flex gap-3">
              {['ใช่', 'ไม่ใช่'].map(v => (
                <label key={v} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer text-sm font-medium transition-all" style={{ borderColor: data.hasCookies === v ? 'var(--green)' : '#e5e7eb', backgroundColor: data.hasCookies === v ? 'rgba(5,150,105,0.05)' : 'white', color: data.hasCookies === v ? 'var(--green)' : '#374151' }}>
                  <input type="radio" className="hidden" value={v} checked={data.hasCookies === v} onChange={() => setData({ hasCookies: v })} />
                  {v}
                </label>
              ))}
            </div>
          </div>
          <div>
            <SectionHeading>มีระบบบัญชีผู้ใช้งาน (Login)?</SectionHeading>
            <div className="flex gap-3">
              {['ใช่', 'ไม่ใช่'].map(v => (
                <label key={v} className="flex-1 flex items-center justify-center gap-2 p-3 rounded-lg border cursor-pointer text-sm font-medium transition-all" style={{ borderColor: data.hasUserAccounts === v ? 'var(--green)' : '#e5e7eb', backgroundColor: data.hasUserAccounts === v ? 'rgba(5,150,105,0.05)' : 'white', color: data.hasUserAccounts === v ? 'var(--green)' : '#374151' }}>
                  <input type="radio" className="hidden" value={v} checked={data.hasUserAccounts === v} onChange={() => setData({ hasUserAccounts: v })} />
                  {v}
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step4({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  const toggleItem = (arr: string[], key: string) =>
    arr.includes(key) ? arr.filter(k => k !== key) : [...arr, key]

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">วัตถุประสงค์และบุคคลที่สาม</h2>
      <p className="text-sm text-gray-400 mb-6">ระบุว่าข้อมูลถูกนำไปใช้ทำอะไร และมีบริการใดที่ได้รับข้อมูล</p>

      <div className="space-y-6">
        <div>
          <SectionHeading>วัตถุประสงค์ในการใช้ข้อมูล</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {purposeOptions.map(({ key, label }) => (
              <CheckboxCard
                key={key}
                label={label}
                checked={data.purposes.includes(key)}
                onChange={() => setData({ purposes: toggleItem(data.purposes, key) })}
              />
            ))}
          </div>
        </div>

        <div>
          <SectionHeading>บุคคลที่สามที่ได้รับข้อมูล</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {thirdPartyOptions.map(({ key, label }) => (
              <CheckboxCard
                key={key}
                label={label}
                checked={data.thirdParties.includes(key)}
                onChange={() => setData({ thirdParties: toggleItem(data.thirdParties, key) })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Step5({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">การตั้งค่านโยบาย</h2>
      <p className="text-sm text-gray-400 mb-6">กำหนดรูปแบบและรายละเอียดการติดต่อสำหรับนโยบายของคุณ</p>

      <div className="space-y-6">
        {/* Language */}
        <div>
          <SectionHeading>ภาษาของนโยบาย</SectionHeading>
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: 'th',    label: '🇹🇭 ภาษาไทย' },
              { value: 'en',    label: '🇬🇧 English' },
              { value: 'both',  label: '🌐 ไทย + EN' },
            ].map(({ value, label }) => (
              <label
                key={value}
                className="flex flex-col items-center justify-center gap-1.5 p-4 rounded-xl border-2 cursor-pointer transition-all text-center"
                style={{
                  borderColor: data.language === value ? 'var(--green)' : '#e5e7eb',
                  backgroundColor: data.language === value ? 'rgba(5,150,105,0.05)' : 'white',
                }}
              >
                <input type="radio" className="hidden" value={value} checked={data.language === value} onChange={() => setData({ language: value })} />
                <span className="text-base">{label.split(' ')[0]}</span>
                <span className="text-xs font-semibold" style={{ color: data.language === value ? 'var(--green)' : '#374151' }}>
                  {label.split(' ').slice(1).join(' ')}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">* ภาษาอังกฤษรองรับเฉพาะแผน Premium</p>
        </div>

        {/* Export format */}
        <div>
          <SectionHeading>รูปแบบการดาวน์โหลด</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {['PDF', 'Word (.docx)', 'TXT', 'HTML Embed'].map(fmt => (
              <CheckboxCard
                key={fmt}
                label={fmt}
                checked={data.exportFormat.includes(fmt)}
                onChange={() => setData({ exportFormat: data.exportFormat.includes(fmt) ? data.exportFormat.filter(f => f !== fmt) : [...data.exportFormat, fmt] })}
              />
            ))}
          </div>
        </div>

        {/* DPO email */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              อีเมลเจ้าหน้าที่คุ้มครองข้อมูล (DPO)
            </label>
            <input
              type="email"
              placeholder="dpo@company.com"
              value={data.dpoEmail}
              onChange={e => setData({ dpoEmail: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors"
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            />
            <p className="text-xs text-gray-400 mt-1">หากไม่มี DPO ระบบจะใช้อีเมลติดต่อจากขั้นตอนก่อนหน้า</p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
              ระยะเวลาการเก็บรักษาข้อมูล
            </label>
            <select
              value={data.retentionPeriod}
              onChange={e => setData({ retentionPeriod: e.target.value })}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none bg-white transition-colors"
              onFocus={e => (e.currentTarget.style.borderColor = 'var(--green)')}
              onBlur={e => (e.currentTarget.style.borderColor = '#e5e7eb')}
            >
              <option value="">เลือกระยะเวลา...</option>
              {retentionOptions.map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

function Step6({ data }: { data: FormData }) {
  const policy = policyTypes.find(p => p.key === data.policyType)
  const selectedDataTypes = dataTypeOptions.filter(d => data.dataTypes.includes(d.key))
  const selectedPurposes = purposeOptions.filter(p => data.purposes.includes(p.key))
  const selectedThirdParties = thirdPartyOptions.filter(t => data.thirdParties.includes(t.key))

  const Row = ({ label, value }: { label: string; value: string }) => (
    <div className="flex items-start gap-4 py-3 border-b border-gray-50 last:border-0">
      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider w-36 shrink-0 mt-0.5">{label}</span>
      <span className="text-sm text-gray-800">{value || <span className="text-gray-300">ไม่ระบุ</span>}</span>
    </div>
  )

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">ตรวจสอบข้อมูลก่อนสร้าง</h2>
      <p className="text-sm text-gray-400 mb-6">ตรวจสอบความถูกต้องก่อนกดสร้างนโยบาย สามารถย้อนกลับแก้ไขได้</p>

      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-gray-100 px-6 py-2">
          <Row label="ประเภท Policy" value={`${policy?.icon} ${policy?.label ?? ''}`} />
          <Row label="ชื่อเว็บไซต์" value={data.websiteName} />
          <Row label="URL" value={data.websiteUrl} />
          <Row label="ประเภทธุรกิจ" value={data.businessType} />
          <Row label="อีเมลติดต่อ" value={data.contactEmail} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-6 py-2">
          <Row
            label="ข้อมูลที่เก็บ"
            value={selectedDataTypes.length ? selectedDataTypes.map(d => d.label).join(', ') : ''}
          />
          <Row label="ใช้คุกกี้" value={data.hasCookies} />
          <Row label="มีระบบ Login" value={data.hasUserAccounts} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-6 py-2">
          <Row
            label="วัตถุประสงค์"
            value={selectedPurposes.length ? selectedPurposes.map(p => p.label).join(', ') : ''}
          />
          <Row
            label="บุคคลที่สาม"
            value={selectedThirdParties.length ? selectedThirdParties.map(t => t.label).join(', ') : ''}
          />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-6 py-2">
          <Row label="ภาษา" value={data.language === 'both' ? 'ไทย + อังกฤษ' : data.language === 'en' ? 'อังกฤษ' : 'ไทย'} />
          <Row label="ระยะเวลาเก็บ" value={data.retentionPeriod} />
          <Row label="รูปแบบดาวน์โหลด" value={data.exportFormat.join(', ')} />
        </div>
      </div>
    </div>
  )
}

function SuccessScreen({ data, onReset }: { data: FormData; onReset: () => void }) {
  const policy = policyTypes.find(p => p.key === data.policyType)
  const [copied, setCopied] = useState(false)

  return (
    <div className="text-center py-6">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: 'rgba(5,150,105,0.12)' }}
      >
        <CheckCircle className="w-8 h-8" style={{ color: 'var(--green)' }} />
      </div>
      <h2 className="text-2xl font-black text-gray-900 mb-2">สร้างนโยบายสำเร็จ! 🎉</h2>
      <p className="text-gray-500 text-sm mb-2">
        {policy?.icon} <strong>{policy?.label}</strong> สำหรับ <strong>{data.websiteName}</strong>
      </p>
      <p className="text-gray-400 text-xs mb-8">พร้อมใช้งานแล้ว — คุณสามารถดู แชร์ หรือดาวน์โหลดได้ทันที</p>

      {/* Shareable URL mockup */}
      <div
        className="flex items-center gap-2 p-3 rounded-xl mb-6 text-left max-w-sm mx-auto"
        style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb' }}
      >
        <ExternalLink className="w-4 h-4 shrink-0 text-gray-400" />
        <span className="text-xs text-gray-600 flex-1 truncate">
          flowpdpa.co.th/p/{data.websiteUrl.replace(/https?:\/\//, '').replace(/\//g, '') || 'mysite-com'}/privacy
        </span>
        <button
          onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="text-xs font-semibold shrink-0 transition-colors"
          style={{ color: copied ? 'var(--green)' : '#6b7280' }}
        >
          {copied ? 'คัดลอกแล้ว!' : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
        <button className="btn-green px-8 py-3 text-sm flex items-center justify-center gap-2" style={{ borderRadius: '8px' }}>
          <Download className="w-4 h-4" /> ดาวน์โหลด PDF
        </button>
        <button
          className="px-8 py-3 text-sm font-bold border-2 rounded-lg transition-colors flex items-center justify-center gap-2"
          style={{ borderColor: 'var(--green)', color: 'var(--green)', borderRadius: '8px' }}
        >
          <ExternalLink className="w-4 h-4" /> ดูนโยบาย
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/dashboard"
          className="text-sm font-semibold transition-colors"
          style={{ color: 'var(--blue)' }}
        >
          ← กลับ Dashboard
        </Link>
        <span className="text-gray-300 hidden sm:block">|</span>
        <button onClick={onReset} className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors">
          สร้าง Policy ใหม่
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
const initialData: FormData = {
  policyType: null,
  agreedToTerms: false,
  websiteName: '',
  websiteUrl: '',
  businessType: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  dataTypes: [],
  hasCookies: '',
  hasUserAccounts: '',
  purposes: [],
  thirdParties: [],
  language: 'both',
  dpoEmail: '',
  retentionPeriod: '',
  exportFormat: ['PDF'],
}

export default function CreatePolicy() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [done, setDone] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [showAuthGate, setShowAuthGate] = useState(false)
  const [data, setDataRaw] = useState<FormData>(initialData)

  const setData = (partial: Partial<FormData>) => setDataRaw(prev => ({ ...prev, ...partial }))

  const canProceed = () => {
    if (step === 1) return data.policyType !== null && data.agreedToTerms
    if (step === 2) return data.websiteName && data.websiteUrl && data.businessType && data.contactEmail
    if (step === 3) return data.dataTypes.length > 0 && data.hasCookies && data.hasUserAccounts
    if (step === 4) return data.purposes.length > 0
    if (step === 5) return data.language !== ''
    return true
  }

  const startGeneration = () => {
    setShowAuthGate(false)
    setGenerating(true)
    setTimeout(() => { setGenerating(false); setDone(true) }, 2200)
  }

  const handleGenerate = () => {
    if (!localStorage.getItem('flowpdpa_auth')) {
      setShowAuthGate(true)
      return
    }
    startGeneration()
  }

  const progress = ((step - 1) / (steps.length - 1)) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>

      {showAuthGate && (
        <AuthGate
          onSuccess={startGeneration}
          onClose={() => setShowAuthGate(false)}
        />
      )}

      {/* Header */}
      <header
        className="sticky top-0 z-20 bg-white border-b border-gray-200"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link to="/dashboard" className="flex items-center gap-0.5">
            <span className="font-black text-lg tracking-tight text-gray-900">Flow</span>
            <span className="font-black text-lg tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
          </Link>
          {!done && (
            <span className="text-xs font-semibold text-gray-400">
              ขั้นตอนที่ {step} จาก {steps.length}
            </span>
          )}
          <Link to="/dashboard" className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </Link>
        </div>

        {/* Progress bar */}
        {!done && (
          <div className="h-1 bg-gray-100">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progress}%`, backgroundColor: 'var(--green)' }}
            />
          </div>
        )}
      </header>

      {/* Step indicators */}
      {!done && (
        <div className="bg-white border-b border-gray-100">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3">
            <div className="flex items-center justify-between overflow-x-auto gap-1">
              {steps.map(({ num, label }) => {
                const active = step === num
                const done_ = step > num
                return (
                  <div key={num} className="flex items-center gap-1 shrink-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors"
                        style={{
                          backgroundColor: done_ ? 'var(--green)' : active ? 'var(--navy)' : '#e5e7eb',
                          color: done_ || active ? 'white' : '#9ca3af',
                        }}
                      >
                        {done_ ? <Check className="w-3 h-3" strokeWidth={3} /> : num}
                      </span>
                      <span
                        className="text-xs font-medium hidden sm:block"
                        style={{ color: active ? 'var(--navy)' : done_ ? 'var(--green)' : '#9ca3af' }}
                      >
                        {label}
                      </span>
                    </div>
                    {num < steps.length && (
                      <div className="w-4 sm:w-8 h-px mx-1" style={{ backgroundColor: step > num ? 'var(--green)' : '#e5e7eb' }} />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <main className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          {done ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 shadow-sm">
              <SuccessScreen data={data} onReset={() => { setDataRaw(initialData); setStep(1); setDone(false) }} />
            </div>
          ) : generating ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full border-4 border-gray-100 mx-auto mb-5 animate-spin" style={{ borderTopColor: 'var(--green)' }} />
              <p className="text-gray-900 font-bold mb-1">กำลังสร้างนโยบาย...</p>
              <p className="text-sm text-gray-400">AI กำลังประมวลผลข้อมูลของคุณ กรุณารอสักครู่</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm">
              {step === 1 && <Step1 data={data} setData={setData} />}
              {step === 2 && <Step2 data={data} setData={setData} />}
              {step === 3 && <Step3 data={data} setData={setData} />}
              {step === 4 && <Step4 data={data} setData={setData} />}
              {step === 5 && <Step5 data={data} setData={setData} />}
              {step === 6 && <Step6 data={data} />}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/dashboard')}
                  className="flex items-center gap-2 text-sm font-semibold text-gray-500 hover:text-gray-800 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                  {step === 1 ? 'ยกเลิก' : 'ย้อนกลับ'}
                </button>

                {step < steps.length ? (
                  <button
                    type="button"
                    disabled={!canProceed()}
                    onClick={() => setStep(s => s + 1)}
                    className="btn-green px-8 py-3 text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:transform-none"
                    style={{ borderRadius: '8px' }}
                  >
                    ถัดไป <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleGenerate}
                    className="btn-green px-8 py-3 text-sm flex items-center gap-2"
                    style={{ borderRadius: '8px' }}
                  >
                    <CheckCircle className="w-4 h-4" /> สร้างนโยบาย
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
