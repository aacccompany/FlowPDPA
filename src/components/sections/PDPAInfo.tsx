import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'

const requirements = [
  { title: 'เก็บรวบรวมข้อมูลส่วนบุคคล', desc: 'ชื่อ อีเมล เบอร์โทร ที่อยู่ หรือข้อมูลใดๆ ที่ระบุตัวตนได้' },
  { title: 'ใช้ข้อมูลเพื่อวัตถุประสงค์ทางธุรกิจ', desc: 'การตลาด การขาย การให้บริการ หรือการวิเคราะห์พฤติกรรม' },
  { title: 'เปิดเผยข้อมูลให้บุคคลที่สาม', desc: 'พาร์ทเนอร์ ผู้ให้บริการ หรือระบบภายนอกที่เข้าถึงข้อมูลลูกค้า' },
]

export default function PDPAInfo() {
  return (
    <section className="bg-white py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Left — warning card */}
          <FadeUp>
            <div className="rounded-2xl p-8 mb-6 border border-red-100" style={{ backgroundColor: '#fff8f6' }}>
              <div
                className="w-12 h-12 flex items-center justify-center mb-5"
                style={{ backgroundColor: '#fee2e2', borderRadius: '10px' }}
              >
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-3xl font-black text-gray-900 leading-tight mb-3">
                โทษปรับสูงสุด<br />
                <span className="text-red-600">5,000,000 บาท</span>
              </h3>
              <p className="text-gray-500 text-sm leading-relaxed">
                ตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) หากฝ่าฝืนหรือ
                ไม่ปฏิบัติตาม มีโทษปรับทางแพ่งสูงสุด 5 ล้านบาท และโทษจำคุกสูงสุด 1 ปี
              </p>
            </div>
            <a href="/create/policy" className="btn-green px-8 py-3 text-sm w-full text-center block" style={{ borderRadius: '8px' }}>
              สร้าง Privacy Policy ตอนนี้
            </a>
          </FadeUp>

          {/* Right — checklist */}
          <FadeUp delay={120}>
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
              <span className="block w-8 h-px bg-gray-300" />
              PDPA Requirement
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900 mb-8">
              ธุรกิจของคุณพร้อมสำหรับ PDPA<br />แล้วหรือยัง?
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              คุณจำเป็นต้องมี Privacy Policy หากธุรกิจของคุณ...
            </p>
            <div className="space-y-3">
              {requirements.map(({ title, desc }) => (
                <div key={title} className="flex items-start gap-4 p-4 rounded-xl border border-gray-100 bg-gray-50">
                  <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'var(--green)' }} />
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">{title}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </FadeUp>

        </div>
      </div>
    </section>
  )
}
