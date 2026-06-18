import { Link } from 'react-router-dom'
import { Monitor, MessageCircle, Link2, LayoutDashboard, CircleDollarSign, Building2, Check, X } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'
import { useInView } from '@/hooks/useInView'

const features = [
  {
    Icon: Monitor,
    title: 'Policy ออนไลน์ อัปเดตอัตโนมัติ',
    desc: 'นโยบายของคุณถูกโฮสด์บนเซิร์ฟเวอร์ของ FlowPDPA และอัปเดตให้ตรงตามกฎหมาย PDPA ล่าสุดโดยอัตโนมัติ ไม่ต้องติดตามข่าวสารกฎหมายเอง ไม่ต้องจ้างนักกฎหมายมาอัปเดตซ้ำ',
  },
  {
    Icon: MessageCircle,
    title: 'ทีมผู้เชี่ยวชาญพร้อมช่วยเหลือ',
    desc: 'ทีมผู้เชี่ยวชาญ PDPA ของเราพร้อมให้คำปรึกษาตลอดเวลาทำการ ผ่านแชทและอีเมล ไม่ปล่อยให้ลูกค้าแก้ปัญหาคนเดียว และตอบกลับภายใน 1 วันทำการเสมอ',
  },
  {
    Icon: Link2,
    title: 'นำไปใช้บนเว็บไซต์ได้ทันที',
    desc: 'รับ HTML Code พร้อมใช้ที่สามารถวางบนเว็บไซต์ได้เลย รองรับทุกแพลตฟอร์ม ทั้ง WordPress, Shopify, Wix, Webflow หรือเว็บที่สร้างเอง ไม่ต้องพึ่งโปรแกรมเมอร์',
  },
  {
    Icon: LayoutDashboard,
    title: 'จัดการทุก Policy จากที่เดียว',
    desc: 'Dashboard ส่วนตัวสำหรับดูแล แก้ไข และอัปเดตนโยบายทุกเว็บไซต์ในบัญชีของคุณ พร้อมประวัติเวอร์ชันทุกครั้งที่มีการแก้ไข',
  },
  {
    Icon: CircleDollarSign,
    title: 'ชำระครั้งเดียว คุ้มค่าตลอดชีพ',
    desc: 'ไม่มีค่าสมาชิกรายปี ไม่มีค่าต่ออายุ ชำระเพียง 2,500 บาทครั้งเดียว รับ Privacy Policy ภาษาไทยและอังกฤษพร้อมอัปเดตตลอดชีพ',
  },
  {
    Icon: Building2,
    title: 'ออกแบบเฉพาะสำหรับธุรกิจของคุณ',
    desc: 'ไม่ใช้เทมเพลตกลางๆ ทุกนโยบายสร้างจากข้อมูลจริงของธุรกิจคุณ ครอบคลุมประเภทข้อมูลที่คุณเก็บ วัตถุประสงค์การใช้งาน และบุคคลที่สามที่เกี่ยวข้อง',
  },
]

const comparison = [
  { feature: 'ราคา',                       us: '2,500 บาท (ครั้งเดียว)', lawyer: '20,000–50,000 บาท', template: 'ฟรี', usGood: true, lawyerGood: false, templateGood: false },
  { feature: 'ถูกต้องตาม PDPA ไทย',        us: true, lawyer: true, template: false },
  { feature: 'พร้อมใช้ใน',                 us: '< 5 นาที', lawyer: '2–4 สัปดาห์', template: 'ทันที (ไม่ถูกต้อง)', usGood: true, lawyerGood: false, templateGood: false },
  { feature: 'อัปเดตเมื่อกฎหมายเปลี่ยน', us: true, lawyer: false, template: false },
  { feature: 'รองรับ GDPR & CCPA',          us: true, lawyer: true, template: false },
  { feature: 'ภาษาไทย + อังกฤษ',           us: true, lawyer: false, template: false },
  { feature: 'ดาวน์โหลด PDF / Word',        us: true, lawyer: true, template: false },
  { feature: 'HTML Code สำหรับเว็บไซต์',   us: true, lawyer: false, template: false },
]

function Cell({ val, highlight }: { val: boolean | string; highlight?: boolean }) {
  if (typeof val === 'boolean') {
    return val
      ? <Check className="w-4 h-4 mx-auto" style={{ color: 'var(--green)' }} />
      : <X className="w-4 h-4 mx-auto text-gray-300" />
  }
  return <span className={`text-xs ${highlight ? 'font-bold' : ''}`} style={highlight ? { color: 'var(--green)' } : { color: '#9ca3af' }}>{val}</span>
}

