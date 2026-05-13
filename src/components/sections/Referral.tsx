import { Megaphone, ArrowRight } from 'lucide-react'

export default function Referral() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative overflow-hidden rounded-2xl px-10 py-10 flex flex-col sm:flex-row items-center gap-8"
          style={{ background: 'linear-gradient(135deg, var(--blue-dark) 0%, var(--blue) 100%)' }}
        >
          {/* Background accent */}
          <div
            className="absolute -right-12 -bottom-12 w-52 h-52 rounded-full pointer-events-none"
            style={{ backgroundColor: 'var(--green)', opacity: 0.12 }}
          />

          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: 'rgba(255,255,255,0.12)' }}
          >
            <Megaphone className="w-7 h-7 text-white" />
          </div>

          <div className="flex-1 text-center sm:text-left">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] mb-2" style={{ color: '#6ee7b7' }}>
              Partner Program
            </p>
            <h3 className="text-xl font-bold text-white mb-1.5">
              ร่วมเป็นพาร์ทเนอร์กับ FlowPDPA
            </h3>
            <p className="text-blue-200 text-sm">
              แนะนำลูกค้า รับรายได้ส่วนแบ่งทุกครั้งที่ลูกค้าสมัครใช้บริการ ง่าย ไม่มีเงื่อนไขซับซ้อน
            </p>
          </div>

          <a
            href="#contact"
            className="flex items-center gap-2 text-sm font-bold text-white px-6 py-3 shrink-0 whitespace-nowrap transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--green)', borderRadius: '8px' }}
          >
            ดูรายละเอียด
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    </section>
  )
}
