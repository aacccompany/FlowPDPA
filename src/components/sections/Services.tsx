import { useState } from 'react'
import FadeUp from '@/components/ui/FadeUp'

const tabs = [
  'Privacy Policy',
  'HR Privacy Policy',
  'Cookies Policy',
  'CCTV Policy',
  'Recruitment Policy',
  'Vendor Policy',
  'DPA',
  'Consulting Service',
  'FlowPDPA Kit',
]

const tableRows = [
  { label: 'คุ้มครองตาม PDPA ประเทศไทย', sublabel: 'สำหรับธุรกิจที่มีลูกค้าในประเทศไทย', free: true, premium: true },
  { label: 'คุ้มครองตาม CCPA (แคลิฟอร์เนีย)', sublabel: 'สำหรับธุรกิจที่ให้บริการลูกค้าในสหรัฐฯ', free: false, premium: true },
  { label: 'คุ้มครองตาม GDPR (สหภาพยุโรป)', sublabel: 'สำหรับธุรกิจที่ให้บริการในยุโรป', free: false, premium: true },
  { label: 'ใช้งานในเชิงพาณิชย์ได้เต็มรูปแบบ', sublabel: '', free: false, premium: true },
  { label: 'ครอบคลุมการส่งข้อมูลให้บุคคลที่สาม', sublabel: '', free: false, premium: true },
  { label: 'ครอบคลุมข้อมูลอ่อนไหว', sublabel: 'เช่น สุขภาพ พันธุกรรม ชีวภาพ ศาสนา', free: false, premium: true },
]

const serviceInfo: Record<string, { title: string; desc: string }> = {
  'Privacy Policy': {
    title: 'Privacy Policy',
    desc: 'เหมาะสำหรับธุรกิจทุกประเภทที่เก็บรวบรวมข้อมูลส่วนบุคคลของลูกค้าหรือผู้ใช้งาน เช่น ชื่อ อีเมล เบอร์โทร หรือประวัติการซื้อสินค้า ครอบคลุมทั้งเว็บไซต์ แอปมือถือ และแพลตฟอร์มออนไลน์',
  },
  'HR Privacy Policy': {
    title: 'HR Privacy Policy',
    desc: 'นโยบายคุ้มครองข้อมูลสำหรับพนักงานและผู้สมัครงาน เหมาะกับองค์กรที่มีกระบวนการรับสมัคร ประเมินผล หรือเก็บข้อมูลบุคลากร ให้ HR ดำเนินงานได้อย่างถูกต้องตามกฎหมาย',
  },
  'Cookies Policy': {
    title: 'Cookies Policy',
    desc: 'นโยบายการใช้งานคุกกี้สำหรับเว็บไซต์ที่ใช้เครื่องมือติดตาม เช่น Google Analytics, Facebook Pixel หรือระบบโฆษณา ช่วยให้ผู้ใช้ทราบว่าคุณเก็บข้อมูลอะไรบ้าง',
  },
  'CCTV Policy': {
    title: 'CCTV Policy',
    desc: 'นโยบายการใช้กล้องวงจรปิดสำหรับสถานประกอบการ สำนักงาน ร้านค้า หรือโรงงาน ที่มีการบันทึกภาพหรือเสียงของบุคคลในพื้นที่',
  },
  'Recruitment Policy': {
    title: 'Recruitment Privacy Policy',
    desc: 'นโยบายเฉพาะสำหรับกระบวนการสรรหาบุคลากร ครอบคลุมการเก็บ Resume ข้อมูลผู้สมัคร และการประมวลผลในกระบวนการคัดเลือก',
  },
  'Vendor Policy': {
    title: 'Vendor Privacy Policy',
    desc: 'นโยบายสำหรับความสัมพันธ์กับซัพพลายเออร์และพาร์ทเนอร์ กำหนดขอบเขตการแบ่งปันและประมวลผลข้อมูลร่วมกับบุคคลภายนอก',
  },
  'DPA': {
    title: 'Data Processing Agreement (DPA)',
    desc: 'สัญญาการประมวลผลข้อมูลระหว่างผู้ควบคุมและผู้ประมวลผลข้อมูล จำเป็นสำหรับธุรกิจที่ใช้บริการภายนอกในการจัดการข้อมูลลูกค้า',
  },
  'Consulting Service': {
    title: 'บริการที่ปรึกษา PDPA',
    desc: 'บริการให้คำปรึกษาโดยทีมผู้เชี่ยวชาญ PDPA ของ FlowPDPA วิเคราะห์ช่องโหว่ด้านการคุ้มครองข้อมูล และให้คำแนะนำแผนปฏิบัติการที่เหมาะสมกับธุรกิจของคุณ',
  },
  'FlowPDPA Kit': {
    title: 'FlowPDPA Kit',
    desc: 'ชุดเอกสาร PDPA ครบวงจรในราคาพิเศษ รวมนโยบายทุกประเภทที่ธุรกิจของคุณต้องการ พร้อมคู่มือการนำไปใช้และเทมเพลตสื่อสารภายในองค์กร',
  },
}