export default function WhyUs() {
  const { ref, inView } = useInView()

  return (
    <div style={{ paddingTop: '61px' }}>

      {/* Header — dark navy */}
      <div className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-5" style={{ color: 'var(--green)' }}>
            <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
            Why FlowPDPA
          </p>
          <h1 className="text-3xl sm:text-5xl font-black text-white leading-tight mb-6">
            ทำไมธุรกิจกว่า 3,500 ราย<br />เลือก FlowPDPA
          </h1>
          <p className="text-base leading-relaxed max-w-2xl" style={{ color: '#64748b' }}>
            มีตัวเลือกมากมายในตลาด ตั้งแต่จ้างนักกฎหมาย ใช้เทมเพลตฟรี หรือทำเอง
            FlowPDPA ถูกออกแบบมาเพื่อตอบโจทย์ธุรกิจไทยโดยเฉพาะ — ถูกต้อง รวดเร็ว และคุ้มค่าที่สุด
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="mb-12">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">
              <span className="block w-8 h-px bg-gray-300" />
              What You Get
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">6 เหตุผลที่ทำให้เราแตกต่าง</h2>
          </FadeUp>

          <div
            ref={ref}
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 stagger-grid ${inView ? 'in-view' : ''}`}
          >
            {features.map(({ Icon, title, desc }, i) => (
              <div key={i} className="rounded-xl border border-gray-100 p-7 bg-gray-50 hover:bg-white hover:shadow-sm transition-all">
                <div
                  className="w-11 h-11 flex items-center justify-center mb-5 rounded-lg"
                  style={{ backgroundColor: 'var(--green-light)' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--green-dark)' }} />
                </div>
                <h3 className="font-black text-gray-900 text-sm mb-3 leading-snug">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="py-20 bg-gray-50 border-t border-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeUp className="mb-10">
            <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-3">
              <span className="block w-8 h-px bg-gray-300" />
              Comparison
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">เปรียบเทียบกับทางเลือกอื่น</h2>
          </FadeUp>

          <FadeUp delay={100}>
            <div className="rounded-2xl border border-gray-200 overflow-hidden bg-white">
              <table className="w-full">
                <thead>
                  <tr style={{ backgroundColor: 'var(--navy)' }}>
                    <th className="text-left px-6 py-4 text-sm font-semibold text-white w-2/5">คุณสมบัติ</th>
                    <th className="px-4 py-4 text-center w-1/5">
                      <div className="text-xs font-black uppercase tracking-wider mb-1" style={{ color: 'var(--green)' }}>FlowPDPA</div>
                    </th>
                    <th className="px-4 py-4 text-center w-1/5">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">ว่าจ้างนักกฎหมาย</div>
                    </th>
                    <th className="px-4 py-4 text-center w-1/5">
                      <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">เทมเพลตฟรี</div>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {comparison.map(({ feature, us, lawyer, template, usGood }, i) => (
                    <tr key={feature} className={`border-t border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                      <td className="px-6 py-3.5 text-sm text-gray-700 font-medium">{feature}</td>
                      <td className="px-4 py-3.5 text-center">
                        <Cell val={us} highlight={usGood} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Cell val={lawyer} />
                      </td>
                      <td className="px-4 py-3.5 text-center">
                        <Cell val={template} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </FadeUp>
        </div>
      </div>

      {/* CTA */}
      <div className="py-16" style={{ backgroundColor: 'var(--navy)' }}>
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-2xl font-black text-white mb-3">พร้อมเริ่มต้นแล้วหรือยัง?</h2>
          <p className="text-sm mb-8" style={{ color: '#64748b' }}>
            ใช้เวลาน้อยกว่า 5 นาที ได้ Privacy Policy ที่ถูกต้องตาม PDPA ทันที
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/get-started" className="btn-green px-10 py-3 text-sm" style={{ borderRadius: '8px' }}>
              สร้าง Policy เลย
            </Link>
            <Link to="/support" className="btn-outline-white px-10 py-3 text-sm" style={{ borderRadius: '8px' }}>
              ถามทีมงาน
            </Link>
          </div>
        </div>
      </div>

    </div>
  )
}
