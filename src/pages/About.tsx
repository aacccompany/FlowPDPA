import { ShieldCheck, Target, Users, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import FadeUp from '@/components/ui/FadeUp'
import { useInView } from '@/hooks/useInView'

const values = [
  { Icon: ShieldCheck, title: 'ความน่าเชื่อถือ', desc: 'นโยบายทุกฉบับผ่านการตรวจสอบจากทีมกฎหมาย และอัปเดตตามกฎหมาย PDPA ล่าสุดเสมอ' },
  { Icon: Target, title: 'ความแม่นยำ', desc: 'ไม่ใช้เทมเพลตกลางๆ ทุกนโยบายถูกสร้างจากข้อมูลจริงของธุรกิจคุณโดยเฉพาะ' },
  { Icon: Users, title: 'การดูแลลูกค้า', desc: 'ทีมผู้เชี่ยวชาญพร้อมให้คำปรึกษาตลอดเวลาทำการ ไม่ปล่อยให้ลูกค้าแก้ปัญหาคนเดียว' },
  { Icon: Lightbulb, title: 'ความเรียบง่าย', desc: 'เชื่อว่าการปฏิบัติตามกฎหมายไม่ควรซับซ้อน ทุกคนควรเข้าถึงได้ง่ายและรวดเร็ว' },
]

export default function About() {
  const valuesRef = useInView()
  return (
    <div style={{ paddingTop: '61px' }}>
      {/* Header */}
      <div className="py-16 border-b border-gray-100" style={{ backgroundColor: '#fafafa' }}>
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            About Us
          </p>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-5">
            เราเชื่อว่าทุกธุรกิจ<br />สมควรได้รับการคุ้มครองที่ดี
          </h1>
          <p className="text-gray-500 text-base leading-relaxed">
            FlowPDPA เกิดขึ้นจากความตั้งใจที่จะทำให้การปฏิบัติตามกฎหมาย PDPA เป็นเรื่องที่ทุกธุรกิจไทย
            เข้าถึงได้ง่าย โดยไม่ต้องพึ่งพานักกฎหมายราคาแพงหรือเสียเวลาศึกษาด้วยตัวเอง
          </p>
        </div>
      </div>

      {/* Story */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <FadeUp>
              <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
                <span className="block w-8 h-px bg-gray-300" />
                Our Story
              </p>
              <h2 className="text-2xl font-bold text-gray-900 mb-5">จุดเริ่มต้นของ FlowPDPA</h2>
              <div className="space-y-4 text-gray-600 text-sm leading-relaxed">
                <p>
                  ในปี 2566 เมื่อ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล (PDPA) มีผลบังคับใช้อย่างเต็มรูปแบบ
                  ธุรกิจขนาดเล็กและ SME จำนวนมากไม่รู้ว่าต้องทำอะไร และค่าใช้จ่ายในการว่าจ้างนักกฎหมาย
                  สูงเกินไปสำหรับธุรกิจที่เพิ่งเริ่มต้น
                </p>
                <p>
                  ทีมผู้ก่อตั้งของเราซึ่งมีพื้นฐานทั้งด้านเทคโนโลยีและกฎหมาย จึงร่วมกันสร้าง FlowPDPA
                  เพื่อเป็นทางออกที่รวดเร็ว ถูกต้อง และราคาเข้าถึงได้สำหรับทุกธุรกิจ
                </p>
                <p>
                  ปัจจุบัน FlowPDPA ให้บริการธุรกิจมากกว่า <strong className="text-gray-900">3,500 ราย</strong> ทั่วประเทศไทย
                  ตั้งแต่ร้านค้าออนไลน์ ไปจนถึงองค์กรขนาดใหญ่
                </p>
              </div>
            </FadeUp>
            <FadeUp delay={120} className="grid grid-cols-2 gap-4">
              {[
                { v: '2566', l: 'ปีที่ก่อตั้ง' },
                { v: '3,500+', l: 'Policies Created' },
                { v: '500+', l: 'Business Clients' },
                { v: 'ISO 29110', l: 'Certified' },
              ].map(({ v, l }) => (
                <div key={l} className="rounded-xl border border-gray-100 p-6 text-center" style={{ backgroundColor: '#fafafa' }}>
                  <div className="text-2xl font-black text-gray-900 mb-1">{v}</div>
                  <div className="text-xs text-gray-500">{l}</div>
                </div>
              ))}
            </FadeUp>
          </div>
        </div>
      </div>

      {/* Values */}
      <div className="py-16 bg-gray-50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            Our Values
          </p>
          <h2 className="text-2xl font-bold text-gray-900 mb-10">สิ่งที่เราเชื่อและยึดถือ</h2>
          <div
            ref={valuesRef.ref}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 stagger-grid ${valuesRef.inView ? 'in-view' : ''}`}
          >
            {values.map(({ Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-xl border border-gray-100 p-6">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--green-light)' }}>
                  <Icon className="w-5 h-5" style={{ color: 'var(--green-dark)' }} />
                </div>
                <h3 className="font-bold text-gray-900 text-sm mb-2">{title}</h3>
                <p className="text-xs text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="py-14 border-t border-gray-100" style={{ backgroundColor: 'var(--blue-dark)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-white mb-3">พร้อมเริ่มต้นกับ FlowPDPA?</h2>
          <p className="text-blue-200 text-sm mb-6">สร้าง Privacy Policy ที่ถูกต้องตาม PDPA ได้ในไม่กี่นาที</p>
          <Link to="/create/policy" className="btn-green px-10 py-3 text-sm inline-block" style={{ borderRadius: '8px' }}>
            สร้าง Policy เลย
          </Link>
        </div>
      </div>
    </div>
  )
}
