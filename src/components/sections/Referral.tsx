import { Megaphone, ArrowRight } from 'lucide-react'

export default function Referral() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden px-10 py-10 flex flex-col sm:flex-row items-center gap-8"
          style={{ backgroundColor: '#f0faf5', borderRadius: '8px', border: '1px solid #c8ded6' }}
        >
          <div
            className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
            style={{ backgroundColor: '#ffffff', border: '1px solid #c8ded6' }}
          >
            <Megaphone className="w-6 h-6" style={{ color: 'var(--green)' }} />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--green)' }}>
              Partner Program
            </p>
            <h3 className="text-xl font-bold mb-1.5" style={{ color: '#111827' }}>
              ร่วมเป็นพาร์ทเนอร์กับ FlowPDPA
            </h3>
            <p className="text-sm" style={{ color: '#6b7280' }}>
              แนะนำลูกค้า รับรายได้ส่วนแบ่งทุกครั้งที่ลูกค้าสมัครใช้บริการ ง่าย ไม่มีเงื่อนไขซับซ้อน
            </p>
          </div>

          <a
            href="#contact"
            className="flex items-center gap-2 text-sm font-bold text-white px-6 py-3 shrink-0 whitespace-nowrap transition-all"
            style={{ backgroundColor: 'var(--green)', borderRadius: '6px' }}
            onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'var(--green-dark)')}
            onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--green)')}
          >
            ดูรายละเอียด
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
