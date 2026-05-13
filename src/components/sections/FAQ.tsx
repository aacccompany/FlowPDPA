import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'
import FadeUp from '@/components/ui/FadeUp'

const faqs = [
  {
    q: 'FlowPDPA คืออะไร และแตกต่างจากบริการอื่นอย่างไร',
    a: 'FlowPDPA คือแพลตฟอร์มสร้างนโยบายคุ้มครองข้อมูลส่วนบุคคลสำหรับธุรกิจไทย ความแตกต่างคือเราไม่ใช้เทมเพลตกลางๆ แต่สร้างนโยบายจากข้อมูลจริงของธุรกิจคุณ และดูแลให้ถูกต้องตามกฎหมายล่าสุดตลอดเวลา',
  },
  {
    q: 'ต้องชำระค่าบริการซ้ำทุกปีหรือไม่',
    a: 'ไม่ต้อง สำหรับ Privacy Policy แบบ Premium ชำระเพียงครั้งเดียว 2,500 บาท (รวม VAT) แล้วรับนโยบายและการอัปเดตตลอดชีพ ไม่มีค่ารายปีหรือค่าต่ออายุ',
  },
  {
    q: 'ธุรกิจประเภทไหนที่ต้องมี Privacy Policy',
    a: 'ทุกธุรกิจที่เก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคล เช่น ชื่อ อีเมล เบอร์โทร หรือข้อมูลการสั่งซื้อ ไม่ว่าจะเป็นร้านค้าออนไลน์ บริษัท สตาร์ทอัป หรือฟรีแลนซ์',
  },
  {
    q: 'หลังสร้างเสร็จ ฉันจะนำนโยบายไปใช้ได้อย่างไร',
    a: 'คุณจะได้รับลิงก์สาธารณะสำหรับแชร์ HTML Code สำหรับฝังในเว็บไซต์ และไฟล์ดาวน์โหลด (PDF, Word, TXT) ทั้งภาษาไทยและอังกฤษ นำไปใช้ได้ทันทีโดยไม่ต้องติดตั้งอะไรเพิ่ม',
  },
  {
    q: 'ถ้ากฎหมาย PDPA มีการเปลี่ยนแปลง นโยบายของฉันจะถูกอัปเดตหรือเปล่า',
    a: 'ใช่ นโยบายของลูกค้า Premium จะถูกอัปเดตโดยทีมผู้เชี่ยวชาญของ FlowPDPA ทุกครั้งที่มีการเปลี่ยนแปลงกฎหมาย คุณจะได้รับแจ้งทางอีเมลทุกครั้งที่มีการอัปเดต',
  },
]

export default function FAQ() {
  const [open, setOpen] = useState<number | null>(null)

  return (
    <section id="faq" className="py-20 bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">

        <FadeUp className="mb-12">
          <p className="flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.15em] text-gray-400 mb-4">
            <span className="block w-8 h-px bg-gray-300" />
            FAQ
          </p>
          <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
            คำถามที่พบบ่อย
          </h2>
        </FadeUp>

        <FadeUp delay={100} className="space-y-2">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="bg-white border border-gray-100 overflow-hidden"
              style={{ borderRadius: '10px' }}
            >
              <button
                className="w-full flex items-start justify-between px-6 py-5 text-left gap-4"
                onClick={() => setOpen(open === i ? null : i)}
              >
                <div className="flex items-start gap-4">
                  <span
                    className="text-xs font-mono mt-0.5 shrink-0"
                    style={{ color: open === i ? 'var(--green)' : '#d1d5db' }}
                  >
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className="text-sm font-semibold text-gray-800 leading-snug">{faq.q}</span>
                </div>
                <span className="shrink-0 mt-0.5" style={{ color: open === i ? 'var(--green)' : '#9ca3af' }}>
                  {open === i
                    ? <Minus className="w-4 h-4" />
                    : <Plus className="w-4 h-4" />
                  }
                </span>
              </button>

              {open === i && (
                <div className="px-6 pb-5 pl-14 text-sm text-gray-500 leading-relaxed border-t border-gray-50 pt-4">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </FadeUp>

        <FadeUp delay={200} className="mt-8 text-center">
          <a href="/faq" className="text-sm font-semibold" style={{ color: 'var(--green)' }}>
            ดูคำถามทั้งหมด →
          </a>
        </FadeUp>

      </div>
    </section>
  )
}