function GreenCheck() {
  return (
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'var(--green)' }}>
        <span className="text-white text-xs font-bold">✓</span>
      </div>
    </div>
  )
}

function GrayX() {
  return (
    <div className="flex justify-center">
      <div className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100">
        <span className="text-gray-300 text-xs font-bold">—</span>
      </div>
    </div>
  )
}

export default function Services() {
  const [activeTab, setActiveTab] = useState('Privacy Policy')
  const info = serviceInfo[activeTab]

  return (
    <section id="services" className="py-20 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeUp>
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 text-center mb-8">
            นโยบายที่เราช่วยคุณสร้าง
          </h2>
        </FadeUp>

        <div className="flex flex-wrap gap-2 justify-center mb-8">
          {tabs.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className="px-4 py-2 rounded text-sm font-medium border transition-all"
              style={
                activeTab === tab
                  ? { backgroundColor: 'var(--blue)', color: 'white', borderColor: 'var(--blue)' }
                  : { backgroundColor: 'white', color: '#555', borderColor: '#ddd' }
              }
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="border border-gray-200 rounded-xl overflow-hidden">
          <div className="bg-white px-8 py-6 text-center border-b border-gray-100">
            <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--blue)' }}>{info.title}</h3>
            <p className="text-gray-600 text-sm leading-relaxed mb-2">{info.desc}</p>
            <a href="/get-started" className="text-sm font-medium" style={{ color: 'var(--green)' }}>
              ดูรายละเอียดและตัวอย่างเพิ่มเติม →
            </a>
          </div>

          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left px-6 py-4 text-sm text-gray-600 font-semibold w-1/2">
                  ความครอบคลุมของนโยบาย
                  <div className="text-xs text-gray-400 font-normal">ราคารวม VAT 7%</div>
                </th>
                <th className="px-4 py-4 text-center w-1/4">
                  <span className="inline-block px-3 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: 'var(--blue-mid)' }}>Free</span>
                  <div className="text-sm font-bold text-gray-900 mt-1">ฟรี</div>
                </th>
                <th className="px-4 py-4 text-center w-1/4">
                  <span className="inline-block px-3 py-1 rounded text-white text-xs font-bold" style={{ backgroundColor: 'var(--green)' }}>Premium</span>
                  <div className="text-sm font-bold text-gray-900 mt-1">2,500 บาท</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {tableRows.map(({ label, sublabel, free, premium }) => (
                <tr key={label} className="border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-3">
                    <div className="text-sm text-gray-800">{label}</div>
                    {sublabel && <div className="text-xs text-gray-400">{sublabel}</div>}
                  </td>
                  <td className="px-4 py-3">{free ? <GreenCheck /> : <GrayX />}</td>
                  <td className="px-4 py-3">{premium ? <GreenCheck /> : <GrayX />}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="px-8 py-5 text-center border-t border-gray-100 bg-gray-50">
            <p className="text-sm mb-4" style={{ color: 'var(--green)' }}>
              ทุกแพ็กเกจรวมนโยบายทั้งภาษาไทยและภาษาอังกฤษในฉบับเดียว
            </p>
            <a href="/get-started" className="block w-full py-4 rounded text-white font-bold text-base" style={{ backgroundColor: 'var(--green)' }}>
              เริ่มสร้าง Policy ของคุณเดี๋ยวนี้
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
