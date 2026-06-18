import { Monitor, MessageCircle, Link2, LayoutDashboard, CircleDollarSign, Building2 } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'
import { useInView } from '@/hooks/useInView'

const features = [
  { Icon: Monitor,           num: '01', title: 'Policy ออนไลน์ อัปเดตอัตโนมัติ',      desc: 'เราโฮสด์นโยบายของคุณและอัปเดตให้ตรงตามกฎหมาย PDPA ล่าสุดโดยอัตโนมัติ ไม่ต้องจัดการเอง' },
  { Icon: MessageCircle,     num: '02', title: 'ทีมผู้เชี่ยวชาญพร้อมช่วยเหลือ',         desc: 'ทีมผู้เชี่ยวชาญ PDPA พร้อมให้คำปรึกษาตลอดเวลาทำการ ผ่านแชทและอีเมล' },
  { Icon: Link2,             num: '03', title: 'นำไปใช้บนเว็บไซต์ได้ทันที',             desc: 'รับ HTML Code พร้อมใช้ รองรับ WordPress, Shopify หรือแพลตฟอร์มใดก็ได้' },
  { Icon: LayoutDashboard,   num: '04', title: 'จัดการได้ทุก Policy จากที่เดียว',        desc: 'Dashboard ส่วนตัวสำหรับดูแล แก้ไข และอัปเดตนโยบายทุกเว็บไซต์ในบัญชีของคุณ' },
  { Icon: CircleDollarSign,  num: '05', title: 'ราคาคุ้มค่า ไม่มีค่าใช้จ่ายซ่อนเร้น',  desc: 'รับ Privacy Policy ทั้งภาษาไทยและอังกฤษในราคาเดียว ไม่มีค่าต่ออายุ' },
  { Icon: Building2,         num: '06', title: 'ออกแบบให้ตรงกับธุรกิจของคุณ',           desc: 'นโยบายถูกสร้างจากข้อมูลจริงของธุรกิจ ไม่ใช่เทมเพลตกลางๆ ที่ใช้กันทั่วไป' },
]

export default function WhyChoose() {
  const { ref, inView } = useInView()

  return (
    <section id="why" className="py-20" style={{ backgroundColor: 'var(--navy)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-14">
          <div>
            <p
              className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] mb-4"
              style={{ color: 'var(--green)' }}
            >
              <span className="block w-8 h-px" style={{ backgroundColor: 'var(--green)', opacity: 0.5 }} />
              Why FlowPDPA
            </p>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              ทำไมธุรกิจไทยเลือก FlowPDPA
            </h2>
          </div>
          <a href="/get-started" className="btn-green text-sm px-7 py-3 shrink-0">
            เริ่มสร้าง Policy
          </a>
        </FadeUp>

        <div
          ref={ref}
          className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-grid ${inView ? 'in-view' : ''}`}
        >
          {features.map(({ Icon, num, title, desc }) => (
            <div
              key={num}
              className="p-8 rounded-xl transition-colors"
              style={{ backgroundColor: 'var(--navy-light)' }}
              onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#253347')}
              onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'var(--navy-light)')}
            >
              <div className="flex items-start justify-between mb-5">
                <div
                  className="w-10 h-10 flex items-center justify-center"
                  style={{ backgroundColor: 'rgba(5,150,105,0.15)', borderRadius: '8px' }}
                >
                  <Icon className="w-5 h-5" style={{ color: 'var(--green)' }} />
                </div>
                <span className="text-xs font-mono" style={{ color: '#334155' }}>{num}</span>
              </div>
              <h3 className="font-bold text-white text-sm mb-2 leading-snug">{title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
