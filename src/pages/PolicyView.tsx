import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Copy, Check, Printer, ArrowLeft, ShieldCheck, AlertCircle } from 'lucide-react'
import { policyStorage, type SavedPolicy } from '@/utils/policyStorage'

function NotFoundState() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
      <div className="text-center px-4">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
          style={{ backgroundColor: 'rgba(239,68,68,0.1)' }}
        >
          <AlertCircle className="w-8 h-8" style={{ color: '#ef4444' }} />
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">ไม่พบนโยบายนี้</h1>
        <p className="text-sm text-gray-500 mb-6">
          ลิงก์อาจหมดอายุ หรือนโยบายถูกลบออกแล้ว
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold transition-colors"
          style={{ color: 'var(--green)' }}
        >
          <ArrowLeft className="w-4 h-4" /> กลับหน้าหลัก
        </Link>
      </div>
    </div>
  )
}

const langLabel: Record<string, string> = {
  th:   '🇹🇭 ภาษาไทย',
  en:   '🇬🇧 English',
  both: '🌐 ไทย + EN',
}

export default function PolicyView() {
  const { slug } = useParams<{ slug: string }>()
  const [policy, setPolicy] = useState<SavedPolicy | null | undefined>(undefined)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!slug) { setPolicy(null); return }
    const found = policyStorage.getBySlug(slug)
    setPolicy(found)
  }, [slug])

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href).catch(() => {
      const ta = document.createElement('textarea')
      ta.value = window.location.href
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    })
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => window.print()

  if (policy === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#f8fafc' }}>
        <div className="w-8 h-8 rounded-full border-4 border-gray-200 border-t-transparent animate-spin" style={{ borderTopColor: 'var(--green)' }} />
      </div>
    )
  }

  if (!policy) return <NotFoundState />

  const formattedDate = new Date(policy.updatedAt).toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f8fafc' }}>

      {/* Top bar */}
      <div
        className="sticky top-0 z-20 bg-white border-b border-gray-200 print:hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-0.5 shrink-0">
            <span className="font-black text-lg tracking-tight text-gray-900">Flow</span>
            <span className="font-black text-lg tracking-tight" style={{ color: 'var(--green)' }}>PDPA</span>
          </Link>

          {/* Policy meta */}
          <div className="flex-1 min-w-0 hidden sm:block">
            <p className="text-xs font-semibold text-gray-900 truncate">{policy.websiteName}</p>
            <p className="text-xs text-gray-400 truncate">{policy.typeName} · อัปเดต {formattedDate}</p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <span
              className="hidden sm:inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full"
              style={{ backgroundColor: 'rgba(5,150,105,0.1)', color: 'var(--green)' }}
            >
              {langLabel[policy.language] || policy.language}
            </span>

            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-colors"
              style={{
                borderColor: copied ? 'var(--green)' : '#e5e7eb',
                color: copied ? 'var(--green)' : '#374151',
                backgroundColor: copied ? 'rgba(5,150,105,0.05)' : 'white',
              }}
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'คัดลอกแล้ว!' : 'คัดลอกลิงก์'}
            </button>

            <button
              onClick={handlePrint}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 transition-colors"
              title="พิมพ์ / บันทึก PDF"
            >
              <Printer className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Document */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 print:px-0 print:py-0">

        {/* Verified badge */}
        <div
          className="flex items-center gap-2 px-4 py-3 rounded-xl mb-6 print:hidden"
          style={{ backgroundColor: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.15)' }}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" style={{ color: 'var(--green)' }} />
          <p className="text-xs" style={{ color: '#065f46' }}>
            <strong>นโยบายที่ได้รับการรับรอง</strong> · สร้างโดย FlowPDPA
            ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>
        </div>

        {/* Policy content */}
        <div
          className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 print:rounded-none print:border-0 print:shadow-none"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}
        >
          <div
            dangerouslySetInnerHTML={{ __html: policy.htmlContent }}
          />
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 print:hidden">
          <Link
            to="/"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> กลับหน้าหลัก
          </Link>
          <div className="flex items-center gap-2 text-xs text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--green)' }} />
            สร้างด้วย{' '}
            <Link to="/" className="font-semibold" style={{ color: 'var(--green)' }}>
              FlowPDPA
            </Link>
            · PDPA Compliant
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  )
}
