import { useState, useCallback, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, ChevronRight, ChevronLeft, X, Clock, CheckCircle, ShieldCheck, Search, Loader2, Building2, AlertCircle } from 'lucide-react'
import { policyStorage, generateSlug, generatePolicyId, type SavedPolicy } from '@/utils/policyStorage'
import { generatePolicyHTML } from '@/utils/policyGenerator'

// ── Thai RD Company Lookup ────────────────────────────────────
// Replace with real Thai RD VAT API calls via your backend proxy
// (https://rdws.rd.go.th/serviceRD3/vatregistrationRI.asmx)
type RDSearchType = 'taxId' | 'name'

async function lookupThaiCompany(
  query: string,
  type: RDSearchType,
): Promise<{ name: string; taxId?: string; address: string } | null> {
  await new Promise(r => setTimeout(r, 1400))
  if (type === 'taxId') {
    const clean = query.replace(/\D/g, '')
    if (clean.length === 13) {
      return { name: 'บริษัท ตัวอย่าง จำกัด', taxId: clean, address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110' }
    }
  } else {
    if (query.trim().length >= 3) {
      return { name: query.trim(), taxId: '0105565012345', address: '123/45 ถนนสุขุมวิท แขวงคลองเตย เขตคลองเตย กรุงเทพมหานคร 10110' }
    }
  }
  return null
}

// ── Types ─────────────────────────────────────────────────────
type PolicyType = 'privacy' | 'hr' | 'cctv' | 'recruitment' | 'vendor' | 'dpa'

interface FormData {
  policyType: PolicyType | null
  agreedToTerms: boolean
  // Step 2
  ownerType: 'person' | 'company'
  ownerFullName: string
  ownerIdCard: string
  companyName: string
  companyRegNumber: string
  businessType: string
  websiteName: string
  websiteUrl: string
  contactEmail: string
  contactPhone: string
  address: string
  // Step 3
  dataTypes: string[]
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

// ── Shared input styles ───────────────────────────────────────
const inputCls = "w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none transition-colors"
const onInputFocus = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = 'var(--green)')
const onInputBlur  = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
  (e.currentTarget.style.borderColor = '#e5e7eb')

function FormField({ label, value, onChange, type = 'text', placeholder = '', required = false }: {
  label: string; value: string; onChange: (v: string) => void
  type?: string; placeholder?: string; required?: boolean
}) {
  return (
    <div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
        {label} {required && <span className="text-red-400 normal-case font-normal ml-1">*</span>}
      </label>
      <input
        type={type} value={value} placeholder={placeholder}
        onChange={e => onChange(e.target.value)}
        className={inputCls} onFocus={onInputFocus} onBlur={onInputBlur}
      />
    </div>
  )
}

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

// ── Company Consent Modal ─────────────────────────────────────
function CompanyConsentModal({ onAccept, onDecline }: { onAccept: () => void; onDecline: () => void }) {
  const [checked, setChecked] = useState(false)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
    >
      <div
        className="w-full max-w-lg rounded-2xl overflow-hidden"
        style={{ backgroundColor: 'white', boxShadow: '0 32px 64px -12px rgba(0,0,0,0.3)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-1">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: 'rgba(5,150,105,0.1)' }}>
              <Building2 className="w-5 h-5" style={{ color: 'var(--green)' }} />
            </div>
            <div>
              <h2 className="font-black text-gray-900 text-base">ยืนยันการสร้างนโยบายในนามนิติบุคคล</h2>
              <p className="text-xs text-gray-400 mt-0.5">กรุณาอ่านและยืนยันก่อนดำเนินการต่อ</p>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          <div className="rounded-xl p-4 space-y-2.5 text-sm text-gray-700" style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb' }}>
            <p className="font-semibold text-gray-900 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
              ข้อกำหนดการใช้งานสำหรับนิติบุคคล
            </p>
            <ul className="space-y-2 text-xs text-gray-600 list-none pl-1">
              {[
                'ข้าพเจ้ามีอำนาจหน้าที่ในการดำเนินการด้านนโยบายความเป็นส่วนตัวในนามของบริษัท / องค์กรนี้',
                'ข้อมูลบริษัทที่กรอกถูกต้องตามความเป็นจริงและตรงกับเอกสารจดทะเบียนนิติบุคคล',
                'นโยบายที่สร้างขึ้นจะถูกนำไปใช้งานจริงกับเว็บไซต์หรือแอปพลิเคชันของบริษัท',
                'บริษัทยินยอมให้ FlowPDPA จัดเก็บข้อมูลที่กรอกเพื่อจัดทำและส่งมอบนโยบาย PDPA',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold text-white" style={{ backgroundColor: 'var(--green)', minWidth: '1rem' }}>{i + 1}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Checkbox */}
          <label
            className="flex items-start gap-3 cursor-pointer select-none"
            onClick={() => setChecked(v => !v)}
          >
            <span
              className="w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 transition-colors"
              style={{ backgroundColor: checked ? 'var(--green)' : 'white', border: checked ? 'none' : '1.5px solid #d1d5db' }}
            >
              {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
            </span>
            <span className="text-sm text-gray-700 leading-relaxed">
              ข้าพเจ้าได้อ่านและยอมรับข้อกำหนดข้างต้นทุกข้อ และมีอำนาจในการดำเนินการในนามองค์กร
            </span>
          </label>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={onDecline}
            className="flex-1 py-3 text-sm font-semibold rounded-lg border transition-colors"
            style={{ borderColor: '#e5e7eb', color: '#6b7280' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
          >
            ยกเลิก
          </button>
          <button
            type="button"
            disabled={!checked}
            onClick={onAccept}
            className="flex-1 py-3 text-sm font-bold text-white rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: 'var(--green)', borderRadius: '8px' }}
          >
            ยืนยันและดำเนินการต่อ
          </button>
        </div>
      </div>
    </div>
  )
}

function Step2({ data, setData }: { data: FormData; setData: (d: Partial<FormData>) => void }) {
  const isPerson = data.ownerType === 'person'
  const [rdState, setRdState] = useState<'idle' | 'loading' | 'found' | 'error'>('idle')
  const [rdError, setRdError] = useState('')
  const [searchType, setSearchType] = useState<RDSearchType>('taxId')
  const [searchQuery, setSearchQuery] = useState('')
  const [showConsent, setShowConsent] = useState(false)

  const resetRd = () => { setRdState('idle'); setRdError(''); setSearchQuery('') }

  const handleLookup = async () => {
    if (!searchQuery.trim()) {
      setRdError(searchType === 'taxId' ? 'กรุณากรอกเลขทะเบียนก่อนค้นหา' : 'กรุณากรอกชื่อบริษัทก่อนค้นหา')
      setRdState('error')
      return
    }
    setRdState('loading')
    setRdError('')
    try {
      const result = await lookupThaiCompany(searchQuery, searchType)
      if (result) {
        setData({
          companyName: result.name,
          address: result.address,
          ...(result.taxId ? { companyRegNumber: result.taxId } : {}),
        })
        setRdState('found')
      } else {
        setRdState('error')
        setRdError('ไม่พบข้อมูลบริษัท กรุณาตรวจสอบและลองใหม่')
      }
    } catch {
      setRdState('error')
      setRdError('เชื่อมต่อฐานข้อมูลภาษีไม่ได้ กรุณาลองใหม่ภายหลัง')
    }
  }

  return (
    <div>
      <h2 className="text-xl font-black text-gray-900 mb-1">ข้อมูลผู้ควบคุมข้อมูล</h2>
      <p className="text-sm text-gray-400 mb-6">ข้อมูลเหล่านี้จะถูกระบุในนโยบาย PDPA ของคุณ</p>

      <div className="space-y-5">

        {/* Type toggle */}
        <div>
          <SectionHeading>ประเภทผู้ควบคุมข้อมูล</SectionHeading>
          {showConsent && (
            <CompanyConsentModal
              onAccept={() => { setShowConsent(false); setData({ ownerType: 'company' }); resetRd() }}
              onDecline={() => setShowConsent(false)}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            {([
              { key: 'company', icon: '🏢', label: 'นิติบุคคล', desc: 'บริษัท / ห้างหุ้นส่วน / องค์กร' },
              { key: 'person',  icon: '👤', label: 'บุคคลธรรมดา', desc: 'ฟรีแลนซ์ / บุคคลทั่วไป' },
            ] as const).map(({ key, icon, label, desc }) => (
              <button
                key={key} type="button"
                onClick={() => {
                  if (key === 'company' && data.ownerType !== 'company') {
                    setShowConsent(true)
                  } else if (key === 'person') {
                    setData({ ownerType: 'person' }); resetRd()
                  }
                }}
                className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: data.ownerType === key ? 'var(--green)' : '#e5e7eb',
                  backgroundColor: data.ownerType === key ? 'rgba(5,150,105,0.04)' : 'white',
                }}
              >
                <span className="text-2xl">{icon}</span>
                <div>
                  <div className="text-sm font-bold text-gray-900">{label}</div>
                  <div className="text-xs text-gray-400">{desc}</div>
                </div>
                {data.ownerType === key && (
                  <span className="ml-auto w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--green)' }}>
                    <Check className="w-3 h-3 text-white" strokeWidth={3} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Owner identity */}
        <div>
          <SectionHeading>{isPerson ? 'ข้อมูลส่วนตัว' : 'ข้อมูลบริษัท / องค์กร'}</SectionHeading>
          <div className="space-y-4">
            {isPerson ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField label="ชื่อ-นามสกุล" value={data.ownerFullName}
                  onChange={v => setData({ ownerFullName: v })} placeholder="เช่น สมชาย ใจดี" required />
                <FormField label="เลขบัตรประชาชน" value={data.ownerIdCard}
                  onChange={v => setData({ ownerIdCard: v })} placeholder="x-xxxx-xxxxx-xx-x" required />
              </div>
            ) : (
              <>
                {/* RD Lookup widget */}
                <div className="rounded-xl p-4 space-y-3" style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb' }}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">ค้นหาจากฐานข้อมูลกรมสรรพากร</p>
                    {rdState === 'found' && (
                      <button type="button" onClick={resetRd} className="text-xs text-gray-400 hover:text-gray-600 transition-colors">
                        ค้นหาใหม่
                      </button>
                    )}
                  </div>

                  {/* Search type toggle */}
                  <div className="flex rounded-lg p-0.5 gap-0.5" style={{ backgroundColor: '#e5e7eb' }}>
                    {([
                      { key: 'taxId', label: 'เลขทะเบียน' },
                      { key: 'name',  label: 'ชื่อบริษัท' },
                    ] as const).map(({ key, label }) => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => { setSearchType(key); setSearchQuery(''); setRdState('idle'); setRdError('') }}
                        className="flex-1 py-2 text-xs font-semibold rounded-md transition-all"
                        style={{
                          backgroundColor: searchType === key ? 'white' : 'transparent',
                          color: searchType === key ? 'var(--navy)' : '#9ca3af',
                          boxShadow: searchType === key ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Search input + button */}
                  <div className="flex gap-2">
                    <input
                      type={searchType === 'taxId' ? 'text' : 'text'}
                      value={searchQuery}
                      placeholder={searchType === 'taxId' ? 'เช่น 0105565012345' : 'เช่น บริษัท MyShop'}
                      maxLength={searchType === 'taxId' ? 17 : 100}
                      onChange={e => { setSearchQuery(e.target.value); if (rdState !== 'idle') { setRdState('idle'); setRdError('') } }}
                      onKeyDown={e => e.key === 'Enter' && handleLookup()}
                      className={inputCls + ' flex-1 bg-white'}
                      onFocus={onInputFocus}
                      onBlur={onInputBlur}
                    />
                    <button
                      type="button"
                      onClick={handleLookup}
                      disabled={rdState === 'loading'}
                      className="shrink-0 flex items-center gap-2 px-4 py-3 rounded-lg text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{
                        backgroundColor: rdState === 'found' ? 'rgba(5,150,105,0.08)' : 'var(--navy)',
                        color: rdState === 'found' ? 'var(--green)' : 'white',
                        border: rdState === 'found' ? '1.5px solid var(--green)' : 'none',
                      }}
                    >
                      {rdState === 'loading' ? <Loader2 className="w-4 h-4 animate-spin" /> : rdState === 'found' ? <CheckCircle className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                      <span className="hidden sm:inline">
                        {rdState === 'loading' ? 'กำลังค้นหา...' : rdState === 'found' ? 'พบแล้ว' : 'ค้นหา'}
                      </span>
                    </button>
                  </div>

                  {/* Status */}
                  {rdState === 'found' && (
                    <p className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--green)' }}>
                      <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                      ดึงข้อมูลจากกรมสรรพากรเรียบร้อย — ชื่อบริษัทและที่อยู่ถูกเติมให้อัตโนมัติ
                    </p>
                  )}
                  {rdState === 'error' && rdError && (
                    <p className="text-xs text-red-500">{rdError}</p>
                  )}
                </div>

                <FormField label="ชื่อบริษัท / องค์กร" value={data.companyName}
                  onChange={v => setData({ companyName: v })} placeholder="เช่น บริษัท MyShop จำกัด" required />
                <FormField label="เลขทะเบียนนิติบุคคล" value={data.companyRegNumber}
                  onChange={v => setData({ companyRegNumber: v })} placeholder="เช่น 0105565012345" required />

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                    ประเภทธุรกิจ <span className="text-red-400 normal-case font-normal ml-1">*</span>
                  </label>
                  <select value={data.businessType} onChange={e => setData({ businessType: e.target.value })}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none bg-white transition-colors"
                    onFocus={onInputFocus} onBlur={onInputBlur}>
                    <option value="">เลือกประเภทธุรกิจ...</option>
                    {businessTypes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <FormField label="ชื่อผู้ติดต่อ" value={data.ownerFullName}
                  onChange={v => setData({ ownerFullName: v })} placeholder="ชื่อ-นามสกุล ผู้ดูแลนโยบาย" />
              </>
            )}
          </div>
        </div>

        {/* Website */}
        <div>
          <SectionHeading>ข้อมูลเว็บไซต์</SectionHeading>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="ชื่อเว็บไซต์ / ชื่อแอป" value={data.websiteName}
              onChange={v => setData({ websiteName: v })} placeholder="เช่น ร้านค้า MyShop" required />
            <FormField label="URL เว็บไซต์" value={data.websiteUrl} type="url"
              onChange={v => setData({ websiteUrl: v })} placeholder="https://www.example.com" required />
          </div>
        </div>

        {/* Contact */}
        <div>
          <SectionHeading>ช่องทางติดต่อ</SectionHeading>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="อีเมลติดต่อ" value={data.contactEmail} type="email"
                onChange={v => setData({ contactEmail: v })} placeholder="contact@company.com" required />
              <FormField label="เบอร์โทรศัพท์" value={data.contactPhone} type="tel"
                onChange={v => setData({ contactPhone: v })} placeholder="02-xxx-xxxx" />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                {isPerson ? 'ที่อยู่' : 'ที่อยู่บริษัท / สำนักงาน'}
              </label>
              <textarea rows={3} value={data.address}
                placeholder="ที่อยู่สำหรับระบุในนโยบาย"
                onChange={e => setData({ address: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-800 focus:outline-none resize-none transition-colors"
                onFocus={onInputFocus} onBlur={onInputBlur}
              />
            </div>
          </div>
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
          <Row label="ผู้ควบคุมข้อมูล" value={data.ownerType === 'person' ? '👤 บุคคลธรรมดา' : '🏢 นิติบุคคล'} />
          {data.ownerType === 'person' ? (
            <>
              <Row label="ชื่อ-นามสกุล" value={data.ownerFullName} />
              <Row label="เลขบัตรประชาชน" value={data.ownerIdCard} />
            </>
          ) : (
            <>
              <Row label="ชื่อบริษัท" value={data.companyName} />
              <Row label="เลขทะเบียน" value={data.companyRegNumber} />
              <Row label="ประเภทธุรกิจ" value={data.businessType} />
            </>
          )}
          <Row label="ชื่อเว็บไซต์" value={data.websiteName} />
          <Row label="URL" value={data.websiteUrl} />
          <Row label="อีเมลติดต่อ" value={data.contactEmail} />
        </div>

        <div className="bg-white rounded-xl border border-gray-100 px-6 py-2">
          <Row
            label="ข้อมูลที่เก็บ"
            value={selectedDataTypes.length ? selectedDataTypes.map(d => d.label).join(', ') : ''}
          />
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

function WaitingReviewScreen({ data, slug, onReset }: { data: FormData; slug: string; onReset: () => void }) {
  const policy = policyTypes.find(p => p.key === data.policyType)
  const refId = slug.split('-').pop()?.toUpperCase() || '------'

  const reviewSteps = [
    { icon: CheckCircle, label: 'ส่งข้อมูลเรียบร้อย',    done: true },
    { icon: Clock,        label: 'รอทีมกฎหมายตรวจสอบ', done: false, active: true },
    { icon: ShieldCheck,  label: 'อนุมัติและเผยแพร่',   done: false },
  ]

  return (
    <div className="text-center py-8 max-w-md mx-auto">

      {/* Icon */}
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
        style={{ backgroundColor: 'rgba(245,158,11,0.1)', border: '2px solid rgba(245,158,11,0.2)' }}
      >
        <Clock className="w-10 h-10" style={{ color: '#f59e0b' }} />
      </div>

      <h2 className="text-2xl font-black text-gray-900 mb-2">รอการตรวจสอบจากทีมกฎหมาย</h2>
      <p className="text-sm text-gray-500 mb-1">
        {policy?.icon} <strong>{policy?.label}</strong> สำหรับ <strong>{data.websiteName}</strong>
      </p>
      <p className="text-xs text-gray-400 mb-8">
        ทีมกฎหมายจะตรวจสอบและอนุมัตินโยบายของคุณภายใน 1–2 วันทำการ
      </p>

      {/* Reference ID */}
      <div
        className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-8 text-xs font-bold tracking-widest"
        style={{ backgroundColor: '#f8fafc', border: '1px solid #e5e7eb', color: '#374151' }}
      >
        หมายเลขอ้างอิง: <span style={{ color: 'var(--green)' }}>{refId}</span>
      </div>

      {/* Status timeline */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {reviewSteps.map(({ icon: Icon, label, done, active }, i) => (
          <div key={i} className="flex items-center">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center transition-colors"
                style={{
                  backgroundColor: done
                    ? 'rgba(5,150,105,0.12)'
                    : active
                      ? 'rgba(245,158,11,0.12)'
                      : '#f1f5f9',
                }}
              >
                <Icon
                  className="w-4 h-4"
                  style={{
                    color: done ? 'var(--green)' : active ? '#f59e0b' : '#cbd5e1',
                  }}
                />
              </div>
              <span
                className="text-xs font-medium text-center leading-tight max-w-[72px]"
                style={{ color: done ? 'var(--green)' : active ? '#f59e0b' : '#cbd5e1' }}
              >
                {label}
              </span>
            </div>
            {i < reviewSteps.length - 1 && (
              <div
                className="w-10 h-px mb-5 mx-1"
                style={{ backgroundColor: done ? 'var(--green)' : '#e5e7eb' }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Info box */}
      <div
        className="text-left px-5 py-4 rounded-xl mb-8 text-sm space-y-2"
        style={{ backgroundColor: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)' }}
      >
        <p className="font-semibold text-gray-700">ขั้นตอนถัดไป</p>
        <ul className="space-y-1 text-xs text-gray-500 list-disc list-inside">
          <li>ทีมกฎหมายจะรับข้อมูลและเริ่มตรวจสอบโดยเร็ว</li>
          <li>ผลการตรวจสอบจะแสดงในหน้า Dashboard ของคุณ</li>
          <li>คุณจะได้รับแจ้งเมื่อนโยบายได้รับการอนุมัติ</li>
        </ul>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link
          to="/dashboard"
          className="btn-green px-8 py-3 text-sm flex items-center justify-center gap-2"
          style={{ borderRadius: '8px' }}
        >
          กลับ Dashboard
        </Link>
        <button
          onClick={onReset}
          className="px-8 py-3 text-sm font-bold border-2 rounded-lg transition-colors"
          style={{ borderColor: '#e5e7eb', color: '#6b7280', borderRadius: '8px' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#d1d5db'; e.currentTarget.style.color = '#374151' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e5e7eb'; e.currentTarget.style.color = '#6b7280' }}
        >
          ส่งข้อมูลนโยบายอื่น
        </button>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
const initialData: FormData = {
  policyType: null,
  agreedToTerms: false,
  ownerType: 'person',
  ownerFullName: '',
  ownerIdCard: '',
  companyName: '',
  companyRegNumber: '',
  businessType: '',
  websiteName: '',
  websiteUrl: '',
  contactEmail: '',
  contactPhone: '',
  address: '',
  dataTypes: [],
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
  const [data, setDataRaw] = useState<FormData>(initialData)
  const [savedSlug, setSavedSlug] = useState('')

  const setData = useCallback((partial: Partial<FormData>) => setDataRaw(prev => ({ ...prev, ...partial })), [])

  useEffect(() => {
    if (!localStorage.getItem('flowpdpa_auth')) {
      navigate('/login', { state: { from: '/create/policy' } })
    }
  }, [navigate])

  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }) }, [step])

  const canProceed = () => {
    if (step === 1) return data.policyType !== null && data.agreedToTerms
    if (step === 2) {
      const base = !!(data.websiteName && data.websiteUrl && data.contactEmail)
      if (data.ownerType === 'person') return base && !!(data.ownerFullName && data.ownerIdCard)
      return base && !!(data.companyName && data.companyRegNumber && data.businessType)
    }
    if (step === 3) return data.dataTypes.length > 0
    if (step === 4) return data.purposes.length > 0
    if (step === 5) return data.language !== ''
    return true
  }

  const startGeneration = () => {
    setGenerating(true)
    setTimeout(() => {
      try {
        const authRaw = localStorage.getItem('flowpdpa_auth')
        const auth = authRaw ? JSON.parse(authRaw) : {}
        const policyType = policyTypes.find(p => p.key === data.policyType)
        const slug = generateSlug(data.websiteUrl || data.websiteName, data.policyType || 'privacy')
        const htmlContent = generatePolicyHTML(data)

        const policy: SavedPolicy = {
          id: generatePolicyId(),
          slug,
          type: data.policyType || 'privacy',
          typeName: policyType?.label || 'Privacy Policy',
          typeIcon: policyType?.icon || '🔒',
          websiteName: data.websiteName,
          domain: data.websiteUrl.replace(/https?:\/\//, '').replace(/\/$/, '') || data.websiteName,
          language: data.language,
          status: 'pending_review',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          approvalDeadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
          htmlContent,
          ownerEmail: auth.email || 'guest',
          ownerName: auth.name || '',
        }

        policyStorage.save(policy)
        setSavedSlug(slug)
      } catch { /* continue even if save fails */ }

      setGenerating(false)
      setDone(true)
    }, 2200)
  }

  const handleGenerate = () => {
    startGeneration()
  }

  const progress = ((step - 1) / (steps.length - 1)) * 100

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#f8fafc' }}>

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
              <WaitingReviewScreen data={data} slug={savedSlug} onReset={() => { setDataRaw(initialData); setStep(1); setDone(false); setSavedSlug('') }} />
            </div>
          ) : generating ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-16 shadow-sm text-center">
              <div className="w-14 h-14 rounded-full border-4 border-gray-100 mx-auto mb-5 animate-spin" style={{ borderTopColor: 'var(--green)' }} />
              <p className="text-gray-900 font-bold mb-1">กำลังสร้างนโยบาย...</p>
              <p className="text-sm text-gray-400">AI กำลังประมวลผลข้อมูลของคุณ กรุณารอสักครู่</p>
            </div>
          ) : (
            <div key={step} className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8 shadow-sm step-in">
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
                    <CheckCircle className="w-4 h-4" /> ส่งข้อมูล
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
